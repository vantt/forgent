// decompose.mjs — chia-việc engine for stage `decompose` (per stage-decompose
// D2/D3/D4/D5). Mirrors discovery.mjs's shape exactly one stage over: TÁI
// DÙNG resolveExecutorCommand + modelForTier from dispatch.mjs, builds its
// own prompt, spawns directly — same reason discovery.mjs gives (spawnWorker
// hardcodes the worker task-prompt shape, wrong for a verdict call).
//
// FAIL-SAFE, but a DIFFERENT shape from discovery.mjs's (chốt tại
// validating, S1 feasibility matrix): a model/parse failure — or a
// "decompose" verdict where any child is missing a real `verify` (D2
// forbids a placeholder/FALLBACK_VERIFY for a child, unlike discovery's
// clarify-pass fallback) — resolves to `{ kind: 'invalid' }` and
// resolveDecompose does NOT write anything: the item is left exactly where
// it was (stage decompose, status todo) for the runner's next sweep to
// retry (mẫu C9). This is deliberately not discovery.mjs's "unclear ->
// awaiting-human" fallback: an item that stays put is retried automatically,
// while awaiting-human is reserved for a verdict the model actually
// produced (need-human) or a risk-heavy root (D3) — never for "the model
// call itself broke".

import fs from 'node:fs';
import path from 'node:path';
import { modelForTier } from '../runner/dispatch.mjs';
import { runJudgeExecutor, JUDGE_STRICT_JSON_SUFFIX } from './judge-executor.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { listWork, moveStage, moveWork, addWork, putInAwaiting, addDecision, editWork, StoreError } from '../state/store.mjs';
import { rankImpact } from '../state/impact.mjs';
import { computeImpact, computePriority, effortForMode, MODE_EFFORT } from '../state/priority-formula.mjs';

// Best-effort read of the locked-decisions artifacts fgos-exploring/
// fgos-planning write under `work.docsRef` (docs/history/<feature>/). A
// missing docsRef, or a missing/unreadable file under it, is never fatal —
// judgeDecompose still runs on title/description alone, same as an item
// that never went through those skills. Real bug this backstops (p-<TBD>,
// tsk-1wd dogfood 2026-07-28): buildDecomposePrompt used to see NEITHER
// work.description NOR CONTEXT.md/plan.md, only a possibly-truncated
// title — the split-work judgment silently reinvented an architecture the
// item's own locked decisions had already ruled out.
function readLockedContext(repoRoot, docsRef) {
  if (typeof docsRef !== 'string' || !docsRef.trim()) return '';
  const featureDir = path.join(repoRoot, docsRef);
  const sections = [];
  for (const file of ['CONTEXT.md', 'plan.md']) {
    try {
      const content = fs.readFileSync(path.join(featureDir, file), 'utf8');
      if (content.trim()) sections.push(`## ${file}\n${content.trim()}`);
    } catch {
      // optional artifact; absence is not an error (item may still be
      // mid-clarify with no plan.md yet, or predate fgos-exploring)
    }
  }
  return sections.join('\n\n');
}

const DEFAULT_NEED_HUMAN_REASON =
  'Không phán được rõ ràng — cần người xác nhận cách chia.';

// D3(b): risk-heavy root always routes through the human gate regardless of
// what the model verdict said — the threshold resolved at validating
// (feasibility matrix row 4): risk domain mirrors tier (classify.mjs), and
// 'heavy' is the one value that gates.
const HEAVY_RISK = 'heavy';
const DEFAULT_RISK_GATE_REASON = 'Item gốc có risk cao (heavy) — cần xác nhận trước khi chia.';

// tsk-6b6 D1/D3: fixed rationale for the one branch with no trustworthy
// model text to draw from -- a parse/model failure, never a real verdict.
const DEFAULT_INVALID_RATIONALE = 'Model/parse thất bại — không phán được verdict.';
// tsk-6b6 D2: fallback when the model was asked for a pass-through reason
// but didn't answer -- distinct from decompose's reason, which is required
// (D3) and never falls back.
const DEFAULT_PASS_THROUGH_RATIONALE = 'Không có lý do cụ thể từ model — pass-through mặc định.';

