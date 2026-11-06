// src/workflow/propose.mjs — `fgos workflow propose`: a plan's slices become one proposal for the owner to approve
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// Judgment stays with the agent that read the plan and the code: it writes the slices (what each writes, how to
// verify it, what really depends on what). Everything after that is arithmetic and lookup, done here and never by
// hand: classify each slice by its write paths, size the frame, check the proposal against the repository, then
// state the owner's question and the commands that follow an approval. The command only proposes: it writes
// nothing, opens no case and runs nothing, so a refused or unapproved proposal costs no dispatch.
//
// `proposeFromSlices` and `proposeFromRequest` are pure over injected reads; `runPropose` is the CLI's shell over
// the real checkout, config and case ledgers.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { RunnerConfigError, loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { shippedCatalog } from '../runner/dispatch/shipped-catalog.mjs';
import { resolveGitRoots } from '../runner/execution/run.mjs';
import { RIGOR_ORDER } from './case-projection.mjs';
import { guideSha256 } from './case-start.mjs';
import { inheritFrom } from './case-inherit.mjs';
import { readCaseProjection } from './case-close.mjs';
import { digestText } from './ref-digests.mjs';
import { loadWorkflow } from './loader.mjs';
import { workflowCommit } from './unit-handoff.mjs';
import { classifySlice, defaultSliceTable } from './propose-classify.mjs';
import { proposeFrame, ProposeFrameError } from './propose-frame.mjs';
import { validateProposal, createRepoPorts } from './propose-validate.mjs';

export const DEFAULT_GUIDE = 'coding/feature';

const SLICE_KEYS = Object.freeze(['id', 'objective', 'writes', 'verify', 'dependsOn', 'raise', 'followUp', 'earlyReview', 'inputs', 'capability', 'pattern', 'rigor', 'activity']);
const MANIFEST_KEYS = Object.freeze(['request', 'slices', 'gate']);
const READ_ONLY_DEFAULTS = Object.freeze({ capability: 'review', pattern: 'solo', rigor: 'standard', activity: 'review-item' });
const WHOLE_REPO = /^(\.|\*\*|\.\/?\*\*?)\/?$/;

const rank = (rigor) => RIGOR_ORDER.indexOf(rigor);
const isText = (value) => typeof value === 'string' && value.trim() !== '';
const slugOf = (text) => String(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 40).replace(/-+$/, '') || 'case';

/**
 * What a plan's case is called when the person names no worktree or branch. Every plan file is called plan.md, so
 * the plan's own directory tells two plans apart; two directories with the same leaf name (or the same first
 * forty letters) are told apart by a short hash of the plan's directory path, added after the name is cut.
 */
export function planCaseSlug(plan) {
  const posix = path.posix.normalize(plan.split(path.sep).join('/'));
  const dir = path.posix.dirname(posix);
  const base = path.posix.basename(posix, path.posix.extname(posix));
  const name = slugOf(base.toLowerCase() === 'plan' ? path.posix.basename(dir) : base);
  return `${name}-${crypto.createHash('sha256').update(dir).digest('hex').slice(0, 6)}`;
}

/** A value `fgos`'s argument parser reads as one argument: no leading `--`, which it takes for a flag. */
const argumentSafe = (value) => typeof value === 'string' && !value.trimStart().startsWith('--');

/** What the lines after `workflow start` call the case: the shell variable the person sets from the start result. */
export const CASE_PLACEHOLDER = '$CASE';

const shellQuote = (arg) => {
  // A flag the command generates is bare; every value is quoted unless plain (a value never starts with "--").
  if (/^--[a-z][a-z-]*$/.test(arg)) return arg;
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(arg) && !arg.startsWith('--') ? arg : `'${arg.replace(/'/g, "'\\''")}'`;
};
/** The shell line of an argv; only the slots named in `caseSlots` become the case variable, so user text spelled `$CASE` stays literal. */
const lineOf = (argv, caseSlots = []) => ['fgos', ...argv.map((arg, i) => (caseSlots.includes(i) ? '"$CASE"' : shellQuote(arg)))].join(' ');
const command = (id, purpose, argv, extra = {}) => ({ id, purpose, argv, line: lineOf(argv, extra.caseSlots), ...extra });

// ─── the slice list the agent wrote ────────────────────────────────────────────

