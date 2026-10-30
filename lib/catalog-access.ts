// Public visitors may request generated translations of existing records.
// Bulk edits and caller-authored catalog content require a maintenance key.
export function catalogWriteAllowed(request: Request, action: unknown, key?: string): boolean {
  if (action === 'translate_preview' || action === 'translate_titles') return true;
  const supplied = request.headers.get('X-SideQuest-Catalog-Key');
  if (!key || !supplied || key.length !== supplied.length) return false;
  let difference = 0;
  for (let i = 0; i < key.length; i++) difference |= key.charCodeAt(i) ^ supplied.charCodeAt(i);
  return difference === 0;
}
