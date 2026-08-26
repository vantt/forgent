# orchestrator-vocabulary-disambiguation-pointer — RESEARCH

Item: `tsk-4ah`.

## Round 1 (2026-08-26) — verify the 6 concrete claims in the submit text

Asked: does the repo's current state actually back every citation the
item's own description makes (file paths, line numbers, banner precedent),
before the discovery-stage verdict can be `clear`?

Checked (all direct repo reads, no external lookup needed — every claim
names a file already in this repo):

1. **`docs/decisions/index.md` lines 28-32** — read directly. Confirmed:
   line 28 = D-ADR0026 (orchestrator, old meaning, retired, narrative moved
   to runner.md), line 29 = D-ADR0028 (renamed to "launcher" + guard),
   line 30 = D-ADR0029 (fixes rootTask/subTask/capacity vocabulary;
   "orchestrator = tầng hợp thành T0"), line 32 = D-ADR0031 (guard removed,
   "ADR0029 D17 đã gán nghĩa chính thức"). Chain confirmed exactly as
   claimed. (Line 31 is D-ADR0030, unrelated — the four target lines are
   28/29/30/32, still inside the "28-32" span the item names.)

2. **`docs/history/orchestrator-worker-slots/DISCUSSION.md`** — exists
   (624 lines). Uses "orchestrator" throughout in the NEW meaning (T0
   composition layer generalized over herdr/tmux/cmux — see lines 25, 65,
   68, 169, 188, 192, 194, 257, 461, 465, 582). It DOES cite
   `docs/decisions/0026` three times (lines 64, 96, 389) — but only for the
   unrelated `capacity` vocabulary point (D1's reasoning for picking
   "worker slot" over "capacity"), never to explain that "orchestrator"
   itself changed meaning across 0026→0028→0029→0031. No citation of
   0028/0029/0031 or of `index.md`'s chain anywhere in the file. A
   disambiguation banner here would be net-new information, not a
   duplicate.

3. **Precedent banner pattern** — `docs/history/runtime-claim-doing-
   separation/CONTEXT.md` lines 3-19: a blockquote directly under the H1,
   opening `> **SUPERSEDED (<date>) — đọc <path> trước khi implement bất cứ
   gì dựa vào file này.**`, then a short paragraph explaining what changed
   and why, closing with a `Nguồn xác nhận:` line. Reusable shape for a
   same-spirit (not superseded, but sense-disambiguation) banner: bold
   dated label, one-line pointer to the authoritative doc first, then brief
   context, no rewrite of surrounding prose.

4. **`docs/explanation/why-the-launcher-vocabulary-word-guard-was-retired-
   right-after-tsk-1s5-fixed-it.md` line 51** — read directly: `guard —
   lives in \`docs/decisions/0031-bo-guard-cam-tu-orchestrator-sau-khi-0029-
   gan-nghia-moi.md\`.` Confirmed exact line number and exact dead path.
   Confirmed the cited file does not exist on disk (`ls` → No such file or
   directory) — retired per tsk-1lv-4, as the item states.

5. **`docs/specs/runner.md`** — `grep -n "0031"` → line 2107:
   `### 0031 — Bỏ guard cấm từ \`orchestrator\` sau khi \`0029\` đã gán
   nghĩa mới`. Confirmed exact heading text and exact line number — the
   item's "~2107" guess is exact, not approximate.

6. **`docs/specs/reading-map.md`** — `grep -n` → line 15: `- \`docs/
   decisions/\` — hồ sơ quyết định dài hạn cho người ngoài (decision
   records); ...`. Confirmed exact line and phrase match.

## Verdict

All 6 points: `clear: true`. Every citation the submit text makes resolves
to real, exact repo content — no guessed line number was wrong, no cited
file's content was misdescribed, and the disambiguation banner would add
genuinely new information (point 2). No open question remains for a
person to resolve; nothing here calls for a product decision, only a
docs-anchoring fix already fully specified by the item itself.
