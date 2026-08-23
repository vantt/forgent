// replay.mjs — fold the event log into the current state view (per D3: the
// view is always rebuildable from the log, never the truth itself).
//
// PURE: no fs import for writing, no Date.now() anywhere in the fold logic —
// every timestamp in the resulting view comes from the event's own `ts`
// field. `rebuildView` reads the log through `readEvents` (events.mjs), the
// one read path shared with the rest of the state layer; it does not write.
//
// Deterministic: folding the same ordered event array (or rebuilding from
// the same log) twice always yields deep-equal views.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readEvents, readLastLineBefore, readEventsFromByte } from './events.mjs';
import { DEFAULTS } from './work.mjs';

// tsk-49e: every top-level key applyEvent ever writes to `view` is either an
// array `.push`ed onto in place (only `decisions`) or reassigned via a
// `{...oldValue, ...patch}` spread (every other container: work, gates,
// settlements, learnings, decisionsById, outcomes, discovery, tools, and any
// future one applyEvent adds) — never mutated two levels deep in place. A
// generic ONE-LEVEL shallow clone of each top-level key is therefore
// sufficient to protect a seed view's own nested references: `foldEvents`
// only ever needs to guarantee its OWN `view` object (and each of its direct
// children) is a fresh reference, never that every nested object is.
function cloneTopLevel(seedView) {
  const out = {};
  for (const [key, value] of Object.entries(seedView)) {
    if (Array.isArray(value)) out[key] = [...value];
    else if (value && typeof value === 'object') out[key] = { ...value };
    else out[key] = value;
  }
  return out;
}

/**
 * Fold an ordered array of events (as returned by `readEvents`) into a state
 * view: `{ work: { [id]: workItem }, decisions: [...] }`. Unknown event
 * types are ignored rather than rejected, so the log can grow new event
 * types over time without breaking replay of older logs.
 *
 * Backward-compat (per D7b): a pre-Phase-2 `work.add` payload carries no
 * `tier` at all (absence of the field, same signal `v` uses — see
 * work.mjs's SCHEMA_VERSION doc). Folding applies `DEFAULTS` from work.mjs
 * — the single declared source — for any field missing on the payload, so
 * old and new logs (and a log mixing old events followed by new ones) all
 * fold into a view shaped the same way. This module declares no default of
 * its own.
 *
 * `seedView` (tsk-49e, optional): when supplied, folding starts from a
 * shallow clone of it (`cloneTopLevel`, above) instead of an empty view —
 * `events` is then expected to be only the events NOT already folded into
 * `seedView`, e.g. the incremental-snapshot read path in `rebuildView`
 * below. Omitting it is byte-identical to every pre-tsk-49e caller.
 */
export function foldEvents(events, seedView) {
  const view = seedView ? cloneTopLevel(seedView) : { work: {}, decisions: [] };
  for (const event of events) {
    applyEvent(view, event);
  }
  return view;
}

