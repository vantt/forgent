// legacy-view.mjs — the legacy `status` and `confidence` readings of a RunResult, in a Tier 0 leaf with no imports so a
// module that only reads results never loads the Execution door and its process spawn. `src/native/execution-door.mjs`
// re-exports it.

/**
 * A version-3 record with the legacy `status` and `confidence` read from its classification; assigning either
 * replaces the reading with the assigned value. Both are non-enumerable views, so a RunResult that crossed the host's
 * JSON line gets them back here (`runUnitInHost`), as Node's settle gave them.
 */
export function withLegacyView(record) {
  const view = (name, read) => Object.defineProperty(record, name, {
    get: read,
    set(v) { Object.defineProperty(this, name, { value: v, writable: true, configurable: true, enumerable: true }); },
    enumerable: false,
    configurable: true,
  });
  view('status', function status() {
    if (this.classification?.outcome?.category === 'ok') return 'done';
    if (this.classification?.outcome?.category === 'blocked') return 'blocked';
    if (this.classification?.confidence?.level === 'no-evidence') return 'no-evidence';
    return 'failed';
  });
  view('confidence', function confidence() { return this.classification?.confidence?.level ?? null; });
  return record;
}
