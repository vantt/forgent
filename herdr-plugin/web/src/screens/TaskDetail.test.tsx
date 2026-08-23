// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../api/client'
import { pairTimeline, TaskDetail } from './TaskDetail'

function envelope(data: unknown) {
  return { contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h1', data }
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

function workDetail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    work: { id: 'tsk-4id', title: 'Task detail', kind: 'task', status: 'todo', stage: 'executing', risk: 'heavy' },
    gates: {},
    decisions: [],
    settlement: { count: 0, recent: [] },
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('pairTimeline (R9: positional pairing, never a fabricated link)', () => {
  it('pairs each question with the newest-available answer, working backward', () => {
    const askHistory = ['round1 q', 'round2 q', 'round3 q']
    const settlementRecent = [
      { kind: 'answer', role: 'human', ts: 't3', detail: 'round3 a', id: 'x' },
      { kind: 'answer', role: 'human', ts: 't2', detail: 'round2 a', id: 'x' },
      { kind: 'answer', role: 'human', ts: 't1', detail: 'round1 a', id: 'x' },
    ]
    const rounds = pairTimeline(askHistory, settlementRecent, false)
    expect(rounds).toEqual([
      { question: 'round1 q', answer: 'round1 a' },
      { question: 'round2 q', answer: 'round2 a' },
      { question: 'round3 q', answer: 'round3 a' },
    ])
  })

  it('the still-open round (no matching answer) renders answer: null, never fabricated text', () => {
    const askHistory = ['round1 q', 'round2 q']
    const settlementRecent = [{ kind: 'answer', role: 'human', ts: 't1', detail: 'round1 a', id: 'x' }]
    const rounds = pairTimeline(askHistory, settlementRecent, true)
    expect(rounds).toEqual([
      { question: 'round1 q', answer: 'round1 a' },
      { question: 'round2 q', answer: null },
    ])
  })

  it('a round older than the 5-answer cap has no answer available, never invented', () => {
    const askHistory = Array.from({ length: 7 }, (_, i) => `q${i}`)
    // Only 5 most-recent answers available (SETTLEMENT_DISPLAY_CAP), newest-first.
    const settlementRecent = [6, 5, 4, 3, 2].map((i) => ({ kind: 'answer', role: 'human', ts: `t${i}`, detail: `a${i}`, id: 'x' }))
    const rounds = pairTimeline(askHistory, settlementRecent, false)
    expect(rounds[0]).toEqual({ question: 'q0', answer: null })
    expect(rounds[1]).toEqual({ question: 'q1', answer: null })
    expect(rounds[6]).toEqual({ question: 'q6', answer: 'a6' })
  })

  it('ignores non-answer settlement entries (e.g. close) when pairing', () => {
    const askHistory = ['q1']
    const settlementRecent = [
      { kind: 'close', role: 'human', ts: 't2', detail: null, id: 'x' },
      { kind: 'answer', role: 'human', ts: 't1', detail: 'a1', id: 'x' },
    ]
    expect(pairTimeline(askHistory, settlementRecent, false)).toEqual([{ question: 'q1', answer: 'a1' }])
  })

  it('handles no history at all', () => {
    expect(pairTimeline(undefined, undefined, false)).toEqual([])
  })
})

describe('TaskDetail', () => {
  it('ST-NEVER-PARKED: shows the quiet message when askHistory is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(jsonResponse(envelope(workDetail())))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('never-parked')).toBeTruthy())
  })

  it('D17: CONTEXT renders the real WorkItem fields (description/verify/footprint/docsRef/deps/tier) when present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(
        jsonResponse(
          envelope(
            workDetail({
              work: {
                id: 'tsk-4id',
                title: 'Task detail pairing',
                kind: 'task',
                status: 'todo',
                domain: 'coding',
                tier: '2',
                deps: ['tsk-yo0', 'tsk-5jr'],
                description: 'A person with no context should be able to answer quickly.',
                verify: 'cargo test --lib gateway',
                footprint: ['gateway.rs', 'TaskDetail.tsx'],
                docsRef: 'docs/history/tsk-4id',
              },
            }),
          ),
        ),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('item-summary')).toBeTruthy())

    expect(screen.getByTestId('item-meta').textContent).toBe('coding · tier-2 · deps: tsk-yo0, tsk-5jr')
    expect(screen.getByTestId('item-description').textContent).toBe('A person with no context should be able to answer quickly.')
    expect(screen.getByTestId('item-verify').textContent).toBe('verify: cargo test --lib gateway')
    expect(screen.getByTestId('item-footprint').textContent).toBe('footprint: gateway.rs, TaskDetail.tsx')
    expect(screen.getByTestId('item-docs-link').textContent).toBe('docs/history/tsk-4id ↗')
  })

  it('D17: a field absent from the real WorkItem renders no row -- never a fabricated placeholder', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(jsonResponse(envelope(workDetail())))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('item-summary')).toBeTruthy())

    expect(screen.queryByTestId('item-meta')).toBeNull()
    expect(screen.queryByTestId('item-description')).toBeNull()
    expect(screen.queryByTestId('item-verify')).toBeNull()
    expect(screen.queryByTestId('item-footprint')).toBeNull()
    expect(screen.queryByTestId('item-docs-link')).toBeNull()
  })

  it('shows the current question and answer input when the item is parked (awaiting-human)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(
        jsonResponse(
          envelope(
            workDetail({
              work: { id: 'tsk-4id', title: 'x', kind: 'task', status: 'awaiting-human' },
              gates: { askHistory: ['q1', 'q2'], ask: 'q2' },
            }),
          ),
        ),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('current-question')).toBeTruthy())
    expect(screen.getByTestId('current-question').textContent).toBe('q2')
    expect(screen.getByTestId('needs-answer-badge').textContent).toContain('round 2 of 2')
  })

  it('submitting an answer calls the real answerWork API and refetches', async () => {
    let answerCalled = false
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      if (url.endsWith('/answer')) {
        answerCalled = true
        expect(JSON.parse(init!.body as string)).toEqual({ text: 'my answer' })
        return Promise.resolve(jsonResponse(envelope(workDetail())))
      }
      return Promise.resolve(
        jsonResponse(
          envelope(
            workDetail({
              work: { id: 'tsk-4id', title: 'x', kind: 'task', status: 'awaiting-human' },
              gates: { askHistory: ['q1'], ask: 'q1' },
            }),
          ),
        ),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('answer-input')).toBeTruthy())

    fireEvent.change(screen.getByTestId('answer-input'), { target: { value: 'my answer' } })
    fireEvent.click(screen.getByTestId('answer-submit'))
    await waitFor(() => expect(answerCalled).toBe(true))
  })

  it('renders What the agent did from real CONTEXT.md/plan.md content, and machine log stays collapsed until clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) {
        return Promise.resolve(
          jsonResponse(envelope({ docsRef: 'docs/history/x/', contextMd: 'real context text', planMd: null })),
        )
      }
      return Promise.resolve(
        jsonResponse(envelope(workDetail({ decisions: [{ text: 'D1: something', source: 's', id: 'x', ts: 't' }] }))),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('context-md').textContent).toBe('real context text'))

    expect(screen.queryByTestId('machine-log')).toBeNull()
    fireEvent.click(screen.getByTestId('machine-log-disclosure'))
    expect(screen.getByTestId('machine-log').textContent).toContain('D1: something')
  })

  it('ST-NARRATIVE-MISSING: names the path it looked for, without failing the screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) {
        return Promise.resolve(
          jsonResponse(envelope({ docsRef: 'docs/history/gone/', contextMd: null, planMd: null, narrativeMissing: true })),
        )
      }
      return Promise.resolve(jsonResponse(envelope(workDetail())))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('narrative-missing').textContent).toContain('docs/history/gone/'))
  })

  it('shows completed gate-approve history (D15) -- never a pending question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(
        jsonResponse(
          envelope(workDetail({ gates: { validateApprove: { actor: 'human', at: '2026-08-15T00:00:00Z', verify: 'npm test' } } })),
        ),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('gate-history-validateApprove')).toBeTruthy())
    expect(screen.getByTestId('gate-history-validateApprove').textContent).toContain('human')
  })

  it('R7: Approve merge is disabled unless the item is awaiting-approval', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(jsonResponse(envelope(workDetail({ work: { id: 'tsk-4id', title: 'x', kind: 'task', status: 'todo' } }))))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('action-approve-merge')).toBeTruthy())
    expect((screen.getByTestId('action-approve-merge') as HTMLButtonElement).disabled).toBe(true)
  })

  it('R7: a real Approve merge failure surfaces the engine reason verbatim, never hidden', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      if (url.endsWith('/approve')) {
        return Promise.resolve(jsonResponse({ category: 'precondition', message: 'approve refuses outside the main working tree' }, { status: 412 }))
      }
      return Promise.resolve(
        jsonResponse(envelope(workDetail({ work: { id: 'tsk-4id', title: 'x', kind: 'task', status: 'awaiting-approval' } }))),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('action-approve-merge')).toBeTruthy())

    fireEvent.click(screen.getByTestId('action-approve-merge'))
    await waitFor(() => expect(screen.getByTestId('approve-error').textContent).toBe('approve refuses outside the main working tree'))
  })

  it('Retire calls the real move-to-wontfix API', async () => {
    let moveArgs: unknown = null
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      if (url.endsWith('/move')) {
        moveArgs = JSON.parse(init!.body as string)
        return Promise.resolve(jsonResponse(envelope(workDetail())))
      }
      return Promise.resolve(jsonResponse(envelope(workDetail())))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('action-retire')).toBeTruthy())

    fireEvent.click(screen.getByTestId('action-retire'))
    await waitFor(() => expect(moveArgs).toEqual({ to: 'wontfix', expect: undefined }))
  })

  it('Edit opens a placeholder overlay (M03 is not this item\'s scope)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(jsonResponse(envelope(workDetail())))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={() => {}} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('action-edit')).toBeTruthy())

    expect(screen.queryByTestId('edit-placeholder')).toBeNull()
    fireEvent.click(screen.getByTestId('action-edit'))
    expect(screen.getByTestId('edit-placeholder')).toBeTruthy()
  })

  it('back button calls onBack', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/docs')) return Promise.resolve(jsonResponse(envelope({ docsRef: null, contextMd: null, planMd: null })))
      return Promise.resolve(jsonResponse(envelope(workDetail())))
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const onBack = vi.fn()
    render(<TaskDetail client={client} baseUrl="http://localhost:4170/v1" itemId="tsk-4id" onBack={onBack} pollIntervalMs={999999} />)
    await waitFor(() => expect(screen.getByTestId('back-to-board')).toBeTruthy())
    fireEvent.click(screen.getByTestId('back-to-board'))
    expect(onBack).toHaveBeenCalled()
  })
})
