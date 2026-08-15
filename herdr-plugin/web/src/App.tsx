import { useMemo, useState } from 'react'
import { createApiClient } from './api/client'
import { Taskboard } from './screens/Taskboard'

// tsk-5jr: same-origin default -- the web bundle is served by the SAME
// gateway process it talks to (tsk-48w's with_static_serving, same port
// as build_router), so `window.location.origin` is the right default.
// Still overridable (area spec R1: the client must not assume one fixed
// origin) via ?gateway=<baseUrl> for local dev (`npm run dev` runs on a
// different port from the gateway it points at).
function defaultBaseUrl(): string {
  const override = new URLSearchParams(window.location.search).get('gateway')
  if (override) return override
  return `${window.location.origin}/v1`
}

const TOKEN_STORAGE_KEY = 'herdr-gateway-token'

// Minimal token gate -- NOT S01 (docs/ui-spec/screens/S01-sign-in.md)'s
// real sign-in screen, which is not owned by any item in this cluster's
// current run (same "found but not this item's scope" note as M03 in
// Taskboard.tsx) and is itself partly stale (still references a session
// cookie the realignment's D13 already replaced with Bearer-only). This
// is just enough to let Taskboard receive a real, entered token.
export default function App() {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_STORAGE_KEY))
  const [draftToken, setDraftToken] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const baseUrl = useMemo(defaultBaseUrl, [])

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!draftToken) return
            window.localStorage.setItem(TOKEN_STORAGE_KEY, draftToken)
            setToken(draftToken)
          }}
        >
          <input
            type="password"
            data-testid="token-input"
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder="Access token"
          />
          <button type="submit" data-testid="token-submit" disabled={!draftToken}>
            Sign in
          </button>
        </form>
      </div>
    )
  }

  const client = createApiClient({ baseUrl, token })

  if (selectedItemId) {
    // S03 (task detail) is tsk-4id's own deliverable, not built yet --
    // this placeholder is the reversible "smaller path" plan.md's own
    // Approach section already chose over pulling in a router library.
    return (
      <div>
        <button data-testid="back-to-board" onClick={() => setSelectedItemId(null)}>
          ← Back to board
        </button>
        <p data-testid="task-detail-placeholder">Task detail for {selectedItemId} — tsk-4id will build this.</p>
      </div>
    )
  }

  return <Taskboard client={client} baseUrl={baseUrl} onSelectItem={setSelectedItemId} />
}
