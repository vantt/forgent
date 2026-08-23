// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// S01 — Sign in (docs/ui-spec/screens/S01-sign-in.md). tsk-51i: the
// token gate now proves the token against the gateway (GET
// /state/digest) before storing it, instead of trusting whatever was
// typed -- these tests cover the real ST-READY/ST-SUBMITTING/ERR-AUTH
// states that behavior adds.

function envelope(data: unknown) {
  return { contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h1', data }
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe('App / S01 sign-in', () => {
  it('ST-READY: submit is disabled until the token field is non-empty', () => {
    render(<App />)
    expect((screen.getByTestId('token-submit') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByTestId('token-input'), { target: { value: 't' } })
    expect((screen.getByTestId('token-submit') as HTMLButtonElement).disabled).toBe(false)
  })

  it('a valid token is proven against the gateway, stored, and the board renders', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/state/digest')) {
          return Promise.resolve(jsonResponse({ contract: 'fgos.v1', generated_at: 't', data_hash: 'h' }))
        }
        return Promise.resolve(jsonResponse(envelope({ work: {} })))
      }),
    )
    render(<App />)
    fireEvent.change(screen.getByTestId('token-input'), { target: { value: 'real-token' } })
    fireEvent.click(screen.getByTestId('token-submit'))

    await waitFor(() => expect(screen.getByTestId('board')).toBeTruthy())
    expect(window.localStorage.getItem('herdr-gateway-token')).toBe('real-token')
  })

  it('ERR-AUTH: a 401 shows the fixed error message and never stores the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ category: 'validation', message: 'missing or invalid Authorization' }, { status: 401 }),
        ),
      ),
    )
    render(<App />)
    fireEvent.change(screen.getByTestId('token-input'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByTestId('token-submit'))

    await waitFor(() => expect(screen.getByTestId('auth-error')).toBeTruthy())
    expect(screen.getByTestId('auth-error').textContent).toBe('Sign-in failed.')
    expect(window.localStorage.getItem('herdr-gateway-token')).toBeNull()
    expect(screen.getByTestId('token-input')).toBeTruthy()
  })

  it('ERR-AUTH also fires, with the SAME message, when the gateway is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.reject(new TypeError('Failed to fetch'))))
    render(<App />)
    fireEvent.change(screen.getByTestId('token-input'), { target: { value: 'anything' } })
    fireEvent.click(screen.getByTestId('token-submit'))

    await waitFor(() => expect(screen.getByTestId('auth-error')).toBeTruthy())
    expect(screen.getByTestId('auth-error').textContent).toBe('Sign-in failed.')
  })

  it('an already-stored token skips the sign-in screen entirely', async () => {
    window.localStorage.setItem('herdr-gateway-token', 'stored-token')
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: {} })))))
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('board')).toBeTruthy())
    expect(screen.queryByTestId('token-input')).toBeNull()
  })
})
