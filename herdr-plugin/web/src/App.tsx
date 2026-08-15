import { useMemo, useState } from 'react'
import { createApiClient } from './api/client'
import { Taskboard } from './screens/Taskboard'
import { TaskDetail } from './screens/TaskDetail'
import { NeedsAnswer } from './screens/NeedsAnswer'

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

type View = { name: 'board' } | { name: 'detail'; itemId: string } | { name: 'needs-answer' }

// Minimal token gate -- NOT S01 (docs/ui-spec/screens/S01-sign-in.md)'s
// real sign-in screen, which is not owned by any item in this cluster's
// current run (same "found but not this item's scope" note as M03 in
// Taskboard.tsx) and is itself partly stale (still references a session
// cookie the realignment's D13 already replaced with Bearer-only). This
// is just enough to let the real screens receive a real, entered token.
export default function App() {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_STORAGE_KEY))
  const [draftToken, setDraftToken] = useState('')
  const [view, setView] = useState<View>({ name: 'board' })
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

  if (view.name === 'detail') {
    return (
      <TaskDetail
        client={client}
        baseUrl={baseUrl}
        itemId={view.itemId}
        onBack={() => setView({ name: 'board' })}
      />
    )
  }

  if (view.name === 'needs-answer') {
    return (
      <NeedsAnswer
        client={client}
        baseUrl={baseUrl}
        onOpenItem={(id) => setView({ name: 'detail', itemId: id })}
        onBack={() => setView({ name: 'board' })}
      />
    )
  }

  return (
    <Taskboard
      client={client}
      baseUrl={baseUrl}
      onSelectItem={(id) => setView({ name: 'detail', itemId: id })}
      onOpenNeedsAnswer={() => setView({ name: 'needs-answer' })}
    />
  )
}
