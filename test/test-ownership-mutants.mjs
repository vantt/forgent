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
  }
];
