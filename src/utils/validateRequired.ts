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
