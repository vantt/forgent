# Iron Law evidence: tsk-yo0

`classifyIronLaw` against the real committed diff (`fgw/tsk-ldb...
fgw/tsk-yo0`) returned `required: true`, matched flags:

```
auth
```

No matched modules (the classifier's module list is empty for this diff —
the flag fired on the item's own description text, which names
`Authorization: Bearer <token>` per D13, and on the real code that
attaches it in `herdr-plugin/web/src/api/client.ts`).

## Test command

```
cd herdr-plugin/web && npm run test
```
(`vitest run`, `src/api/client.test.ts`)

## Failing-before / passing-after

The real implementation and its tests were written together and passed on
first run except for one unrelated bug (a shared-`Response`-object test
mistake, fixed and noted below) — so, per this Iron Law's own
failing-test-first requirement, the auth-specific proof was captured live
by temporarily removing the `Authorization` header attachment in
`rawFetch` (`herdr-plugin/web/src/api/client.ts`) and re-running just the
auth test, then restoring the real code and re-running the full suite to
confirm green again.

**Before (header attachment removed):**

```
 ❯ src/api/client.test.ts (10 tests | 1 failed | 9 skipped) 18ms
     × attaches Authorization: Bearer <token> to every request (D13) 17ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/api/client.test.ts > createApiClient auth + base URL > attaches Authorization: Bearer <token> to every request (D13)
AssertionError: expected null to be 'Bearer secret-token' // Object.is equality

- Expected:
"Bearer secret-token"

+ Received:
null

 ❯ src/api/client.test.ts:32:42
     30|     const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
     31|     const headers = new Headers(init.headers)
     32|     expect(headers.get('Authorization')).toBe('Bearer secret-token')
       |                                          ^
     33|   })

 Test Files  1 failed (1)
      Tests  1 failed | 9 skipped (10)
```

**After (real code restored, `git diff` confirmed empty against the
committed state before re-running):**

```
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

## Also caught live during Implement (unrelated to the `auth` flag, noted
for completeness — a real red/green cycle from the natural course of
writing these tests, not staged)

The "never hardcodes a base URL" test initially failed with `TypeError:
Body is unusable: Body has already been read` — `vi.fn().mockResolvedValue(...)`
handed the same `Response` instance back to both of the test's two
`fetch` calls, and a `Response` body can only be consumed once. Fixed by
switching to `mockImplementation` returning a fresh `Response` per call.
Before:

```
 ❯ src/api/client.test.ts (10 tests | 1 failed) 23ms
     × never hardcodes a base URL -- two clients with different baseUrl hit different origins 3ms

TypeError: Body is unusable: Body has already been read
 ❯ request src/api/client.ts:57:36

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

After: `Test Files  1 passed (1)`, `Tests  10 passed (10)`.

## Not applicable here

No package install beyond what `plan.md` already named and validated with
real evidence at the planning gate (`tailwindcss`/`@tailwindcss/vite`,
`vitest` — dev-tooling for a greenfield scaffold, not a runtime auth
dependency). No scope/architecture redesign. No blocking issue found in
the touched path beyond the two fixes captured above.
