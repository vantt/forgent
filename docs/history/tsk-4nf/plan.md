# plan.md — tsk-4nf: how-to doc cho node --test-name-pattern vacuous-pass trap

## Mode gate

0 flag áp dụng (không auth/data model/audit/external/public-contract/
cross-platform/existing-covered-behavior/weak-proof/multi-domain — thuần
viết 1 file markdown mới, nội dung đã có sẵn từ tsk-580). **Mode: tiny.**

## Approach

Viết `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`
theo khuôn 2 how-to doc chị em (`close-out-a-goaltier-milestone-...md`,
`close-out-a-decomposed-root-item-...md`): "Use this when", "Steps",
"Real example" (dùng đúng transcript thật từ `docs/history/tsk-580/
plan.md`/`iron-law-evidence.md`), "Why this happens", "Related". Không
split — 1 mảnh việc duy nhất.

## Verify

```
f=docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md; test -f "$f" && grep -q "test-name-pattern" "$f" && grep -q "tsk-580" "$f" && grep -qE "^## " "$f" && grep -q "iron-law-evidence" "$f" && [ "$(wc -l < "$f")" -ge 15 ]
```
