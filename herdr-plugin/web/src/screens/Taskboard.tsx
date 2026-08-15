import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiClient } from '../api/client'
import { GatewayUnreachableError } from '../api/errors'
import { pollStateDigest } from '../api/poll'
import type { WorkItem } from '../api/types'
import { hostOf, isNonLoopbackHost } from '../lib/network'

// S02 — Taskboard (docs/ui-spec/screens/S02-taskboard.md). Statuses that
// belong in the "needs answer" rail regardless of which group-by is
// active on the board -- a cross-cutting subset, not a board group of its
// own (Layout: the rail is pinned separately from whatever the board is
// currently grouped by).
const NEEDS_ANSWER_STATUSES = new Set(['awaiting-human', 'awaiting-approval'])

const COLLAPSE_STORAGE_PREFIX = 'herdr-taskboard-collapsed:'

function readCollapsed(group: string): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_PREFIX + group) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(group: string, collapsed: boolean): void {
  try {
    if (collapsed) window.localStorage.setItem(COLLAPSE_STORAGE_PREFIX + group, '1')
    else window.localStorage.removeItem(COLLAPSE_STORAGE_PREFIX + group)
  } catch {
    // best-effort only -- a person losing remembered collapse state across
    // reloads is not worth failing the board over.
  }
}

function isPresent(value: string | undefined): value is string {
  return value !== undefined && value !== '';
}

export interface TaskboardProps {
  client: ApiClient
  baseUrl: string
  onSelectItem: (id: string) => void
  // A-S02-006 (S02-taskboard.md): a rail entry click navigates to S04
  // (the needs-answer LIST), not directly to S03 -- optional, falling
  // back to `onSelectItem` when unset, so a caller not yet wired for S04
  // (or an existing test) keeps its prior behavior unchanged.
  onOpenNeedsAnswer?: () => void
  pollIntervalMs?: number
}