function checkManifest(manifest, { stat }) {
  const refusals = [];
  const refuse = (code, detail, slice) => refusals.push({ code, ...(slice ? { slice } : {}), detail });
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    refuse('manifest-invalid', 'the slice list must be a JSON object with "slices"');
    return { refusals, slices: [] };
  }
  for (const key of Object.keys(manifest)) if (!MANIFEST_KEYS.includes(key)) refuse('manifest-invalid', `unknown key "${key}" (allowed: ${MANIFEST_KEYS.join(', ')})`);
  if (manifest.request !== undefined && !(isText(manifest.request) && argumentSafe(manifest.request))) refuse('manifest-invalid', '"request" must be text that does not start with "--"');
  if (manifest.gate !== undefined && !(isText(manifest.gate) && argumentSafe(manifest.gate))) refuse('manifest-invalid', '"gate" must be a command that does not start with "--"');
  if (!Array.isArray(manifest.slices) || manifest.slices.length === 0) {
    refuse('manifest-invalid', '"slices" must be a non-empty list');
    return { refusals, slices: [] };
  }
  const ids = new Set();
  const slices = [];
  manifest.slices.forEach((raw, index) => {
    const where = isText(raw?.id) ? raw.id : `#${index + 1}`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return refuse('slice-invalid', `slice ${where} must be an object`, where);
    for (const key of Object.keys(raw)) if (!SLICE_KEYS.includes(key)) refuse('slice-invalid', `unknown key "${key}"`, where);
    if (!isText(raw.id) || !/^[a-z0-9][a-z0-9-]*$/.test(raw.id)) return refuse('slice-invalid', 'id must be lowercase letters, digits and dashes', where);
    if (ids.has(raw.id)) return refuse('slice-invalid', `id "${raw.id}" appears twice`, where);
    ids.add(raw.id);
    if (!(isText(raw.objective) && argumentSafe(raw.objective))) refuse('slice-invalid', 'objective is required: what the slice does and the plan phase and decisions it rests on (text that does not start with "--")', raw.id);
    const writes = raw.writes ?? [];
    if (!Array.isArray(writes) || !writes.every((w) => isText(w) && !w.includes(','))) {
      refuse('slice-invalid', '"writes" must be a list of paths without commas (empty for a read-only slice)', raw.id);
    }
    if (raw.verify !== undefined && !(isText(raw.verify) && argumentSafe(raw.verify))) refuse('slice-invalid', '"verify" must be a command that does not start with "--"', raw.id);
    if (Array.isArray(writes) && writes.length > 0 && !isText(raw.verify)) refuse('slice-verify-missing', 'a writing slice needs a narrow pass/fail "verify" command: a reviewed run without one verifies nothing', raw.id);
    if (raw.dependsOn !== undefined && !(Array.isArray(raw.dependsOn) && raw.dependsOn.every(isText))) refuse('slice-invalid', '"dependsOn" must be a list of slice ids', raw.id);
    if (raw.inputs !== undefined && !(Array.isArray(raw.inputs) && raw.inputs.every((p) => isText(p) && !p.includes(',')))) refuse('slice-invalid', '"inputs" must be a list of repository paths without commas', raw.id);
    for (const input of Array.isArray(raw.inputs) ? raw.inputs : []) {
      if (stat(input) !== 'file') refuse('input-missing', `input "${input}" is not a file of this checkout`, raw.id);
    }
    if (raw.earlyReview !== undefined && typeof raw.earlyReview !== 'boolean') refuse('slice-invalid', '"earlyReview" must be true or false', raw.id);
    if (raw.followUp !== undefined && !(isText(raw.followUp?.capability) && isText(raw.followUp?.pattern))) refuse('slice-invalid', '"followUp" needs a capability and a pattern', raw.id);
    if (Array.isArray(writes) && writes.length === 0) {
      if (raw.raise !== undefined) refuse('slice-invalid', 'a read-only slice has no paths to raise a rigor from; give it "rigor"', raw.id);
      if (raw.rigor !== undefined && !RIGOR_ORDER.includes(raw.rigor)) refuse('slice-invalid', `"rigor" must be one of ${RIGOR_ORDER.join(', ')}`, raw.id);
    } else if (raw.capability !== undefined || raw.pattern !== undefined || raw.rigor !== undefined) {
      refuse('slice-invalid', 'a writing slice takes its capability, pattern and rigor from the table; raise it with "raise" and a reason', raw.id);
    }
    slices.push({ ...raw, writes: Array.isArray(writes) ? writes : [], dependsOn: Array.isArray(raw.dependsOn) ? raw.dependsOn.filter(isText) : [], inputs: Array.isArray(raw.inputs) ? raw.inputs.filter(isText) : [] });
  });
  for (const slice of slices) {
    for (const dep of slice.dependsOn) if (!ids.has(dep)) refuse('slice-invalid', `depends on "${dep}", which is not a slice`, slice.id);
  }
  return { refusals, slices };
}

/** Slices in an order that respects `dependsOn`, the list's own order otherwise; a cycle is refused. */
function orderSlices(slices, refusals) {
  const done = new Set();
  const ordered = [];
  let pending = [...slices];
  while (pending.length > 0) {
    const ready = pending.find((slice) => slice.dependsOn.every((dep) => done.has(dep)));
    if (!ready) {
      refusals.push({ code: 'slice-cycle', detail: `slices ${pending.map((s) => `"${s.id}"`).join(', ')} wait on each other` });
      return slices;
    }
    ordered.push(ready);
    done.add(ready.id);
    pending = pending.filter((slice) => slice !== ready);
  }
  return ordered;
}

// ─── classification, frame and validation ──────────────────────────────────────

function wholeRepoNote(refusal, slices) {
  const slice = slices.find((s) => s.id === refusal.slice);
  const named = [refusal.path, ...(slice?.writes ?? [])].filter((p) => typeof p === 'string');
  if (named.some((p) => WHOLE_REPO.test(p.trim()))) {
    return 'Một mảnh không được ghi cả repo ("." hay "**"): hãy nêu từng thư mục. Nếu thật sự cần ghi cả repo thì đó là quyết định riêng của anh, không nằm trong đề xuất này.';
  }
  return undefined;
}

function classifyAll(slices, { table, ports, refusals }) {
  return slices.map((slice) => {
    if (slice.writes.length === 0) {
      return {
        ...slice,
        kind: 'read-only',
        ruleId: null,
        capability: slice.capability ?? READ_ONLY_DEFAULTS.capability,
        pattern: slice.pattern ?? READ_ONLY_DEFAULTS.pattern,
        rigor: slice.rigor ?? READ_ONLY_DEFAULTS.rigor,
        tableRigor: slice.rigor ?? READ_ONLY_DEFAULTS.rigor,
        raised: null,
        followUp: slice.followUp ?? null,
        askOwnerFirst: false,
        dispatch: true,
        unresolvedScopes: [],
        activity: slice.activity ?? READ_ONLY_DEFAULTS.activity,
      };
    }
    try {
      const judged = classifySlice({ writes: slice.writes, raise: slice.raise, listFiles: ports.repo.listFiles, table });
      return { ...slice, ...judged, followUp: slice.followUp ?? judged.followUp, activity: 'implement-item' };
    } catch (err) {
      if (!(err instanceof RunnerConfigError)) throw err;
      refusals.push({ code: err.code ?? 'slice-invalid', slice: slice.id, detail: err.message });
      return null;
    }
  });
}

