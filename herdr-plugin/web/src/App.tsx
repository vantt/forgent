import { useMemo, useState, type FormEvent } from 'react'
import { createApiClient } from './api/client'
import { GatewayApiError, GatewayUnreachableError } from './api/errors'
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

// S01 — Sign in (docs/ui-spec/screens/S01-sign-in.md). "The first and
// only door" -- one field, one credential, exchanged for a session by a
// real request (tsk-51i, D16/D17's own design pass): a token that is
// simply the wrong shape/value never gets stored, it is proven against
// the gateway first (`GET /state/digest`, the cheapest authenticated
// read that exists) so ERR-AUTH is a real rejection, not a client-side
// guess. R3: the error message never varies with the cause.
export default function App() {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_STORAGE_KEY))
  const [draftToken, setDraftToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [view, setView] = useState<View>({ name: 'board' })
  const baseUrl = useMemo(defaultBaseUrl, [])

  if (!token) {
    async function signIn(e: FormEvent): Promise<void> {
      e.preventDefault()
      if (!draftToken || submitting) return
      setSubmitting(true)
      setAuthError(false)
      try {
        await createApiClient({ baseUrl, token: draftToken }).stateDigest()
        window.localStorage.setItem(TOKEN_STORAGE_KEY, draftToken)
        setToken(draftToken)
      } catch (err) {
        // R3: one message, same words, regardless of which half of the
        // credential was wrong or whether the gateway rejected it for a
        // different reason -- this screen must never become an oracle.
        if (err instanceof GatewayApiError || err instanceof GatewayUnreachableError) {
          setAuthError(true)
        } else {
          throw err
        }
      } finally {
        setSubmitting(false)
      }
    }

    return (
      <div className="flex min-h-svh items-center justify-center bg-bg px-4">
        <form
          className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-surface p-8 shadow-sm"
          onSubmit={signIn}
        >
          <div className="text-center">
            <h1 className="font-mono text-2xl font-bold text-brand">herdr</h1>
            <p className="mt-1 text-sm text-ink-muted">fgOS work dashboard</p>
          </div>

          <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-ink">
            Access token
            <input
              type="password"
              data-testid="token-input"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={draftToken}
              onChange={(e) => setDraftToken(e.target.value)}
              placeholder="••••••••••••••••••••••••"
              readOnly={submitting}
              autoFocus
            />
          </label>

          <button
            type="submit"
            data-testid="token-submit"
            disabled={!draftToken || submitting}
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="min-h-[1.25rem] text-sm text-danger" data-testid="auth-error-slot">
            {authError && <span data-testid="auth-error">Sign-in failed.</span>}
          </div>

          <p className="text-center text-xs text-ink-muted">Reachable beyond this machine.</p>
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