// tsk-6b6 D1: log every judgeDecompose verdict branch via the shipped
// addDecision (tsk-63c, store.mjs) -- `outcome` is what resolveDecompose
// actually did (never just verdict.kind, since the heavy-risk gate can force
// a `need-human` outcome out of a pass-through/decompose verdict), `label`
// is the extra bit worth naming in `text` (e.g. child count).
function logDecomposeVerdict(dir, id, outcome, rationale, label) {
  const text = label ? `decompose verdict: ${outcome} (${label})` : `decompose verdict: ${outcome}`;
  addDecision(dir, { id, text, source: 'judgeDecompose', rationale });
}

function buildDecomposePrompt(work, lockedContext, view) {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';
  const deps = Array.isArray(work.deps) && work.deps.length ? work.deps.join(', ') : '(none)';
  const description =
    typeof work.description === 'string' && work.description.trim() ? work.description : '(không có)';
  const locked =
    typeof lockedContext === 'string' && lockedContext.trim()
      ? lockedContext
      : '(không có CONTEXT.md/plan.md — item chưa qua fgos-exploring/fgos-planning, hoặc docsRef trống)';

  // Gate ask/answer (mirrors discovery.mjs's buildDiscoveryPrompt exactly —
  // tsk-3w8 follow-up, str87-decompose-gate-consult): a "need-human" verdict
  // from THIS function parks the item via the SAME putInAwaiting/view.gates
  // door discovery.mjs's "unclear" verdict uses, but until now nothing here
  // ever read it back — a human's `fgos answer` never changed the next
  // judgment, so a re-run just asked the identical question again forever.
  const gate = view?.gates?.[work.id];
  const qa = gate
    ? `Câu hỏi gần nhất: ${gate.ask ?? '(không có)'}\nCâu trả lời của người (MỚI NHẤT): ${gate.answer ?? '(chưa trả lời)'}`
    : '(chưa có vòng hỏi-đáp nào với người)';

  return `# Chia-việc (decompose)

Bạn đang phán một work item đã qua làm-rõ (clarify) có cần chia thành nhiều
việc con độc lập hay không trước khi thi công.

Title: ${work.title}
Kind: ${work.kind}
Risk: ${work.risk ?? '(none)'}
Verify (hiện có): ${work.verify ?? '(none)'}
Refs: ${refs}
Deps: ${deps}

# Mô tả đầy đủ (nguyên văn lúc submit)
${description}

# Quyết định đã khoá (CONTEXT.md / plan.md, nếu có — đây là nguồn thẩm quyền,
KHÔNG được đề xuất kiến trúc/hàm/file khác với những gì đã khoá ở đây)
${locked}

# Vòng hỏi-đáp với người (nếu người đã xác nhận cách chia ở đây, dùng CHÍNH
câu trả lời đó để phán — không hỏi lại cùng một câu)
${qa}

# Câu hỏi
Item này đơn giản, thi công thẳng được không, hay cần chia thành nhiều việc
con độc lập, dependency rõ?
- Đơn giản: trả "verdict": "pass-through", kèm "reason" ngắn gọn vì sao
  không cần chia (tùy chọn, nhưng nên có).
- Cần chia: trả "reason" TÓM TẮT vì sao phải chia (BẮT BUỘC, không được bỏ
  trống), và liệt kê MỖI việc con với "title" (PHẢI nêu rõ đối tượng + hành
  động + phạm vi — cái gì bị đụng tới, làm gì với nó, giới hạn ở đâu; không
  được là một mệnh đề cụt thiếu chủ ngữ hay tân ngữ), "verify" (một lệnh
  chạy được THẬT để chứng minh việc con đã xong — không được bỏ trống,
  không được là một câu mô tả suông), và tùy chọn "kind", "risk", "refs",
  "footprint" (danh sách đường dẫn file việc con này dự kiến đụng tới, nếu
  biết), "deps" ("deps" là mảng chỉ số 0-based trỏ vào các việc con KHÁC
  đứng TRƯỚC nó trong danh sách mà nó phụ thuộc).
- Mơ hồ, không phán chắc được: trả "verdict": "need-human" kèm "reason".

Ngoài ra, đọc phần "Quyết định đã khoá" ở trên (nếu có nhắc mode
tiny/small/standard/high-risk/spike từ fgos-planning) và trả lại ĐÚNG
nhãn mode đó qua "mode" — trường này TÙY CHỌN, không ảnh hưởng verdict.
Nếu plan.md có ghi posture capability impact-analysis KÈM 1 con số blast-
radius thật (vd số file/symbol bị ảnh hưởng), trả lại ĐÚNG con số đó qua
"blastRadius"; nếu posture là inactive hoặc không có con số nào, bỏ trống
trường này — KHÔNG được tự bịa số.

# Định dạng trả lời
Trả lời DUY NHẤT bằng một dòng JSON, không kèm chữ nào khác:
{"verdict": "pass-through" | "decompose" | "need-human", "reason": string (bắt buộc khi need-human hoặc decompose; tùy chọn khi pass-through), "children": [{"title": string, "verify": string, "kind": string, "risk": string, "refs": string[], "footprint": string[], "deps": number[]}] (chỉ khi decompose), "mode": "tiny" | "small" | "standard" | "high-risk" | "spike" (tùy chọn, đọc lại từ plan.md nếu có), "blastRadius": number không âm (tùy chọn, đọc lại từ plan.md nếu có con số thật)}
`;
}

