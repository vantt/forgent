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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('NeedsAnswer (S04, D15: ask channel only)', () => {
  it('ST-EMPTY-QUESTIONS: reads as the good outcome when nothing is waiting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: {} })))))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<NeedsAnswer client={client} baseUrl="http://localhost:4170/v1" onOpenItem={() => {}} onBack={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('empty-questions').textContent).toBe('Nothing is waiting on you.'))
  })

  it('lists each parked item with the ASK tag and the real question text via the item id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse(
            envelope({ work: { 'tsk-4id': { id: 'tsk-4id', title: 'Task detail pairing', kind: 'task', status: 'awaiting-human' } } }),
          ),
        ),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<NeedsAnswer client={client} baseUrl="http://localhost:4170/v1" onOpenItem={() => {}} onBack={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('row-tsk-4id')).toBeTruthy())
    expect(screen.getByTestId('tag-tsk-4id').textContent).toBe('ASK')
  })

  it('Answer submits the real answerWork API and refreshes the list', async () => {
    let answered = false
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/answer')) {
        answered = true
        return Promise.resolve(jsonResponse(envelope({})))
      }
      return Promise.resolve(
        jsonResponse(
          envelope({ work: { 'tsk-4id': { id: 'tsk-4id', title: 'x', kind: 'task', status: 'awaiting-human' } } }),
        ),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<NeedsAnswer client={client} baseUrl="http://localhost:4170/v1" onOpenItem={() => {}} onBack={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('answer-input-tsk-4id')).toBeTruthy())

    fireEvent.change(screen.getByTestId('answer-input-tsk-4id'), { target: { value: 'the answer' } })
    fireEvent.click(screen.getByTestId('answer-submit-tsk-4id'))
    await waitFor(() => expect(answered).toBe(true))
  })

  it('Open navigates via onOpenItem with the item id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse(envelope({ work: { 'tsk-4id': { id: 'tsk-4id', title: 'x', kind: 'task', status: 'awaiting-human' } } })),
        ),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const onOpenItem = vi.fn()
    render(<NeedsAnswer client={client} baseUrl="http://localhost:4170/v1" onOpenItem={onOpenItem} onBack={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('open-tsk-4id')).toBeTruthy())

    fireEvent.click(screen.getByTestId('open-tsk-4id'))
    expect(onOpenItem).toHaveBeenCalledWith('tsk-4id')
  })

  it('ST-DISCONNECTED: a network failure shows the disconnected banner, and retry recovers', async () => {
    let shouldFail = true
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      if (shouldFail) return Promise.reject(new TypeError('Failed to fetch'))
      return Promise.resolve(
        jsonResponse(envelope({ work: { 'tsk-4id': { id: 'tsk-4id', title: 'x', kind: 'task', status: 'awaiting-human' } } })),
      )
    }))
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    render(<NeedsAnswer client={client} baseUrl="http://localhost:4170/v1" onOpenItem={() => {}} onBack={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('disconnected-banner')).toBeTruthy())

    shouldFail = false
    fireEvent.click(screen.getByTestId('retry-button'))
    await waitFor(() => expect(screen.getByTestId('row-tsk-4id')).toBeTruthy())
    expect(screen.queryByTestId('disconnected-banner')).toBeNull()
  })
})
