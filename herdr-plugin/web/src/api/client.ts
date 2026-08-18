import { GatewayApiError, GatewayUnreachableError } from './errors'
import type {
  DigestEnvelope,
  Envelope,
  ErrorEnvelope,
  ListReadyData,
  ListWorkData,
  ListWorkParams,
  PageParams,
  RunnerTickData,
  Session,
  SessionSlotsData,
  WorkDetail,
  WorkDocsData,
  WorkItem,
} from './types'

// Area spec R1 / item scope: base URL and token are constructor
// parameters, never a module-level constant -- the client must be able to
// address more than one gateway.
export interface ApiClientConfig {
  baseUrl: string
  token: string
}

async function rawFetch(config: ApiClientConfig, path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
        // D13: Authorization: Bearer <token>, the one auth mechanism this
        // cluster locked -- never a cookie.
        Authorization: `Bearer ${config.token}`,
      },
    })
  } catch (cause) {
    // fetch() only rejects on a network-level failure (MDN), never on an
    // HTTP error status -- this catch is exactly the gateway-unreachable
    // case, distinct from the !response.ok branch below.
    throw new GatewayUnreachableError(cause)
  }
}

async function parseErrorEnvelope(response: Response): Promise<ErrorEnvelope> {
  try {
    return (await response.json()) as ErrorEnvelope
  } catch {
    return { category: 'unexpected', message: `HTTP ${response.status} with a non-JSON body` }
  }
}

async function request<T>(config: ApiClientConfig, path: string, init?: RequestInit): Promise<T> {
  const response = await rawFetch(config, path, init)
  if (!response.ok) {
    throw new GatewayApiError(await parseErrorEnvelope(response))
  }
  const envelope = (await response.json()) as Envelope<T>
  return envelope.data
}

function query(params?: object): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return ''
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))
  return `?${search.toString()}`
}

function jsonBody(body: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(body) }
}

/**
 * Typed wrapper over docs/contracts/fgos-gateway-api-v1.yaml -- one
 * function per operationId, never a re-description of an endpoint's own
 * shape. `/contract` (unauthenticated, non-enveloped) is intentionally
 * NOT wrapped here: a client fetches it once, before it has a client
 * configured at all, per the contract's own top-level note.
 */
export function createApiClient(config: ApiClientConfig) {
  return {
    // GET /work (fgos-gateway-api-v1.yaml:105-148)
    listWork: (params?: ListWorkParams) => request<ListWorkData>(config, `/work${query(params)}`),

    // POST /work (fgos-gateway-api-v1.yaml:150-181)
    submitWork: (text: string) => request<WorkItem>(config, '/work', jsonBody({ text })),

    // GET /work/{id} (fgos-gateway-api-v1.yaml:186-203)
    // tsk-4id: corrected return type from WorkItem to WorkDetail -- the
    // real response includes discovery/decisions/gates/outcome/friction/
    // settlement/learning, not just the WorkItem subset (contract fixed
    // to match, see fgos-gateway-api-v1.yaml's own WorkDetail schema).
    getWork: (id: string) => request<WorkDetail>(config, `/work/${encodeURIComponent(id)}`),

    // GET /work/{id}/docs (tsk-4id) -- CONTEXT.md/plan.md raw content.
    getWorkDocs: (id: string) => request<WorkDocsData>(config, `/work/${encodeURIComponent(id)}/docs`),

    // POST /work/{id}/move (fgos-gateway-api-v1.yaml:205-224)
    moveWork: (id: string, to: string, expect?: string) =>
      request<WorkItem>(config, `/work/${encodeURIComponent(id)}/move`, jsonBody({ to, expect })),

    // POST /work/{id}/ask (fgos-gateway-api-v1.yaml:226-244)
    askWork: (id: string, text: string) =>
      request<WorkItem>(config, `/work/${encodeURIComponent(id)}/ask`, jsonBody({ text })),

    // POST /work/{id}/answer (fgos-gateway-api-v1.yaml:246-264)
    answerWork: (id: string, text: string) =>
      request<WorkItem>(config, `/work/${encodeURIComponent(id)}/answer`, jsonBody({ text })),

    // POST /work/{id}/take (fgos-gateway-api-v1.yaml:266-289)
    takeWork: (id: string, role: 'human' | 'session' = 'session') =>
      request<WorkItem>(config, `/work/${encodeURIComponent(id)}/take`, jsonBody({ role })),

    // POST /work/{id}/return (fgos-gateway-api-v1.yaml:291-300)
    returnWork: (id: string) => request<WorkItem>(config, `/work/${encodeURIComponent(id)}/return`, { method: 'POST' }),

    // POST /work/{id}/approve (fgos-gateway-api-v1.yaml:302-312)
    approveWork: (id: string) => request<WorkItem>(config, `/work/${encodeURIComponent(id)}/approve`, { method: 'POST' }),

    // POST /work/{id}/reject (fgos-gateway-api-v1.yaml:314-332)
    rejectWork: (id: string, reason: string) =>
      request<WorkItem>(config, `/work/${encodeURIComponent(id)}/reject`, jsonBody({ reason })),

    // GET /ready (fgos-gateway-api-v1.yaml:334-361)
    listReady: (params?: PageParams) => request<ListReadyData>(config, `/ready${query(params)}`),

    // GET /rollup/{id} (fgos-gateway-api-v1.yaml:363-382) -- opaque shape
    // per the contract itself ("Rollup shape, opaque to this contract").
    rollupWork: (id: string) => request<Record<string, unknown>>(config, `/rollup/${encodeURIComponent(id)}`),

    // GET /graph (fgos-gateway-api-v1.yaml:384-401) -- opaque shape.
    workGraph: () => request<Record<string, unknown>>(config, '/graph'),

    // GET /state/digest (fgos-gateway-api-v1.yaml:403-429) -- no `data`
    // field; see poll.ts for the cheap-poll helper built on this.
    stateDigest: async (): Promise<DigestEnvelope> => {
      const response = await rawFetch(config, '/state/digest')
      if (!response.ok) {
        throw new GatewayApiError(await parseErrorEnvelope(response))
      }
      return (await response.json()) as DigestEnvelope
    },

    // POST /sessions (fgos-gateway-api-v1.yaml:431-460)
    startSession: (item?: string) => request<Session>(config, '/sessions', jsonBody(item ? { item } : {})),

    // DELETE /sessions/{sessionId} (fgos-gateway-api-v1.yaml:462-483)
    endSession: (sessionId: string, force = false) =>
      request<unknown>(config, `/sessions/${encodeURIComponent(sessionId)}${query({ force: force || undefined })}`, {
        method: 'DELETE',
      }),

    // GET /sessions/{sessionId}/slots (fgos-gateway-api-v1.yaml:485-521)
    sessionSlots: (sessionId: string) =>
      request<SessionSlotsData>(config, `/sessions/${encodeURIComponent(sessionId)}/slots`),

    // POST /runner/tick (fgos-gateway-api-v1.yaml:523-558). The 429
    // "runner busy" case is still an ErrorEnvelope body (category
    // `busy`), so it already flows through the same GatewayApiError path
    // as every other non-2xx response -- no special-casing needed here.
    runnerTick: () => request<RunnerTickData>(config, '/runner/tick', { method: 'POST' }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
