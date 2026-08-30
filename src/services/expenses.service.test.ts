import { buildExpenseListQuery } from './expenses.service';

describe('buildExpenseListQuery', () => {
  it('omits every param when nothing is filtered', () => {
    expect(buildExpenseListQuery({}).toString()).toBe('');
  });

  it('carries search, category, and date range through unchanged', () => {
    const query = buildExpenseListQuery({
      search: 'cement',
      category: 'material_expense',
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(query.get('search')).toBe('cement');
    expect(query.get('category')).toBe('material_expense');
    expect(query.get('from')).toBe('2026-01-01');
    expect(query.get('to')).toBe('2026-01-31');
  });

  it('joins a multi-select column-filter checkbox into one comma-separated value', () => {
    const query = buildExpenseListQuery({ columnFilters: { status: ['submitted', 'approved'] } });
    expect(query.get('status')).toBe('submitted,approved');
  });

  it('sends every active column filter, each under its own column name', () => {
    const query = buildExpenseListQuery({
      columnFilters: {
        paidTo: ['Ramesh Traders'],
        purpose: ['Cement', 'Bricks'],
        status: ['draft'],
      },
    });
    expect(query.get('paidTo')).toBe('Ramesh Traders');
    expect(query.get('purpose')).toBe('Cement,Bricks');
    expect(query.get('status')).toBe('draft');
  });

  it('omits a column filter key whose value list is empty', () => {
    const query = buildExpenseListQuery({ columnFilters: { status: [] } });
    expect(query.has('status')).toBe(false);
  });

  it('does not send category through the generic column-filter path', () => {
    const query = buildExpenseListQuery({ category: 'rent', columnFilters: { status: ['draft'] } });
    expect(query.get('category')).toBe('rent');
    expect(query.getAll('category')).toHaveLength(1);
  });
});
