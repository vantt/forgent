import type { ErrorEnvelope } from './types'

// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):
// "The gateway is unreachable. The client says so plainly and offers to
// retry; it never presents stale data as current." A network-level fetch
// failure (bad host, connection refused, DNS failure, offline) throws
// before a Response ever exists -- MDN Window/fetch: "A fetch() promise
// only rejects when the request fails ... because of a badly-formed
// request URL or a network error." This is the type that distinguishes
// that case from a normal HTTP error response.
export class GatewayUnreachableError extends Error {
  constructor(cause: unknown) {
    super('gateway unreachable')
    this.name = 'GatewayUnreachableError'
    this.cause = cause
  }
}

// A resolved HTTP response whose status was not ok -- the gateway itself
// answered, with an fgos.v1 ErrorEnvelope body (fgos-gateway-api-v1.yaml
// components.responses.Error). Callers branch on `category`, never on
// `message` text (the contract's own explicit rule).
export class GatewayApiError extends Error {
  readonly category: ErrorEnvelope['category']
  readonly exitCode?: number

  constructor(envelope: ErrorEnvelope) {
    super(envelope.message ?? envelope.category)
    this.name = 'GatewayApiError'
    this.category = envelope.category
    this.exitCode = envelope.exitCode
  }
}