const frameSliceOf = (slice, writes = slice.writes) => ({
  id: slice.id,
  writes,
  pattern: slice.pattern,
  rigor: slice.rigor,
  kind: slice.kind,
  capability: slice.capability,
  earlyReview: slice.earlyReview === true,
  followUp: slice.followUp ?? null,
});

/** The rigor the case's own read passes (ambiguity, plan validation) run at: the frame's floor, and never below standard. */
export function readPassRigor(floor) {
  return rank(floor) >= rank('standard') ? floor : 'standard';
}

/** The read-only passes a case runs besides its slices (a case that inherits skips the lock and validation), as the frame must admit them. */
function readPassesOf(dispatching, { inherit }) {
  const floor = dispatching.reduce((lowest, s) => (rank(s.rigor) < rank(lowest) ? s.rigor : lowest), 'critical');
  const rigor = readPassRigor(floor);
  const passes = inherit ? [] : [{ id: 'judge-ambiguity', pattern: 'solo', rigor }, { id: 'validate-plan', pattern: 'reviewed', rigor }];
  // A follow-up review is a dispatch of its own pattern: resolving it here refuses an unknown pattern and counts its launches.
  for (const slice of dispatching) if (slice.followUp) passes.push({ id: `follow-up-${slice.id}`, pattern: slice.followUp.pattern, rigor: slice.rigor });
  return passes;
}

// ─── the commands that follow an approval ──────────────────────────────────────

function activityPatternOf(guide, activityId) {
  const activity = guide.activities?.find((a) => a.id === activityId);
  return activity === undefined ? undefined : (activity.unit?.pattern ?? null);
}

function commandsFor({ proposal, guide, plan, request, worktree, branch, baseCommit, inherit, gate, runnerConfig }) {
  const commands = [];
  const caseId = CASE_PLACEHOLDER;
  const slices = proposal.slices.filter((s) => s.dispatch);

  commands.push(command('worktree', 'one linked worktree and branch carry the whole case; slices run one after another in it', ['worktree', 'create', worktree, '--branch', branch, ...(baseCommit ? ['--base', baseCommit] : [])]));
  const frame = proposal.frame;
  const frameFlag = ['dispatches', 'mutatingDispatches', 'seatLaunchesPerDispatch'].map((key) => `${key}=${frame[key]}`).concat(`rigorFloor=${frame.rigorFloor}`).join(',');
  commands.push(command('start', 'open the case inside the approved frame; the result\'s workflowRunId is the case id every later line names', ['workflow', 'start', guide.id, '--request', request, '--frame', frameFlag, ...(inherit ? ['--inherit', inherit.fromCase] : []), '--worktree', worktree, '--json'], { yields: { caseId: 'data.workflowRunId' } }));

  const run = (id, purpose, objective, flags) => commands.push(command(id, purpose, ['run', objective, '--case', caseId, ...flags, '--json'], { caseSlots: [3] }));
  const planInput = plan ? ['--input', plan] : [];
  if (!inherit) {
    // Read-only passes run at the frame's floor or standard, whichever is higher, as the frame was sized for.
    run('judge', 'one machine pass over the request: clear or unclear', `Judge whether the request is clear enough to plan from, for the plan at ${plan ?? 'the request'}; name every decision still open.`, ['--activity', 'judge-ambiguity', '--capability', 'advise', '--rigor', readPassRigor(frame.rigorFloor), '--pattern', 'solo', ...planInput]);
    run('validate', 'a reviewed read-only pass over the plan against the code as it is', `Validate the plan at ${plan ?? 'the request'} against the code as it stands: say what the slices rest on and what would not hold.`, ['--activity', 'validate-plan', '--capability', 'review', '--rigor', readPassRigor(frame.rigorFloor), '--pattern', 'reviewed', ...planInput]);
  }
  const implementPattern = activityPatternOf(guide, 'implement-item');
  for (const slice of slices) {
    const inputs = [...new Set([...(plan ? [plan] : []), ...slice.inputs])];
    const inputFlag = inputs.length > 0 ? ['--input', inputs.join(',')] : [];
    const readOnly = slice.writes.length === 0;
    if (readOnly) {
      run(`slice-${slice.id}`, `read-only slice "${slice.id}"`, slice.objective, ['--activity', slice.activity, '--capability', slice.capability, '--rigor', slice.rigor, '--pattern', slice.pattern, '--worktree', worktree, ...inputFlag, ...(slice.activity === 'review-item' ? ['--route', 'may-instead', '--reason', 'the slice reads work and writes nothing'] : [])]);
    } else {
      const swap = implementPattern !== undefined && implementPattern !== slice.pattern;
      run(`slice-${slice.id}`, `writing slice "${slice.id}" (${slice.kind}, ${slice.rigor})`, slice.objective, [
        '--activity', 'implement-item', '--capability', slice.capability, '--rigor', slice.rigor, '--pattern', slice.pattern,
        ...(swap ? ['--reason', `${slice.kind} slices are ${slice.pattern}: ${slice.kind === 'docs' ? 'a document is written once and read by a reviewer afterwards' : 'the table names this pattern for the kind'}`] : []),
        '--writes', slice.finalWrites.join(','), '--worktree', worktree, '--verify', slice.verify, ...inputFlag,
      ]);
    }
    // The frame counted these reviews, so every slice that asks for one gets the line, a read-only slice included.
    const subject = readOnly ? `the findings of read-only slice "${slice.id}"` : `the change of slice "${slice.id}" (${slice.finalWrites.join(', ')})`;
    const review = (id, capability, pattern, why) => run(id, why, `Review ${subject}: say what is wrong with ${readOnly ? 'them' : 'it'}, or that nothing is.`, ['--activity', 'review-item', '--route', 'may-instead', '--reason', why, '--capability', capability, '--pattern', pattern, '--rigor', slice.rigor, '--worktree', worktree]);
    if (slice.earlyReview === true) review(`early-review-${slice.id}`, 'review', 'solo', `an early read of slice "${slice.id}" before the rest is built on it`);
    if (slice.followUp) review(`follow-up-${slice.id}`, slice.followUp.capability, slice.followUp.pattern, readOnly ? `the findings of slice "${slice.id}" are read by a reviewer after it ran` : `${slice.kind} slices are read by a reviewer after they are written`);
  }
  const writing = slices.filter((s) => s.writes.length > 0);
  if (writing.length > 0) {
    const tested = [...new Set(writing.flatMap((s) => s.finalWrites))];
    const gateFlags = gate ? ['--verify', gate] : ['--capability', 'code:implement'];
    commands.push(command('gate', 'the runner, not a seat, runs the whole-worktree check and settles the integrated receipt', ['workflow', 'gate', caseId, '--worktree', worktree, '--writes', tested.join(','), ...gateFlags, '--json'], { caseSlots: [2] }));
  }
  return commands;
}

