/** Parse valores no formato da planilha Financeiro (`R$ 5,852.14`, `R$ -`, `-R$ 846.40`). */
export function parseSpreadsheetMoney(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return Math.round(raw * 100) / 100;
  }

  const text = String(raw).trim();
  if (!text) return null;

  // Célula vazia / traço / "R$ -"
  if (/^R\$?\s*-?\s*$/i.test(text) || text === '-') return 0;

  const compact = text.replace(/\s/g, '');
  const negative = /^-/.test(compact) || /^-R\$/i.test(compact);
  let cleaned = compact.replace(/^-/, '').replace(/R\$/gi, '');

  // BR: 5.852,14 · US (planilha): 5,852.14 · inteiro: 7500
  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (/^\d+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  const signed = negative ? -Math.abs(num) : num;
  return Math.round(signed * 100) / 100;
}

/** Valor útil para importar: ignora null e zero. */
export function isPositiveAmount(value: number | null): value is number {
  return value != null && value > 0;
}
