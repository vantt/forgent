import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './client'
import { GatewayApiError, GatewayUnreachableError } from './errors'
import { pollStateDigest } from './poll'

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createApiClient auth + base URL', () => {
  it('attaches Authorization: Bearer <token> to every request (D13)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse(envelope({ dispatched: [] })))
    vi.stubGlobal('fetch', fetchSpy)

    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 'secret-token' })
    await client.runnerTick()

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer secret-token')
  })

  it('never hardcodes a base URL -- two clients with different baseUrl hit different origins', async () => {
    const fetchSpy = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(envelope({ work: {} }))))
    vi.stubGlobal('fetch', fetchSpy)

    const clientA = createApiClient({ baseUrl: 'http://host-a:4170/v1', token: 't' })
    const clientB = createApiClient({ baseUrl: 'http://host-b:4170/v1', token: 't' })
    await clientA.listWork()
    await clientB.listWork()

    const [urlA] = fetchSpy.mock.calls[0] as [string]
    const [urlB] = fetchSpy.mock.calls[1] as [string]
    expect(urlA.startsWith('http://host-a:4170/v1')).toBe(true)
    expect(urlB.startsWith('http://host-b:4170/v1')).toBe(true)
  })
})

describe('createApiClient response shapes (fgos-gateway-api-v1.yaml)', () => {
  it('parses GET /work as a map keyed by id (not an array)', async () => {
    const workItem = { id: 'tsk-1', title: 'x', kind: 'task', status: 'todo' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(envelope({ work: { 'tsk-1': workItem } }))))

    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const data = await client.listWork()

    expect(data.work['tsk-1']).toEqual(workItem)
  })

  it('parses GET /ready as an array (distinct shape from /work)', async () => {
    const item = { id: 'tsk-2', title: 'y', kind: 'task', status: 'todo' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(envelope({ items: [item] }))))

    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const data = await client.listReady()

    expect(data.items).toEqual([item])
  })

  it('parses GET /state/digest with no `data` field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'abc123' }),
      ),
    )

    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const digest = await client.stateDigest()

    expect(digest.data_hash).toBe('abc123')
    expect('data' in digest).toBe(false)
  })
})

describe('gateway-unreachable vs API error (area spec Edge Cases)', () => {
  it('throws GatewayUnreachableError on a network-level fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    await expect(client.listWork()).rejects.toBeInstanceOf(GatewayUnreachableError)
  })

  it('throws GatewayApiError (never GatewayUnreachableError) on an HTTP error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ category: 'precondition', message: 'not ready' }, { status: 412 })),
    )

    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const err = await client.listWork().catch((e) => e)
    expect(err).toBeInstanceOf(GatewayApiError)
    expect(err).not.toBeInstanceOf(GatewayUnreachableError)
    expect((err as GatewayApiError).category).toBe('precondition')
  })
})

describe('pollStateDigest (D9 cheap-poll pattern)', () => {
  it('reports changed on the first call (no previous hash to compare)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h1' }),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const result = await pollStateDigest(client)
    expect(result).toEqual({ dataHash: 'h1', changed: true })
  })

  it('reports unchanged when the digest matches the previous hash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h1' }),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const result = await pollStateDigest(client, 'h1')
    expect(result).toEqual({ dataHash: 'h1', changed: false })
  })

  it('reports changed when the digest differs from the previous hash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ contract: 'fgos.v1', generated_at: '2026-08-15T00:00:00Z', data_hash: 'h2' }),
      ),
    )
    const client = createApiClient({ baseUrl: 'http://localhost:4170/v1', token: 't' })
    const result = await pollStateDigest(client, 'h1')
    expect(result).toEqual({ dataHash: 'h2', changed: true })
  })
})