function normalizeChild(child) {
  if (!child || typeof child !== 'object' || Array.isArray(child)) return null;
  if (typeof child.title !== 'string' || !child.title.trim()) return null;
  // D2: a child with no real, runnable verify makes the WHOLE verdict
  // invalid — no placeholder, no FALLBACK_VERIFY (discovery.mjs's fallback
  // is explicitly forbidden here for children, per validating feasibility
  // matrix last row).
  if (typeof child.verify !== 'string' || !child.verify.trim()) return null;

  return {
    title: child.title,
    verify: child.verify,
    kind: typeof child.kind === 'string' && child.kind.trim() ? child.kind : undefined,
    risk: typeof child.risk === 'string' && child.risk.trim() ? child.risk : undefined,
    refs: Array.isArray(child.refs) ? child.refs.filter((r) => typeof r === 'string') : [],
    // work-graph-intelligence S9 footprint, same optional-additive shape as
    // work.mjs's validateWorkShape: a malformed (non-array) value never
    // invalidates the child, it just leaves footprint absent — same fail-soft
    // rule bin/fgos.mjs's own --footprint flag follows.
    footprint: Array.isArray(child.footprint)
      ? child.footprint.filter((p) => typeof p === 'string' && p.trim())
      : undefined,
    rawDeps: Array.isArray(child.deps) ? child.deps : [],
  };
}

/**
 * Judge whether `work` (a stage-`decompose` item) should pass through
 * unsplit, split into children, or park for human review, by calling the
 * real model configured for its tier (per D2/D3, never a mechanical
 * classifier). Always returns one of:
 *   { kind: 'pass-through', reason? }
 *   { kind: 'decompose', reason, children: [{title, verify, kind?, risk?, refs, footprint?, deps}] }
 *   { kind: 'need-human', reason }
 *   { kind: 'invalid' }  // fail-safe: model/parse failure, a child missing verify,
 *                        // or (tsk-6b6 D3) a decompose verdict missing its own reason
 * and never throws. A "decompose" verdict with zero children normalizes to
 * "pass-through" (0 con = pass-through, chốt tại validating test matrix). A
 * child's `deps` is filtered down to indices strictly before its own
 * position — the only shape resolveDecompose can resolve to real ids while
 * writing children in a single forward pass through one store door.
 *
 * `view` is optional (documented backward-compat, mirrors discovery.mjs's
 * own optional-view idiom) — an old 3-arg caller still works exactly as
 * before, just without the gate ask/answer consulted in the prompt.
 */
