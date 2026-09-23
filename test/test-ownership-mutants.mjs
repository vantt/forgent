export const mutants = [
  {
    id: "m-edit-1",
    ruleId: "src/verbs/state/edit.mjs",
    file: "src/verbs/state/edit.mjs",
    origin: "authored",
    find: "if (!item) {",
    replace: "if (false) {"
  },
  {
    id: "m-edit-2",
    ruleId: "src/verbs/state/edit.mjs",
    file: "src/verbs/state/edit.mjs",
    origin: "authored",
    find: "patch.priority = priority;",
    replace: "patch.priority = 999;"
  },
  {
    id: "m-edit-3",
    ruleId: "src/verbs/state/edit.mjs",
    file: "src/verbs/state/edit.mjs",
    origin: "authored",
    find: "const value = Number(flags[field]);",
    replace: "const value = 1;"
  }
];
