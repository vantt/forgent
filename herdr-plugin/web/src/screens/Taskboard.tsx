import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiClient } from '../api/client'
import { GatewayUnreachableError } from '../api/errors'
import { pollStateDigest } from '../api/poll'
import type { WorkItem } from '../api/types'
import { hostOf, isNonLoopbackHost } from '../lib/network'
import { statusColor } from '../lib/status'

// S02 — Taskboard (docs/ui-spec/screens/S02-taskboard.md). Statuses that
// belong in the "needs answer" rail regardless of which group-by is
// active on the board -- a cross-cutting subset, not a board group of its
// own (Layout: the rail is pinned separately from whatever the board is
// currently grouped by).
const NEEDS_ANSWER_STATUSES = new Set(['awaiting-human', 'awaiting-approval'])

const COLLAPSE_STORAGE_PREFIX = 'herdr-taskboard-collapsed:'
// D16 (docs/history/herdr-web-dashboard/CONTEXT.md): group view and
// kanban view are the same status-grouped data, two renderings -- the
// choice is a reading preference, remembered like collapse state.
const VIEW_STORAGE_KEY = 'herdr-taskboard-view'
type BoardView = 'group' | 'kanban'

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

function readBoardView(): BoardView {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'kanban' ? 'kanban' : 'group'
  } catch {
    return 'group'
  }
}

