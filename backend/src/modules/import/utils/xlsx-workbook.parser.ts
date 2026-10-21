import * as XLSX from 'xlsx';
import type { EntrySection } from '@finances/shared';
import { isPositiveAmount, parseSpreadsheetMoney } from './money';

const MONTH_BY_SHEET: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

const INSTALLMENT_RE = /^(\d+)\s*\/\s*(\d+)$/;

export type ParsedImportEntry = {
  section: EntrySection;
  description: string;
  amount: number;
  dueLabel: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  /** Conta sugerida (Cartões, C6, BB…). */
  accountName: string | null;
  /** Parte sugerida (A receber). */
  partyName: string | null;
  sortOrder: number;
};

export type ParsedImportPeriod = {
  sheetName: string;
  year: number;
  month: number;
  caixaBudget: number;
  entries: ParsedImportEntry[];
  countsBySection: Record<EntrySection, number>;
  warnings: string[];
};

export type ParsedImportWorkbook = {
  periods: ParsedImportPeriod[];
  totals: {
    periods: number;
    entries: number;
    bySection: Record<EntrySection, number>;
  };
};

type CellRow = unknown[];

function cell(row: CellRow | undefined, col: number): unknown {
  if (!row) return null;
  return row[col] ?? null;
}

function text(raw: unknown): string {
  if (raw == null) return '';
  return String(raw).trim();
}

function norm(raw: unknown): string {
  return text(raw)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function emptySectionCounts(): Record<EntrySection, number> {
  return {
    PAYABLE: 0,
    RECEIVABLE: 0,
    CARD_ITEM: 0,
    CARD_FIXED: 0,
    CASH_OUT: 0,
    OTHER_INCOME: 0,
  };
}

function excelSerialToYear(serial: number): number | null {
  if (!Number.isFinite(serial)) return null;
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed?.y) return null;
  return parsed.y;
}

function resolveYearMonth(
  sheetName: string,
  a1: unknown,
  fallbackYear: number,
): { year: number; month: number } | null {
  const month = MONTH_BY_SHEET[norm(sheetName)];
  if (!month) return null;

  let year = fallbackYear;
  if (typeof a1 === 'number') {
    const fromSerial = excelSerialToYear(a1);
    if (fromSerial) year = fromSerial;
  } else {
    const m = text(a1).match(/(20\d{2})/);
    if (m) year = Number(m[1]);
  }
  return { year, month };
}

function parseDue(raw: unknown): {
  dueLabel: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
} {
  const dueLabel = text(raw) || null;
  if (!dueLabel) {
    return { dueLabel: null, installmentCurrent: null, installmentTotal: null };
  }
  const match = dueLabel.match(INSTALLMENT_RE);
  if (!match) {
    return { dueLabel, installmentCurrent: null, installmentTotal: null };
  }
  return {
    dueLabel,
    installmentCurrent: Number(match[1]),
    installmentTotal: Number(match[2]),
  };
}

function isSkipDescription(description: string, section: EntrySection): boolean {
  const n = norm(description);
  if (!n) return true;
  if (n === 'total') return true;
  if (section === 'PAYABLE' && (n === 'cartoes' || n === 'cartões')) return true;
  // "Custo fixo" sob Nubank é espelho do total de Fixos — derivado, não Entry.
  if (section === 'CARD_ITEM' && n === 'custo fixo') return true;
  return false;
}

function isHeaderLike(description: string): boolean {
  const n = norm(description);
  return (
    n === 'a pagar' ||
    n === 'nubank' ||
    n === 'c6' ||
    n === 'fixos nubank' ||
    n === 'fixos (cartao)' ||
    n === 'fixos' ||
    n === 'saidas (dinheiro)' ||
    n === 'outras entradas' ||
    n === 'a receber' ||
    n === 'saldo' ||
    n === 'caixa' ||
    n === 'sugestao ia'
  );
}

type LeftBlock = 'PAYABLE' | 'CARD_ITEM' | 'CARD_FIXED' | 'C6_ITEM' | null;
type RightBlock = 'RECEIVABLE' | 'CASH_OUT' | 'OTHER_INCOME' | null;

function detectLeftAnchor(a: string, b: string): LeftBlock | 'IGNORE' {
  const n = norm(a);
  const nb = norm(b);
  if (n === 'a pagar') return 'PAYABLE';
  // Cabeçalho do bloco de fatura (legado "Nubank"). Não confundir com a linha
  // derivada "Cartões" em A Pagar (vencimento "dia 07").
  if (n === 'nubank') return 'CARD_ITEM';
  if ((n === 'cartoes' || n === 'cartões') && nb === 'parcela') return 'CARD_ITEM';
  if (n === 'c6' && (nb === 'descricao' || nb === 'descrição' || nb === 'valor')) {
    return 'C6_ITEM';
  }
  if (n.startsWith('fixos') && (nb === 'descricao' || nb === 'descrição' || nb === '')) {
    return 'CARD_FIXED';
  }
  if (n.startsWith('fixos') && nb !== 'total') return 'CARD_FIXED';
  return null;
}

function detectRightAnchor(e: string): RightBlock | 'IGNORE' {
  const n = norm(e);
  if (n === 'a receber') return 'RECEIVABLE';
  if (n.startsWith('saidas')) return 'CASH_OUT';
  if (n.startsWith('outras entradas')) return 'OTHER_INCOME';
  if (n === 'saldo' || n === 'sugestao ia') return 'IGNORE';
  return null;
}

function pushEntry(
  period: ParsedImportPeriod,
  entry: Omit<ParsedImportEntry, 'sortOrder'> & { sortOrder?: number },
): void {
  if (isSkipDescription(entry.description, entry.section)) return;
  if (isHeaderLike(entry.description)) return;
  if (!isPositiveAmount(entry.amount)) return;

  const sortOrder = entry.sortOrder ?? period.entries.length;
  period.entries.push({ ...entry, sortOrder });
  period.countsBySection[entry.section] += 1;
}