// ─── the owner's question, generated from the proposal ─────────────────────────

const countBy = (items, key) => items.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] ?? 0) + 1 }), {});

function questionsFor(proposal) {
  const questions = [];
  const plan = proposal.plan ?? 'yêu cầu này';
  if (proposal.refusals.length > 0) {
    questions.push({
      id: 'refusals',
      what: `Đề xuất cho ${plan} bị từ chối vì ${proposal.refusals.length} lỗi, nên chưa có khung nào để anh duyệt: ${proposal.refusals.map((r) => `${r.code}${r.slice ? ` (mảnh ${r.slice})` : ''}`).join(', ')}.`,
      cause: proposal.refusals.map((r) => `${r.code}: ${r.detail}${r.ownerNote ? ` ${r.ownerNote}` : ''}`).join(' | '),
      options: [
        { label: 'Sửa bản kê mảnh theo từng lỗi rồi đề xuất lại', cost: 'mất một vòng đề xuất, không tốn lượt chạy nào' },
        { label: 'Bỏ mảnh bị từ chối khỏi case này', cost: 'phần việc đó phải làm riêng sau' },
      ],
      recommendation: 'Sửa bản kê rồi đề xuất lại: các lỗi đều là chỗ bản kê khác với repo thật, sửa rẻ hơn chạy sai.',
      scope: 'Chỉ áp cho bản kê này; chưa mở case, chưa tốn lượt nào.',
    });
    return questions;
  }
  if (proposal.ownerFirst.length > 0) {
    const named = proposal.slices.filter((s) => s.askOwnerFirst);
    questions.push({
      id: 'owner-first',
      what: `${named.length} mảnh chạm dữ liệu, di trú hoặc thứ không đảo được, nên em không giao cho ghế nào chạy: ${named.map((s) => `${s.id} (${s.writes.join(', ')})`).join('; ')}.`,
      cause: `Bảng loại mảnh xếp các đường này vào loại phải hỏi chủ trước (rigor critical), vì một lượt ghi sai ở đó không quay lại được.${proposal.parked.length > 0 ? ` Các mảnh phụ thuộc vào chúng cũng chưa chạy: ${proposal.parked.map((p) => `${p.slice} (chờ ${p.behind})`).join(', ')}.` : ''}`,
      options: [
        { label: 'Anh tự làm, hoặc cho phép riêng từng mảnh sau khi đọc nội dung', cost: 'tốn thời gian của anh, nhưng không có gì chạy ngoài ý anh' },
        { label: 'Bỏ các mảnh này khỏi case, xử lý thành việc riêng', cost: 'case xong sớm hơn, phần dữ liệu còn nguyên đó' },
        { label: 'Đổi cách làm để không chạm các đường này', cost: 'phải sửa lại cách chia mảnh' },
      ],
      recommendation: 'Bỏ khỏi case này và xử lý riêng: case còn lại vẫn chạy được, mảnh không đảo được thì anh duyệt từng mảnh.',
      scope: 'Chỉ áp cho các mảnh này; không đổi khung của phần còn lại.',
    });
  }
  const dispatching = proposal.slices.filter((s) => s.dispatch);
  if (proposal.frame && dispatching.length > 0) {
    const f = proposal.frame;
    const b = proposal.breakdown;
    const writing = dispatching.filter((s) => s.writes.length > 0);
    const kinds = Object.entries(countBy(writing, 'kind')).map(([kind, n]) => `${n} ${kind}`).join(', ');
    const notes = [];
    const raised = dispatching.filter((s) => s.raised);
    if (raised.length > 0) notes.push(`Mảnh được nâng rigor: ${raised.map((s) => `${s.id} lên ${s.raised.rigor} (${s.raised.reason})`).join('; ')}.`);
    const added = proposal.expansions.flatMap((e) => e.add);
    if (added.length > 0) notes.push(`Em thêm ${added.length} file test vào phạm vi ghi vì chúng gọi tới code các mảnh đổi: ${added.join(', ')}.`);
    if (proposal.inherit) notes.push(`Case này nối tiếp ${proposal.inherit.fromCase} (cùng kế hoạch, cùng commit gốc): bỏ lượt khoá quyết định và validate, vì case đó đã làm.`);
    questions.push({
      id: 'frame',
      what: `${plan} được chia thành ${dispatching.length} mảnh (${writing.length} mảnh ghi${kinds ? `: ${kinds}` : ''}, ${dispatching.length - writing.length} mảnh chỉ đọc). Em cần anh duyệt khung chạy trước khi mở case: tối đa ${f.dispatches} lượt, ${f.mutatingDispatches} lượt ghi, ${f.seatLaunchesPerDispatch} lần khởi động ghế mỗi lượt, rigor tối thiểu ${f.rigorFloor}.`,
      cause: `Khung tính từ số mảnh, không đoán: ${f.mutatingDispatches} lượt ghi = ${b.writingSlices} mảnh ghi + ${b.fixes} lượt sửa (chỉ mảnh rigor high/critical) + ${b.spareWrites} dự phòng; lượt đọc = ${f.dispatches - f.mutatingDispatches} (validate, khoá quyết định, chẩn đoán, review, bước gate, dự phòng). Số lần khởi động ghế lấy từ pattern ở mảnh nặng nhất. ${notes.join(' ')}`.trim(),
      options: [
        { label: 'Duyệt khung như đề xuất', cost: `tốn tối đa ${f.dispatches} lượt (${f.mutatingDispatches} lượt ghi); sắp vượt thì em dừng và hỏi lại` },
        { label: 'Thu hẹp khung', cost: 'rẻ hơn, nhưng khung chỉ thu hẹp được sau khi duyệt: hết lượt giữa chừng thì phải mở case mới và hỏi lại' },
        { label: 'Đổi cách chia mảnh', cost: 'mất một vòng đề xuất lại, không tốn lượt chạy nào' },
      ],
      recommendation: 'Duyệt khung như đề xuất: số đã được thử lại trên các vòng thật trước đó (không nhỏ hơn mức đã dùng, không quá 1,5 lần), và có lượt dự phòng để không phải hỏi lại giữa chừng.',
      scope: `Duyệt nghĩa là em được mở case và chạy ${dispatching.length} mảnh này trong đúng khung trên, ghi trong worktree ${proposal.worktree}. Không bao gồm: merge (anh vẫn duyệt riêng), mở rộng khung, hay mảnh phải hỏi chủ trước.`,
    });
  }
  return questions;
}

