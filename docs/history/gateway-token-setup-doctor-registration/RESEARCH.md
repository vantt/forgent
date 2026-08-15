# Research — gateway token not in setup/doctor (tsk-4r1)

## Round 1 — 2026-08-14

**Asked:** how does this repo's own setup/doctor config registry
(`src/setup/registrations.mjs`) work, can it generate a real random secret
(not just a static default), and where does the gateway's own token
actually get read from vs. where `fgos setup`/`fgos doctor` operate.

**Checked:**
- `src/setup/registrations.mjs:1-20` (module header) — the registry (D1/D2,
  `docs/history/setup-doctor-config-registry/`): `registerConfigDefault`,
  `registerCheck`, `registerFix` are three INDEPENDENT registrations (a
  module may use any subset).
- `src/setup/config-merge.mjs:1-15,40+` (`mergeConfigDefaults`) — pure
  fill-missing-only deep merge, never overwrites an existing value. A
  `registerConfigDefault` shape is a STATIC object evaluated once at
  module load — it cannot generate a fresh random secret per install.
- **Real precedent for "ship a key as `null`, arm it later"**:
  `registrations.mjs`'s own `workerSlots` registration ships `ceiling:
  null` deliberately — "present but unarmed... shipping the recommended
  NUMBER here would arm the gate the moment anyone runs `fgos setup`." The
  same shape fits `gateway.token`: register `{port: <default>, token:
  null}` so the section and its keys exist (visible to `doctor`,
  satisfying AGENTS.md's install/setup/doctor gate) without silently
  shipping a shared, predictable secret to every install.
- Real secret generation belongs in a `registerFix` function (D3,
  `docs/history/doctor-fix-gate-bypass/CONTEXT.md`) — `fix: (cwd) =>
  {changed, message}`, run only under `fgos doctor --fix`, matching the
  existing `gateBypass` fix's own read-merge-write pattern
  (`readSharedConfig`/`writeSharedConfig`, already imported).
  `src/runner/session.mjs:315` already uses `crypto.randomUUID()` for a
  different (non-secret) id; a bearer TOKEN calls for higher entropy —
  `crypto.randomBytes(32).toString('hex')` (256 bits) is the right primitive
  for this, not `randomUUID` (122 bits, and UUID's own dashes/version
  nibble aren't meant as secret-strength output).
- **Home vs. project config, a real distinction this fix must not blur**:
  `herdr-plugin/src/gateway.rs`'s `load_gateway_config` reads
  `~/.fgos/config.json` specifically (`home_dir` param, defaults to
  `$HOME`) — machine-level, not project-level. `bin/fgos.mjs`'s own
  `setup` verb already calls `ensureSharedConfigDefaults(os.homedir())`
  (a HOME-level pass through this SAME registry), so the static
  `registerConfigDefault` half needs no new wiring — it is already
  reached at the right path the moment it exists. `registerCheck`/
  `registerFix` functions, by contrast, receive `cwd` (typically a
  project checkout when `fgos doctor` runs) — no existing registered
  check reads `os.homedir()`'s config, so the gateway-token check/fix
  must explicitly target `os.homedir()`, not `cwd`, or it would check/fix
  the wrong file entirely.
- Nothing in `mergeConfigDefaults`'s per-entry model distinguishes
  "home-only" vs. "project-scoped" registrations — every existing entry
  (`gateBypass`, `cleanup`, `workerSlots`) flows through whichever `dir`
  `ensureSharedConfigDefaults` is called with, home or project alike.
  Registering `gateway` the same undifferentiated way is consistent with
  every existing entry, not a new mechanism — it will also appear (always
  `null`/default, harmlessly unread) in project-level config files, same
  as any other entry would if a caller ever ran the project-level pass for
  it.
- `herdr-plugin/src/gateway.rs:75-90` (`GatewayConfigError`'s `Display`)
  — current remediation text ("run `fgos setup` first... Add a
  `gateway: {token: ...}` entry to it") does not mention the real fix
  path once one exists; needs updating to name `fgos doctor --fix`.

**Still open:** none.
