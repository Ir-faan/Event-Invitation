/** Keep both earlier <id>/ and <id>-<name>-<slug>/ objects readable. */
export function belongsToOrder(path: string, id: string): boolean {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return path.startsWith(`${id}/`)
    || path.startsWith(`${id}-`)
    || new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-${escapedId}-[a-z0-9]+(?:-[a-z0-9]+)*/$`, "i").test(path.replace(/[^/]+$/, ""));
}
