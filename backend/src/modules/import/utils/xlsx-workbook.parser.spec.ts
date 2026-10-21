import * as fs from 'fs';
import * as path from 'path';
import { computePeriodTotals, emptyEntrySectionSums } from '@finances/shared';
import { parseWorkbookBuffer } from './xlsx-workbook.parser';

const REF_XLSX = path.resolve(
  process.env.HOME ?? '',
  'Downloads/Financeiro - 2026.xlsx',
);

describe('parseWorkbookBuffer', () => {
  const hasFile = fs.existsSync(REF_XLSX);

  (hasFile ? it : it.skip)('importa as 12 abas sem crash', () => {
    const buffer = fs.readFileSync(REF_XLSX);
    const parsed = parseWorkbookBuffer(buffer);

    expect(parsed.periods).toHaveLength(12);
    expect(parsed.totals.periods).toBe(12);
    expect(parsed.totals.entries).toBeGreaterThan(100);

    const jan = parsed.periods.find((p) => p.month === 1)!;
    expect(jan.caixaBudget).toBe(7500);
    expect(jan.countsBySection.PAYABLE).toBeGreaterThan(0);
    expect(jan.countsBySection.CARD_ITEM).toBeGreaterThan(0);
    expect(jan.countsBySection.CARD_FIXED).toBeGreaterThan(0);
    expect(jan.countsBySection.RECEIVABLE).toBeGreaterThan(0);
    expect(jan.countsBySection.OTHER_INCOME).toBeGreaterThan(0);

    // Linha Cartões / Custo fixo não viram Entry.
    expect(jan.entries.some((e) => /^cart[oõ]es$/i.test(e.description))).toBe(false);
    expect(jan.entries.some((e) => /^custo fixo$/i.test(e.description))).toBe(false);

    // Parcela n/m
    const consorcio = jan.entries.find((e) => e.description === 'Consorcio Imovel');
    expect(consorcio?.installmentCurrent).toBe(10);
    expect(consorcio?.installmentTotal).toBe(208);

    const sums = emptyEntrySectionSums();
    for (const e of jan.entries) sums[e.section] += e.amount;
    const totals = computePeriodTotals(jan.caixaBudget, sums);
    // Planilha: A pagar 8426.40, A receber 80 → saldo -846.40
    expect(totals.totalPayables).toBeCloseTo(8426.4, 1);
    expect(totals.totalReceivables).toBeCloseTo(80, 1);
    expect(totals.monthBalance).toBeCloseTo(-846.4, 1);
  });

  it('parseia workbook mínimo sintético', () => {
    // Gera xlsx mínimo via sheet_to_json inverso
    const XLSX = require('xlsx') as typeof import('xlsx');
    const aoa = [
      [46023],
      ['A Pagar', 'Vencimento', 'Valor', 'Caixa', 'A receber', 'Descrição', 'Valor'],
      ['Cartões', 'dia 07', 100, 7500, 'Gui', 'Spotify', 40],
      ['Flow', 'dia 10', 30, null, null, null, null],
      [null, 'Total', 130, null, null, 'Total', 40],
      [],
      ['Nubank', 'Parcela', 'Valor', null, 'Saidas (Dinheiro)', 'Descrição', 'Valor'],
      ['Geral', null, 80, null, 'Pacote', 'BB', 10],
      ['Custo fixo', null, 20],
      [],
      ['Fixos Nubank', 'Descrição', 'Valor', null, 'Outras Entradas', 'Descrição', 'Valor'],
      ['Prime', 'dia 10', 20, null, 'Beneficio', null, 100],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Janeiro');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const parsed = parseWorkbookBuffer(buffer);
    expect(parsed.periods).toHaveLength(1);
    const jan = parsed.periods[0];
    expect(jan.caixaBudget).toBe(7500);
    expect(jan.entries.map((e) => e.description).sort()).toEqual(
      ['Beneficio', 'Flow', 'Geral', 'Pacote', 'Prime', 'Spotify'].sort(),
    );
    expect(jan.countsBySection.PAYABLE).toBe(1);
    expect(jan.countsBySection.CARD_ITEM).toBe(1);
    expect(jan.countsBySection.CARD_FIXED).toBe(1);
    expect(jan.countsBySection.RECEIVABLE).toBe(1);
    expect(jan.countsBySection.CASH_OUT).toBe(1);
    expect(jan.countsBySection.OTHER_INCOME).toBe(1);
  });
});
