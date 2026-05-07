/**
 * Local-only no-op logger. Kept as a stub so internal callers compile;
 * OSS build does not ship a server-side log endpoint.
 */
export function logToServer(_tag: string, _msg: string, _data?: unknown): void {
  /* no-op */
}
