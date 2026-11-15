// The labels of the doctor registry's bridged entries (packages/distribution/contracts/doctor-registry.v1.json).
//
// A row or fix the registry gives to `bridge:<step>` is judged by Node until that step moves the layer it reads.
// The registry records, per bridged row, the Node modules it reads (`judge`) and, once per module, the step that
// removes it (`layers`). The label may not be earlier than any layer the row reads; it may be later, because a
// row can also read a layer through a function the list does not name (a note says so when there is no list).

/** The order of the steps; a later step removes its layers later. */
export const STEP_ORDER = ['S5', 'S6a', 'S6b', 'S7'];

/**
 * Failures of the bridged entries. Each `entries` item is `{ kind, id, owner, judge?, note? }`; `layers` maps a
 * module to its step; `exists` says whether a module is a file of the repository. Entries owned by Rust are not
 * judged here.
 */
export function bridgeFailures(entries, layers, exists = () => true) {
  const failures = [];
  for (const [module, step] of Object.entries(layers)) {
    if (!STEP_ORDER.includes(step)) failures.push(`layer ${module}: ${step} names no step (${STEP_ORDER.join(', ')})`);
    if (!exists(module)) failures.push(`layer ${module}: no such file (drop it from layers)`);
  }
  for (const entry of entries) {
    if (!entry.owner.startsWith('bridge:')) continue;
    const label = entry.owner.slice('bridge:'.length);
    const who = `${entry.kind} ${entry.id}`;
    if (!STEP_ORDER.includes(label)) {
      failures.push(`${who}: bridge:${label} names no step (${STEP_ORDER.join(', ')})`);
      continue;
    }
    const judge = entry.judge ?? [];
    if (judge.length === 0 && !entry.note) failures.push(`${who}: reads no recorded layer and gives no note saying why`);
    for (const module of judge) {
      const step = layers[module];
      if (step === undefined) {
        failures.push(`${who}: reads ${module}, which has no step in layers`);
      } else if (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(label)) {
        failures.push(`${who}: labelled bridge:${label} but reads ${module}, which stays in Node until ${step}`);
      }
    }
  }
  return failures;
}
