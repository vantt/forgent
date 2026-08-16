// Types mirrored from docs/contracts/fgos-gateway-api-v1.yaml (tsk-yo0
// scope: "KHÔNG tự mô tả lại endpoint" -- every shape here traces to a
// specific path in that contract, never invented independently.

export interface Envelope<T> {
  contract: 'fgos.v1'
  generated_at: string
  data_hash: string
  data: T
}

// GET /state/digest -- the one response with no `data` field
// (fgos-gateway-api-v1.yaml:403-429).
export interface DigestEnvelope {
  contract: 'fgos.v1'
  generated_at: string
  data_hash: string
}

// components.schemas.ErrorEnvelope (fgos-gateway-api-v1.yaml:663-689) --
// the closed category taxonomy CTR001 defines. Branch on `category` only,
// never on `message`.
export type ErrorCategory =
  | 'precondition'
  | 'conflict'
  | 'validation'
  | 'corrupt-log'
  | 'lock-timeout'
  | 'session-fail'
  | 'merge-fail'
  | 'busy'
  | 'unexpected'

export interface ErrorEnvelope {
  category: ErrorCategory
  message?: string
  exitCode?: number
}

// components.schemas.WorkItem (fgos-gateway-api-v1.yaml:630-652).
export interface WorkItem {
  id: string
  title: string
  description?: string
  kind: string
  status: string
  stage?: string
  tier?: string
  risk?: string
  domain?: string
  parent?: string | null
  deps?: string[]
  footprint?: string[]
  verify?: string
  docsRef?: string | null
}

// components.schemas.WorkDetail (fgos-gateway-api-v1.yaml) -- GET
// /work/{id}'s real `data` shape (tsk-4id).
export interface GateApproveRecord {
  actor: string
  at: string
  verify: string
}

export interface GatesInfo {
  contextApprove?: GateApproveRecord
  planApprove?: GateApproveRecord
  validateApprove?: GateApproveRecord
  ask?: string
  askHistory?: string[]
  answer?: string
  statusAtAsk?: string
}

export interface Decision {
  text: string
  rationale?: string
  source: string
  id: string
  ts: string
  kind?: string
}

export interface SettlementEntry {
  kind: string
  role: string
  ts: string
  detail: string | null
  id: string
}

export interface Settlement {
  count: number
  recent: SettlementEntry[]
}

export interface WorkDetail {
  work: WorkItem
  discovery?: unknown[]
  decisions?: Decision[]
  gates?: GatesInfo
  outcome?: unknown
  friction?: unknown
  settlement?: Settlement
  learning?: unknown
}

// GET /work/{id}/docs's own data shape (fgos-gateway-api-v1.yaml, tsk-4id).
export interface WorkDocsData {
  docsRef: string | null
  contextMd: string | null
  planMd: string | null
  narrativeMissing?: boolean
}

// components.schemas.Session (fgos-gateway-api-v1.yaml:654-661).
export interface Session {
  sessionId: string
  worktree: string
  branch: string
  item?: string | null
}

// components.schemas.Page (fgos-gateway-api-v1.yaml:622-628).
export interface Page {
  nextCursor?: string | null
}

// GET /work's own data shape (fgos-gateway-api-v1.yaml:139-146): a map
// keyed by id, NOT an array -- distinct from /ready below.
export interface ListWorkData extends Page {
  work: Record<string, WorkItem>
}

// GET /ready's own data shape (fgos-gateway-api-v1.yaml:352-359): an
// array, distinct from /work's map.
export interface ListReadyData extends Page {
  items: WorkItem[]
}

// GET /sessions/{sessionId}/slots (fgos-gateway-api-v1.yaml:505-521).
export interface SessionSlotsData {
  execution?: {
    occupied: number
    items: Array<{ id: string; sessionId: string; claimRole: string }>
  }
}

// POST /runner/tick (fgos-gateway-api-v1.yaml:549-551).
export interface RunnerTickData {
  dispatched: string[]
}

export interface ListWorkParams {
  status?: string
  stage?: string
  all?: boolean
  cursor?: string
  limit?: number
}

export interface PageParams {
  cursor?: string
  limit?: number
}