function applyEvent(view, event) {
  switch (event.type) {
    case 'work.add': {
      const item = event.payload;
      if (item && typeof item === 'object' && typeof item.id === 'string') {
        view.work[item.id] = { ...DEFAULTS, ...item };
      }
      break;
    }
    case 'work.move': {
      const { id, from, to, ask, answer, role, learning, headAtTake, headAtReturn, branchHeadAtTake, branchHeadAtReturn, mergedSha, mergedInto, reason, parentSnapshotAtAsk, claimTrigger, statusAtAsk, writer, statusCategory, parkReason, rationale, alternatives, source, askRationale, askAlternatives, askSource } = event.payload ?? {};
      const item = view.work[id];
      if (item) {
        item.status = to;
      }
      // Writer provenance (D8/D15, str46-io-contract): folds onto the item
      // unconditionally, latest write wins -- a durable per-item field
      // recording who last wrote it, unlike claimRole below which only
      // folds on the doing-entry edge. Absent on a legacy event with no
      // writer, mirroring reason/headAtTake above (backward-compat).
      if (item && writer !== undefined) {
        item.writer = writer;
      }
      // statusCategory (decision record 0027, D2/D3): folds onto the item
      // unconditionally, latest-write-wins, mirroring `writer` immediately
      // above -- this cell only makes the field exist and get written/
      // folded correctly (consumer migration is tsk-38t-4's own scope, so
      // nothing reads `item.statusCategory` yet). Purely additive read of
      // whatever store.mjs's moveWork actually stamped on THIS event --
      // never invented or recomputed here (that would be derive-on-read,
      // which platform-foundations.md's L3 forbids; see STATUS_CATEGORIES's
      // own doc comment, work.mjs). Absent on every event before this cell
      // existed AND on every move into one of the four tail-segment
      // statuses (delivered/retrospective/cleanup/done, D1) -- on both, per
      // RUL11 optional-additive discipline (same convention `reason` above
      // already follows), the fold simply leaves whatever `item.
      // statusCategory` last was; it never actively clears a stale value on
      // a tail-segment move. That is a deliberate, conservative choice, not
      // an oversight: nothing reads this field yet, so a momentarily-stale
      // category sitting on a `delivered` item is inert, and clearing it
      // would be exactly the kind of behavior-shaping guess this cell's
      // task explicitly rules out (only the schema/write-time concern is in
      // scope here) -- what a tail-segment item's category should read, if
      // anything, is tsk-38t-4's decision to make.
      if (item && statusCategory !== undefined) {
        item.statusCategory = statusCategory;
      }
      // parkReason (tsk-48i D1): same fold shape as statusCategory
      // immediately above -- purely additive read of whatever store.mjs's
      // moveWork actually stamped on THIS event, never invented/recomputed
      // here. Absent on every event before this cell existed and on every
      // move into a status with no parkReason entry (D1's own guard), same
      // conservative "leave whatever it last was" behavior statusCategory
      // already established.
      if (item && parkReason !== undefined) {
        item.parkReason = parkReason;
      }
      // Claim attribution (stage-decompose S2-pull D1/cell action (4)):
      // fold the claiming `role` onto the item itself as `claimRole` —
      // separate from the settlement channel's per-transition `role` below,
      // this is a durable per-item field the reap guard reads (`item.status
      // === 'doing' && item.claimRole is human/session` means a person is
      // holding it, never auto-reclaimed). `headAtTake` (the host repo's HEAD
      // at claim time, per D1's take verb) rides the same event additively
      // so `fgos return` can later measure real progress against it. Both
      // only ever get set on THIS claim's `to === 'doing'` move — a runner
      // claim carries `role: 'runner'` and no `headAtTake`, so this is a
      // strict addition for the pull door, never a rewrite of the runner's
      // own claim shape.
      // Guarded on `from !== 'awaiting-human'` (claim-lock §5.1): a resume out
      // of the human gate can now legally land on `doing` (the new
      // awaiting-human -> doing edge, status-fsm.mjs), but that is a RESUME of an
      // existing claim, never a fresh one. In practice only `claimRole` is
      // at real risk (answerAwaiting's caller, bin/fgos.mjs's `answer` verb,
      // forwards `role: 'human'` but never headAtTake/branchHeadAtTake/
      // claimTrigger, so those three would no-op via moveWork's own
      // `!== undefined` guards regardless) — this guard is what stops that
      // `role` from silently overwriting the ORIGINAL pick/take's
      // claimRole. Written to cover all four fields uniformly anyway, since
      // that is the same shape the sibling fold below already has, and it
      // costs nothing extra to also protect the other three from a future
      // caller that DOES start passing them. The two genuine claim edges
      // (`todo -> doing`, `blocked -> doing`) never have `from ===
      // 'awaiting-human'`, so this guard changes nothing for them.
      if (item && to === 'doing' && from !== 'awaiting-human') {
        if (role !== undefined) {
          item.claimRole = role;
        }
        if (headAtTake !== undefined) {
          item.headAtTake = headAtTake;
        }
        // Branch-source claim marker (human-rounds D2): the branch's OWN
        // HEAD at take time, discriminator for a blocked-item-with-branch
        // take — set only on THIS claim's `to === 'doing'` move, mirroring
        // headAtTake exactly, never on a main-based take (which carries
        // headAtTake instead).
        if (branchHeadAtTake !== undefined) {
          item.branchHeadAtTake = branchHeadAtTake;
        }
        // Claim-trigger marker (claim-lock §7): audit-only record of what
        // dispatched this claim (e.g. `'herdr'`), folded the same way as
        // claimRole above — durable per-item field, set only on a genuine
        // new claim.
        if (claimTrigger !== undefined) {
          item.claimTrigger = claimTrigger;
        }
      }
      // Latest human rationale on the item (worker-feedback): a `reason`
      // rides reject (`awaiting-approval -> todo`) and park moves; fold the newest
      // one onto the item (latest wins) so the next dispatch can hand the
      // worker the human's actual objection. Lazy: items whose moves never
      // carried a reason keep no `reason` key at all.
      if (item && reason !== undefined) {
        item.reason = reason;
      }
      // Pull-door return marker (pr-lifecycle D3/D4): folds onto the item the
      // same way `headAtTake` above folds on claim — durable per-item field,
      // set only on THIS return's `to === 'awaiting-approval'` move (a runner's own
      // `doing -> awaiting-approval` goal-check pass never carries `headAtReturn`, so
      // this is a strict addition for the pull door, never a rewrite of the
      // runner's own proposal shape).
      if (item && to === 'awaiting-approval' && headAtReturn !== undefined) {
        item.headAtReturn = headAtReturn;
      }
      // Branch-source return marker (human-rounds D2, mirrors headAtReturn
      // above): folds onto the item from THIS return's `to === 'awaiting-approval'`
      // move alone. A branch-source return never carries headAtReturn (CẤM
      // per D2 — mixing the two markers would give reviewDiff a meaningless
      // range), so the two fields are always mutually exclusive on a given
      // item, but the fold itself imposes no such check — it just reads
      // whichever field the move actually carried.
      if (item && to === 'awaiting-approval' && branchHeadAtReturn !== undefined) {
        item.branchHeadAtReturn = branchHeadAtReturn;
      }
      // Merge-evidence provenance (tsk-5dk), same fold-onto-item shape as
      // headAtReturn/branchHeadAtReturn above, gated on THIS move's own
      // `to === 'delivered'` — a hand-typed move (or a verify-only
      // pull-door delivery) never carries these, so their absence on the
      // folded item is itself evidence, not a gap.
      if (item && to === 'delivered' && mergedSha !== undefined) {
        item.mergedSha = mergedSha;
      }
      if (item && to === 'delivered' && mergedInto !== undefined) {
        item.mergedInto = mergedInto;
      }
      // Human-gate ask/answer (per async-human-gate D2/D5), mirroring the
      // work.outcome lazy-key/merge-by-id precedent above: the ask (entry
      // move into awaiting-human) and answer (exit move back to todo) ride
      // as optional payload on the SAME work.move event rather than a
      // separate event type, so this folds them into a lazy `gates` key
      // merged by id instead of a new case. GUARDED on ask/answer actually
      // being present — a gateless move never creates the key, and `gates`
      // stays absent from the view entirely on any log with no gate events
      // (mirrors the "no outcomes key" backward-compat guarantee).
      //
      // `parentSnapshotAtAsk` (str61 D2/D3) rides the SAME fold, guarded the
      // same way (only stamped when present) — a snapshot of the item's
      // parent taken at ask-time, so a later read can diff the parent's
      // current state against it. It folds only on the `ask` branch (the
      // only move that ever carries it, per putInAwaiting/store.mjs); a
      // fresh `ask` after an `answer` overwrites the prior snapshot with the
      // new one via this same spread-then-override merge, never accumulating
      // both.
      //
      // `statusAtAsk` (claim-lock §5.1) rides the SAME fold, same guard: the
      // item's own status at the moment this ask parked it, read back by
      // answerAwaiting (store.mjs) to pick the resume target. Only the `ask`
      // branch ever carries it; a fresh `ask` overwrites the prior value the
      // same way parentSnapshotAtAsk does.
      if (ask || answer) {
        if (!view.gates) {
          view.gates = {};
        }
        view.gates[id] = {
          ...view.gates[id],
          ...(ask ? { ask } : {}),
          // askHistory (tsk-25g D1): ADDITIVE to the single-slot `ask`
          // overwrite above, never a replacement for it -- every OTHER
          // `.ask` reader (discovery.mjs's/decompose.mjs's own "most recent
          // question" prompt text, decompose.mjs's risk/blast-radius
          // bypass-reason match) keeps reading the single-slot value
          // unchanged. Appends only on a FRESH `ask` (an `answer`-only
          // event never adds an entry), same guard `ask ? {ask} : {}` above
          // already uses -- accumulates the full round-to-round rejection
          // history for judgeVerifySemanticCorrectness's own priorRejection
          // threading (discovery.mjs/decompose.mjs) to draw on, instead of
          // only the immediately-prior round.
          ...(ask ? { askHistory: [...(view.gates[id]?.askHistory ?? []), ask] } : {}),
          ...(answer ? { answer } : {}),
          ...(parentSnapshotAtAsk !== undefined ? { parentSnapshotAtAsk } : {}),
          ...(statusAtAsk !== undefined ? { statusAtAsk } : {}),
          // rationale/alternatives/source (tsk-63c D1, decision-schema-
          // rationale-alternatives-source): same guarded fold as
          // parentSnapshotAtAsk/statusAtAsk above — only stamped when
          // present, overwritten by a fresh ask/answer the same way. Only
          // `answer` ever carries these now (tsk-19zm D2 moved `ask`'s own
          // values to askRationale/askAlternatives/askSource below), so
          // this trio stays the human's answer, still authoritative.
          ...(rationale !== undefined ? { rationale } : {}),
          ...(alternatives !== undefined ? { alternatives } : {}),
          ...(source !== undefined ? { source } : {}),
          // askRationale/askAlternatives/askSource (tsk-19zm D2): the
          // agent's checkpoint distillate as of the latest `ask` — kept
          // separate from rationale/alternatives/source above so a later
          // `answer` never overwrites it; a fresh `ask` overwrites only
          // this trio, never the answer-side one.
          ...(askRationale !== undefined ? { askRationale } : {}),
          ...(askAlternatives !== undefined ? { askAlternatives } : {}),
          ...(askSource !== undefined ? { askSource } : {}),
        };
      }
      // Settlement channel (kênh 1 của capture 2 kênh, per Phase 3
      // S3-closeout, vision §8) — two of the three settling kinds ride on
      // work.move: 'answer' (an awaiting-human gate resolved by a person's
      // decision) and 'close' (the item reaching the terminal `done`
      // status, via either entry edge). No new event type (D3/R3 — the
      // data already exists in the log); this only APPENDS a derived
      // record, mirroring frictions/discovery below (never merge/replace —
      // a settlement is a one-time occurrence per transition, and reusing
      // the id for a later unrelated settlement must not erase this one).
      // GUARDED on `item` (a real work item this move actually applied to)
      // exactly like `item.status = to` above — a move for an id that was
      // never added must stay a no-op in every respect (ghost-id test).
      // ALSO guarded on `event.v` being present: a true pre-Phase-2 legacy
      // event (per D7b/R11 — `v` absent entirely, the fixture's own shape)
      // predates the schema-version regime itself, and backward-compat.test
      // locks its fold to a byte-identical historical view with no
      // `settlements` key at all. Any v-carrying log (Phase 2 onward,
      // including logs written before this cell existed) mines normally —
      // this is the exact D7c signal the repo already uses to draw that line.
      if (item && event.v !== undefined) {
        let kind = null;
        let detail = null;
        if (answer) {
          kind = 'answer';
          detail = answer;
        } else if (to === 'done') {
          kind = 'close';
        }
        if (kind) {
          if (!view.settlements) {
            view.settlements = {};
          }
          view.settlements[id] = [
            ...(view.settlements[id] ?? []),
            { kind, role: role ?? null, ts: event.ts, detail },
          ];
        }
      }
      // Câu-6 tự động (per Phase 3 S3-closeout (c), six-questions L5): the
      // `done`-closing work.move carries an additive `learning` object
      // composed by store.mjs (never here — replay only folds, per D3).
      // Mirrors frictions/discovery's fold rule: APPENDED per id, never
      // merged/replaced. `done` is terminal (status-fsm.mjs — no outgoing edge) so
      // in practice at most one learning record ever accumulates per id, but
      // the append shape stays consistent with the other occurrence-style
      // channels. `learnings` is a LAZY key exactly like
      // `outcomes`/`frictions`/`discovery`: absent until the first item
      // closes with a `learning` payload (backward-compat.test) — a legacy
      // event with no `learning` field (or, per the guard above, no `v` at
      // all) never creates it.
      if (item && to === 'done' && learning) {
        if (!view.learnings) {
          view.learnings = {};
        }
        view.learnings[id] = [
          ...(view.learnings[id] ?? []),
          { ...learning, ts: event.ts },
        ];
      }
      break;
    }
    case 'work.edit': {
      // Additive fold (per D3/R11): merges ONLY the patched keys onto the
      // existing item, mirroring how work.move folds partial fields
      // (reason, headAtTake, ...) rather than replacing the whole record.
      // Guarded on `item` for the same ghost-id no-op reason as every other
      // case here — an edit for an id that was never added stays a no-op.
      const { id, patch, writer } = event.payload ?? {};
      const item = view.work[id];
      if (item && patch && typeof patch === 'object') {
        Object.assign(item, patch);
      }
      // Writer provenance (D8/D15, str46-io-contract): same unconditional,
      // latest-write-wins fold as work.move above -- writer is a sibling of
      // patch on the payload, never itself part of the editable-field set.
      if (item && writer !== undefined) {
        item.writer = writer;
      }
      break;
    }
    case 'decision': {
      view.decisions.push({ ...event.payload, ts: event.ts });
      // Per-item fold (tsk-63c D1/seq 1206 (renumbered by tsk-n4i-1; was
      // 1190 before the live-log seq repair), decision-schema-rationale-
      // alternatives-source): `id` is optional on a decision (per
      // addDecision) — when present, ALSO fold into a lazy `decisionsById`
      // key, same append-per-id pattern as `discovery`/`frictions` above
      // (decisions accumulate over time, never merge/replace). The global
      // push above stays unconditional either way, so id-less decisions and
      // every existing reader of the flat `decisions` array are unaffected.
      if (typeof event.payload?.id === 'string') {
        if (!view.decisionsById) {
          view.decisionsById = {};
        }
        view.decisionsById[event.payload.id] = [
          ...(view.decisionsById[event.payload.id] ?? []),
          { ...event.payload, ts: event.ts },
        ];
      }
      break;
    }
    case 'work.outcome': {
      // Additive event type (per D7 schema evolution / plan Approach S1):
      // predicted (written at claim) and actual (written at close) are TWO
      // separate work.outcome events sharing the same `id` — this MERGES by
      // id rather than replacing, so a later actual-only payload folds
      // alongside an earlier predicted-only payload instead of erasing it.
      // `outcomes` is a LAZY key: never present on `view` until at least one
      // work.outcome event folds (see foldEvents' initializer above) — this
      // keeps replay of any log with no work.outcome events shaped exactly
      // as before this event type existed (backward-compat.test).
      const { id } = event.payload ?? {};
      if (typeof id === 'string') {
        if (!view.outcomes) {
          view.outcomes = {};
        }
        view.outcomes[id] = { ...view.outcomes[id], ...event.payload };
      }
      break;
    }
    case 'work.stage': {
      // Additive event type (per stage-clarify D1/D3/D10): a clarify-pass
      // moves `item.stage` and, when the discovery engine supplied one,
      // fills in the item's real `verify` at the SAME time — one event,
      // never two, so there is no window where the item reads `executing`
      // with a stale placeholder verify (D10). `item.stage` itself is never
      // defaulted here — a missing `stage` on the record stays missing
      // (read lazily as `executing` by consumers, per D8); this case only
      // ever runs for an item that already has a real `work.stage` event in
      // its history, at which point setting the field explicitly is correct.
      const { id, from, to, verify, role, writer } = event.payload ?? {};
      const item = view.work[id];
      if (item) {
        item.stage = to;
        if (verify !== undefined) {
          item.verify = verify;
        }
        // Writer provenance (D8/D15, str46-io-contract): same unconditional,
        // latest-write-wins fold as work.move/work.edit above.
        if (writer !== undefined) {
          item.writer = writer;
        }
      }
      // Settlement channel, third kind (mirrors the work.move case above):
      // a clarify-pass is the third settling event type per the S3-closeout
      // design — settlement means "left the domain's entry stage carrying a
      // verify" (D10), originally what `from === 'clarify'` tested. tsk-qod
      // D1/D2: `clarify` retires entirely for coding — `discovery`
      // (`stages[0]`) is now that entry stage, so this gate moves with it;
      // no live coding item can ever produce `from === 'clarify'` again
      // (only the historical migration edges do, which never carry a
      // `role`/`verify` settlement shape to begin with). Guarded on the
      // origin rather than `to === 'executing'` (stage-decompose D2): the
      // discovery engine's first real hop off `discovery` must still settle
      // even though it no longer lands on `executing` directly;
      // `exploring -> planning`/`planning -> executing` do NOT settle here
      // (they never carry a `from === 'discovery'`), so they stay
      // undocumented until a future spec pass. Guarded on `item` for the
      // same ghost-id no-op reason as work.move above.
      //
      // tsk-31lz: leaving `discovery` stopped being sufficient once tsk-30v
      // made an UNCLEAR verdict advance the stage too (`discovery ->
      // exploring`) while the item parks in `awaiting-human` with an open
      // question — that path recorded a "passed" settlement for an item
      // just judged NOT clear, with the FALLBACK_VERIFY placeholder as its
      // `detail`. The verdict, not the destination, is what decides: the
      // gate keys off the `work.discovery` record `resolveDiscovery`
      // appends immediately before its own `moveStage` (discovery.mjs), so
      // this stays a plain forward fold over data the log ALREADY carries.
      //
      // Deliberately not `to !== 'exploring'`: that reads the arrival edge,
      // which RUL27 (`docs/specs/work-state.md`) locks against precisely so
      // inserting a stage in the middle cannot silence an existing
      // settlement — and it would retroactively silence every real
      // `discovery -> exploring` settlement in this repo's own live log (all
      // 45 of them, written before tsk-30v, when that edge WAS the clear
      // path). Deliberately not a new payload field stamped in
      // discovery.mjs either: replay is a pure fold over events already
      // written, so a source-side marker would only ever fix moves made
      // AFTER the fix, leaving any already-logged unclear move settling
      // wrongly on every replay forever.
      //
      // A log line with no readable verdict (legacy, or a hand-run `fgos
      // stage` move) settles exactly as it did before this fix — only an
      // explicit `clear: false` suppresses.
      const drivingVerdict = view.discovery?.[id]?.at(-1);
      if (item && from === 'discovery' && drivingVerdict?.clear !== false) {
        if (!view.settlements) {
          view.settlements = {};
        }
        view.settlements[id] = [
          ...(view.settlements[id] ?? []),
          { kind: 'clarify-pass', role: role ?? null, ts: event.ts, detail: verify ?? null },
        ];
      }
      break;
    }
    case 'work.handoff': {
      // Additive event type (tsk-2t9c D1/D4/D8): an ASYNC call — the item
      // parks for another role, `holder` changes. Two lazy structures,
      // same absent-key-means-never-happened shape `view.outcomes`/
      // `view.discovery` already use: `view.work[id].holder` is a
      // latest-write-wins field (mirrors `item.stage` above); `callThreads`
      // is an APPEND-only per-id log (mirrors `view.discovery`), the
      // record a replaying reader needs to derive open-call depth for the
      // callstack cap (src/state/handoff.mjs's own `openCallDepth` input
      // is computed by the caller from this array, never stored as a
      // counter field — a counter can drift from the log; a fold cannot).
      const raw = event.payload ?? {};
      const id = raw.id;
      // tsk-397 D16 renamed the coding roleGraph's 'human-advisor' role to
      // 'advisor'. events.jsonl is append-only and already carries real
      // pre-rename 'human-advisor' handoffs (e.g. seq 18440, tsk-1yf) --
      // without this normalization, replay reconstructs a `holder` value
      // the new vocabulary rejects (WorkValidationError on any later write
      // to that item), permanently stranding it. Map the retired literal
      // forward on both fields a reader might compare against the current
      // roleGraph vocabulary -- `from`/`to` are historical record either
      // way, so normalizing here (not just `to`) keeps replay internally
      // consistent instead of only patching the field that happens to
      // throw today.
      const normalizeRole = (role) => (role === 'human-advisor' ? 'advisor' : role);
      const from = normalizeRole(raw.from);
      const to = normalizeRole(raw.to);
      const { reason, mode, returning, note } = raw;
      const item = view.work[id];
      if (item && typeof to === 'string') {
        item.holder = to;
      }
      if (typeof id === 'string') {
        if (!view.callThreads) {
          view.callThreads = {};
        }
        view.callThreads[id] = [
          ...(view.callThreads[id] ?? []),
          { kind: 'handoff', from, to, reason, mode: mode ?? 'async', returning: Boolean(returning), note: note ?? null, ts: event.ts },
        ];
      }
      break;
    }
    case 'work.call-summary': {
      // Additive event type (tsk-2t9c D8): a SYNC in-session call
      // (subagent) — the ball never leaves the session, so `holder` is
      // deliberately left untouched here (the D8 invariant: holder
      // changes only via work.handoff above). A compact record still
      // folds into the same `callThreads[id]` array so compound-learn can
      // see the full team-interaction picture without the state machine
      // ever treating a sync call as a role change.
      const { id, calleeRole, reason, outcome } = event.payload ?? {};
      if (typeof id === 'string') {
        if (!view.callThreads) {
          view.callThreads = {};
        }
        view.callThreads[id] = [
          ...(view.callThreads[id] ?? []),
          { kind: 'call-summary', calleeRole, reason, outcome: outcome ?? null, ts: event.ts },
        ];
      }
      break;
    }
    case 'work.discovery': {
      // Additive event type (per stage-clarify D3/D6) — mirrors work.friction
      // below: each context-discovery verdict is its own occurrence (pass or
      // not), so this APPENDS per id rather than merging/replacing. `discovery`
      // is a LAZY key exactly like `frictions`/`outcomes`/`gates`: absent from
      // the view until the first work.discovery event folds (backward-compat).
      const { id } = event.payload ?? {};
      if (typeof id === 'string') {
        if (!view.discovery) {
          view.discovery = {};
        }
        view.discovery[id] = [
          ...(view.discovery[id] ?? []),
          { ...event.payload, ts: event.ts },
        ];
      }
      break;
    }
    case 'work.gate-approve': {
      // Additive event type (tsk-19j D1/D11): a structured, explicit approve
      // record for a skill-embedded Gate ("Approve CONTEXT.md?"/"Approve
      // plan.md?"/"Approve moving to executing?") — deliberately separate
      // from the ask/answer fold above (that pair is the `awaiting-human`
      // park, a different mechanism). Three parallel fields live side by
      // side in the SAME lazy `gates[id]` object the ask/answer fold already
      // creates: `contextApprove` (fgos-coding-exploring), `planApprove`
      // (fgos-coding-planning), `validateApprove` (fgos-coding-validating) — each an
      // OVERWRITE of just that one field (last approve wins per gate, mirrors
      // how a fresh `ask` overwrites the prior one above), never merged with
      // the other two gates' fields. `gates` stays the same LAZY key as
      // ask/answer — absent from the view on any log with no gate events at
      // all (backward-compat).
      const { id, gate, actor, verify } = event.payload ?? {};
      if (typeof id === 'string' && typeof gate === 'string') {
        if (!view.gates) {
          view.gates = {};
        }
        view.gates[id] = {
          ...view.gates[id],
          [gate]: { actor, at: event.ts, verify },
        };
      }
      break;
    }
    case 'goal.focus': {
      // Additive event type (per str67-goal-directed-planning D3/D4): the
      // single persisted pointer to the currently active goal id — a
      // scalar OVERWRITE (last-write-wins), never merged like work.outcome
      // above (D4: exactly one active focus at a time). `focus` is a LAZY
      // key exactly like `outcomes`/`frictions`/`gates`: absent from the
      // view until the first goal.focus event folds, so replaying a
      // pre-STR67 log produces a view shaped exactly as before this event
      // type existed (backward-compat).
      const { id } = event.payload ?? {};
      if (typeof id === 'string') {
        view.focus = id;
      }
      break;
    }
    case 'work.friction': {
      // Additive event type (per D7 schema evolution, mirroring work.outcome
      // above) — but with the OPPOSITE fold rule: one friction record per
      // final failure exit (park/halt), and a single id can accumulate
      // several across re-claims, so this APPENDS per id. It never merges
      // and never replaces — each record is its own occurrence, and a later
      // one erasing an earlier one would silently lose history (the exact
      // fold-replace bug class critical-patterns records). `frictions` is a
      // LAZY key exactly like `outcomes`/`gates`: absent from the view until
      // the first work.friction event folds (backward-compat.test).
      const { id } = event.payload ?? {};
      if (typeof id === 'string') {
        if (!view.frictions) {
          view.frictions = {};
        }
        view.frictions[id] = [
          ...(view.frictions[id] ?? []),
          { ...event.payload, ts: event.ts },
        ];
      }
      break;
    }
    case 'work.resolve-park-reason': {
      // Clears reason/parkReason from the live item view on terminal items,
      // and records the note additively in view.parkResolutions[id].
      const { id, writer } = event.payload ?? {};
      const item = view.work[id];
      if (item) {
        delete item.reason;
        delete item.parkReason;
        if (writer !== undefined) {
          item.writer = writer;
        }
      }
      if (typeof id === 'string') {
        if (!view.parkResolutions) {
          view.parkResolutions = {};
        }
        view.parkResolutions[id] = [
          ...(view.parkResolutions[id] ?? []),
          { ...event.payload, ts: event.ts },
        ];
      }
      break;
    }
    // tsk-in1-1 D1: `tool.register`/`tool.remove` retired — a tool provider
    // is now declared directly in `runner.executors.<id>` (config-edited,
    // never event-sourced). Historical events of either type already in
    // `.fgos/events.jsonl` fall through to `default` below and are skipped,
    // same forward-compatible "unknown type, not an error" treatment any
    // other retired event type gets.
    default:
      // Forward-compatible: an event type this view does not (yet) know how
      // to fold is skipped, not an error — readEvents already guarantees
      // every line parsed as valid JSON.
      break;
  }
}

