// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../api/client'
import { Taskboard } from './Taskboard'

function envelope(data: unknown) {
  return { contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h1', data }
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function workItem(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: 'tsk-1', title: 'Do the thing', kind: 'task', status: 'todo', stage: 'executing', risk: 'standard', ...overrides }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

beforeEach(() => {
  window.localStorage.clear()
})

describe('Taskboard', () => {
  it('shows the loading skeleton, then the board once data lands', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy()
    await waitFor(() => expect(screen.queryByTestId('loading-skeleton')).toBeNull())
    expect(screen.getByTestId('card-tsk-1')).toBeTruthy()
  })

  it('shows ST-EMPTY-BOARD when there are no work items at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: {} })))))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)

    await waitFor(() => expect(screen.getByTestId('empty-board')).toBeTruthy())
  });

  it('shows ST-EMPTY-FILTER (distinct from ST-EMPTY-BOARD) when items exist but the filter matches none', async () => {
    // Two items whose (stage, risk) pairs never intersect -- selecting
    // stage=executing AND risk=high-risk uses only REAL option values
    // (both appear in the select's own <option> list) yet matches neither
    // item, proving a genuine empty-intersection case rather than picking
    // an out-of-range value a native <select> would just reject.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse(
            envelope({
              work: {
                'tsk-1': workItem({ id: 'tsk-1', stage: 'executing', risk: 'standard' }),
                'tsk-2': workItem({ id: 'tsk-2', stage: 'planning', risk: 'high-risk' }),
              },
            }),
          ),
        ),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())

    fireEvent.change(screen.getByTestId('stage-filter'), { target: { value: 'executing' } })
    fireEvent.change(screen.getByTestId('risk-filter'), { target: { value: 'high-risk' } })

    expect(screen.getByTestId('empty-filter')).toBeTruthy()
    expect(screen.queryByTestId('empty-board')).toBeNull()
    expect(screen.queryByTestId('card-tsk-1')).toBeNull()
    expect(screen.queryByTestId('card-tsk-2')).toBeNull()
  })

  it('an awaiting-human item appears in the needs-answer rail AND in its own status group on the board', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(jsonResponse(envelope({ work: { 'tsk-4id': workItem({ id: 'tsk-4id', status: 'awaiting-human' }) } }))),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)

    await waitFor(() => expect(screen.getByTestId('rail-item-tsk-4id')).toBeTruthy())
    expect(screen.getByTestId('card-tsk-4id')).toBeTruthy()
    expect(screen.getByTestId('group-awaiting-human')).toBeTruthy()
  })

  it('group header click collapses the group and hides its cards', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())

    fireEvent.click(screen.getByTestId('group-header-todo'))
    expect(screen.queryByTestId('card-tsk-1')).toBeNull()

    fireEvent.click(screen.getByTestId('group-header-todo'))
    expect(screen.getByTestId('card-tsk-1')).toBeTruthy()
  })

  it('collapse state is remembered across remounts (localStorage)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const { unmount } = render(
      <Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />,
    )
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())
    fireEvent.click(screen.getByTestId('group-header-todo'))
    expect(screen.queryByTestId('card-tsk-1')).toBeNull()
    unmount()

    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('group-header-todo')).toBeTruthy())
    expect(screen.queryByTestId('card-tsk-1')).toBeNull()
  })

  it('clicking a card calls onSelectItem with the item id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const onSelectItem = vi.fn()
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={onSelectItem} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())

    fireEvent.click(screen.getByTestId('card-tsk-1'))
    expect(onSelectItem).toHaveBeenCalledWith('tsk-1')
  })

  it('ST-DISCONNECTED: a network failure marks the board stale WITHOUT clearing existing data, and retry recovers it', async () => {
    let fetchesShouldFail = false
    const fetchMock = vi.fn().mockImplementation(() => {
      if (fetchesShouldFail) return Promise.reject(new TypeError('Failed to fetch'))
      return Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))
    })
    vi.stubGlobal('fetch', fetchMock)
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    // Short interval so the poll tick (which drives the failure below)
    // reliably fires within this test's own timeout.
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={20} />)
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())
    expect(screen.queryByTestId('disconnected-banner')).toBeNull()

    fetchesShouldFail = true
    // The next poll tick's own digest fetch now fails -- pollStateDigest
    // itself throws GatewayUnreachableError, caught in the interval's own
    // .catch, which flips `stale` without ever calling fetchBoard again.
    await waitFor(() => expect(screen.getByTestId('disconnected-banner')).toBeTruthy(), { timeout: 3000 })
    expect(screen.getByTestId('card-tsk-1')).toBeTruthy()

    fetchesShouldFail = false
    fireEvent.click(screen.getByTestId('retry-button'))
    await waitFor(() => expect(screen.queryByTestId('disconnected-banner')).toBeNull())
    expect(screen.getByTestId('card-tsk-1')).toBeTruthy()
  })

  it('exposure warning shows for a non-loopback baseUrl and not for a loopback one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: {} })))))
    const localClient = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const { unmount } = render(
      <Taskboard client={localClient} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />,
    )
    await waitFor(() => expect(screen.getByTestId('empty-board')).toBeTruthy())
    expect(screen.queryByTestId('exposure-warning')).toBeNull()
    unmount()

    const lanClient = createApiClient({ baseUrl: 'http://192.168.1.5:4170/v1', token: 't' })
    render(<Taskboard client={lanClient} baseUrl="http://192.168.1.5:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('exposure-warning')).toBeTruthy())
  })

  it('the +Add button opens a placeholder overlay (M03 is not this item\'s scope)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: {} })))))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('empty-board')).toBeTruthy())

    expect(screen.queryByTestId('add-item-placeholder')).toBeNull()
    fireEvent.click(screen.getByTestId('add-item-button'))
    expect(screen.getByTestId('add-item-placeholder')).toBeTruthy()
  })

  it('polling with an unchanged digest does not re-fetch listWork', async () => {
    let listWorkCalls = 0
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/state/digest')) {
        return Promise.resolve(
          jsonResponse({ contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'same-hash' }),
        )
      }
      listWorkCalls += 1
      return Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))
    })
    vi.stubGlobal('fetch', fetchMock)
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={10} />)
    await waitFor(() => expect(listWorkCalls).toBe(1))

    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(listWorkCalls).toBe(1)
  })

  it('D16: view toggle switches between group view (default) and kanban view, and remembers the choice', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const { unmount } = render(
      <Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />,
    )
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())
    expect(screen.getByTestId('board')).toBeTruthy()
    expect(screen.queryByTestId('board-kanban')).toBeNull()

    fireEvent.click(screen.getByTestId('view-toggle-kanban'))
    expect(screen.queryByTestId('board')).toBeNull()
    expect(screen.getByTestId('board-kanban')).toBeTruthy()
    expect(screen.getByTestId('kanban-column-todo')).toBeTruthy()
    expect(screen.getByTestId('card-tsk-1')).toBeTruthy()
    unmount()

    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('board-kanban')).toBeTruthy())

    fireEvent.click(screen.getByTestId('view-toggle-group'))
    expect(screen.getByTestId('board')).toBeTruthy()
  })

  it('D16/A-S02-013: dropping a card on a kanban column runs the one-door-write move verb and refetches the board', async () => {
    let moveCalls = 0
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/move')) {
        moveCalls += 1
        expect(JSON.parse(init!.body as string)).toEqual({ to: 'doing' })
        return Promise.resolve(jsonResponse(envelope(workItem({ status: 'doing' }))))
      }
      return Promise.resolve(
        jsonResponse(
          envelope({ work: { 'tsk-1': workItem(), 'tsk-2': workItem({ id: 'tsk-2', status: 'doing' }) } }),
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('card-tsk-1')).toBeTruthy())
    fireEvent.click(screen.getByTestId('view-toggle-kanban'))
    await waitFor(() => expect(screen.getByTestId('kanban-column-doing')).toBeTruthy())

    const dataTransfer = { data: {} as Record<string, string>, setData(k: string, v: string) { this.data[k] = v }, getData(k: string) { return this.data[k] } }
    fireEvent.dragStart(screen.getByTestId('card-tsk-1'), { dataTransfer })
    fireEvent.drop(screen.getByTestId('kanban-column-doing'), { dataTransfer })

    await waitFor(() => expect(moveCalls).toBe(1))
  })

  it('polling with a changed digest re-fetches listWork exactly once per change', async () => {
    let listWorkCalls = 0
    let digestCalls = 0
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/state/digest')) {
        digestCalls += 1
        const hash = digestCalls === 1 ? 'h1' : 'h2'
        return Promise.resolve(
          jsonResponse({ contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: hash }),
        )
      }
      listWorkCalls += 1
      return Promise.resolve(jsonResponse(envelope({ work: { 'tsk-1': workItem() } })))
    })
    vi.stubGlobal('fetch', fetchMock)
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<Taskboard client={client} baseUrl="http://localhost:4170/v1" onSelectItem={() => {}} pollIntervalMs={10} />)
    await waitFor(() => expect(listWorkCalls).toBe(1))

    await waitFor(() => expect(listWorkCalls).toBe(2), { timeout: 2000 })
  })
})
