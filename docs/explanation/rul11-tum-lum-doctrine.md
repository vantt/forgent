---
authoritative_for: RUL11 tùm lum doctrine, "khong phai no nang ma no tum lum" anchor phrase, D-ADR0036
---

# RUL11 — why "heavy" was the wrong diagnosis

`tsk-7u7` locked a user-stated production philosophy into `AGENTS.md` as
RUL11 (D-ADR0036, `docs/specs/platform-foundations.md`), with a literal
anchor phrase kept on one un-wrapped line so it stays grep-matchable:
`khong phai no nang ma no tum lum`.

## The rule, verbatim

> Không có việc nặng, chỉ có việc tùm lum. Một việc trở nặng vì thiếu và
> quên chứ không vì bản chất nó lớn; nên "nặng" là chẩn đoán sai, tên
> đúng của nó là TÙM LUM. Thấy tùm lum thì gom lại, gom tới khi hết — quy
> mô không bao giờ là lý do miễn trừ. Đích của mọi lần gom là một hình
> dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến hình dễ,
> không chắp vá.

In short: something doesn't become hard because it's inherently large —
it becomes hard because pieces are missing or forgotten. The correct
diagnosis for that state is "scattered" (tùm lum), not "heavy." The fix
is always to consolidate, regardless of scale, toward one target shape:
clear boundaries, an explicit contract, easy to change and reshape, never
patched over.

## Why this became a locked rule, not a note

It had a real, dollar-real cost already inside the same session that
produced it. `tsk-2uf-1`'s first draft was scoped as "add a `--work` flag
to `executeExecutorCli`" — one more door into an already ten-door pile,
rationalized as "additive." Measured on the actual file: `dispatch.mjs`
was 2204 lines holding six genuinely separable concerns with no boundary
between any of them (config+validators alone were 794 lines, 36% of the
file). That was the real "tùm lum" — not that dispatch was inherently
complex, but that six unrelated concerns shared one file so each leaked
into the others' reasoning. The user's own correction reframed the fix:
not "add a flag" but "regroup into modules with a named concept in the
middle" (`prepareDispatch`) — the shape that actually shipped (see
`docs/reference/dispatch-module-boundaries.md`).

## The anchor phrase mechanism

`khong phai no nang ma no tum lum` is kept on one line, unwrapped, so a
literal grep for that exact string always matches — `test/docs/
rul11-anchor-phrase.test.mjs` asserts it's present in `AGENTS.md`. This is
deliberately a doctrine loaded every turn (via `AGENTS.md`'s always-loaded
context), not a note buried in a spec someone has to go looking for — the
point of locking it here is that no future session forgets the target
shape mid-work, the same way `tsk-2uf-1`'s first draft nearly did.
