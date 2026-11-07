/**
 * Configuration checks for the live app's basic readiness endpoint.
 * Never return the signing secret or environment-variable values to clients.
 */
export function isSessionSigningConfigured(
  secret: string | undefined,
  production: boolean,
): boolean {
  return !production || (typeof secret === "string" && secret.length >= 32);
}
