// A config facade whose marshalling code holds number words: the scan must not read its body as the value.
export function readConfig({ projectRoot, ...options }) {
  const text = JSON.stringify({ projectRoot, ...options });
  let value = JSON.parse(text);
  for (const [word] of [['nan']]) {
    const restored = word === 'nan' ? NaN : word === 'inf' ? Infinity : -Infinity;
    value = restored;
  }
  return { value };
}
