import { useEffect, useState } from 'react'
import type { ApiClient } from '../api/client'
import { GatewayUnreachableError } from '../api/errors'
import { hostOf, isNonLoopbackHost } from '../lib/network'
import type { WorkItem } from '../api/types'

// S04 — Questions needing answer (docs/ui-spec/screens/S04-questions-
// needing-answer.md). D15 (docs/history/herdr-web-dashboard/CONTEXT.md):
// the `ask` channel only -- gate-approve questions have no durable,
// remotely-observable pending state today (see TaskDetail.tsx's own
// D15 citation for the live evidence).

export interface NeedsAnswerProps {
  client: ApiClient
  baseUrl: string
  onOpenItem: (id: string) => void
  onBack: () => void
}

export function NeedsAnswer({ client, baseUrl, onOpenItem, onBack }: NeedsAnswerProps) {
  const [items, setItems] = useState<WorkItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})

  async function fetchList(): Promise<void> {
    try {
      const data = await client.listWork({ status: 'awaiting-human', all: true })
      // Oldest-first (area spec: "the thing that has been waiting longest
      // is the thing most likely to be blocking something else"). The
      // contract carries no `parkedAt` field, so items are ordered by id
      // only where no better signal exists -- Execute-time note, not a
      // fabricated timestamp.
      setItems(Object.values(data.work))
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

  const exposed = isNonLoopbackHost(baseUrl)

  return (
    <div className="min-h-svh bg-bg">
      <div data-testid="topbar" className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <button data-testid="back-to-board" onClick={onBack} className="text-sm font-medium text-ink-muted hover:text-brand">
            ← Board
          </button>
          <span className="text-sm font-semibold text-ink">Needs answer · {items?.length ?? 0}</span>
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

      {!loading && items && items.length === 0 && (
        <p data-testid="empty-questions" className="p-6 text-sm text-ink-muted">
          Nothing is waiting on you.
        </p>
      )}

      <div data-testid="list" className="mx-auto max-w-2xl space-y-3 p-6">
        {(items ?? []).map((item) => (
          <div key={item.id} data-testid={`row-${item.id}`} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-ink">
                {item.id} · {item.title}
              </span>
            </div>
            <p data-testid={`tag-${item.id}`} className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
              ASK
            </p>
            <textarea
              data-testid={`answer-input-${item.id}`}
              value={answerDrafts[item.id] ?? ''}
              onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
              disabled={stale}
              className="mt-2 w-full rounded-lg border border-border bg-surface p-2 text-sm text-ink"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button data-testid={`open-${item.id}`} onClick={() => onOpenItem(item.id)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink">
                Open
              </button>
              <button
                data-testid={`answer-submit-${item.id}`}
                onClick={() => submitAnswer(item.id)}
                disabled={!answerDrafts[item.id]?.trim() || stale}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-contrast disabled:cursor-not-allowed disabled:opacity-40"
              >
                Answer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
