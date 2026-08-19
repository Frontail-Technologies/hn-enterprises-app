// Shared by every Add/Edit form's dirty-state check: each screen normalizes
// its own editable fields into a plain, JSON-safe snapshot (own shape, own
// choice of what counts - see e.g. app/planning/plan.tsx's normalizeTasks),
// then this does the actual comparison. Deliberately generic but NOT a
// general deep-diff engine - only handles the plain object/array/primitive
// shapes a normalized form snapshot ever produces, so there's one shared,
// tested comparison instead of each screen writing (and maybe getting
// wrong) its own.
//
// `0`, `false`, and `""` are real, distinct values here - this is `===`
// underneath, never a truthiness check, so a field reverted to any of those
// compares equal to that same value, not to "no value".
export function isEqualSnapshot(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => isEqualSnapshot(item, b[index]));
  }

  if (isPlainObject(a) || isPlainObject(b)) {
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && isEqualSnapshot(a[key], b[key]));
  }

  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
