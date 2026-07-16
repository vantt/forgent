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

import { spawnSync } from 'node:child_process';
import { resolveExecutorCommand, modelForTier } from '../runner/dispatch.mjs';
import { generateId } from './classify.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { listWork, moveStage, addWork, putInAwaiting, StoreError } from '../state/store.mjs';

const DEFAULT_NEED_HUMAN_REASON =
  'Không phán được rõ ràng — cần người xác nhận cách chia.';

// D3(b): risk-heavy root always routes through the human gate regardless of
// what the model verdict said — the threshold resolved at validating
// (feasibility matrix row 4): risk domain mirrors tier (classify.mjs), and
// 'heavy' is the one value that gates.
const HEAVY_RISK = 'heavy';
const DEFAULT_RISK_GATE_REASON = 'Item gốc có risk cao (heavy) — cần xác nhận trước khi chia.';

function buildDecomposePrompt(work) {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';
  const deps = Array.isArray(work.deps) && work.deps.length ? work.deps.join(', ') : '(none)';

  return `# Chia-việc (decompose)

Bạn đang phán một work item đã qua làm-rõ (clarify) có cần chia thành nhiều
việc con độc lập hay không trước khi thi công.

Title: ${work.title}
Kind: ${work.kind}
Risk: ${work.risk ?? '(none)'}
Verify (hiện có): ${work.verify ?? '(none)'}
Refs: ${refs}
Deps: ${deps}

# Câu hỏi
Item này đơn giản, thi công thẳng được không, hay cần chia thành nhiều việc
con độc lập, dependency rõ?
- Đơn giản: trả "verdict": "pass-through".
- Cần chia: liệt kê MỖI việc con với "title", "verify" (một lệnh chạy được
  THẬT để chứng minh việc con đã xong — không được bỏ trống, không được là
  một câu mô tả suông), và tùy chọn "kind", "risk", "refs", "deps" ("deps" là
  mảng chỉ số 0-based trỏ vào các việc con KHÁC đứng TRƯỚC nó trong danh
  sách mà nó phụ thuộc).
- Mơ hồ, không phán chắc được: trả "verdict": "need-human" kèm "reason".

# Định dạng trả lời
Trả lời DUY NHẤT bằng một dòng JSON, không kèm chữ nào khác:
{"verdict": "pass-through" | "decompose" | "need-human", "reason": string (chỉ khi need-human), "children": [{"title": string, "verify": string, "kind": string, "risk": string, "refs": string[], "deps": number[]}] (chỉ khi decompose)}
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
    rawDeps: Array.isArray(child.deps) ? child.deps : [],
  };
}

/**
 * Judge whether `work` (a stage-`decompose` item) should pass through
 * unsplit, split into children, or park for human review, by calling the
 * real model configured for its tier (per D2/D3, never a mechanical
 * classifier). Always returns one of:
 *   { kind: 'pass-through' }
 *   { kind: 'decompose', children: [{title, verify, kind?, risk?, refs, deps}] }
 *   { kind: 'need-human', reason }
 *   { kind: 'invalid' }  // fail-safe: model/parse failure, or a child missing verify
 * and never throws. A "decompose" verdict with zero children normalizes to
 * "pass-through" (0 con = pass-through, chốt tại validating test matrix). A
 * child's `deps` is filtered down to indices strictly before its own
 * position — the only shape resolveDecompose can resolve to real ids while
 * writing children in a single forward pass through one store door.
 */
export function judgeDecompose(work, cfg) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const prompt = buildDecomposePrompt(work);
    const { command, args } = resolveExecutorCommand(cfg, { prompt, model });

    const result = spawnSync(command, args, {
      shell: false,
      timeout: cfg?.timeoutMs,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.error || result.status !== 0) {
      return { kind: 'invalid' };
    }

    const verdict = JSON.parse(result.stdout);
    if (!verdict || typeof verdict.verdict !== 'string') {
      return { kind: 'invalid' };
    }

    if (verdict.verdict === 'pass-through') {
      return { kind: 'pass-through' };
    }

    if (verdict.verdict === 'need-human') {
      const reason =
        typeof verdict.reason === 'string' && verdict.reason.trim() ? verdict.reason : DEFAULT_NEED_HUMAN_REASON;
      return { kind: 'need-human', reason };
    }

    if (verdict.verdict === 'decompose') {
      if (!Array.isArray(verdict.children) || verdict.children.length === 0) {
        return { kind: 'pass-through' };
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
      return { kind: 'decompose', children };
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
 * resolveDiscovery). `actor` is positional, exactly like resolveDiscovery
 * (Phase 3 S3-closeout settlement design): the runner's sweep passes
 * `'runner'`; a sync caller passes its own attribution. Only stamped on the
 * root's own stage-move (children are `work.add` events, which carry no
 * actor field at all).
 *
 * Returns `{ outcome, id, verdict?, childIds? }` where `outcome` is one of
 * `'noop'` (already past decompose — CAS-backed idempotency), `'already-
 * decomposed'` (children exist from an interrupted prior call; only the
 * root's stage-move is completed, no children regenerated), `'invalid'`
 * (fail-safe, item left untouched), `'need-human'` (parked in awaiting-human
 * with the proposal, nothing written to the queue yet), `'pass-through'`, or
 * `'decompose'` (children written, root moved to executing).
 */
export function resolveDecompose(dir, id, cfg, actor) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDecompose: work "${id}" not found.`);
  }

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
  // children on retry — generateId is deterministic, so a blind retry would
  // hit addWork's "already exists" validation error. Detect prior children
  // via the view instead, and only finish the root's own stage-move.
  const hasChildren = Object.values(view.work).some((item) => item.parent === id);
  if (hasChildren) {
    moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', actor });
    return { outcome: 'already-decomposed', id };
  }

  const verdict = judgeDecompose(work, cfg);

  if (verdict.kind === 'invalid') {
    return { outcome: 'invalid', id };
  }

  // D3: need-human (the model's own call) OR a risk-heavy root (classify's
  // signal) routes through the human gate — carrying whatever the verdict
  // proposed as context, but writing nothing into the queue yet (Terms:
  // "Đề xuất chia" is the proposal BEFORE it is committed).
  if (verdict.kind === 'need-human' || work.risk === HEAVY_RISK) {
    const reason = verdict.kind === 'need-human' ? verdict.reason : DEFAULT_RISK_GATE_REASON;
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason) });
    return { outcome: 'need-human', id, verdict };
  }

  if (verdict.kind === 'pass-through') {
    moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', actor });
    return { outcome: 'pass-through', id };
  }

  // verdict.kind === 'decompose': generate every child id up front (so
  // sibling `deps` resolve to real ids), then write each through the same
  // single store door, in list order — a child's deps were already filtered
  // to indices strictly before its own position, so every dep it names has
  // already been written by the time its own addWork runs.
  const existingIds = new Set(Object.keys(view.work));
  const childIds = verdict.children.map((child) => {
    const childId = generateId(child.title, existingIds);
    existingIds.add(childId);
    return childId;
  });

  verdict.children.forEach((child, index) => {
    addWork(dir, {
      id: childIds[index],
      title: child.title,
      kind: child.kind ?? work.kind,
      status: 'todo',
      deps: child.deps.map((depIndex) => childIds[depIndex]),
      risk: child.risk ?? work.risk,
      refs: child.refs,
      verify: child.verify,
      stage: 'executing',
      parent: id,
      tier: work.tier,
    });
  });

  moveStage(dir, { id, to: 'executing', expectedStage: 'decompose', actor });
  return { outcome: 'decompose', id, childIds };
}