function renderQuestion(q, index, total) {
  return [
    `Câu hỏi ${index + 1}/${total}`,
    `1. Việc đang xảy ra: ${q.what}`,
    `2. Nguyên nhân: ${q.cause}`,
    '3. Các lựa chọn và chi phí:',
    ...q.options.map((o, i) => `   ${String.fromCharCode(97 + i)}) ${o.label} — chi phí: ${o.cost}`),
    `4. Em khuyến nghị: ${q.recommendation}`,
    `5. Phạm vi của câu trả lời: ${q.scope}`,
  ].join('\n');
}

/** The proposal as the text a person reads: the question or questions first, then what runs after a yes. */
export function renderProposalText(proposal) {
  const out = [];
  if (proposal.questions.length === 0) out.push(proposal.summary);
  proposal.questions.forEach((q, i) => out.push(renderQuestion(q, i, proposal.questions.length), ''));
  if (proposal.commands.length > 0) {
    out.push('Sau khi anh duyệt, chạy lần lượt (đặt CASE bằng data.workflowRunId trong kết quả của lệnh `workflow start`):', ...proposal.commands.map((c) => `  ${c.line}`));
  }
  return `${out.join('\n').trimEnd()}\n`;
}

// ─── the proposal ──────────────────────────────────────────────────────────────

function emptyProposal(fields) {
  return { ok: false, kind: 'case', plan: null, guide: null, request: null, frame: null, breakdown: null, inherit: null, slices: [], order: [], ownerFirst: [], parked: [], expansions: [], refusals: [], questions: [], commands: [], worktree: null, branch: null, summary: '', ...fields };
}

function finish(proposal) {
  proposal.refusals = proposal.refusals.map((r) => {
    const ownerNote = wholeRepoNote(r, proposal.slices);
    return ownerNote && ['write-path-forbidden', 'write-path-invalid', 'unresolved-scope'].includes(r.code) ? { ...r, ownerNote } : r;
  });
  proposal.ok = proposal.refusals.length === 0;
  // Nothing is offered for approval while anything is refused: a frame sized on a proposal that does not match the repository is a guess.
  if (!proposal.ok) Object.assign(proposal, { frame: null, breakdown: null, commands: [] });
  if (!proposal.ok || proposal.questions.length === 0) proposal.questions = questionsFor(proposal);
  return proposal;
}

/**
 * Propose how a list of slices is run as one case.
 *
 * @param {object} params
 * @param {object} params.manifest `{ request?, gate?, slices: [{ id, objective, writes, verify, dependsOn?, raise?, followUp?, earlyReview?, inputs?, capability?, pattern?, rigor?, activity? }] }`
 * @param {string} [params.plan] the plan file, a repository path
 * @param {object} params.guide the guide the case runs
 * @param {object} params.runnerConfig
 * @param {object} params.shipped the shipped pattern catalog
 * @param {object} params.ports `{ repo: { stat, listFiles, findTests, crateOf }, headCommit(): string|null, findInherit({ guide, request, baseCommit }): object|null }`
 * @param {string} [params.worktree] where the case's worktree goes
 * @param {string} [params.branch]
 * @param {object} [params.table] test seam: a slice table
 * @returns {object} the proposal; `ok` is false when anything was refused, and then it holds no frame and no commands
 */
