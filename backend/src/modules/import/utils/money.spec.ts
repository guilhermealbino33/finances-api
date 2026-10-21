import { isPositiveAmount, parseSpreadsheetMoney } from './money';

describe('parseSpreadsheetMoney', () => {
  it('parseia formato US da planilha', () => {
    expect(parseSpreadsheetMoney(' R$ 5,852.14 ')).toBe(5852.14);
    expect(parseSpreadsheetMoney(' R$ 80.50 ')).toBe(80.5);
    expect(parseSpreadsheetMoney(' R$ 7,500.00 ')).toBe(7500);
  });

  it('trata traço / vazio como zero', () => {
    expect(parseSpreadsheetMoney(' R$ -   ')).toBe(0);
    expect(parseSpreadsheetMoney('-')).toBe(0);
  });

  it('parseia negativo', () => {
    expect(parseSpreadsheetMoney('-R$ 846.40 ')).toBe(-846.4);
  });

  it('aceita número cru', () => {
    expect(parseSpreadsheetMoney(7500)).toBe(7500);
  });

  it('isPositiveAmount', () => {
    expect(isPositiveAmount(10)).toBe(true);
    expect(isPositiveAmount(0)).toBe(false);
    expect(isPositiveAmount(null)).toBe(false);
  });
});
