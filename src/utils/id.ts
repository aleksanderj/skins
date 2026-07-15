/** Local-only id generator — no server, no collisions to worry about beyond this device. */
export function generateId(prefix: string = "id"): string {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}