export function proposeFromSlices({ manifest, plan, guide, runnerConfig, shipped, ports, worktree, branch, table = defaultSliceTable() }) {
  const proposal = emptyProposal({ plan: plan ?? null, guide: { id: guide.id } });
  const refusals = proposal.refusals;
  for (const [name, value] of [['worktree', worktree], ['branch', branch]]) {
    if (value !== undefined && !(isText(value) && argumentSafe(value))) refusals.push({ code: 'option-invalid', detail: `${name} must be text that does not start with "--"` });
  }
  if (plan !== undefined && ports.repo.stat(plan) !== 'file') refusals.push({ code: 'plan-missing', detail: `the plan "${plan}" is not a file of this checkout` });
  const checked = checkManifest(manifest, ports.repo);
  refusals.push(...checked.refusals);
  for (const activity of ['implement-item', 'validate-plan', 'judge-ambiguity']) {
    if (!guide.activities?.some((a) => a.id === activity)) refusals.push({ code: 'guide-activity-missing', detail: `guide "${guide.id}" has no activity "${activity}", which the commands need` });
  }
  if (refusals.length > 0) return finish(proposal);

  const request = manifest.request ?? (plan ? `Deliver the plan at ${plan}.` : 'Deliver the slices listed in the proposal.');
  const ordered = orderSlices(checked.slices, refusals);
  const classified = classifyAll(ordered, { table, ports, refusals });
  if (refusals.length > 0) return finish({ ...proposal, slices: ordered.map((s) => ({ ...s, dispatch: false })) });
  proposal.slices = classified.map((s) => ({ ...s, finalWrites: [...s.writes] }));
  proposal.order = classified.map((s) => s.id);
  proposal.request = request;
  proposal.ownerFirst = classified.filter((s) => s.askOwnerFirst).map((s) => s.id);
  // A slice that waits on one the owner must decide first cannot run before that answer, so it is parked behind it
  // (transitively) rather than offered as runnable work whose prerequisite has not happened.
  const parked = new Map();
  for (const slice of classified) {
    const behind = slice.dependsOn.find((dep) => proposal.ownerFirst.includes(dep) || parked.has(dep));
    if (behind !== undefined && !slice.askOwnerFirst) {
      parked.set(slice.id, proposal.ownerFirst.includes(behind) ? behind : parked.get(behind));
      slice.dispatch = false;
      slice.parkedBehind = parked.get(slice.id);
    }
  }
  for (const slice of proposal.slices) if (parked.has(slice.id)) Object.assign(slice, { dispatch: false, parkedBehind: parked.get(slice.id) });
  proposal.parked = [...parked].map(([id, behind]) => ({ slice: id, behind }));

  const dispatching = classified.filter((s) => s.dispatch);
  const baseCommit = ports.headCommit();
  const found = ports.findInherit({ guide, request, baseCommit });
  // The lock and the validation are dropped together, so a case is continued only when it reached both; one that reached
  // only one would leave the new case without the other and the first slice refused at its entry milestone.
  const inherit = found && ['decisions-locked', 'plan-validated'].every((m) => found.milestones.some((reached) => reached.milestone === m)) ? found : null;
  proposal.inherit = inherit ? { fromCase: inherit.fromCase, milestones: inherit.milestones.map((m) => m.milestone) } : null;

  if (dispatching.length > 0) {
    try {
      const sized = proposeFrame({
        slices: dispatching.map((s) => frameSliceOf(s, s.writes)),
        catalog: { runnerConfig, shipped },
        frameDefaults: guide.frameDefaults,
        inherit: inherit !== null,
        readPasses: readPassesOf(dispatching, { inherit: inherit !== null }),
      });
      proposal.frame = sized.frame;
      proposal.breakdown = sized.breakdown;
    } catch (err) {
      if (!(err instanceof ProposeFrameError)) throw err;
      refusals.push({ code: err.code, detail: err.message });
    }
  }

  // The proposal is compared with the repository before anyone is asked: a frame sized on slices that do not
  // match what is there is a guess.
  const verdict = validateProposal({
    slices: classified.map((s) => ({ id: s.id, writes: s.writes, rigor: s.rigor, capability: s.capability, followUp: s.followUp, askOwnerFirst: s.askOwnerFirst, unresolvedScopes: s.unresolvedScopes })),
    runnerConfig,
    ...(proposal.frame ? { rigorFloor: proposal.frame.rigorFloor } : {}),
    ports: ports.repo,
  });
  refusals.push(...verdict.refusals);
  proposal.expansions = verdict.expansions;
  for (const slice of proposal.slices) {
    const grown = verdict.expansions.find((e) => e.slice === slice.id);
    if (grown) slice.finalWrites = [...slice.writes, ...grown.add];
  }

  const writing = dispatching.filter((s) => s.writes.length > 0);
  const gate = manifest.gate ?? null;
  if (writing.length > 0 && gate === null && !runnerConfig?.capabilities?.['code:implement']?.verify) {
    refusals.push({ code: 'gate-command-missing', detail: 'the whole-worktree gate needs a command: give "gate" in the slice list, or configure a verify command for code:implement' });
  }
  const slug = plan ? planCaseSlug(plan) : slugOf(request);
  proposal.worktree = worktree ?? `../${slug}-worktree`;
  proposal.branch = branch ?? `case/${slug}`;
  if (refusals.length > 0 || proposal.frame === null) {
    if (refusals.length === 0) proposal.summary = 'Mọi mảnh đều phải hỏi chủ trước: không có gì để chạy.';
    return finish(proposal);
  }
  proposal.commands = commandsFor({ proposal, guide, plan, request, worktree: proposal.worktree, branch: proposal.branch, baseCommit, inherit, gate, runnerConfig });
  return finish(proposal);
}

