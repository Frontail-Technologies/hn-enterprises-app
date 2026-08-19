// Shared "is every backend-flagged required field actually filled in"
// check for the customer-section forms, whose required-field list comes
// from `customer.sectionCompletion.<section>.requiredFields` rather than
// being fixed per form.
export function getRequiredFieldErrors(
  required: string[],
  values: Record<string, unknown>,
  message = "This field is required.",
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of required) {
    const value = values[key];
    if (typeof value !== "string" || !value.trim()) {
      errors[key] = message;
    }
  }
  return errors;
}