// tsk-49e: state.json's own sibling `snapshot` field (written by
// store.mjs's refreshView) — {size, mtimeMs, lastLine} as of the last
// successful full read. Returns the persisted view directly (zero bytes of
// `logPath` read) when the log is byte-for-byte unchanged since that
// snapshot; folds only the NEW bytes onto it when the log has safely grown
// past it (verified via readLastLineBefore); returns null (falls back to a
// full read) on any doubt at all — a wrong-in-doubt design that can only
// ever cost a slower call, never a wrong view. See docs/history/
// tsk-49e-incremental-read-snapshot/RESEARCH.md for why mtime+size (not a
// content hash of the whole prefix) is the right signal here, and why the
// last-line fingerprint is proven safe against all 3 known log-rewrite
// paths (repairTruncatedLastLine, fixEventsJsonlContiguity --fix, git's own
// merge=union driver).
function tryIncrementalRebuild(logPath) {
  const viewPath = path.join(path.dirname(logPath), 'state.json');
  let persisted;
  try {
    persisted = JSON.parse(fs.readFileSync(viewPath, 'utf8'));
  } catch {
    return null;
  }
  if (!persisted || typeof persisted !== 'object') return null;
  const snap = persisted.snapshot;
  if (!snap || typeof snap.size !== 'number' || typeof snap.mtimeMs !== 'number' || typeof snap.lastLine !== 'string') return null;

  let stat;
  try {
    stat = fs.statSync(logPath);
  } catch {
    return null;
  }

  // Destructured only to exclude these two sibling fields (revision/
  // snapshot) from the returned view shape -- everything else in
  // `persisted` IS the real view, per writeView's own "additive sibling
  // field, never folded back" pattern (see viewRevision's own doc comment).
  const { revision, snapshot, ...savedView } = persisted;

  if (stat.mtimeMs === snap.mtimeMs && stat.size === snap.size) {
    return savedView; // untouched since the snapshot -- zero-read shortcut
  }
  if (stat.size <= snap.size) return null; // shrank, or same-size-different-mtime rewrite -- never safe to trust the prefix

  const stillThere = readLastLineBefore(logPath, snap.size) === snap.lastLine;
  if (!stillThere) return null; // prefix was rewritten (or the check itself failed) -- fall back, never guess

  const newEvents = readEventsFromByte(logPath, snap.size);
  return foldEvents(newEvents, savedView);
}