export function Taskboard({ client, baseUrl, onSelectItem, onOpenNeedsAnswer, pollIntervalMs = 5000 }: TaskboardProps) {
  const [items, setItems] = useState<Record<string, WorkItem> | null>(null)
  const [loading, setLoading] = useState(true)
  // ST-DISCONNECTED (area spec Edge Cases / 30-states-and-errors.md):
  // gateway unreachable marks existing data stale IN PLACE -- `items`
  // itself is never cleared on a failed fetch.
  const [stale, setStale] = useState(false)
  const [stageFilter, setStageFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [collapsedOverrides, setCollapsedOverrides] = useState<Record<string, boolean>>({})
  const [showAddPlaceholder, setShowAddPlaceholder] = useState(false)
  const lastDigestRef = useRef<string | undefined>(undefined)

  async function fetchBoard(): Promise<void> {
    try {
      const data = await client.listWork({ all: true })
      setItems(data.work)
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
    fetchBoard()
    // Seed the digest baseline so the FIRST scheduled poll tick can
    // correctly detect "unchanged" -- pollStateDigest's own contract
    // treats an undefined previous hash as always-changed (there is
    // nothing to compare against yet), which is right for a caller that
    // has never polled before but wrong here: fetchBoard() above already
    // loaded the current data, so the first tick must compare against
    // THIS moment's digest, not treat itself as the first poll ever.
    client
      .stateDigest()
      .then((digest) => {
        if (!cancelled) lastDigestRef.current = digest.data_hash
      })
      .catch(() => {
        // A failed seed just means the first real tick falls back to
        // pollStateDigest's own always-changed default -- one possibly
        // redundant refetch, never a crash.
      })
    const interval = setInterval(() => {
      pollStateDigest(client, lastDigestRef.current)
        .then((result) => {
          if (cancelled) return
          lastDigestRef.current = result.dataHash
          if (result.changed) return fetchBoard()
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
  }, [client, pollIntervalMs])

  function retry(): void {
    setLoading(true)
    fetchBoard()
  }

  function toggleGroup(group: string): void {
    setCollapsedOverrides((prev) => {
      const current = prev[group] ?? readCollapsed(group)
      const next = { ...prev, [group]: !current }
      writeCollapsed(group, next[group])
      return next
    })
  }

  function isGroupCollapsed(group: string): boolean {
    return collapsedOverrides[group] ?? readCollapsed(group)
  }

  function clearFilters(): void {
    setStageFilter('')
    setRiskFilter('')
  }

  const allItems = useMemo(() => (items ? Object.values(items) : []), [items])

  const needsAnswer = useMemo(() => allItems.filter((item) => NEEDS_ANSWER_STATUSES.has(item.status)), [allItems]);

  const filtered = useMemo(
    () => allItems.filter((item) => (!stageFilter || item.stage === stageFilter) && (!riskFilter || item.risk === riskFilter)),
    [allItems, stageFilter, riskFilter],
  )

  const groups = useMemo(() => {
    const byStatus = new Map<string, WorkItem[]>()
    for (const item of filtered) {
      const bucket = byStatus.get(item.status) ?? []
      bucket.push(item)
      byStatus.set(item.status, bucket)
    }
    return [...byStatus.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const stages = useMemo(() => [...new Set(allItems.map((i) => i.stage).filter(isPresent))], [allItems])
  const risks = useMemo(() => [...new Set(allItems.map((i) => i.risk).filter(isPresent))], [allItems])

  const exposed = isNonLoopbackHost(baseUrl)
  const filtersActive = stageFilter !== '' || riskFilter !== ''

  return (
    <div>
      <div data-testid="topbar">
        <span data-testid="gateway-indicator">{hostOf(baseUrl)}</span>
        {exposed && <span data-testid="exposure-warning">⚠ reachable on network</span>}
      </div>

      <div data-testid="controls">
        <select data-testid="stage-filter" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select data-testid="risk-filter" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="">All risks</option>
          {risks.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button data-testid="add-item-button" onClick={() => setShowAddPlaceholder(true)}>
          + Add
        </button>
      </div>

      {stale && (
        <div data-testid="disconnected-banner">
          Gateway unreachable — showing last known data.
          <button data-testid="retry-button" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {loading && <div data-testid="loading-skeleton">Loading…</div>}

      {!loading && allItems.length === 0 && <div data-testid="empty-board">No work items yet.</div>}

      {!loading && allItems.length > 0 && filtered.length === 0 && (
        <div data-testid="empty-filter">
          No items match the active filter (stage: {stageFilter || '—'}, risk: {riskFilter || '—'}).
          <button data-testid="clear-filter" onClick={clearFilters}>
            Clear filter
          </button>
        </div>
      )}

      <div data-testid="needs-answer-rail">
        <h3>Needs answer · {needsAnswer.length}</h3>
        {needsAnswer.map((item) => (
          <div
            key={item.id}
            data-testid={`rail-item-${item.id}`}
            onClick={() => (onOpenNeedsAnswer ? onOpenNeedsAnswer() : onSelectItem(item.id))}
          >
            {item.id} — {item.title}
          </div>
        ))}
      </div>

      <div data-testid="board">
        {groups.map(([status, groupItems]) => (
          <div key={status} data-testid={`group-${status}`}>
            <h3 data-testid={`group-header-${status}`} onClick={() => toggleGroup(status)}>
              {status} · {groupItems.length}
            </h3>
            {!isGroupCollapsed(status) &&
              groupItems.map((item) => (
                <div key={item.id} data-testid={`card-${item.id}`} onClick={() => onSelectItem(item.id)}>
                  {item.id} — {item.title}
                </div>
              ))}
          </div>
        ))}
      </div>

      {filtersActive && (
        <button data-testid="clear-filters-controls" onClick={clearFilters}>
          Clear filters
        </button>
      )}

      {showAddPlaceholder && (
        // M03 (docs/ui-spec/modals/M03-add-edit-item.md) is not owned by
        // any item in this cluster's current run -- see plan.md's own
        // "NẮN LẠI P3 tsk-5jr" section. A minimal placeholder keeps
        // A-S02-002 a real interaction instead of a dead button.
        <div data-testid="add-item-placeholder" role="dialog">
          Add item — coming soon.
          <button data-testid="add-item-placeholder-close" onClick={() => setShowAddPlaceholder(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}
