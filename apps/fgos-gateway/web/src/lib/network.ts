// Shared by Taskboard.tsx and TaskDetail.tsx -- R5 (docs/platform/herdr-web-dashboard/contracts/gateway-readiness.md#reachable-on-network): "reachable on network" has no dedicated contract
// field (confirmed: no `bind` field anywhere in docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml), so the client's own configured `baseUrl` is
// the only observable signal.

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function isNonLoopbackHost(baseUrl: string): boolean {
  try {
    return !LOOPBACK_HOSTNAMES.has(new URL(baseUrl).hostname)
  } catch {
    return false
  }
}

export function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl
  }
}
