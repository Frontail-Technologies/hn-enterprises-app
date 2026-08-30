import { isEqualSnapshot } from './isEqualSnapshot';

describe('isEqualSnapshot', () => {
  it('is true for identical primitives', () => {
    expect(isEqualSnapshot('abc', 'abc')).toBe(true);
    expect(isEqualSnapshot(5, 5)).toBe(true);
    expect(isEqualSnapshot(true, true)).toBe(true);
    expect(isEqualSnapshot(null, null)).toBe(true);
    expect(isEqualSnapshot(undefined, undefined)).toBe(true);
  });

  it('is false for different primitives', () => {
    expect(isEqualSnapshot('abc', 'abd')).toBe(false);
    expect(isEqualSnapshot(5, 6)).toBe(false);
    expect(isEqualSnapshot(true, false)).toBe(false);
  });

  it('treats 0, false, and "" as real, distinct values - never as "no value"', () => {
    expect(isEqualSnapshot(0, 0)).toBe(true);
    expect(isEqualSnapshot(false, false)).toBe(true);
    expect(isEqualSnapshot('', '')).toBe(true);
    expect(isEqualSnapshot(0, '')).toBe(false);
    expect(isEqualSnapshot(0, false)).toBe(false);
    expect(isEqualSnapshot('', null)).toBe(false);
    expect(isEqualSnapshot(0, undefined)).toBe(false);
  });

  it('compares plain objects by value, not by reference', () => {
    expect(isEqualSnapshot({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(isEqualSnapshot({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toBe(false);
  });

  it('is order-independent for object keys', () => {
    expect(isEqualSnapshot({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('is false when one object has an extra key', () => {
    expect(isEqualSnapshot({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isEqualSnapshot({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it('compares nested objects recursively', () => {
    const a = { customer: { qty: '5', worker: 'Ramesh' } };
    const b = { customer: { qty: '5', worker: 'Ramesh' } };
    const c = { customer: { qty: '5', worker: 'Suresh' } };
    expect(isEqualSnapshot(a, b)).toBe(true);
    expect(isEqualSnapshot(a, c)).toBe(false);
  });

  it('compares arrays by value and order', () => {
    expect(isEqualSnapshot([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(isEqualSnapshot([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(isEqualSnapshot([1, 2], [1, 2, 3])).toBe(false);
  });

  it('does not treat an array and an object as equal', () => {
    expect(isEqualSnapshot([], {})).toBe(false);
  });
});
