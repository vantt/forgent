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
    <div>
      <div data-testid="topbar">
        <button data-testid="back-to-board" onClick={onBack}>
          ← Board
        </button>
        <span>Needs answer · {items?.length ?? 0}</span>
        {exposed && <span data-testid="exposure-warning">⚠ reachable on network</span>}
        <span data-testid="gateway-indicator">{hostOf(baseUrl)}</span>
      </div>

      {stale && (
        <div data-testid="disconnected-banner">
          Gateway unreachable — showing last known data.
          <button
            data-testid="retry-button"
            onClick={() => {
              setLoading(true)
              fetchList()
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && <div data-testid="loading-skeleton">Loading…</div>}

      {!loading && items && items.length === 0 && (
        <p data-testid="empty-questions">Nothing is waiting on you.</p>
      )}

      <div data-testid="list">
        {(items ?? []).map((item) => (
          <div key={item.id} data-testid={`row-${item.id}`}>
            <p>
              {item.id} · {item.title}
            </p>
            <p data-testid={`tag-${item.id}`}>ASK</p>
            <textarea
              data-testid={`answer-input-${item.id}`}
              value={answerDrafts[item.id] ?? ''}
              onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
              disabled={stale}
            />
            <button
              data-testid={`answer-submit-${item.id}`}
              onClick={() => submitAnswer(item.id)}
              disabled={!answerDrafts[item.id]?.trim() || stale}
            >
              Answer
            </button>
            <button data-testid={`open-${item.id}`} onClick={() => onOpenItem(item.id)}>
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
