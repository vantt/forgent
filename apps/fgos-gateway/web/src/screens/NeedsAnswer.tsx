import { useEffect, useState } from 'react'
import type { ApiClient } from '../api/client'
import { GatewayUnreachableError } from '../api/errors'
import { hostOf, isNonLoopbackHost } from '../lib/network'
import type { ListQuestionsData, QuestionDetail } from '../api/types'

// S04 — Questions needing answer (docs/platform/ui-spec/architecture/screens/S04-questions-
// needing-answer.md). Renders exactly what GET /v1/questions returns, in three groups: store
// questions, `fgos ask` items and gates. Each group keeps its own answer door.

export interface NeedsAnswerProps {
  client: ApiClient
  baseUrl: string
  onOpenItem: (id: string) => void
  onBack: () => void
}

/** The id of the Work item behind an `fgos ask` row's `work:<id>` ref. */
function workIdOf(ref: string): string {
  return ref.startsWith('work:') ? ref.slice('work:'.length) : ref
}

export function NeedsAnswer({ client, baseUrl, onOpenItem, onBack }: NeedsAnswerProps) {
  const [data, setData] = useState<ListQuestionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [details, setDetails] = useState<Record<string, QuestionDetail>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [refused, setRefused] = useState<Record<string, string>>({})

  async function fetchList(): Promise<void> {
    try {
      setData(await client.listQuestions())
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
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  async function toggleExpand(id: string): Promise<void> {
    const open = !expanded[id]
    setExpanded((prev) => ({ ...prev, [id]: open }))
    if (!open || details[id]) return
    try {
      const { question } = await client.getQuestion(id)
      setDetails((prev) => ({ ...prev, [id]: question }))
      const recommended = question.asked.parts.options.find((o) => o.recommended === true)
      if (recommended) setPicked((prev) => (prev[id] ? prev : { ...prev, [id]: recommended.label }))
    } catch (err) {
      if (err instanceof GatewayUnreachableError) setStale(true)
    }
  }

  async function submitQuestion(id: string): Promise<void> {
    const option = picked[id]
    const text = notes[id]?.trim()
    if (!option && !text) return
    try {
      await client.answerQuestion(id, { ...(option ? { option } : {}), ...(text ? { text } : {}) })
      setRefused((prev) => ({ ...prev, [id]: '' }))
      await fetchList()
    } catch (err) {
      if (err instanceof GatewayUnreachableError) {
        setStale(true)
        return
      }
      // The verb refuses (already answered, not the owner): show its message, never swallow it.
      setRefused((prev) => ({ ...prev, [id]: err instanceof Error ? err.message : 'refused' }))
      await fetchList()
    }
  }

  async function submitAnswer(id: string): Promise<void> {
    const text = answerDrafts[id]
    if (!text?.trim()) return
    try {
      await client.answerWork(id, text)
      setAnswerDrafts((prev) => ({ ...prev, [id]: '' }))
      await fetchList()
    } catch (err) {
      if (err instanceof GatewayUnreachableError) setStale(true)
    }
  }

  const questions = data?.questions ?? []
  const asks = data?.work?.asks ?? []
  const gates = data?.work?.gates ?? []
  const needsYou = data?.needsYou ?? 0
  const nothing = questions.length + asks.length + gates.length === 0

  const exposed = isNonLoopbackHost(baseUrl)

  return (
    <div className="min-h-svh bg-bg">
      <div data-testid="topbar" className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <button data-testid="back-to-board" onClick={onBack} className="text-sm font-medium text-ink-muted hover:text-brand">
            ← Board
          </button>
          <span className="text-sm font-semibold text-ink">Needs answer · {needsYou}</span>
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
              fetchList()
            }}
            className="rounded-md border border-danger px-2 py-0.5 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div data-testid="loading-skeleton" className="p-6 text-sm text-ink-muted">
          Loading…
        </div>
      )}

      {!loading && data && nothing && (
        <p data-testid="empty-questions" className="p-6 text-sm text-ink-muted">
          Nothing is waiting on you.
        </p>
      )}

      {data?.work?.unavailable && (
        <p data-testid="work-unavailable" className="px-6 pt-3 text-sm text-ink-muted">
          Work items unavailable: {data.work.unavailable}
        </p>
      )}

      <div data-testid="list" className="mx-auto max-w-2xl space-y-3 p-6">
        {questions.length > 0 && <h2 className="text-xs font-semibold uppercase text-ink-muted">Questions</h2>}
        {questions.map((q) => {
          const detail = details[q.id]
          return (
            <div key={q.id} data-testid={`row-${q.id}`} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <span className="text-sm font-semibold text-ink">{q.headline}</span>
              <p data-testid={`tag-${q.id}`} className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                QUESTION
              </p>
              <p data-testid={`recommended-${q.id}`} className="mt-1 text-xs text-ink-muted">
                Recommended: {q.recommended ?? 'none'} · blocks: {q.blocks} · {q.age}
              </p>
              <button
                data-testid={`expand-${q.id}`}
                onClick={() => toggleExpand(q.id)}
                className="mt-2 text-sm font-medium text-ink-muted hover:text-brand"
              >
                {expanded[q.id] ? 'Collapse' : 'Expand'}
              </button>
              {expanded[q.id] && detail && (
                <div data-testid={`detail-${q.id}`} className="mt-2 space-y-2 text-sm text-ink">
                  <p>
                    <strong>What is happening:</strong> {detail.asked.parts.what}
                  </p>
                  <p>
                    <strong>Cause:</strong> {detail.asked.parts.cause}
                  </p>
                  <fieldset className="space-y-1">
                    {detail.asked.parts.options.map((option) => (
                      <label key={option.label} className="block rounded-lg border border-border p-2">
                        <input
                          type="radio"
                          name={`option-${q.id}`}
                          data-testid={`option-${q.id}-${option.label}`}
                          checked={picked[q.id] === option.label}
                          onChange={() => setPicked((prev) => ({ ...prev, [q.id]: option.label }))}
                          disabled={stale}
                        />{' '}
                        <strong>{option.label}</strong>
                        {option.recommended === true ? ' (recommended)' : ''}: {option.does}
                        <span className="block text-xs text-ink-muted">
                          gain: {option.gain} · harm: {option.harm} · cost: {option.cost}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <p>
                    <strong>Recommendation:</strong> {detail.asked.parts.recommendation}
                  </p>
                  <p>
                    <strong>Scope of the answer:</strong> allows {detail.asked.parts.scope.allows}; forbids{' '}
                    {detail.asked.parts.scope.forbids}
                  </p>
                  <textarea
                    data-testid={`note-${q.id}`}
                    value={notes[q.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    disabled={stale}
                    placeholder="Note (optional)"
                    className="w-full rounded-lg border border-border bg-surface p-2 text-sm text-ink"
                  />
                  {refused[q.id] && (
                    <p data-testid={`refused-${q.id}`} className="text-sm text-danger">
                      {refused[q.id]}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      data-testid={`question-submit-${q.id}`}
                      onClick={() => submitQuestion(q.id)}
                      disabled={(!picked[q.id] && !notes[q.id]?.trim()) || stale}
                      className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-contrast disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {asks.length > 0 && <h2 className="text-xs font-semibold uppercase text-ink-muted">Ask items</h2>}
        {asks.map((ask) => {
          const id = workIdOf(ask.ref)
          return (
            <div key={ask.ref} data-testid={`row-${id}`} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <span className="text-sm font-semibold text-ink">
                {id}
                {ask.title ? ` · ${ask.title}` : ''}
              </span>
              <p data-testid={`tag-${id}`} className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                ASK
              </p>
              <textarea
                data-testid={`answer-input-${id}`}
                value={answerDrafts[id] ?? ''}
                onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [id]: e.target.value }))}
                disabled={stale}
                className="mt-2 w-full rounded-lg border border-border bg-surface p-2 text-sm text-ink"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button data-testid={`open-${id}`} onClick={() => onOpenItem(id)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink">
                  Open
                </button>
                <button
                  data-testid={`answer-submit-${id}`}
                  onClick={() => submitAnswer(id)}
                  disabled={!answerDrafts[id]?.trim() || stale}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-contrast disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Answer
                </button>
              </div>
            </div>
          )
        })}

        {gates.length > 0 && <h2 className="text-xs font-semibold uppercase text-ink-muted">Gates</h2>}
        {gates.map((gate) => (
          <div key={gate.ref} data-testid={`row-${gate.ref}`} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <span className="text-sm font-semibold text-ink">{gate.ref}</span>
            <p data-testid={`tag-${gate.ref}`} className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
              GATE
            </p>
            <p className="mt-1 text-sm text-ink">{gate.question}</p>
            <code data-testid={`door-${gate.ref}`} className="mt-1 block text-xs text-ink-muted">
              {gate.answerDoor}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}
