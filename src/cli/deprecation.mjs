export function formatDeprecation(deprecated) {
  if (!deprecated) return null;
  if (typeof deprecated === 'string') return deprecated;
  if (typeof deprecated === 'object') {
    const parts = [];
    if (deprecated.since) parts.push(`since ${deprecated.since}`);
    if (deprecated.use_instead) parts.push(`use ${deprecated.use_instead}`);
    return parts.length > 0 ? parts.join('; ') : JSON.stringify(deprecated);
  }
  return String(deprecated);
}
