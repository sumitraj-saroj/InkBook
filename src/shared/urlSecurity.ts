const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/**
 * Validates that an external URL string has a safe scheme (http:, https:, or mailto:)
 * before opening it in the system default browser.
 * Rejects dangerous schemes like file:, javascript:, data:, shell:, etc.
 */
export function isValidExternalUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false
  try {
    const parsed = new URL(urlStr)
    return ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}
