// src/workflow/seat-providers.mjs — which executor and provider actually served each seat of a run.
// The binding a seat was planned with can differ from the one that settled it (a provider limit moves
// the seat to another account or another candidate), and a persona's text and the documents it was
// given may therefore have reached a provider the owner did not expect. This reads the settled
// results of a projected workflow state and lists, per unit and role, the executor, the provider
// family and the model that ran, and where a failover moved it from. Pure: it reads only the state.

/**
 * @param {{ steps?: Record<string, { units?: Record<string, { results?: object[] }> }> }} state a projected workflow state
 * @returns {Array<{ step: string, unit: string, role: string, round: number | null, persona: string | null, executor: string | null,
 *   invocation: string | null, family: string | null, model: string | null, outcome: string | null,
 *   movedFrom: { executor: string, kind: string, reason: string } | null }>}
 */
export function seatProviders(state) {
  const rows = [];
  for (const [stepId, step] of Object.entries(state?.steps ?? {})) {
    for (const [unitId, unit] of Object.entries(step?.units ?? {})) {
      for (const result of unit?.results ?? []) {
        const binding = result.binding ?? {};
        const fallback = binding.provenance?.fallbackFrom ?? binding.fallbackFrom ?? null;
        rows.push({
          step: stepId,
          unit: unitId,
          role: result.role ?? null,
          round: result.round ?? null,
          persona: binding.persona ?? null,
          executor: binding.executor ?? result.runResult?.executorId ?? null,
          invocation: binding.invocation ?? null,
          family: result.runResult?.policy?.providerModel ?? binding.familySpread?.value?.family ?? null,
          model: binding.model ?? null,
          outcome: result.outcome ?? null,
          movedFrom: fallback ? { executor: fallback.executor, kind: fallback.kind, reason: fallback.reason } : null,
        });
      }
    }
  }
  return rows;
}
