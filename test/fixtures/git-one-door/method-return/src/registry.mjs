export function createRegistry() {
  const doc = { tools: { vcs: { bin: 'git' } } };
  return Object.freeze({
    resolve(id) {
      return doc.tools[id];
    },
  });
}
