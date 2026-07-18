// command-registry.mjs — the single source of truth for the fgos CLI's
// machine-readable verb manifest (`fgos --help --json`), mirroring the
// `.bee/bin/lib/command-registry.mjs` precedent (entry-standardization P37,
// deliverable b).
//
// Pure data only — no imports of verb logic (src/state, src/runner, etc.), so
// this module sits at the `kernel` layer in docs/architecture-manifest.json:
// `bin/fgos.mjs` (entry) importing it is a downward import, and this file can
// never import back up into anything that would create a cycle.
//
// Each entry's `parameters` field is JSON-Schema in the same
// {type:"object", properties, required} shape bee's registry uses — the
// manifest is zero-translation for any tool-schema-based agent.
//
// `access` is a NEW per-verb declaration (no prior source of truth): 'read'
// for a verb that never appends an event or mutates `.fgos/state.json`,
// 'mutation' for one that does. A verb with more than one sub-mode (review,
// evolve, session) is classified by its most-privileged effect — e.g. `evolve`
// with no flags is a pure read, but `evolve --submit` appends a work item, so
// the whole verb is declared 'mutation'. This flag is a declaration only: P37
// does not wire it into dispatch/authz (that is P38's job).

export const SCHEMA_VERSION = '1.0';

export const COMMAND_REGISTRY = [
  {
    name: 'init',
    invoke: 'fgos init',
    description: 'Initialize the .fgos/ store in the current directory (event log, empty view, coexistence manifest).',
    parameters: { type: 'object', properties: {}, required: [] },
    examples: ['fgos init'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'add',
    invoke: 'fgos add',
    description: 'Add a work item directly with explicit fields (id/title/kind/risk/verify required).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        title: { type: 'string', description: 'Work item title.' },
        kind: { type: 'string', description: 'Work item kind.' },
        risk: { type: 'string', description: 'Work item risk level.' },
        verify: { type: 'string', description: 'Verification command or plan for this item.' },
        deps: { type: 'string', description: 'Comma-separated list of dependency ids.' },
        refs: { type: 'string', description: 'Comma-separated list of reference ids/links.' },
        learn: { type: 'string', description: 'Optional learning note.' },
        tier: { type: 'string', description: 'Optional tier; omit to use the store default.' },
        domain: { type: 'string', description: 'Optional domain; omit to use the store default.' },
      },
      required: ['id', 'title', 'kind', 'risk', 'verify'],
    },
    examples: ['fgos add build-cli --title "Build CLI" --kind feature --risk medium --verify "npm test"'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'submit',
    invoke: 'fgos submit',
    description: 'Intake a free-text description: derives the title, classifies tier/kind/risk, auto-generates an id, and adds the item.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Free-text description of the work (positional).' },
        async: { type: 'boolean', description: 'Mark as async/unattended (submitter does not stay to collaborate). Alias: --unattended.' },
        domain: { type: 'string', description: 'Optional domain; omit to use the store default.' },
      },
      required: ['text'],
    },
    examples: ['fgos submit "Fix the flaky retry test" --async'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'discover',
    invoke: 'fgos discover',
    description: 'Run context-discovery (clarify) or chia-viec (decompose) for an item, moving it forward per its current stage.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        config: { type: 'string', description: 'Path to the runner config (default .fgos-runner.json in cwd).' },
      },
      required: ['id'],
    },
    examples: ['fgos discover build-cli'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'move',
    invoke: 'fgos move',
    description: 'Move a work item to a new status through the FSM, with an optional CAS guard.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        to: { type: 'string', description: 'Target status to move to.' },
        expect: { type: 'string', description: 'Optional CAS guard: the expected current status.' },
        reason: { type: 'string', description: 'Optional reason; required by the FSM on specific edges (e.g. proposed -> blocked/todo).' },
      },
      required: ['id', 'to'],
    },
    examples: ['fgos move build-cli --to doing'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'edit',
    invoke: 'fgos edit',
    description: 'Patch fields on an existing item (title/kind/risk/verify/tier/refs/deps). At least one field must be given.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        title: { type: 'string', description: 'New title.' },
        kind: { type: 'string', description: 'New kind.' },
        risk: { type: 'string', description: 'New risk level.' },
        verify: { type: 'string', description: 'New verification command/plan.' },
        tier: { type: 'string', description: 'New tier.' },
        refs: { type: 'string', description: 'Comma-separated list of reference ids/links (empty string clears the field).' },
        deps: { type: 'string', description: 'Comma-separated list of dependency ids (empty string clears the field).' },
      },
      required: ['id'],
    },
    examples: ['fgos edit build-cli --verify "npm test -- --grep cli"'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'ask',
    invoke: 'fgos ask',
    description: 'Park an item in awaiting-human, carrying the question it is waiting on.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        text: { type: 'string', description: 'The question text.' },
        expect: { type: 'string', description: 'Optional CAS guard: the expected current status.' },
      },
      required: ['id', 'text'],
    },
    examples: ['fgos ask build-cli --text "Which module owns this?"'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'answer',
    invoke: 'fgos answer',
    description: 'Record the answer to a parked question and resume the item to todo.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        text: { type: 'string', description: 'The answer text.' },
        expect: { type: 'string', description: 'Optional CAS guard: the expected current status.' },
      },
      required: ['id', 'text'],
    },
    examples: ['fgos answer build-cli --text "src/cli owns it."'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'decision',
    invoke: 'fgos decision',
    description: 'Append a decision event to the log.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Decision text (or pass as positional words, joined with spaces).' },
      },
      required: ['text'],
    },
    examples: ['fgos decision --text "Use envelope wrapping at the dispatcher choke-point"'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'list',
    invoke: 'fgos list',
    description: 'List the full work/decisions view.',
    parameters: { type: 'object', properties: {}, required: [] },
    examples: ['fgos list'],
    access: 'read',
    deprecated: null,
  },
  {
    name: 'ready',
    invoke: 'fgos ready',
    description: 'List the frontier: open work items ready to be taken/dispatched right now.',
    parameters: { type: 'object', properties: {}, required: [] },
    examples: ['fgos ready'],
    access: 'read',
    deprecated: null,
  },
  {
    name: 'graph',
    invoke: 'fgos graph',
    description: 'Read-only mechanical work-graph metrics: connected components, critical path, stale-blocked, greedy top-k-unblock, folded from the dependency + lineage graph. With --what-if <id>, reports only what completing that item unblocks.',
    parameters: {
      type: 'object',
      properties: {
        'what-if': { type: 'string', description: 'A work id: report what completing it unblocks (transitive count + newly dep-satisfied items) instead of the full metrics umbrella.' },
      },
      required: [],
    },
    examples: ['fgos graph', 'fgos graph --what-if auth-3'],
    access: 'read',
    deprecated: null,
  },
  {
    name: 'rebuild',
    invoke: 'fgos rebuild',
    description: 'Rebuild the derived view (.fgos/state.json) from the event log.',
    parameters: { type: 'object', properties: {}, required: [] },
    examples: ['fgos rebuild'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'repair',
    invoke: 'fgos repair',
    description: 'Repair a truncated final line in .fgos/events.jsonl (the common crash-mid-append shape); backs up the original log first.',
    parameters: { type: 'object', properties: {}, required: [] },
    examples: ['fgos repair'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'check',
    invoke: 'fgos check',
    description: 'Read-only predicted-vs-actual report: outcomes, friction, settlement, learning, missing-outcome nag, and entropy trend.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Optional work item id (positional or --id); omit to check every item.' },
      },
      required: [],
    },
    examples: ['fgos check', 'fgos check build-cli'],
    access: 'read',
    deprecated: null,
  },
  {
    name: 'rollup',
    invoke: 'fgos rollup',
    description: "Rollup view of a root item's direct children: done/total count and each child's status.",
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Root work item id (positional or --id).' },
      },
      required: ['id'],
    },
    examples: ['fgos rollup build-cli'],
    access: 'read',
    deprecated: null,
  },
  {
    name: 'take',
    invoke: 'fgos take',
    description: 'Claim one item through the pull door (defaults to the frontier head): moves it to doing and records the predicted outcome.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Optional work item id (positional or --id); omit to take the frontier head.' },
        actor: { type: 'string', description: 'Claiming actor (default "human").', enum: ['human', 'session'] },
      },
      required: [],
    },
    examples: ['fgos take', 'fgos take build-cli --actor session'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'return',
    invoke: 'fgos return',
    description: "Complete a take: runs the item's own verify and moves it to proposed (verify green) or blocked (verify red), recording the actual outcome.",
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        timeout: { type: 'number', description: 'Optional verify timeout in milliseconds.' },
      },
      required: ['id'],
    },
    examples: ['fgos return build-cli'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'review',
    invoke: 'fgos review',
    description: "Show a proposed item's diff and trace (local, read-only) or, with --github, open/inspect a real GitHub PR for a runner-sourced item.",
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        github: { type: 'boolean', description: 'Use the GitHub transport instead of the local diff.' },
        pr: { type: 'string', description: 'With --github: an existing PR number to report status for instead of creating one.' },
      },
      required: ['id'],
    },
    examples: ['fgos review build-cli', 'fgos review build-cli --github'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'approve',
    invoke: 'fgos approve',
    description: 'Merge a runner item into main (or re-verify a pull/legacy item on main) and move it to done, or park it blocked on conflict/verify failure.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        timeout: { type: 'number', description: 'Optional verify timeout in milliseconds.' },
        github: { type: 'boolean', description: 'Merge a prior review --github PR through GitHub instead of a local git merge.' },
        pr: { type: 'string', description: 'With --github: the PR number to merge.' },
        'acknowledge-iron-law': { type: 'boolean', description: 'Acknowledge the Iron Law gate for a self-modifying runner diff before merging.' },
      },
      required: ['id'],
    },
    examples: ['fgos approve build-cli'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'reject',
    invoke: 'fgos reject',
    description: 'Reject a proposed item back to todo with a mandatory reason.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        reason: { type: 'string', description: 'Why the item is rejected.' },
      },
      required: ['id', 'reason'],
    },
    examples: ['fgos reject build-cli --reason "needs more work"'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'catchup',
    invoke: 'fgos catchup',
    description: 'Catch up a merge-related blocked item by merging its target into its own branch, re-verifying, and landing (blocked -> proposed) or reporting the conflict/verify-fail.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Work item id (positional or --id).' },
        timeout: { type: 'number', description: 'Optional verify timeout in milliseconds.' },
      },
      required: ['id'],
    },
    examples: ['fgos catchup build-cli'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'evolve',
    invoke: 'fgos evolve',
    description: 'Rank open self-improve candidates (no flags), reprint one candidate\'s full friction record (--pick), or submit a candidate as a new work item (--submit — the only mutating path).',
    parameters: {
      type: 'object',
      properties: {
        pick: { type: 'string', description: "Reprint one ranked candidate's full friction record by id." },
        submit: { type: 'string', description: 'Submit the named candidate as a new work item.' },
      },
      required: [],
    },
    examples: ['fgos evolve', 'fgos evolve --pick cand-1', 'fgos evolve --submit cand-1'],
    access: 'mutation',
    deprecated: null,
  },
  {
    name: 'triage',
    invoke: 'fgos triage',
    description: 'Rank open work by blocking fan-out (how many other open items it unblocks).',
    parameters: { type: 'object', properties: {}, required: [] },
    examples: ['fgos triage'],
    access: 'read',
    deprecated: null,
  },
  {
    name: 'session',
    invoke: 'fgos session',
    description: 'Per-session git worktree lifecycle: "start" opens a detached-HEAD worktree, "end" removes it, "list" (read-only) prints the registry.',
    parameters: {
      type: 'object',
      properties: {
        sub: { type: 'string', description: 'Sub-verb (positional).', enum: ['start', 'end', 'list'] },
        'session-id': { type: 'string', description: 'Session id (positional, required for "end").' },
        item: { type: 'string', description: '"start" only: optional work item id to bind the session to.' },
        force: { type: 'boolean', description: '"end" only: force-remove a diverged (dangling-commit) session.' },
      },
      required: ['sub'],
    },
    examples: ['fgos session start', 'fgos session end <session-id>', 'fgos session list'],
    access: 'mutation',
    deprecated: null,
  },
];