function writeBoardView(view: BoardView): void {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view)
  } catch {
    // best-effort only, same as collapse state.
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
  const [boardView, setBoardView] = useState<BoardView>(readBoardView)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
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

  function switchView(view: BoardView): void {
    setBoardView(view)
    writeBoardView(view)
  }

  // A-S02-013: drag-drop in kanban view runs the SAME one-door-write verb
  // a card's quick action would (moveWork) -- never a client-side status
  // edit. A failed move (e.g. an illegal FSM transition) just leaves the
  // board to refresh from the real state on the next poll tick, same as
  // any other write rejection this screen already doesn't special-case.
  async function dropOnColumn(itemId: string, toStatus: string): Promise<void> {
    setDragOverColumn(null)
    try {
      await client.moveWork(itemId, toStatus)
      await fetchBoard()
    } catch (err) {
      if (err instanceof GatewayUnreachableError) setStale(true)
    }
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

  function ItemCard({ item }: { item: WorkItem }) {
    const color = statusColor(item.status)
    return (
      <div
        data-testid={`card-${item.id}`}
        draggable={boardView === 'kanban'}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
        onClick={() => onSelectItem(item.id)}
        className="group cursor-pointer rounded-lg border border-border bg-surface p-3 shadow-sm transition hover:border-brand/40 hover:shadow"
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="font-mono text-xs text-ink-muted">{item.id}</span>
          <span className="text-ink-muted opacity-0 transition group-hover:opacity-100">⋯</span>
        </div>
        <p className="text-sm font-medium text-ink">{item.title}</p>
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}>
          {item.status}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-bg">
      <div data-testid="topbar" className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <h1 className="font-mono text-lg font-bold text-brand">herdr</h1>
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <span data-testid="gateway-indicator">{hostOf(baseUrl)}</span>
          {exposed && (
            <span
              data-testid="exposure-warning"
              className="rounded-full bg-status-needs-answer-bg px-2.5 py-1 text-xs font-medium text-status-needs-answer"
            >
              ⚠ reachable on network
            </span>
          )}
        </div>
      </div>

      <div data-testid="controls" className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-6 py-3">
        <select
          data-testid="stage-filter"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink"
        >
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          data-testid="risk-filter"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink"
        >
          <option value="">All risks</option>
          {risks.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5" role="group" aria-label="Board view">
          <button
            type="button"
            data-testid="view-toggle-group"
            aria-pressed={boardView === 'group'}
            onClick={() => switchView('group')}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              boardView === 'group' ? 'bg-surface text-brand shadow-sm' : 'text-ink-muted'
            }`}
          >
            ▤ List
          </button>
          <button
            type="button"
            data-testid="view-toggle-kanban"
            aria-pressed={boardView === 'kanban'}
            onClick={() => switchView('kanban')}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              boardView === 'kanban' ? 'bg-surface text-brand shadow-sm' : 'text-ink-muted'
            }`}
          >
            ▥ Board
          </button>
        </div>

        <button
          data-testid="add-item-button"
          onClick={() => setShowAddPlaceholder(true)}
          className="ml-auto rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-dark"
        >
          + Add
        </button>
      </div>

      {stale && (
        <div data-testid="disconnected-banner" className="flex items-center gap-3 bg-danger-bg px-6 py-2 text-sm text-danger">
          Gateway unreachable — showing last known data.
          <button data-testid="retry-button" onClick={retry} className="rounded-md border border-danger px-2 py-0.5 text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div data-testid="loading-skeleton" className="p-6 text-sm text-ink-muted">
          Loading…
        </div>
      )}

      {!loading && allItems.length === 0 && (
        <div data-testid="empty-board" className="p-6 text-sm text-ink-muted">
          No work items yet.
        </div>
      )}

      {!loading && allItems.length > 0 && filtered.length === 0 && (
        <div data-testid="empty-filter" className="flex items-center gap-3 p-6 text-sm text-ink-muted">
          No items match the active filter (stage: {stageFilter || '—'}, risk: {riskFilter || '—'}).
          <button data-testid="clear-filter" onClick={clearFilters} className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">
            Clear filter
          </button>
        </div>
      )}

      <div className="flex items-start gap-6 p-6">
        {boardView === 'group' ? (
          <div data-testid="board" className="flex-1 space-y-4">
            {groups.map(([status, groupItems]) => {
              const color = statusColor(status)
              const collapsed = isGroupCollapsed(status)
              return (
                <div key={status} data-testid={`group-${status}`} className="overflow-hidden rounded-lg border border-border">
                  <h3
                    data-testid={`group-header-${status}`}
                    onClick={() => toggleGroup(status)}
                    className={`flex cursor-pointer items-center gap-2 border-l-4 ${color.barBorder} bg-surface px-4 py-2 text-sm font-semibold text-ink`}
                  >
                    <span>{collapsed ? '▸' : '▾'}</span>
                    {status} · {groupItems.length}
                  </h3>
                  {!collapsed && (
                    <div className="space-y-2 bg-bg p-3">
                      {groupItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div data-testid="board-kanban" className="flex flex-1 gap-4 overflow-x-auto">
            {groups.map(([status, groupItems]) => {
              const color = statusColor(status)
              return (
                <div
                  key={status}
                  data-testid={`kanban-column-${status}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverColumn(status)
                  }}
                  onDragLeave={() => setDragOverColumn((prev) => (prev === status ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain')
                    if (id) dropOnColumn(id, status)
                  }}
                  className={`w-64 shrink-0 overflow-hidden rounded-lg border ${
                    dragOverColumn === status ? 'border-brand' : 'border-border'
                  }`}
                >
                  <h3 className={`border-t-4 ${color.bar} bg-surface px-3 py-2 text-sm font-semibold text-ink`}>
                    {status} · {groupItems.length}
                  </h3>
                  <div className="min-h-[2rem] space-y-2 bg-bg p-2">
                    {groupItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div data-testid="needs-answer-rail" className="w-72 shrink-0 rounded-lg border border-status-needs-answer-bg bg-status-needs-answer-bg/40 p-3">
          <h3 className="mb-2 text-sm font-semibold text-status-needs-answer">Needs answer · {needsAnswer.length}</h3>
          <div className="space-y-2">
            {needsAnswer.map((item) => (
              <div
                key={item.id}
                data-testid={`rail-item-${item.id}`}
                onClick={() => (onOpenNeedsAnswer ? onOpenNeedsAnswer() : onSelectItem(item.id))}
                className="cursor-pointer rounded-lg border border-border bg-surface p-2.5 text-sm shadow-sm"
              >
                <span className="font-mono text-xs text-ink-muted">{item.id}</span>
                <p className="text-ink">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filtersActive && (
        <div className="px-6 pb-4">
          <button data-testid="clear-filters-controls" onClick={clearFilters} className="rounded-md border border-border px-2 py-1 text-xs font-medium">
            Clear filters
          </button>
        </div>
      )}

      {showAddPlaceholder && (
        // M03 (docs/ui-spec/modals/M03-add-edit-item.md) is not owned by
        // any item in this cluster's current run -- see plan.md's own
        // "NẮN LẠI P3 tsk-5jr" section. A minimal placeholder keeps
        // A-S02-002 a real interaction instead of a dead button.
        <div data-testid="add-item-placeholder" role="dialog" className="fixed inset-0 flex items-center justify-center bg-ink/20">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            Add item — coming soon.
            <button data-testid="add-item-placeholder-close" onClick={() => setShowAddPlaceholder(false)} className="ml-3 rounded-md border border-border px-2 py-1 text-xs font-medium">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
