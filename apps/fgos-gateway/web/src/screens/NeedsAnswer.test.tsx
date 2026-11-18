// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../api/client'
import { NeedsAnswer } from './NeedsAnswer'

function envelope(data: unknown) {
  return { contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h1', data }
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

const storeRow = {
  id: 'q-abc',
  state: 'open',
  headline: 'Ship the store first?',
  blocks: 'phase 8',
  stage: 'plan',
  ref: 'plans/p/plan.md',
  askedAt: '2026-08-15T00:00:00Z',
  age: '2h',
  asker: { handle: 'planner', roles: [] },
  recommended: 'B',
}

const detail = {
  question: {
    state: 'open',
    asked: {
      id: 'q-abc',
      headline: 'Ship the store first?',
      blocks: 'phase 8',
      parts: {
        what: 'The store is half built',
        cause: 'Two phases overlap',
        options: [
          { label: 'A', does: 'ship now', gain: 'speed', harm: 'risk', cost: '1d' },
          { label: 'B', does: 'wait', gain: 'safety', harm: 'delay', cost: '2d', recommended: true },
        ],
        recommendation: 'B',
        scope: { allows: 'phase 8', forbids: 'phase 9' },
      },
    },
  },
}

const list = {
  needsYou: 3,
  questions: [storeRow],
  work: {
    asks: [{ ref: 'work:tsk-4id', title: 'Task detail pairing', question: 'which?', answerDoor: 'fgos answer tsk-4id' }],
    gates: [{ ref: 'workflow:r1#s1', question: 'approve?', answerDoor: 'fgos workflow answer r1 s1' }],
  },
}

function stubGateway(onAnswer?: (url: string, init?: RequestInit) => Response, listBody: unknown = list) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/answer') && onAnswer) return Promise.resolve(onAnswer(url, init))
      if (url.endsWith('/questions/q-abc')) return Promise.resolve(jsonResponse(envelope(detail)))
      if (url.endsWith('/questions')) return Promise.resolve(jsonResponse(envelope(listBody)))
      return Promise.resolve(jsonResponse(envelope({})))
    }),
  )
}

function renderScreen(onOpenItem: (id: string) => void = () => {}) {
  const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
  render(<NeedsAnswer client={client} baseUrl="http://localhost:4170/v1" onOpenItem={onOpenItem} onBack={() => {}} />)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('NeedsAnswer (S04: store questions, ask items and gates from /v1/questions)', () => {
  it('ST-EMPTY-QUESTIONS: reads as the good outcome when nothing is waiting', async () => {
    stubGateway(undefined, { needsYou: 0, questions: [], work: { asks: [], gates: [] } })
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('empty-questions').textContent).toBe('Nothing is waiting on you.'))
  })

  it('shows all three groups once each, with the needs-you count', async () => {
    stubGateway()
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('row-q-abc')).toBeTruthy())
    expect(screen.getAllByTestId(/^row-/)).toHaveLength(3)
    expect(screen.getByTestId('tag-q-abc').textContent).toBe('QUESTION')
    expect(screen.getByTestId('tag-tsk-4id').textContent).toBe('ASK')
    expect(screen.getByTestId('tag-workflow:r1#s1').textContent).toBe('GATE')
    expect(screen.getByTestId('door-workflow:r1#s1').textContent).toBe('fgos workflow answer r1 s1')
    expect(screen.getByText('Needs answer · 3')).toBeTruthy()
    expect(screen.getByTestId('recommended-q-abc').textContent).toContain('Recommended: B')
  })

  it('expanding a store question shows the five parts and preselects the recommended option', async () => {
    stubGateway()
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('detail-q-abc')).toBeTruthy())
    expect((screen.getByTestId('option-q-abc-B') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('option-q-abc-A') as HTMLInputElement).checked).toBe(false)
    expect(screen.getByTestId('detail-q-abc').textContent).toContain('cost: 2d')
  })

  it('answering a store question posts the picked option and the note to the question answer route', async () => {
    let body: unknown
    let answeredUrl = ''
    stubGateway((url, init) => {
      answeredUrl = url
      body = JSON.parse(String(init?.body))
      return jsonResponse(envelope({ id: 'q-abc', state: 'answered' }))
    })
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('question-submit-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('option-q-abc-A'))
    fireEvent.change(screen.getByTestId('note-q-abc'), { target: { value: 'because' } })
    fireEvent.click(screen.getByTestId('question-submit-q-abc'))
    await waitFor(() => expect(body).toEqual({ option: 'A', text: 'because' }))
    expect(answeredUrl.endsWith('/questions/q-abc/answer')).toBe(true)
  })

  it('an ask item answers through the existing work answer route and Open navigates by its work id', async () => {
    let answeredUrl = ''
    stubGateway((url) => {
      answeredUrl = url
      return jsonResponse(envelope({}))
    })
    const onOpenItem = vi.fn()
    renderScreen(onOpenItem)
    await waitFor(() => expect(screen.getByTestId('answer-input-tsk-4id')).toBeTruthy())
    fireEvent.change(screen.getByTestId('answer-input-tsk-4id'), { target: { value: 'the answer' } })
    fireEvent.click(screen.getByTestId('answer-submit-tsk-4id'))
    await waitFor(() => expect(answeredUrl.endsWith('/work/tsk-4id/answer')).toBe(true))
    fireEvent.click(screen.getByTestId('open-tsk-4id'))
    expect(onOpenItem).toHaveBeenCalledWith('tsk-4id')
  })

  it('ST-DISCONNECTED: a network failure shows the disconnected banner, and retry recovers', async () => {
    let shouldFail = true
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        if (shouldFail) return Promise.reject(new TypeError('Failed to fetch'))
        return Promise.resolve(jsonResponse(envelope(list)))
      }),
    )
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('disconnected-banner')).toBeTruthy())

    shouldFail = false
    fireEvent.click(screen.getByTestId('retry-button'))
    await waitFor(() => expect(screen.getByTestId('row-q-abc')).toBeTruthy())
    expect(screen.queryByTestId('disconnected-banner')).toBeNull()
  })
})
