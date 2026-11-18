# Owner question: how phase 7 (landing use case) pushes and catches up local main

Asked by lead:SUPERVISION, 2026-11-18. Plan 261118-1045-project-supervisor, phase 7. Phase 7 is parked; phases 1-5
and 8 are landed, phase 6 is in review. Nothing else in the plan waits on this until phase 16.

**Chuyện gì đang xảy ra:** Phase 7 must land a branch with `fgos land`: merge, run the gates, push to the remote, and
only then move local main, so local main never holds an unpushed land (plan step 3). The seat wrote the use case with
16 tests. 11 of them fail because the Git crate refuses two steps the plan relies on.

**Nguyên nhân:** I checked the seat's report against the source on main.
1. A push of `refs/heads/main` is refused while our own Land session holds `main`. `prepare_land` opens a WAL chain on
   the destination ref, and `push_refs` runs `refs::admission` against every active chain on that ref. Only Land's own
   `admission_land` is exempt (`packages/git/rust/src/refs.rs:81-88`, `land.rs:451,606`). The test fails with
   `push: resource-recovery-required`. Remote also refuses any `refs/fgos/*` source (`remote.rs:120,215`), so the
   candidate pin ref cannot be pushed directly. The seat worked around that with a short-lived `refs/heads/` branch.
2. No port fast-forwards the main checkout to the fetched remote tip. That is needed when local main is behind the
   remote: on the retry path, and on `--paths`. `fast_forward_checked_out` refuses the main checkout on purpose
   (`refs.rs:648`; `docs/platform/git/spec.md:160`). `advance_ref` refuses a checked-out branch. A Land of the remote
   tip would add a `--no-ff` merge commit.

**Các lựa chọn:**
- **A. Extend the Git crate (two small ports), keep the plan.**
  - What: (a) `push_refs` admits past an active Land chain when the push carries that same Land's binding and
    destination, as a single exemption next to `admission_land`. (b) A catch-up port that fast-forwards the main
    checkout's trunk to a fetched remote-tracking tip. It is allowed only when the main checkout is clean and the move
    is a pure fast-forward, under the same worktree-admin 40 and read-back as `publish_land`. It is not a general
    lifting of `main-checkout-fast-forward-refused`.
  - Gain: the plan's invariant holds ("local main never holds an unpushed land"), and retry and `--paths` work as
    planned.
  - Harm: it touches the Git crate. That code is owned by the Git lane and reviewed by lead:OPC, and the plan did not
    list it in any footprint.
  - Cost: about 150-250 lines of Rust plus tests in `packages/git/rust/{refs,remote,land}.rs`, a Git spec row, and
    about half a day. It would be a new phase 7a before phase 7.
- **B. Change the plan: publish first, push second.**
  - What: Land publishes local main, then a plain push follows after the session has closed. If the push is rejected,
    local main holds an unpushed land and phase 7 refuses `land-remote-diverged`, naming the commit.
  - Gain: no Git change; phase 7 lands today.
  - Harm: we drop the invariant. A rejected push leaves the shared main checkout ahead of origin, and someone has to
    repair it. The catch-up for `--paths` is still missing, so `--paths` can only refuse when local main is behind.
  - Cost: plan text plus about 50 changed lines in `land.rs`.
- **C. Land in a throwaway linked worktree, as `land-branch.sh` does today.**
  - What: merge in a linked worktree on a branch based on `origin/main`, run the gates there, and push `HEAD:main`
    (a non-forced compare-and-swap). The main checkout is never touched; it catches up by its normal pull.
  - Gain: no Git change; no unpushed local land is possible; it matches the procedure that has landed every branch
    today.
  - Harm: the main checkout lags until someone pulls it. Gates run in the linked worktree, not in the main checkout.
    PS-3 ("land merges through the Git Land port") changes to "merge in a linked worktree through Git's worktree and
    merge ports". We need to confirm such a merge port exists; if it does not, C becomes A.
  - Cost: plan PS-3 text plus a rework of `land.rs` (about 300 lines), about half a day.

**Khuyến nghị:** A. It is the only option that keeps both plan invariants and the deliberate main-checkout rule
intact (the catch-up is narrow: clean and fast-forward only). The cost is small, and phase 7 has no downstream waiter
before phase 16, so a half-day phase 7a delays nothing that runs now. Choose C if you would rather the supervisor
never move the main checkout at all.

**Phạm vi của câu trả lời:** "A" authorizes a new phase 7a in this plan with footprint
`packages/git/rust/src/{refs,remote,land}.rs`, `packages/git/rust/tests/*land*`, `docs/platform/git/spec.md`, reviewed
by lead:OPC, then phase 7 re-run unchanged. It does not lift `main-checkout-fast-forward-refused` for anything else.
"B" or "C" authorizes the matching plan-text change (PS-3, phase 7 steps) and a rework of phase 7 only. None of the
three touches any other phase.