/**
 * Size a request that comes without a plan, from the paths it names, and say what to do next: shape the plan
 * first (nothing named), one `fgos run` (a few paths, none risky), or write the slice list (anything bigger).
 * The thresholds are the slice table's `request` section.
 *
 * @param {object} params
 * @param {string} params.request
 * @param {string[]} [params.writes] paths the request would change
 * @param {string} [params.verify] the narrow check of a single run
 * @param {object} params.ports same as `proposeFromSlices`
 * @param {object} params.runnerConfig
 * @param {string} [params.worktree]
 * @param {object} [params.table]
 */
export function proposeFromRequest({ request, writes = [], verify, ports, runnerConfig, worktree, table = defaultSliceTable() }) {
  const proposal = emptyProposal({ kind: 'shape-plan-first', request });
  const refuse = (code, detail) => proposal.refusals.push({ code, detail });
  if (worktree !== undefined && !(isText(worktree) && argumentSafe(worktree))) {
    refuse('option-invalid', 'worktree must be text that does not start with "--"');
    return finish(proposal);
  }
  if (!(isText(request) && argumentSafe(request))) {
    refuse('request-invalid', 'the request must be text that does not start with "--"');
    return finish(proposal);
  }
  if (writes.length === 0) {
    proposal.summary = 'Yêu cầu chưa nêu đường nào sẽ đổi, nên chưa đủ để chia mảnh.';
    proposal.questions = [{
      id: 'size',
      what: 'Yêu cầu này chưa nêu file hay thư mục nào sẽ đổi, nên em chưa thể chia mảnh hay tính khung.',
      cause: `Bảng loại mảnh chỉ coi là việc nhỏ khi yêu cầu nêu từ 1 đến ${table.request.singleRunMaxPaths} đường cụ thể.`,
      options: [
        { label: 'Lập kế hoạch trước (shape-plan) rồi đề xuất lại từ kế hoạch', cost: 'một lượt đọc, không ghi gì' },
        { label: 'Anh nêu đường cần đổi để em đề xuất lại', cost: 'không tốn lượt chạy nào' },
      ],
      recommendation: 'Lập kế hoạch trước: việc chưa rõ phạm vi thì chia mảnh sẽ là đoán.',
      scope: 'Chỉ áp cho yêu cầu này; chưa mở case.',
    }];
    return finish({ ...proposal, ok: true, questions: proposal.questions });
  }
  if (writes.some((w) => !isText(w) || w.includes(','))) {
    refuse('request-invalid', 'the paths must be non-empty and contain no commas');
    return finish(proposal);
  }
  let judged;
  try {
    judged = classifySlice({ writes, listFiles: ports.repo.listFiles, table });
  } catch (err) {
    if (!(err instanceof RunnerConfigError)) throw err;
    refuse(err.code ?? 'request-invalid', err.message);
    return finish(proposal);
  }
  const verdict = validateProposal({
    slices: [{ id: 'request', writes, rigor: judged.rigor, capability: judged.capability, followUp: judged.followUp, askOwnerFirst: judged.askOwnerFirst, unresolvedScopes: judged.unresolvedScopes }],
    runnerConfig,
    ports: ports.repo,
  });
  proposal.refusals.push(...verdict.refusals);
  proposal.expansions = verdict.expansions;
  if (proposal.refusals.length > 0) return finish(proposal);
  const single = !judged.askOwnerFirst && writes.length <= table.request.singleRunMaxPaths && rank(judged.rigor) <= rank(table.request.singleRunMaxRigor);
  if (!single) {
    proposal.kind = 'manifest-needed';
    proposal.ownerFirst = judged.askOwnerFirst ? ['request'] : [];
    proposal.summary = 'Việc này lớn hoặc rủi ro hơn một lượt chạy: cần bản kê các mảnh.';
    proposal.questions = [{
      id: 'size',
      what: `Yêu cầu nêu ${writes.length} đường, xếp loại ${judged.kind} với rigor ${judged.rigor}${judged.askOwnerFirst ? ' và phải hỏi chủ trước' : ''}; quá một lượt chạy đơn.`,
      cause: `Một lượt chạy đơn chỉ dành cho tối đa ${table.request.singleRunMaxPaths} đường và rigor không quá ${table.request.singleRunMaxRigor}.`,
      options: [
        { label: 'Viết bản kê các mảnh (slices) rồi đề xuất bằng --slices', cost: 'một lượt chia mảnh của agent, không ghi gì' },
        { label: 'Thu nhỏ yêu cầu về một việc đơn', cost: 'phần còn lại làm sau' },
      ],
      recommendation: judged.askOwnerFirst ? 'Tách phần chạm dữ liệu ra hỏi riêng, phần còn lại chia mảnh.' : 'Viết bản kê các mảnh: khung được tính từ các mảnh thay vì đoán.',
      scope: 'Chỉ áp cho yêu cầu này; chưa mở case.',
    }];
    return finish({ ...proposal, ok: true, questions: proposal.questions });
  }
  if (!(isText(verify) && argumentSafe(verify))) {
    refuse('slice-verify-missing', 'a single run that writes needs a narrow pass/fail --verify command');
    return finish(proposal);
  }
  const added = verdict.expansions.flatMap((e) => e.add);
  const finalWrites = [...writes, ...added];
  proposal.kind = 'single-run';
  proposal.worktree = worktree ?? `../${slugOf(request)}-worktree`;
  proposal.branch = `case/${slugOf(request)}`;
  proposal.slices = [{ id: 'request', objective: request, writes, finalWrites, verify, kind: judged.kind, ruleId: judged.ruleId, capability: judged.capability, pattern: judged.pattern, rigor: judged.rigor, dispatch: true }];
  proposal.expansions = verdict.expansions;
  proposal.commands = [
    command('worktree', 'a writing run needs a linked worktree', ['worktree', 'create', proposal.worktree, '--branch', proposal.branch]),
    command('run', 'one reviewed run, verified by the command given', ['run', request, '--capability', judged.capability, '--rigor', judged.rigor, '--pattern', judged.pattern, '--writes', finalWrites.join(','), '--worktree', proposal.worktree, '--verify', verify, '--json']),
  ];
  proposal.summary = 'Việc nhỏ: một lượt `fgos run` là đủ.';
  proposal.questions = [{
    id: 'size',
    what: `Yêu cầu nêu ${writes.length} đường (${judged.kind}, rigor ${judged.rigor}), nhỏ đủ để chạy bằng một lượt \`fgos run\` mà không cần mở case.`,
    cause: `Bảng loại mảnh cho phép một lượt chạy đơn tới ${table.request.singleRunMaxPaths} đường và rigor tới ${table.request.singleRunMaxRigor}; ${added.length > 0 ? `em thêm ${added.length} file test gọi tới code đổi; ` : ''}lượt chạy được kiểm bằng lệnh anh đưa.`,
    options: [
      { label: 'Chạy một lượt đơn như dưới đây', cost: `1 lượt ghi với ${judged.pattern}, rigor ${judged.rigor}; không có khung case nên không có lượt dự phòng` },
      { label: 'Mở case đầy đủ', cost: 'khung có lượt dự phòng và gate, nhưng tốn thêm lượt đọc' },
    ],
    recommendation: 'Chạy một lượt đơn: việc nhỏ không đáng khung case.',
    scope: 'Chỉ áp cho lượt chạy này; sai thì chạy lại là một lượt mới.',
  }];
  return finish({ ...proposal, ok: true, questions: proposal.questions });
}

