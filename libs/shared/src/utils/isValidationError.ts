/**
 * checks if an error is one that is coming from a validation pipe
 */
export function isValidationError(error: any): boolean {
  return Array.isArray(error);
}
