export const mutants = [
  {
    id: "m-edit-1",
    ruleId: "verbs-state-edit",
    file: "src/verbs/state/edit.mjs",
    boundary: "missing-item-guard",
    origin: "authored",
    find: "if (!item) {",
    replace: "if (false) {"
  },
  {
    id: "m-edit-2",
    ruleId: "verbs-state-edit",
    file: "src/verbs/state/edit.mjs",
    boundary: "priority-bounds",
    origin: "authored",
    find: "patch.priority = priority;",
    replace: "patch.priority = 999;"
  },
  {
    id: "m-edit-3",
    ruleId: "verbs-state-edit",
    file: "src/verbs/state/edit.mjs",
    boundary: "number-parsing",
    origin: "authored",
    find: "const value = Number(flags[field]);",
    replace: "const value = 1;"
  },
  // -- verbs-state-read: N=3 boundary mutants, each with a direct test
  // covering the exact behavior it removes (test/direct/fgos-read.test.mjs).
  {
    id: "m-read-1",
    ruleId: "verbs-state-read",
    file: "src/verbs/state/read.mjs",
    boundary: "unknown-field-guard",
    origin: "authored",
    find: "if (!ALLOWED_ID_FIELDS.has(f)) {",
    replace: "if (false) {"
  },
  {
    id: "m-read-2",
    ruleId: "verbs-state-read",
    file: "src/verbs/state/read.mjs",
    boundary: "default-hides-resolved",
    origin: "authored",
    find: "!isResolvedStatus(item)",
    replace: "false"
  },
  {
    id: "m-read-3",
    ruleId: "verbs-state-read",
    file: "src/verbs/state/read.mjs",
    boundary: "empty-fields-guard",
    origin: "authored",
    find: "if (fieldList.length === 0) {",
    replace: "if (false) {"
  },
  // -- verbs-state-stage: N=3 boundary mutants, each with a direct test
  // covering the exact behavior it removes (test/direct/fgos-stage.test.mjs).
  {
    id: "m-stage-1",
    ruleId: "verbs-state-stage",
    file: "src/verbs/state/stage.mjs",
    boundary: "discover-stage-guard",
    origin: "authored",
    find: "if (!validStages.includes(stage)) {",
    replace: "if (false) {"
  },
  {
    id: "m-stage-2",
    ruleId: "verbs-state-stage",
    file: "src/verbs/state/stage.mjs",
    boundary: "plan-stage-guard",
    origin: "authored",
    find: "if (stage !== planningStage && stage !== legacyPlanStage) {",
    replace: "if (false) {"
  },
  {
    id: "m-stage-3",
    ruleId: "verbs-state-stage",
    file: "src/verbs/state/stage.mjs",
    boundary: "classification-patch-apply",
    origin: "authored",
    find: "if (Object.keys(classificationPatch).length === 0) return result;",
    replace: "if (true) return result;"
  }
];
