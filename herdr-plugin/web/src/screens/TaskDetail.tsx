import { useEffect, useRef, useState } from 'react'
import type { ApiClient } from '../api/client'
import { GatewayApiError, GatewayUnreachableError } from '../api/errors'
import { hostOf, isNonLoopbackHost } from '../lib/network'
import { pollStateDigest } from '../api/poll'
import { statusColor } from '../lib/status'
import type { SettlementEntry, WorkDetail, WorkDocsData } from '../api/types'

// S03 — Task detail (docs/ui-spec/screens/S03-task-detail.md). "The core
// deliverable of the whole cluster" per its own Purpose section.

const NEEDS_ANSWER_STATUSES = new Set(['awaiting-human', 'awaiting-approval'])

export interface TimelineRound {
  question: string
  answer: string | null
}

// R9: pairing is POSITIONAL, never a link the data does not carry.
// `askHistory` is oldest-first (confirmed: its last element equals the
// separate `ask` field, the most recent question -- a live `fgos show`
// check, not assumed). `settlement.recent` is newest-first and capped at
// 5 entries ACROSS every settlement kind (SETTLEMENT_DISPLAY_CAP), so
// only the answer-kind entries are usable, and only the most recent ones
// -- a round older than that window has no answer available through this
// view at all (a real API limit, not a client choice to hide it).
//
// `isCurrentlyParked` disambiguates two DIFFERENT reasons the trailing
// question(s) might lack an answer, which a length comparison alone
// cannot tell apart: a genuinely still-open round (the item's own FSM
// allows at most one open ask at a time, so this is only ever the LAST
// entry) versus an answer that exists but sits outside the 5-answer
// cap window. When parked, the last question is excluded from pairing
// entirely (it structurally has no answer anywhere yet) before aligning
// the rest from the end; when not parked, every question is treated as
// potentially answered and aligned from the end as-is.
export function pairTimeline(
  askHistory: string[] | undefined,
  settlementRecent: SettlementEntry[] | undefined,
  isCurrentlyParked: boolean,
): TimelineRound[] {
  const questions = askHistory ?? []
  const answersNewestFirst = (settlementRecent ?? []).filter((s) => s.kind === 'answer')
  const answersOldestFirst = [...answersNewestFirst].reverse().map((s) => s.detail ?? '')

  const openRound = isCurrentlyParked && questions.length > 0 ? questions[questions.length - 1] : null;
  const answerableQuestions = openRound !== null ? questions.slice(0, -1) : questions;

  // Align from the END: the newest answerable question pairs with the
  // newest available answer, working backward. A question older than the
  // available answer window gets `answer: null` with no fabricated text.
  const rounds: TimelineRound[] = []
  for (let i = 0; i < answerableQuestions.length; i++) {
    const answerIndexFromEnd = answerableQuestions.length - 1 - i
    const answer =
      answerIndexFromEnd < answersOldestFirst.length ? answersOldestFirst[answersOldestFirst.length - 1 - answerIndexFromEnd] : null
    rounds.push({ question: answerableQuestions[i], answer })
  }
  if (openRound !== null) {
    rounds.push({ question: openRound, answer: null })
  }
  return rounds
}

export interface TaskDetailProps {
  client: ApiClient
  baseUrl: string
  itemId: string
  onBack: () => void
  pollIntervalMs?: number
}

