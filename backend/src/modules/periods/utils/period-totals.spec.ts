import { computePeriodTotals, emptyEntrySectionSums } from '@finances/shared';

describe('computePeriodTotals (regra Cartões / DOMAIN.md)', () => {
  it('soma CARD_ITEM + CARD_FIXED na linha Cartões e inclui em A pagar', () => {
    const sums = emptyEntrySectionSums();
    sums.PAYABLE = 100;
    sums.CARD_ITEM = 50.5;
    sums.CARD_FIXED = 20;
    sums.RECEIVABLE = 30;

    const totals = computePeriodTotals(1000, sums);

    expect(totals.totalCard).toBe(70.5);
    expect(totals.totalPayables).toBe(170.5);
    expect(totals.totalReceivables).toBe(30);
    expect(totals.netObligations).toBe(140.5);
    expect(totals.monthBalance).toBe(859.5);
  });

  it('bate com conferência Janeiro da planilha (Caixa 7500, pagar 8426.40, receber 80)', () => {
    const sums = emptyEntrySectionSums();
    // totalPayables da planilha já inclui Cartões; aqui decompomos em PAYABLE + card
    sums.PAYABLE = 5000;
    sums.CARD_ITEM = 3000;
    sums.CARD_FIXED = 426.4;
    sums.RECEIVABLE = 80;

    const totals = computePeriodTotals(7500, sums);

    expect(totals.totalCard).toBe(3426.4);
    expect(totals.totalPayables).toBe(8426.4);
    expect(totals.monthBalance).toBe(-846.4);
  });

  it('detailBalance desconta saídas e soma outras entradas', () => {
    const sums = emptyEntrySectionSums();
    sums.CASH_OUT = 100;
    sums.OTHER_INCOME = 40;

    const totals = computePeriodTotals(1000, sums);

    expect(totals.monthBalance).toBe(1000);
    expect(totals.detailBalance).toBe(940);
  });
});
