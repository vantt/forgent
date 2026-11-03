# Runner Actors & Access


```txt
Document type: Specification
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading the scope, contracts and implementation limits stated here
Do not use this for: Claims outside the stated scope or unrecorded implementation proof
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/runner/spec.md
Supersedes: The mapped source location; source provenance is retained
Superseded by: None
```

> Body retained from `docs/specs/runner.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; source section numbers and implementation limits remain explicit. Reader routes and authority metadata are adapted to this holder.

## Actors & Access

| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |
| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Carriage note: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |
