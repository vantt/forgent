# Refresh-token reuse: family revocation or single reject? (OpenAI Codex login, xAI OAuth)

Access date for all URLs: 2026-10-13. Docs/source/issues only, no live requests, no token values.
Evidence levels: (a) documented by provider, (b) provider client source / issue reports, (c) generic OAuth recommendation only.

## Bottom line

| Provider | Replay of a rotated token | Whole family revoked? | Evidence |
|---|---|---|---|
| OpenAI (Codex / ChatGPT login) | Within ~1 h of rotation: **accepted**, returns a fresh pair (maintainer statement). After that window: **rejected** with `refresh_token_reused` (401). | **Unknown.** No statement or issue shows that the replay kills the successor token. | b (OpenAI maintainer comment + client source + issues); no (a) |
| xAI (auth.x.ai, `xai-oauth`) | Rejected `invalid_grant: Refresh token has been revoked` | **Unknown.** All reports are explained by plain rotation (old token dead, successor held by someone else). Nothing shows reuse detection killing the successor. | b only (third-party clients); nothing from xAI |
| Generic OAuth (RFC 9700 / 2.1, Auth0, Okta pattern) | MUST detect replay for public clients; rotation variant = "revoke the active refresh token" | **Yes, by the standard pattern** (family/grant). Auth0 does exactly this, with an optional leeway. | a for Auth0, c for RFC |

Honest answer: neither provider is documented to revoke the family. Both are only **observed** to reject the stale token. The generic pattern says a provider MAY do family kill, so fgOS must assume worst case unless measured.

## 1. OpenAI (Codex CLI, auth.openai.com)

### Server behavior
- (b, strongest) OpenAI maintainer etraut-openai on openai/codex#10332 (2026-02-01): "Our OAuth refresh mechanism allows a refresh token to be used multiple times over a limited time window (on the order of an hour) before it is permanently invalidated. This accommodates network flakiness and other similar conditions. ... this race is mitigated by the refresh behavior on the server. ... app-server-2 would not receive a 'refresh_token_reused' error in this situation. It would receive a proper access token / refresh token pair." https://github.com/openai/codex/issues/10332 (closed 2026-02-02). Also: "We have received occasional reports of the 'refresh token reused' error, so there is likely a bug lurking somewhere still."
  - Implication: OpenAI has a reuse grace window (~1 h, "on the order of"); that is Auth0-style leeway but much longer. After it, the old token is "permanently invalidated". Says nothing about the successor.
- (b) Error bodies seen in logs, openai/codex#19803 (2026-04-27): `"Your refresh token has already been used to generate a new access token. Please try signing in again."`, type `invalid_request_error`, code `refresh_token_reused`, HTTP 401.
- (b) Distinct code `refresh_token_invalidated` ("Your refresh token has been invalidated. Please try signing in again.", 401), seen in #40267 (2026-08-23), #39925 (2026-08-21), #40541 (2026-08-25). Observed triggers there: Desktop forcing a rotation on thread open, multi-account browser session (#39199, 2026-08-18), Advanced Account Security (#39696). Meaning of the code vs `_reused` is NOT documented; plausibly `_invalidated` = server-side grant killed, `_reused` = stale token presented. Unproven.
- (b) Third-party framing "fresh login invalidated within 76 s / brand-new token family invalidated" (#40267) is a Desktop bug (rotated token never persisted to auth.json), not a reuse-detection kill. Do not cite it as family revocation.
- Counter-hint toward sticky damage: #48619 (2026-09-27) "Refresh token revoked error persists after successful reauthentication" and #24365 (2026-05-24) "tried to login many times but still don't work". Reports only, causes unknown (some link to browser multi-account state, not reuse).

### Client reaction (source, openai/codex codex-rs/login/src/auth/manager.rs, main as fetched 2026-10-13)
- Classification: `refresh_token_expired` -> Expired, `refresh_token_reused` -> Exhausted, `refresh_token_invalidated` -> Revoked, else Other. Message for reused: "Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again."
- Failure is `Permanent` if HTTP 401, or reason != Other, or 400 + `invalid_grant`. Permanent failure is cached per attempted auth (`record_permanent_refresh_failure_if_unchanged`) so the same stale token is not retried.
- Before spending the refresh token it does a "guarded reload" from disk (`refresh_token()`): if on-disk auth differs from cache (sibling already refreshed) it adopts it and skips the POST ("Skipping token refresh because auth changed after guarded reload"). Only an in-process `Semaphore(1)` serializes refresh; no cross-process file lock (matches #10332 analysis, 2026-02).
- No automatic logout/delete of auth.json on refresh failure seen in this file (logout paths are for login-policy violations). Failed state is cached in memory; fix is manual re-login. VS Code extension loops forever without prompt (#19803).
- Official docs (a): https://learn.chatgpt.com/docs/auth (redirect of developers.openai.com/codex/auth): "treat ~/.codex/auth.json like a password"; says nothing about rotation/reuse. CI guide https://learn.chatgpt.com/docs/auth/ci-cd-auth: "Do not share the same file across concurrent jobs or multiple machines."; "Use one auth.json per runner or per serialized workflow stream."; lists "another machine or concurrent job rotated the token first" as a cause of breakage and says the refresh token may be "revoked or expired" and then needs reseeding. No reuse/family semantics given.

### Is OpenAI Auth0-based?
Not documented. Refresh endpoint is `https://auth.openai.com/oauth/token` (source, line ~212). Error body shape (`{"error":{"message","type":"invalid_request_error","code":...}}`) is OpenAI-style, not Auth0's `invalid_grant` shape; Codex only falls back to `invalid_grant` handling for 400s. Historic ChatGPT login used an auth0.openai.com host (from memory, not verified this session). Treat "Auth0-based" as unverified; the ~1 h overlap is not Auth0's default (Auth0 leeway is disabled by default, configured in seconds).

### Answer: OpenAI = rejects the single stale token (after ~1 h grace); family kill unknown. Evidence level b.

## 2. xAI (auth.x.ai; omp, pi, Grok CLI)

- (a) Nothing found from xAI about rotation, reuse or revocation semantics. Web search found only third-party docs.
- (b) omp/pi source: omp `packages/ai/src/registry/oauth/xai-oauth.ts` (issuer `https://auth.x.ai`, OIDC discovery) and pi `earendil-works/pi packages/ai/src/auth/oauth/xai.ts` contain no reuse/family handling that I could grep. omp issue can1357/oh-my-pi#9918 (2026-08-27) shows stored disable causes `Refresh token has been revoked` and `Refresh token not found or invalid`, i.e. omp soft-disables the credential row permanently on a definitive failure (re-login only).
- (b) Server error string, NousResearch/hermes-agent#43589 (2026-06-10, xAI loopback PKCE, 5 profiles): "refresh failed with `invalid_grant: Refresh token has been revoked`"; "xAI refresh tokens rotate"; "mutual revocation is a structural certainty"; observed "invalid_grant minutes after a fresh re-auth, traced to a different profile store having saved a newer rotated chain". Reporter's own workaround: single elected refresher, fan out the winner.
- (b) hermes-agent#77553 (2026-08-03): a stale gateway successfully consumed the current token and lost the successor; ~5.5 h later the coordinator's use of the (now superseded) token returned `invalid_grant: Refresh token has been revoked` and "every profile sharing the login group became unavailable". Note: this is ordinary rotation (the one-shot predecessor is dead), not proof of family kill.
- (b) FerroxLabs/wayland#391 (2026-06-27): "xAI uses single-use rotating refresh tokens (burned on each refresh) ... POSTs the burned token -> 401 -> forces an unnecessary re-login." Akagilnc/ming-salvage-sim#1115 (2026-07-22): copies of grok auth.json in containers; "whichever container refreshes first, only that copy's chain survives; host original and other copies' token chain is dead" (inference by reporter, access token life 6 h measured by them, matches yours). Fix there: single refresher, access-only copies; stripped `refresh_token` auth.json still works for the Grok CLI (reporter's measurement).
- Hermes code comment (quoted in hermes-agent#95431, 2026-08-26): "Codex and xAI OAuth refresh tokens are single-use ... otherwise two processes can both adopt the same on-disk token, both POST it, and the loser gets `refresh_token_reused`." Hermes treats xAI and Codex identically (single-use, flock around refresh).

### Key gap
No report separates: "stale token replayed -> successor also killed" vs "stale token replayed -> only stale rejected". All observed full-lockouts are explained by the survivor chain being held by a different process. Also: no grace window evidence for xAI (OpenAI has one; xAI reports are of immediate rejection once the successor exists, but timing was never isolated).

### Answer: xAI = rejects the single stale token (immediately, no grace seen); family kill unknown. Evidence level b (third-party), no (a).

## 3. Generic OAuth (c, plus a for Auth0)

- RFC 9700 s4.14.2 (https://www.rfc-editor.org/rfc/rfc9700.html): AS MUST detect refresh-token replay for public clients via sender-constraint or rotation. Rotation: "The previous refresh token is invalidated, but information about the relationship is retained ... If a refresh token is compromised and subsequently used by both the attacker and the legitimate client, one of them will present an invalidated refresh token ... The authorization server cannot determine which party submitted the invalid refresh token, but it will revoke the active refresh token. This stops the attack at the cost of forcing the legitimate client to obtain a fresh authorization grant." Implementation note: grant may be encoded in the token to find "all refresh tokens that need to be revoked." Same text in OAuth 2.1 draft (draft-ietf-oauth-v2-1-13, rotation bullet). Note these say MUST *detect*, and the revoke action describes rotation as one option; a provider with sender-constrained tokens is compliant without rotation.
- Auth0 (a): https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation : "Auth0 recognizes that refresh token 1 is being reused, and immediately invalidates the refresh token family"; the newest token "is also immediately invalidated"; "all subsequent requests will be denied until the user re-authenticates." Config page https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-rotation : overlap/leeway "By default leeway is disabled"; within leeway "breach detection features don't apply and a new rotating refresh token is issued"; outside, "the entire set of refresh tokens issued since that invalidated token was issued will immediately be revoked."
- Okta equivalent exists (reuse detection with grace period) but not re-fetched this session; not needed for the verdict.

OpenAI's observed ~1 h overlap + "permanently invalidated" afterward matches the Auth0/Okta "grace then detect" shape. Whether detect = family kill is the open item.

## 4. What it means for fgOS

Cost of a lost race, worst-case planning:
- OpenAI: inside ~1 h of a sibling's rotation, a pane presenting the old token **still gets a valid new pair** (but then two live chains exist, the file holds whichever writer wrote last; the other pane keeps a token that may be the one superseded next). Outside that window, the stale pane fails permanently (`refresh_token_reused`) and Codex does not self-recover; cost is at least one pane, and plausibly the grant (unproven). Because the successor's fate is unknown, treat a reuse event as a potential full re-login of the account.
- xAI: no grace evidence; stale pane is rejected immediately. Single-use semantics confirmed by 4 independent third-party projects (hermes, wayland, ming-salvage-sim, omp's own disable behavior). Family kill unproven; potential cost = one pane or account re-login.
- Design guidance consistent with every source: **one refresher per credential chain** (flock around read-refresh-write-back), always re-read the store before POSTing (Codex's own guarded reload), never copy refresh tokens into panes that can refresh independently (hand panes access-only copies where the CLI tolerates it: reported working for Grok CLI; not verified for omp/pi/Codex). Re-sync write-back must be atomic; hermes#77553 shows a single stale writer that spends the token without persisting the successor is the dominant lockout cause.
- Rank of fgOS stance: (1) assume family-kill, serialize refreshes; (2) rely on OpenAI's ~1 h overlap only as a safety net, never as design; (3) do not rely on any xAI grace.

## Limitations
- No live testing by instruction, so the family-kill question for both providers stays open; only a controlled replay on a throwaway account can close it (not done).
- Okta docs and xAI official docs not retrieved/found. Codex server-side code is closed; only client source read. The full manager.rs was truncated in one fetch (last ~19 KB unread there); I re-downloaded it via gh and grepped the refresh path directly.
- openai/codex issues are mostly Desktop (not CLI) and mix several causes; citing them as CLI behavior is weaker.

## Unresolved questions
1. Does a post-window replay of an OpenAI refresh token also invalidate the successor (i.e. is `refresh_token_invalidated` the family-kill code and `refresh_token_reused` the single-reject)? Only server-side docs or a controlled replay answer this.
2. Exact length and configurability of OpenAI's reuse window ("on the order of an hour" is a maintainer's aside, no spec).
3. Does xAI have any overlap/leeway at all, and does replay kill the successor? Measured rotation exists; reuse behavior untested.
4. Is OpenAI auth really Auth0 (or Okta CIC) under the hood? Not documented.
5. Do pi/omp/Codex tolerate access-only (refresh-stripped) auth files, as the Grok CLI reportedly does?

Sources: https://github.com/openai/codex/issues/10332, /19803, /24365, /39199, /39925, /40267, /40541, /48619 ; https://github.com/openai/codex/blob/main/codex-rs/login/src/auth/manager.rs ; https://learn.chatgpt.com/docs/auth ; https://learn.chatgpt.com/docs/auth/ci-cd-auth ; https://github.com/NousResearch/hermes-agent/issues/43589, /48415, /77553, /95431 ; https://github.com/FerroxLabs/wayland/issues/391 ; https://github.com/Akagilnc/ming-salvage-sim/issues/1115 ; https://github.com/can1357/oh-my-pi/issues/9918 ; https://www.rfc-editor.org/rfc/rfc9700.html ; https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation ; https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-rotation
