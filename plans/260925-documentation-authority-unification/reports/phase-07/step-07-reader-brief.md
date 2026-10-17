# Fresh-reader brief — cross-area candidate corpus

Answer as the candidate corpus will read after cutover; legacy may be cited as
provenance, never as owner. Start at `docs/platform/README.md`. Documentation
cutover changes the location of authority; it does not approve pending designs or
make planned implementation real. Report uncertainty rather than inventing proof.

You receive only this brief and the candidate entrypoint. Do not read the key,
review requests, other reader answers, plan reports, source code, contracts outside
the list below, legacy documents, root instructions, or either switchboard.
Do not mutate files. A coordinator records your answer outside the candidate corpus.
Do not run readers until the independent key reviewer has sealed the key.

## Reading contract

At most **eight distinct files for the whole run**, including the entrypoint and
all three scenarios together. A partial read, heading listing, glob, or search
that returns file contents counts as opening that file; rereads count once.
Only these eight candidate files may be read (this list is a scope boundary, not
an answer order):

- `docs/platform/README.md`
- `docs/platform/architecture-map.md`
- `docs/platform/component-boundary.md`
- `docs/platform/event-store/spec.md`
- `docs/platform/governance.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/platform-foundations.md`
- `docs/platform/process/spec.md`

Following a link outside this list is forbidden. You may name an external contract
or test named by an allowed document without opening it; say you have not checked
its contents or run it. The budget includes every search and tool-assisted read.

## Questions for each scenario

Answer separately for A, B and C, with real candidate `path#anchor` citations:

1. What should a stranger read first?
2. What kind of work is this, and where does its claim belong?
3. Which contracts or shared obligations does it touch, and who owns each side?
4. How much risk is there, and why? Distinguish settled, draft and implemented.
5. What reproducible proof would mean done? Distinguish required proof from proof
   you actually observed. Do not run implementation tests in this exercise.
6. What learning or settled decision must be left behind, and where?
7. Authoring probe: classify the made-up claim supplied below; identify its owning
   candidate document/location, required metadata and body links/registrations.
   Do not write the claim into the corpus.

## A — A lock timeout becomes takeover

A maintainer proposes that a cold-lock caller treat an unreadable process start
time as dead and use a TTL to take over a lock from a hung holder. The caller
would signal the bare PID directly. Assess the proposal across lock ownership and
process facts/control. Made-up authoring claim: “An unreadable process start time
is sufficient proof that a cold lock is free.”

## B — Faster Event Store publication

A proposed Event Store implementation would acknowledge writes before fsync,
seal while the Work state gate is held, and retain only a SQLite view instead of
replayable event history. Its author calls the ref-based design already approved
and implemented because it appears in the corpus. Assess durability, publication,
lock ordering and acceptance. Made-up authoring claim: “A SQLite cache is the
canonical event truth and needs no replay source.”

## C — A dashboard creates another completion writer

A new dashboard slice would launch a separate execution path, treat a successful
worker result as final Work completion, and write lifecycle state directly from
its surface adapter. Its author proposes to register it as a low-level process
primitive because it starts processes. Assess authority and the new slice's
registration and verification. Made-up authoring claim: “The dashboard owns the
decision that a successful worker run makes a Work item done.”

## Output

Give your session identity and start timestamp, then an ordered log of every file
opened, including search/heading reads and purpose. Give A1–A7, B1–B7 and C1–C7.
Cite only anchors you verified in allowed files. Report missing routes, contradictions,
budget pressure and any accidental out-of-scope read. A proposal in a scenario is
not permission to implement it. Your answer must stand without chat history.