export function parseWorkbookBuffer(
  buffer: Buffer,
  options?: { defaultYear?: number },
): ParsedImportWorkbook {
  const defaultYear = options?.defaultYear ?? 2026;
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const periods: ParsedImportPeriod[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<CellRow>(sheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    const ym = resolveYearMonth(sheetName, cell(rows[0], 0), defaultYear);
    if (!ym) {
      continue;
    }

    const period: ParsedImportPeriod = {
      sheetName,
      year: ym.year,
      month: ym.month,
      caixaBudget: 0,
      entries: [],
      countsBySection: emptySectionCounts(),
      warnings: [],
    };

    // Caixa tipicamente em D3 (índice [2][3]); fallback: primeira célula numérica na col D das linhas 2–5.
    const caixaRaw = cell(rows[2], 3);
    const caixa = parseSpreadsheetMoney(caixaRaw);
    if (caixa != null && caixa > 0) {
      period.caixaBudget = caixa;
    } else {
      for (let i = 1; i <= 5; i++) {
        const candidate = parseSpreadsheetMoney(cell(rows[i], 3));
        if (candidate != null && candidate > 0) {
          period.caixaBudget = candidate;
          break;
        }
      }
      if (period.caixaBudget <= 0) {
        period.warnings.push(`Caixa não encontrado em ${sheetName}; usando 0`);
      }
    }

    let left: LeftBlock = null;
    let right: RightBlock = null;
    let leftOrder = 0;
    let rightOrder = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const a = text(cell(row, 0));
      const b = text(cell(row, 1));
      const e = text(cell(row, 4));

      const leftAnchor = a ? detectLeftAnchor(a, b) : null;
      if (leftAnchor === 'IGNORE') {
        left = null;
      } else if (leftAnchor) {
        left = leftAnchor;
        leftOrder = 0;
        // Linha de âncora não é lançamento.
        // Continua para lado direito da mesma linha.
      }

      const rightAnchor = e ? detectRightAnchor(e) : null;
      if (rightAnchor === 'IGNORE') {
        right = null;
      } else if (rightAnchor) {
        right = rightAnchor;
        rightOrder = 0;
      }

      const isLeftAnchorRow = Boolean(leftAnchor && leftAnchor !== 'IGNORE');
      const isRightAnchorRow = Boolean(rightAnchor && rightAnchor !== 'IGNORE');

      // Esquerda: A descrição, B vencimento/parcela, C valor
      if (left && !isLeftAnchorRow && a) {
        // Linha "Total" no meio do bloco
        if (norm(text(cell(row, 1))) === 'total' || norm(a) === 'total') {
          // não muda o bloco
        } else {
          const amount = parseSpreadsheetMoney(cell(row, 2));
          const due = parseDue(cell(row, 1));
          const section: EntrySection =
            left === 'CARD_FIXED' ? 'CARD_FIXED' : left === 'PAYABLE' ? 'PAYABLE' : 'CARD_ITEM';
          const accountName =
            left === 'C6_ITEM' ? 'C6' : section === 'PAYABLE' ? null : 'Cartões';

          pushEntry(period, {
            section,
            description: a,
            amount: amount ?? 0,
            dueLabel: due.dueLabel,
            installmentCurrent: due.installmentCurrent,
            installmentTotal: due.installmentTotal,
            accountName,
            partyName: null,
            sortOrder: leftOrder++,
          });
        }
      }

      // Direita: E parte/desc, F descrição/conta, G valor
      if (right && !isRightAnchorRow && e) {
        if (norm(e) === 'total' || norm(text(cell(row, 5))) === 'total') {
          // skip
        } else if (right === 'RECEIVABLE') {
          const amount = parseSpreadsheetMoney(cell(row, 6));
          pushEntry(period, {
            section: 'RECEIVABLE',
            description: text(cell(row, 5)) || e,
            amount: amount ?? 0,
            dueLabel: null,
            installmentCurrent: null,
            installmentTotal: null,
            accountName: null,
            partyName: e,
            sortOrder: rightOrder++,
          });
        } else if (right === 'CASH_OUT') {
          const amount = parseSpreadsheetMoney(cell(row, 6));
          // Em saídas: E=descrição, F=conta (BB), G=valor
          pushEntry(period, {
            section: 'CASH_OUT',
            description: e,
            amount: amount ?? 0,
            dueLabel: text(cell(row, 5)) || null,
            installmentCurrent: null,
            installmentTotal: null,
            accountName: text(cell(row, 5)) || 'BB',
            partyName: null,
            sortOrder: rightOrder++,
          });
        } else if (right === 'OTHER_INCOME') {
          // Outras entradas: E=descrição, F vazio, G=valor
          const amount = parseSpreadsheetMoney(cell(row, 6));
          pushEntry(period, {
            section: 'OTHER_INCOME',
            description: e,
            amount: amount ?? 0,
            dueLabel: null,
            installmentCurrent: null,
            installmentTotal: null,
            accountName: null,
            partyName: null,
            sortOrder: rightOrder++,
          });
        }
      }
    }

    periods.push(period);
  }

  periods.sort((a, b) => a.year - b.year || a.month - b.month);

  const bySection = emptySectionCounts();
  let entries = 0;
  for (const p of periods) {
    entries += p.entries.length;
    for (const section of Object.keys(bySection) as EntrySection[]) {
      bySection[section] += p.countsBySection[section];
    }
  }

  return {
    periods,
    totals: {
      periods: periods.length,
      entries,
      bySection,
    },
  };
}