export function judgeDecompose(work, cfg, lockedContext, view) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const prompt = buildDecomposePrompt(work, lockedContext, view);
    const stricterPrompt = prompt + JUDGE_STRICT_JSON_SUFFIX;

    const verdict = runJudgeExecutor(cfg, model, prompt, stricterPrompt);
    if (!verdict || typeof verdict.verdict !== 'string') {
      return { kind: 'invalid' };
    }

    // work-item-priority-matrix D5/D8: mode/blastRadius ride on every
    // non-invalid outcome, same "never gates the decision" discipline
    // discovery.mjs's impactScore already uses -- an invalid/missing value
    // is silently omitted, never thrown.
    const mode = typeof verdict.mode === 'string' && Object.hasOwn(MODE_EFFORT, verdict.mode) ? verdict.mode : undefined;
    const blastRadius =
      typeof verdict.blastRadius === 'number' && Number.isFinite(verdict.blastRadius) && verdict.blastRadius >= 0
        ? verdict.blastRadius
        : undefined;

    if (verdict.verdict === 'pass-through') {
      // tsk-6b6 D2: reason is optional here -- the model was asked, but a
      // blank/omitted answer is still a valid pass-through (unlike decompose
      // below, where a missing reason invalidates the whole verdict).
      const reason = typeof verdict.reason === 'string' && verdict.reason.trim() ? verdict.reason : undefined;
      const out = { kind: 'pass-through' };
      if (reason) out.reason = reason;
      if (mode) out.mode = mode;
      if (blastRadius !== undefined) out.blastRadius = blastRadius;
      return out;
    }

    if (verdict.verdict === 'need-human') {
      const reason =
        typeof verdict.reason === 'string' && verdict.reason.trim() ? verdict.reason : DEFAULT_NEED_HUMAN_REASON;
      const out = { kind: 'need-human', reason };
      if (mode) out.mode = mode;
      if (blastRadius !== undefined) out.blastRadius = blastRadius;
      return out;
    }

    if (verdict.verdict === 'decompose') {
      if (!Array.isArray(verdict.children) || verdict.children.length === 0) {
        const reason = typeof verdict.reason === 'string' && verdict.reason.trim() ? verdict.reason : undefined;
        const out = { kind: 'pass-through' };
        if (reason) out.reason = reason;
        if (mode) out.mode = mode;
        if (blastRadius !== undefined) out.blastRadius = blastRadius;
        return out;
      }

      // tsk-6b6 D3: a decompose verdict with no real top-level reason (the
      // why-split summary) is invalid -- same rule as a child missing
      // verify below, never a placeholder or a silently-accepted blank.
      if (typeof verdict.reason !== 'string' || !verdict.reason.trim()) {
        return { kind: 'invalid' };
      }

      const normalized = verdict.children.map(normalizeChild);
      if (normalized.some((child) => child === null)) {
        return { kind: 'invalid' };
      }

      const children = normalized.map((child, index) => {
        const deps = child.rawDeps.filter((d) => Number.isInteger(d) && d >= 0 && d < index);
        const { rawDeps, ...rest } = child;
        return { ...rest, deps };
      });
      const out = { kind: 'decompose', reason: verdict.reason, children };
      if (mode) out.mode = mode;
      if (blastRadius !== undefined) out.blastRadius = blastRadius;
      return out;
    }

    return { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

function formatProposalAsk(verdict, reason) {
  if (verdict.kind === 'decompose') {
    const list = verdict.children.map((c, i) => `${i + 1}. ${c.title} (verify: ${c.verify})`).join('\n');
    return `Đề xuất chia (chưa ghi vào queue, cần xác nhận) — ${reason}\n${list}`;
  }
  if (verdict.kind === 'pass-through') {
    return `Đề xuất: không chia (pass-through) — ${reason}`;
  }
  return `Đề xuất chia — ${reason}`;
}

/**
 * Read `id` from the store at `dir`, judge it via `judgeDecompose`, and
 * resolve the verdict — the ONE function both the sync decompose-equivalent
 * verb and the async runner sweep call (D3's sync/async parity, mirroring
 * resolveDiscovery). `role` is positional, exactly like resolveDiscovery
 * (Phase 3 S3-closeout settlement design): the runner's sweep passes
 * `'runner'`; a sync caller passes its own attribution. Only stamped on the
 * root's own stage-move (children are `work.add` events, which carry no
 * role field at all).
 *
 * Returns `{ outcome, id, verdict?, childIds? }` where `outcome` is one of
 * `'noop'` (already past decompose — CAS-backed idempotency), `'already-
 * decomposed'` (children exist from an interrupted prior call; only the
 * root's stage-move is completed, no children regenerated), `'invalid'`
 * (fail-safe, item left untouched), `'need-human'` (parked in awaiting-human
 * with the proposal, nothing written to the queue yet), `'pass-through'`, or
 * `'decompose'` (children written, root moved to executing).
 */
export function resolveDecompose(dir, id, cfg, role) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDecompose: work "${id}" not found.`);
  }

  // Claim release on the decompose->executing boundary (claim-lock §3b): a
  // pick claim held through clarify/decompose (`status: 'doing'`) is released
  // back to `todo` the moment the root actually reaches `executing`, so
  // `pick <id>` can re-claim it for the executing phase (§3a/§3c reattach the
  // SAME `fgw/<id>` worktree via branchExists, since it already exists).
  // `work.status` is read once, from the same snapshot as `work` above — the
  // status axis is untouched by anything else in this function, so it stays
  // valid across all three moveStage(...,'executing',...) call sites below. A
  // runner-sweep call (item never claimed, `status: 'todo'` already) is a
  // no-op here, matching R15 (sweep only touches todo items).
  const releaseClaimOnExecuting = () => {
    if (work.status === 'doing') {
      // releaseTrigger (tsk-2zv): tags this specific todo-entry as a
      // claim-lock §3b release so claimWork can tell it apart from a
      // reject or verify-fail park, which land an item at the exact same
      // status/branch-existence shape without deleting the branch.
      moveWork(dir, { id, to: 'todo', expectedStatus: 'doing', releaseTrigger: 'claim-lock-3b' });
    }
  };

  // Idempotent no-op (must_haves truth 3): a re-entrant call once the root
  // is already past `decompose` does nothing — the CAS on the moveStage
  // calls below would otherwise throw a conflict for the exact same case,
  // so this check backs it up ahead of time rather than making every caller
  // catch that error.
  const currentStage = work.stage ?? 'executing';
  if (currentStage !== 'decompose') {
    return { outcome: 'noop', id };
  }

  // RE-ENTRANCY (validating feasibility matrix, REPAIRED): a crash between
  // writing children and moving the root to executing must not regenerate
  // children on retry — child ids are positional (`${work.id}-<n>`), so a
  // blind retry would hit addWork's "already exists" validation error.
  // Detect prior children via the view instead, and only finish the root's
  // own stage-move.
  const hasChildren = Object.values(view.work).some((item) => item.parent === id);
  if (hasChildren) {
    moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', role });
    releaseClaimOnExecuting();
    return { outcome: 'already-decomposed', id };
  }

  const repoRoot = path.dirname(dir);
  const lockedContext = readLockedContext(repoRoot, work.docsRef);
  const verdict = judgeDecompose(work, cfg, lockedContext, view);

  if (verdict.kind === 'invalid') {
    logDecomposeVerdict(dir, id, 'invalid', DEFAULT_INVALID_RATIONALE);
    return { outcome: 'invalid', id };
  }

  // work-item-priority-matrix D6/D8: the REFINED pass -- unlike discovery.mjs's
  // rough pass (impact = blocks + semantic scan only, effort assumed at
  // EFFORT_FLOOR), this one has real `effort` (from fgos-planning's own
  // mode, read back by the judge above) and a real `blastRadius` (when
  // fgos-planning/fgos-validating actually recorded one in plan.md, per
  // tsk-1e4's capability-gate). Rides on every non-invalid outcome, same
  // fail-safe try/catch discipline discovery.mjs's rough pass uses.
  try {
    const impact = computeImpact({ blocks: rankImpact(view).find((r) => r.id === id)?.blocks ?? 0, blastRadius: verdict.blastRadius });
    const priority = computePriority({
      impact,
      urgent: work.urgent,
      effort: verdict.mode ? effortForMode(verdict.mode) : undefined,
      risk: work.risk,
      blastRadius: verdict.blastRadius,
    });
    editWork(dir, { id, patch: { priority }, role });
  } catch {
    // Swallowed intentionally — same fail-safe discipline as discovery.mjs's
    // rough pass: a corrupted item shape or write-door rejection here must
    // never abort the pass-through/decompose/need-human resolution below.
  }

  // D3: need-human (the model's own call) OR a risk-heavy root (classify's
  // signal) routes through the human gate — carrying whatever the verdict
  // proposed as context, but writing nothing into the queue yet (Terms:
  // "Đề xuất chia" is the proposal BEFORE it is committed).
  //
  // Heavy-risk gate release (tsk-3w8 follow-up): unlike a model "need-human"
  // verdict (which the prompt above now consults via view.gates, so a real
  // answer changes the NEXT verdict), this hard risk gate used to re-fire
  // unconditionally on every call — a human answering `fgos answer` never
  // released it, re-parking the exact same question forever (dogfood,
  // 2026-07-28). Bypassed only when the MOST RECENT gate ask/answer on
  // record is genuinely THIS gate's own prior ask (matched by
  // DEFAULT_RISK_GATE_REASON's own text, the one string formatProposalAsk
  // always embeds for it) — never a stale answer left over from an
  // unrelated clarify-stage or model need-human question.
  const gate = view?.gates?.[id];
  const heavyRiskAlreadyConfirmed =
    typeof gate?.answer === 'string' && gate.answer.trim() && typeof gate?.ask === 'string' && gate.ask.includes(DEFAULT_RISK_GATE_REASON);
  const risksGate = work.risk === HEAVY_RISK && !heavyRiskAlreadyConfirmed;

  if (verdict.kind === 'need-human' || risksGate) {
    const reason = verdict.kind === 'need-human' ? verdict.reason : DEFAULT_RISK_GATE_REASON;
    // Logged outcome is 'need-human' (what actually happened), not
    // verdict.kind -- a risk-heavy root can force this parking out of a
    // pass-through/decompose verdict underneath it.
    logDecomposeVerdict(dir, id, 'need-human', reason);
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason), statusAtAsk: work.status });
    return { outcome: 'need-human', id, verdict };
  }

  if (verdict.kind === 'pass-through') {
    logDecomposeVerdict(dir, id, 'pass-through', verdict.reason ?? DEFAULT_PASS_THROUGH_RATIONALE);
    moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', role });
    releaseClaimOnExecuting();
    return { outcome: 'pass-through', id };
  }

  // verdict.kind === 'decompose': child ids are positional — `${work.id}-<n>`,
  // n = 1-based sibling index (id-systems-audit.md #1) — so recursion into a
  // grandchild falls out for free: when a child is itself later decomposed,
  // its own `work.id` (already `<root>-<m>`) becomes the base, producing
  // `<root>-<m>-<n>` with no special-case code.
  const childIds = verdict.children.map((child, index) => `${work.id}-${index + 1}`);

  verdict.children.forEach((child, index) => {
    addWork(dir, {
      id: childIds[index],
      title: child.title,
      kind: child.kind ?? work.kind,
      status: 'todo',
      deps: child.deps.map((depIndex) => childIds[depIndex]),
      risk: child.risk ?? work.risk,
      refs: child.refs,
      footprint: child.footprint,
      verify: child.verify,
      stage: 'executing',
      parent: id,
      tier: work.tier,
    });
  });

  logDecomposeVerdict(dir, id, 'decompose', verdict.reason, `${childIds.length} children`);
  moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', role });
  releaseClaimOnExecuting();
  return { outcome: 'decompose', id, childIds };
}