// ─── the real reads, and the CLI's shell ───────────────────────────────────────

/** The reads a proposal needs from a checkout and the case ledgers under `mainRoot`. */
export function createProposePorts({ checkoutRoot, mainRoot }) {
  const repo = createRepoPorts({ root: checkoutRoot });
  const closedCaseIds = () => {
    try {
      return fs.readdirSync(path.join(mainRoot, '.fgos', 'workflow-runs'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => ({ id: d.name, at: fs.statSync(path.join(mainRoot, '.fgos', 'workflow-runs', d.name)).mtimeMs }))
        .sort((a, b) => b.at - a.at)
        .map((d) => d.id);
    } catch {
      return [];
    }
  };
  return {
    repo,
    headCommit: () => workflowCommit(checkoutRoot, 'HEAD'),
    // The one door for what may be taken over is `inheritFrom`: a closed case is offered only when its own guards pass.
    findInherit: ({ guide, request, baseCommit }) => {
      for (const caseId of closedCaseIds()) {
        try {
          readCaseProjection(mainRoot, caseId);
          return inheritFrom({ mainRoot, fromCaseId: caseId, guide, guideSha256: guideSha256(guide), requestDigest: digestText(request), baseCommit });
        } catch { /* this case is open, another guide, another request or base: the next may fit */ }
      }
      return null;
    },
  };
}

/**
 * `fgos workflow propose`: read the slice list or the request, and return the proposal. Writes nothing.
 *
 * @param {object} params the flags of the verb, by name
 * @param {string} [params.slices] JSON file of the slice list
 * @param {string} [params.plan]
 * @param {string} [params.guide]
 * @param {string} [params.request] a request with no plan
 * @param {string} [params.writes] with `request`: comma-separated paths it would change
 * @param {string} [params.verify] with `request`: the narrow check of a single run
 * @param {string} [params.worktree]
 * @param {string} [params.branch]
 * @param {string} [params.dir] the store root (`--dir`), the checkout too when given
 * @param {string} [params.cwd]
 */
export function runPropose({ slices, plan, guide: guideId, request, writes, verify, worktree, branch, dir, cwd = process.cwd() }) {
  const roots = resolveGitRoots(cwd, { allowNoRepository: false });
  const mainRoot = dir === undefined ? roots.mainCheckoutRoot : path.resolve(dir);
  const checkoutRoot = dir === undefined ? roots.worktreeRoot : mainRoot;
  if ((slices === undefined) === (request === undefined)) {
    throw new RunnerConfigError('workflow propose takes exactly one of --slices <file> (a plan\'s slice list) or --request "<text>" (a request with no plan)', { code: 'propose-source' });
  }
  const runnerConfig = loadRunnerConfigForDir(mainRoot);
  const ports = createProposePorts({ checkoutRoot, mainRoot });
  if (request !== undefined) {
    if (plan !== undefined || guideId !== undefined) throw new RunnerConfigError('workflow propose --request sizes a request on its own; --plan and --guide belong to --slices', { code: 'propose-source' });
    const named = typeof writes === 'string' ? writes.split(',').map((w) => w.trim()).filter(Boolean) : [];
    return proposeFromRequest({ request, writes: named, verify, ports, runnerConfig, worktree });
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.resolve(cwd, slices), 'utf8'));
  } catch (err) {
    throw new RunnerConfigError(`the slice list ${slices} cannot be read as JSON: ${err.message}`, { code: 'propose-slices-unreadable' });
  }
  const id = guideId ?? DEFAULT_GUIDE;
  const guide = loadWorkflow(id, { packageRoot: mainRoot, cwd }).guide;
  if (!guide) throw new RunnerConfigError(`"${id}" has no guide part: propose needs a conductor guide such as ${DEFAULT_GUIDE}`, { code: 'propose-guide-missing' });
  return proposeFromSlices({ manifest, plan, guide: { ...guide, id }, runnerConfig, shipped: shippedCatalog(), ports, worktree, branch });
}