export function TaskDetail({ client, baseUrl, itemId, onBack, pollIntervalMs = 5000 }: TaskDetailProps) {
  const [detail, setDetail] = useState<WorkDetail | null>(null)
  const [docs, setDocs] = useState<WorkDocsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [showMachineLog, setShowMachineLog] = useState(false)
  const [showEarlierRounds, setShowEarlierRounds] = useState(false)
  const [answerDraft, setAnswerDraft] = useState('')
  const [answering, setAnswering] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [showEditPlaceholder, setShowEditPlaceholder] = useState(false)
  const lastDigestRef = useRef<string | undefined>(undefined)

  async function fetchDetail(): Promise<void> {
    try {
      const [detailData, docsData] = await Promise.all([client.getWork(itemId), client.getWorkDocs(itemId)])
      setDetail(detailData)
      setDocs(docsData)
      setStale(false)
    } catch (err) {
      if (err instanceof GatewayUnreachableError) {
        setStale(true)
        return
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchDetail()
    client
      .stateDigest()
      .then((digest) => {
        if (!cancelled) lastDigestRef.current = digest.data_hash
      })
      .catch(() => {})
    const interval = setInterval(() => {
      pollStateDigest(client, lastDigestRef.current)
        .then((result) => {
          if (cancelled) return
          lastDigestRef.current = result.dataHash
          if (result.changed) return fetchDetail()
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof GatewayUnreachableError) setStale(true)
        })
    }, pollIntervalMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, itemId, pollIntervalMs])

  async function submitAnswer(): Promise<void> {
    if (!answerDraft.trim()) return
    setAnswering(true)
    try {
      await client.answerWork(itemId, answerDraft)
      setAnswerDraft('')
      await fetchDetail()
    } catch (err) {
      if (err instanceof GatewayUnreachableError) setStale(true)
      // A GatewayApiError here is a real engine rejection -- left on
      // screen implicitly via the unchanged draft; a full error banner
      // is Execute-time polish this item's own scope does not require
      // beyond not losing the person's typed answer.
    } finally {
      setAnswering(false)
    }
  }

  async function retire(): Promise<void> {
    try {
      await client.moveWork(itemId, 'wontfix')
      await fetchDetail()
    } catch (err) {
      if (err instanceof GatewayUnreachableError) setStale(true)
    }
  }

  async function approveMerge(): Promise<void> {
    setApproveError(null)
    try {
      await client.approveWork(itemId)
      await fetchDetail()
    } catch (err) {
      if (err instanceof GatewayUnreachableError) {
        setStale(true)
        return
      }
      // R7: report unavailable WITH the reason, never silently. No
      // endpoint exposes "is this gateway at the main working tree"
      // ahead of time (area spec's own Open Gaps do not name one
      // either), so this button is offered and the engine's real
      // refusal -- e.g. `approve` structurally refusing outside the
      // main working tree -- surfaces here verbatim rather than being
      // predicted client-side.
      if (err instanceof GatewayApiError) {
        setApproveError(err.message)
      }
    }
  }

  if (loading) {
    return (
      <div data-testid="loading-skeleton" className="p-6 text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  if (!detail) {
    return null
  }

  const item = detail.work
  const gates = detail.gates ?? {}
  const askHistory = gates.askHistory ?? []
  const isParked = item.status === 'awaiting-human'
  const neverParked = askHistory.length === 0
  const rounds = pairTimeline(askHistory, detail.settlement?.recent, isParked)
  const visibleRounds = showEarlierRounds ? rounds : rounds.slice(-1)
  const hiddenRoundCount = rounds.length - visibleRounds.length
  const exposed = isNonLoopbackHost(baseUrl)
  const decisions = detail.decisions ?? []
  const canApprove = item.status === 'awaiting-approval'
  const gateHistory = (['contextApprove', 'planApprove', 'validateApprove'] as const)
    .map((name) => [name, gates[name]] as const)
    .filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => entry[1] !== undefined)
  const color = statusColor(item.status)

  // D17 (docs/history/herdr-web-dashboard/CONTEXT.md): the classification
  // line (domain/tier/deps/parent) -- only the fields that are actually
  // present render, same "no fabricated row" convention docsRef already
  // used before D17.
  const metaParts = [
    item.domain,
    item.tier && `tier-${item.tier}`,
    item.deps && item.deps.length > 0 && `deps: ${item.deps.join(', ')}`,
    item.parent && `parent: ${item.parent}`,
  ].filter(Boolean)

  return (
    <div className="min-h-svh bg-bg pb-24">
      <div data-testid="topbar" className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <button data-testid="back-to-board" onClick={onBack} className="text-sm font-medium text-ink-muted hover:text-brand">
            ← Board
          </button>
          <span className="text-sm font-semibold text-ink">
            {item.id} · {item.title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          {exposed && (
            <span
              data-testid="exposure-warning"
              className="rounded-full bg-status-needs-answer-bg px-2.5 py-1 text-xs font-medium text-status-needs-answer"
            >
              ⚠ reachable on network
            </span>
          )}
          <span data-testid="gateway-indicator">{hostOf(baseUrl)}</span>
        </div>
      </div>

      {stale && (
        <div data-testid="disconnected-banner" className="flex items-center gap-3 bg-danger-bg px-6 py-2 text-sm text-danger">
          Gateway unreachable — showing last known data.
          <button
            data-testid="retry-button"
            onClick={() => {
              setLoading(true)
              fetchDetail()
            }}
            className="rounded-md border border-danger px-2 py-0.5 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
        <div
          data-testid="question-region"
          className="rounded-xl border border-status-needs-answer-bar/40 bg-status-needs-answer-bg p-5"
        >
          {neverParked ? (
            <p data-testid="never-parked" className="text-sm text-ink-muted">
              This item has never needed a person.
            </p>
          ) : isParked ? (
            <>
              <p data-testid="needs-answer-badge" className="text-xs font-semibold uppercase tracking-wide text-status-needs-answer">
                NEEDS YOUR ANSWER · round {askHistory.length} of {askHistory.length}
              </p>
              <p data-testid="current-question" className="mt-2 text-lg font-semibold text-ink">
                {gates.ask}
              </p>
              <textarea
                data-testid="answer-input"
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                disabled={stale}
                className="mt-3 w-full rounded-lg border border-border bg-surface p-2 text-sm text-ink"
              />
              <button
                data-testid="answer-submit"
                onClick={submitAnswer}
                disabled={!answerDraft.trim() || answering || stale}
                className="mt-2 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-brand-contrast disabled:cursor-not-allowed disabled:opacity-40"
              >
                Answer this
              </button>
            </>
          ) : (
            <p data-testid="last-question" className="text-sm text-ink">
              {gates.ask ?? 'No open question.'}
            </p>
          )}
        </div>

        <div data-testid="why-region" className="rounded-xl border border-border bg-surface p-5">
          {/* The real data has no separate "why" field from the question
              text itself (a live `fgos show` check confirmed each
              askHistory entry already embeds the options-still-standing
              reasoning inline, matching how these questions are actually
              written per D6's own framing requirement) -- rendering a
              second, fabricated "why" summary here would invent content
              this screen has no real source for. */}
          <h3 className="text-sm font-semibold text-ink">Why you&apos;re being asked</h3>
          <p className="mt-1 text-sm text-ink-muted">{gates.ask ?? 'No open question.'}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div data-testid="context-region" className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-ink">What this item is</h3>
            <p data-testid="item-summary" className="mt-1 text-sm text-ink">
              {item.id} · {item.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}>
                {item.status}
              </span>
              {item.stage && <span className="text-xs text-ink-muted">{item.stage}</span>}
              {item.risk && <span className="text-xs text-ink-muted">· {item.risk}</span>}
            </div>

            {metaParts.length > 0 && (
              <p data-testid="item-meta" className="mt-2 text-xs text-ink-muted">
                {metaParts.join(' · ')}
              </p>
            )}

            {item.description && (
              <p data-testid="item-description" className="mt-3 text-sm text-ink-muted">
                {item.description}
              </p>
            )}

            {item.verify && (
              <p data-testid="item-verify" className="mt-3 rounded-md bg-surface-muted p-2 font-mono text-xs text-ink">
                verify: {item.verify}
              </p>
            )}

            {item.footprint && item.footprint.length > 0 && (
              <p data-testid="item-footprint" className="mt-2 text-xs text-ink-muted">
                footprint: {item.footprint.join(', ')}
              </p>
            )}

            {item.docsRef && (
              <a data-testid="item-docs-link" href="#" className="mt-2 inline-block text-xs text-brand hover:underline">
                {item.docsRef} ↗
              </a>
            )}

            <h3 className="mt-4 text-sm font-semibold text-ink">What the agent did</h3>
            {docs?.narrativeMissing ? (
              <p data-testid="narrative-missing" className="mt-1 text-sm text-ink-muted">
                Narrative not found at {docs.docsRef}.
              </p>
            ) : docs?.contextMd || docs?.planMd ? (
              <div data-testid="narrative" className="mt-1 space-y-2">
                {docs.contextMd && (
                  <pre data-testid="context-md" className="overflow-x-auto rounded-md bg-surface-muted p-2 text-xs text-ink">
                    {docs.contextMd}
                  </pre>
                )}
                {docs.planMd && (
                  <pre data-testid="plan-md" className="overflow-x-auto rounded-md bg-surface-muted p-2 text-xs text-ink">
                    {docs.planMd}
                  </pre>
                )}
              </div>
            ) : (
              <p data-testid="no-docs-ref" className="mt-1 text-sm text-ink-muted">
                No docsRef on this item.
              </p>
            )}

            <button
              data-testid="machine-log-disclosure"
              onClick={() => setShowMachineLog((v) => !v)}
              className="mt-3 text-xs font-medium text-ink-muted hover:text-brand"
            >
              {showMachineLog ? '▾' : '▸'} Machine decision log ({decisions.length})
            </button>
            {showMachineLog && (
              <ul data-testid="machine-log" className="mt-2 space-y-1 text-xs text-ink-muted">
                {decisions.map((d, i) => (
                  <li key={i}>{d.text}</li>
                ))}
              </ul>
            )}

            {gateHistory.length > 0 && (
              // D4-scope decision (2026-08-15, user-confirmed): the
              // gate-approve channel has no durable PENDING-question state to
              // show remotely (a live `gates` object only ever carries a
              // COMPLETED `{actor, at, verify}` record once a gate is
              // approved -- confirmed via `fgos show`, no "pending question"
              // field exists anywhere in it). Rather than fabricate a
              // "GATE · <name>" needs-answer row S04's own mock draws, this
              // renders the real, completed gate history instead -- history,
              // not a question. Making gate questions durably visible to a
              // remote client while still open is a real architecture gap,
              // out of this item's own scope.
              <div data-testid="gate-history" className="mt-3 border-t border-border pt-3">
                <h3 className="text-xs font-semibold text-ink">Gate history</h3>
                <ul className="mt-1 space-y-1 text-xs text-ink-muted">
                  {gateHistory.map(([name, record]) => (
                    <li key={name} data-testid={`gate-history-${name}`}>
                      {name} · {record.actor} · {record.at}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div data-testid="timeline-region" className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-2 text-sm font-semibold text-ink">Conversation history</h3>
            {hiddenRoundCount > 0 && (
              <button
                data-testid="timeline-show-earlier"
                onClick={() => setShowEarlierRounds(true)}
                className="mb-2 text-xs font-medium text-brand hover:underline"
              >
                show {hiddenRoundCount} earlier round{hiddenRoundCount === 1 ? '' : 's'}
              </button>
            )}
            <div className="space-y-3">
              {visibleRounds.map((round, i) => (
                <div key={i} data-testid={`round-${i}`} className="border-l-2 border-border pl-3">
                  <p className="text-sm text-ink">Q {round.question}</p>
                  <p data-testid={`round-${i}-answer`} className="mt-1 text-sm text-ink-muted">
                    {round.answer !== null ? `A ${round.answer}` : 'A — waiting'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        data-testid="actions-region"
        className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-border bg-surface px-6 py-3"
      >
        <div className="flex items-center gap-2">
          <button
            data-testid="action-edit"
            onClick={() => setShowEditPlaceholder(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink"
          >
            Edit
          </button>
          <button
            data-testid="action-retire"
            onClick={retire}
            disabled={stale}
            className="rounded-lg border border-danger px-3 py-1.5 text-sm font-medium text-danger disabled:cursor-not-allowed disabled:opacity-40"
          >
            Retire
          </button>
          {approveError && (
            <span data-testid="approve-error" className="text-xs text-danger">
              {approveError}
            </span>
          )}
        </div>
        <button
          data-testid="action-approve-merge"
          onClick={approveMerge}
          disabled={!canApprove || stale}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-brand-contrast disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve merge <span title="The only control on this client that changes trunk.">ⓘ</span>
        </button>
      </div>

      {showEditPlaceholder && (
        // M03 (docs/ui-spec/modals/M03-add-edit-item.md) is not owned by
        // any item in this cluster's current run -- same placeholder
        // pattern tsk-5jr's Taskboard already uses for the same reason.
        // tsk-41h's PATCH /work/{id} exists to support M03 once it is
        // built; this item does not build M03 itself.
        <div data-testid="edit-placeholder" role="dialog" className="fixed inset-0 flex items-center justify-center bg-ink/20">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            Edit item — coming soon.
            <button
              data-testid="edit-placeholder-close"
              onClick={() => setShowEditPlaceholder(false)}
              className="ml-3 rounded-md border border-border px-2 py-1 text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// tsk-4id (D4 of docs/history/herdr-web-dashboard/CONTEXT.md): "needs
// answer" covers BOTH the ask channel AND the gate-approve channel. This
// item's own detail screen only ever shows the ask channel's live
// question (`gates.ask`, present exactly when `status === 'awaiting-
// human'`) -- a gate-approve park (`status === 'awaiting-approval'`) has
// no free-text question to show here at all (`gates.contextApprove`/
// `planApprove`/`validateApprove` are `{actor, at, verify}` records, not
// questions); S04 (NeedsAnswer.tsx) is where both channels are unified
// into one list, per its own spec.
export { NEEDS_ANSWER_STATUSES }