/**
 * Read every event from `logPath` (via `readEvents`) and fold it into a
 * fresh state view. This is the `fgos rebuild` primitive: rebuilding twice
 * from the same log must produce deep-equal views (D3 determinism) —
 * including via the tsk-49e snapshot fast path above, which is why that
 * path is tried FIRST here but always falls back to this exact full-read
 * shape on any doubt, never a partial or best-effort result.
 */
export function rebuildView(logPath) {
  const fast = tryIncrementalRebuild(logPath);
  if (fast) return fast;
  const events = readEvents(logPath);
  return foldEvents(events);
}

// Tầng A/T3 (TA-D3/TA-D7/TA-D12/TA-D13): reads events, alongside their own
// raw line text, from one file — via `readEvents` for parsing (same
// corrupt-log fail-closed guarantee every other reader here gets), and a
// second raw read for the exact line content dedupe below needs. A missing
// file (never written yet) contributes nothing, same as `readEvents`.
function readFileWithRawLines(filePath) {
  const events = readEvents(filePath);
  if (events.length === 0) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return events.map((ev, i) => ({ ev, raw: lines[i] }));
}

// The file-membership half of discovery, shared by the full read
// (`readAllEventsFromDir`) and the incremental fast path (T4,
// `tryIncrementalRebuildFromDir`) below: baseline-0 (tagged `''`, always
// listed even if the physical file doesn't exist yet) plus every
// `*.jsonl` file directly under `${dir}/events/` (non-recursive, so a
// future `archive/` is structurally never included).
function discoverEventFilePaths(dir) {
  const result = [{ file: '', path: path.join(dir, 'events.jsonl') }];
  const eventsDirPath = path.join(dir, 'events');
  let files = [];
  try {
    files = fs
      .readdirSync(eventsDirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  for (const file of files) result.push({ file, path: path.join(eventsDirPath, file) });
  return result;
}

/**
 * The multi-file discovery step (TA-D2's read side): `dir` is the same
 * `.fgos`-shaped directory `rebuildView`'s callers resolve `events.jsonl`
 * from. Discovers baseline-0 (`${dir}/events.jsonl`, frozen legacy content
 * per TA-D12 — never appended to once a writer file exists) plus every
 * `*.jsonl` file directly under `${dir}/events/` (`discoverEventFilePaths`
 * above), merges them into the TA-D7 total order `(ts, file, seq)` —
 * baseline-0 sorts under the empty-string file tag, which is always
 * lexicographically first on a tie — then dedupes: TA-D9 (per T1)'s
 * content-hash `h` is a new-format event's identity; baseline-0 lines
 * predate `h` and dedupe by their own raw line text instead (same
 * precedent `events-jsonl-contiguity.mjs`'s `fixContiguity` already uses).
 * First occurrence in total order wins. No compaction exists yet (that's
 * T6) to ever actually produce a duplicate today — this is the mechanism
 * T6 lands on top of, per TA-D13.
 */
export function readAllEventsFromDir(dir) {
  const tagged = [];
  for (const { file, path: filePath } of discoverEventFilePaths(dir)) {
    for (const entry of readFileWithRawLines(filePath)) tagged.push({ ...entry, file });
  }

  tagged.sort((a, b) => {
    if (a.ev.ts !== b.ev.ts) return a.ev.ts < b.ev.ts ? -1 : 1;
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return (a.ev.seq ?? 0) - (b.ev.seq ?? 0);
  });

  const seen = new Set();
  const result = [];
  for (const { ev, raw } of tagged) {
    const key = typeof ev.h === 'string' && ev.h ? `h:${ev.h}` : `line:${raw}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ev);
  }
  return result;
}

/**
 * Tầng A/T4 (TA-D4/TA-D8): the multi-file incremental fast path.
 * `persisted.snapshot` now anchors on `{ files: { [fileTag]: { size,
 * lastLine } }, maxTs }` instead of tsk-49e's single `{size, mtimeMs,
 * lastLine}` — no `mtimeMs` here on purpose: with `maxTs` as an
 * independent, structurally-checked freshness gate (below), the boundary
 * fingerprint (`lastLine`) plus size already proves the recorded prefix is
 * untouched, and `maxTs` closes the one thing a per-file boundary check
 * alone cannot see: a REWRITE that happens to preserve one file's own
 * length while changing its content (fixContiguity's resequencing is the
 * known example) can no longer slip through, because a real rewrite always
 * changes SOME line's `ts` relative to the recorded prefix and any new event
 * this path would fold must have `ts` strictly greater than the last
 * confirmed `maxTs` — a rewritten line replayed here would violate that.
 *
 * Every check below is wrong-in-doubt: any mismatch returns `null`,
 * `rebuildViewFromDir` then falls back to a full discovery + fold, and the
 * only cost is a slower read — never a wrong view (same guarantee tsk-49e's
 * original single-file version gives).
 */
function tryIncrementalRebuildFromDir(dir) {
  const viewPath = path.join(dir, 'state.json');
  let persisted;
  try {
    persisted = JSON.parse(fs.readFileSync(viewPath, 'utf8'));
  } catch {
    return null;
  }
  if (!persisted || typeof persisted !== 'object') return null;
  const snap = persisted.snapshot;
  if (!snap || typeof snap.files !== 'object' || snap.files === null || typeof snap.maxTs !== 'string') return null;

  const { revision, snapshot, ...savedView } = persisted;

  const currentFiles = discoverEventFilePaths(dir);
  const currentFileNames = new Set(currentFiles.map((f) => f.file));
  const snapFileNames = Object.keys(snap.files);
  // Membership must match EXACTLY (a file appeared, or one the snapshot
  // recorded is gone from discovery) -- either is a structural change this
  // path never guesses through.
  if (currentFileNames.size !== snapFileNames.length) return null;
  for (const name of snapFileNames) {
    if (!currentFileNames.has(name)) return null;
  }

  const newEventsTagged = [];
  for (const { file, path: filePath } of currentFiles) {
    const snapEntry = snap.files[file];
    if (!snapEntry || typeof snapEntry.size !== 'number' || (snapEntry.lastLine !== null && typeof snapEntry.lastLine !== 'string')) return null;

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      if (snapEntry.size > 0) return null; // recorded as non-empty, now gone entirely -- doubt
      continue; // both "absent/empty" then and now -- consistent, nothing to add
    }

    if (stat.size === snapEntry.size) continue; // unchanged since the snapshot
    if (stat.size < snapEntry.size) return null; // shrank -- never safe to trust the prefix

    if (snapEntry.size > 0) {
      const stillThere = readLastLineBefore(filePath, snapEntry.size) === snapEntry.lastLine;
      if (!stillThere) return null; // prefix was rewritten (or the check itself failed)
    }

    for (const ev of readEventsFromByte(filePath, snapEntry.size)) newEventsTagged.push({ ev, file });
  }

  if (newEventsTagged.length === 0) return savedView; // every file byte-identical to its snapshot -- zero-read shortcut

  // TA-D8: fast path only when EVERY new event's ts is STRICTLY greater
  // than maxTs -- a tie or a violation is a doubt, never guessed through.
  for (const { ev } of newEventsTagged) {
    if (typeof ev.ts !== 'string' || !(ev.ts > snap.maxTs)) return null;
  }

  newEventsTagged.sort((a, b) => {
    if (a.ev.ts !== b.ev.ts) return a.ev.ts < b.ev.ts ? -1 : 1;
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return (a.ev.seq ?? 0) - (b.ev.seq ?? 0);
  });

  return foldEvents(newEventsTagged.map((t) => t.ev), savedView);
}

/**
 * `rebuildView`'s multi-file counterpart: tries the T4 incremental fast
 * path first, falling back to a full discovery + fold on any doubt.
 */
export function rebuildViewFromDir(dir) {
  const fast = tryIncrementalRebuildFromDir(dir);
  if (fast) return fast;
  return foldEvents(readAllEventsFromDir(dir));
}

/**
 * The write side of T4's anchor: `{files: {[fileTag]: {size, lastLine}},
 * maxTs}`, built from a cheap per-file stat + tail-read pass — never a
 * full-content read, so this stays cheap regardless of how large any one
 * file has grown. `maxTs` is derived from each file's own last line (safe
 * because a single writer's own file is always append-ordered by ts) rather
 * than trusted from the caller, so it is correct even the very first time
 * this runs (no prior snapshot to carry forward).
 */
export function buildSnapshotFromDir(dir) {
  const files = {};
  let maxTs = '';
  for (const { file, path: filePath } of discoverEventFilePaths(dir)) {
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      files[file] = { size: 0, lastLine: null };
      continue;
    }
    const lastLine = stat.size > 0 ? readLastLineBefore(filePath, stat.size) : null;
    files[file] = { size: stat.size, lastLine };
    if (lastLine) {
      try {
        const ts = JSON.parse(lastLine).ts;
        if (typeof ts === 'string' && ts > maxTs) maxTs = ts;
      } catch {
        // malformed last line -- ignore for maxTs purposes; readEvents
        // elsewhere is what actually fails loudly on real corruption.
      }
    }
  }
  return { files, maxTs };
}

/**
 * Deterministic fingerprint of a folded view (work-graph-intelligence S3).
 * Reuses the C1 `data_hash` pattern (`envelope.mjs` wrapEnvelope) — the
 * sha256 hex digest of `JSON.stringify(view)` — so a consumer can tell "did
 * the folded state change?" without re-folding the log or diffing the view.
 *
 * PURE and deterministic by the same guarantee `rebuildView` gives: the view
 * carries no `Date.now()`/wall-clock value (every timestamp comes from an
 * event's own `ts`), so the same log always hashes to the same revision. The
 * caller passes the folded view itself — this function never re-folds. It is
 * computed over the view EXACTLY as `rebuildView` returns it, so it must be
 * called on that pure shape (the on-disk `state.json` stamps this hash as a
 * sibling field; it is never folded back into the view a rebuild returns).
 */
export function serializeView(view) {
  const viewStr = JSON.stringify(view);
  const revision = createHash('sha256').update(viewStr).digest('hex');
  return { viewStr, revision };
}

export function viewRevision(view) {
  return serializeView(view).revision;
}

