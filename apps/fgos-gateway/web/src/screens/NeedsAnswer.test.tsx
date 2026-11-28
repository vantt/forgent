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

// A question whose options are written out, one of them already carrying its own letter, and which states what the
// asker does if no answer comes.
const letteredDetail = {
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
          { label: 'Ship the store now', does: 'ship now', gain: 'speed', harm: 'risk', cost: '1d' },
          { label: 'Wait for phase 9', does: 'wait', gain: 'safety', harm: 'delay', cost: '2d', recommended: true },
          { label: 'C. Cancel the phase', does: 'stop', gain: 'calm', harm: 'slip', cost: '3d' },
        ],
        recommendation: 'Wait for phase 9',
        default: 'wait until phase 9 opens, then ship',
        scope: { allows: 'phase 8', forbids: 'phase 9' },
      },
    },
  },
}

// A question whose recommended option is written second and whose labels both carry a hand letter, so the letter of a
// place on screen differs from the letter the asker wrote.
const handLetteredDetail = {
  question: {
    state: 'open',
    asked: {
      id: 'q-abc',
      headline: 'Who carries the release?',
      blocks: 'phase 8',
      parts: {
        what: 'Nobody holds the release yet',
        cause: 'Two owners stepped back',
        options: [
          { label: 'A. Wait for Keeper', does: 'wait', gain: 'safety', harm: 'delay', cost: '2d' },
          { label: 'B. Keeper carries', does: 'carry', gain: 'speed', harm: 'risk', cost: '1d', recommended: true },
        ],
        recommendation: 'Keeper carries',
        scope: { allows: 'phase 8', forbids: 'phase 9' },
      },
    },
  },
}

const handLetteredRow = {
  ...storeRow,
  headline: 'Who carries the release?',
  recommended: 'B. Keeper carries',
}

const list = {
  needsYou: 3,
  questions: [storeRow],
  work: {
    asks: [{ ref: 'work:tsk-4id', title: 'Task detail pairing', question: 'which?', answerDoor: 'fgos answer tsk-4id' }],
    gates: [{ ref: 'workflow:r1#s1', question: 'approve?', answerDoor: 'fgos workflow answer r1 s1' }],
  },
}

function stubGateway(
  onAnswer?: (url: string, init?: RequestInit) => Response,
  listBody: unknown = list,
  detailBody: unknown = detail,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/answer') && onAnswer) return Promise.resolve(onAnswer(url, init))
      if (url.endsWith('/questions/q-abc')) return Promise.resolve(jsonResponse(envelope(detailBody)))
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
    // The recommended option's label is the bare letter `B`, which carries no hand letter, under the letter of the
    // place it holds on screen.
    expect(screen.getByTestId('recommended-q-abc').textContent).toContain('Recommended: A. B')
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

  it('shows the options recommended first, each under its own letter, and states the default after the recommendation', async () => {
    stubGateway(undefined, list, letteredDetail)
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('detail-q-abc')).toBeTruthy())

    const labels = Array.from(screen.getByTestId('options-q-abc').querySelectorAll('strong')).map((node) => node.textContent)
    expect(labels).toEqual(['A. Wait for phase 9', 'B. Ship the store now', 'C. Cancel the phase'])

    const detailText = screen.getByTestId('detail-q-abc').textContent ?? ''
    expect(detailText).toContain('Recommendation: A. Wait for phase 9')
    expect(detailText.indexOf('Default if no answer:')).toBeGreaterThan(detailText.indexOf('Recommendation:'))
    expect(screen.getByTestId('default-q-abc').textContent).toBe(
      'Default if no answer: wait until phase 9 opens, then ship',
    )
  })

  it('replaces a hand-lettered label with the letter of its new place, in the rows and in the options', async () => {
    let body: unknown
    stubGateway(
      (_url, init) => {
        body = JSON.parse(String(init?.body))
        return jsonResponse(envelope({ id: 'q-abc', state: 'answered' }))
      },
      { ...list, questions: [handLetteredRow] },
      handLetteredDetail,
    )
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    expect(screen.getByTestId('recommended-q-abc').textContent).toContain('Recommended: A. Keeper carries')

    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('detail-q-abc')).toBeTruthy())
    const labels = Array.from(screen.getByTestId('options-q-abc').querySelectorAll('strong')).map((node) => node.textContent)
    expect(labels).toEqual(['A. Keeper carries', 'B. Wait for Keeper'])

    fireEvent.click(screen.getByTestId('option-q-abc-A. Wait for Keeper'))
    fireEvent.click(screen.getByTestId('question-submit-q-abc'))
    await waitFor(() => expect(body).toEqual({ option: 'A. Wait for Keeper' }))
  })

  it('names the recommended option on the recommendation line the way the option list does, never twice', async () => {
    stubGateway(undefined, list, handLetteredDetail)
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('detail-q-abc')).toBeTruthy())
    const labels = Array.from(screen.getByTestId('options-q-abc').querySelectorAll('strong')).map((node) => node.textContent)
    expect(labels).toContain('A. Keeper carries')
    const detailText = screen.getByTestId('detail-q-abc').textContent ?? ''
    // The recommended option is shown first, so its place letter is always A, and the hand letter the asker wrote in
    // front of the label is replaced: the owner never reads a second letter for one option.
    expect(detailText).toContain('Recommendation: A. Keeper carries')
    expect(detailText).not.toContain('Recommendation: B. Keeper carries')
    expect(detailText).not.toContain('Recommendation: Keeper carries')
  })

  it('shows the asker recommendation as written when the question offers no option to letter', async () => {
    // A discovery question (or one stored before options were lettered) offers no place to name, so the words the
    // asker wrote are the whole recommendation.
    stubGateway(undefined, list, {
      question: {
        ...detail.question,
        asked: {
          ...detail.question.asked,
          parts: { ...detail.question.asked.parts, options: [], recommendation: 'ask the release owner first' },
        },
      },
    })
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('detail-q-abc')).toBeTruthy())
    // There is no place to name, so the words the asker wrote are the whole recommendation.    expect(screen.getByTestId('detail-q-abc').textContent).toContain('Recommendation: ask the release owner first')
  })

  it('shows no default line when the question states none', async () => {
    stubGateway()
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('detail-q-abc')).toBeTruthy())
    expect(screen.queryByTestId('default-q-abc')).toBeNull()
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

  it('a refused answer keeps the row and shows the verb refusal under the question', async () => {
    stubGateway(() =>
      jsonResponse({ category: 'conflict', message: 'question q-abc is already answered' }, { status: 409 }),
    )
    renderScreen()
    await waitFor(() => expect(screen.getByTestId('expand-q-abc')).toBeTruthy())
    fireEvent.click(screen.getByTestId('expand-q-abc'))
    await waitFor(() => expect(screen.getByTestId('option-q-abc-A')).toBeTruthy())
    fireEvent.click(screen.getByTestId('option-q-abc-A'))
    fireEvent.click(screen.getByTestId('question-submit-q-abc'))
    await waitFor(() => expect(screen.getByTestId('refused-q-abc').textContent).toContain('already answered'))
    expect(screen.getByTestId('row-q-abc')).toBeTruthy()
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
    expect(screen.getByTestId('row-tsk-4id').textContent).toContain('which?')
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
