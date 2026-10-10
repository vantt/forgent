# Yêu cầu targeted review: nhãn carriage và binding kế thừa

**READY FOR REVIEW — chưa đóng batch, chưa hoàn tất Phase 6.**

- Worktree: `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`
- Branch: `plan/260925-documentation-authority-unification`
- Authored inventory/accounting commit: `91a899f1863b2147a0f96db855dd0b2695fddc95`
- Current prose commit: `4add5ba7112a1792698e8a41a9c39b3f28eb438a` (không sửa thêm prose trong lượt A24).
- Receipt commit: `e3989e217d932ced11b99f40f7cfd9c9097c6c31`
- Author session: `codex-session:1@2026-10-10`
- Owner authorization: A23 `98427bec4`, A24 `8af99d966`; real digest/ancestry theo A22.

## Phạm vi chính xác

| Hạng mục | Số item | Packet / dữ liệu |
|---|---:|---|
| Source rows bị tác động | 48 | `review-pack-2-carriage-labels-source.md` và `.md.json`; `review-input-2-carriage-labels-source.json` ghi shard vật lý |
| Retired successors bị tác động | 114 | `review-pack-2-carriage-labels-current.md` và `.md.json`; `ledger/retired-unit-decisions.json` |
| Current-unit receipts | 42 | 41 candidate-native-content + 1 structural-frame; supplementary packet; `ledger/candidate-classifications-agent-coordination-carriage-labels.json` |
| Current sections đã đổi | 6 | supplementary packet và `truth-ledger-agent-coordination.json` |
| Tổng verdict item | 210 | Không mở rộng thành review toàn area |

48 source rows là hợp của 12 nhãn A23, 37 binding phát sinh thật và hai nhãn kế thừa cùng batch; có giao nhau. 25 pending và 23 ordinal/control vẫn có approval vật lý hợp lệ cũ; view native để pending chỉ nhằm re-confirmation, không sửa approval vật lý bằng view. 114 successors là hợp đã deduplicate của các nhãn/binding thật, gồm hai lỗi được A24 nêu đích danh, 25 wrong-ordinal carrier và 70 nhãn move kế thừa có đổi từ claim-bearing. 51 reference cũ được rút và thay bằng 41 current identity thật, cộng structural frame mới. 13 historical IDs vẫn nằm trong native registry gaps, hai IDs đã retired/accounted; không tạo retirement/identity giả, không mất ID. Mỗi source unit và target trong supplementary đã được so với native reader tại commit thật.

Đọc `carriage-label-binding-completion.json` để thấy full before/after, nguồn immutable, lý do riêng từng row và ancestry/digest thật. Các receipt artifact cũ không đổi. `carriage-label-binding-verification.json` chứa nguyên argv và proof numbers; không có seeded pack/red-team ở targeted non-checkpoint này.

## Reviewer phải kiểm tra

1. Dùng session khác author. Đọc **mọi row** trong phạm vi. Không nhận author citations như bằng chứng đã độc lập kiểm tra; mở code/file:line thật. Không approve cả nhóm bằng một nhận xét chung.
2. Áp dụng vocabulary whole-unit A23: có đổi claim-bearing words thì supersede; partial-carry khi chỉ mang một phần và phải ghi remainder; move/promote chỉ khi mọi claim giữ nguyên. Kiểm tra toàn source và toàn counterpart, không chỉ heading hoặc blob digest. Các nhãn supersede mới vẫn cần verdict semantic, không phải tự chứng nhận.
3. Kiểm tra hai bindings A24: `claim_a5d7cd08266654056f95caaca04e2e7b` tới full Domain Augmentation primitive, `claim_63156a6026de7a0ff7fbad44aa1b4281` tới full confidence table, không intro. Kiểm tra 25 carriers literal cùng-source, 70 retired relabels và hai current-source relabels cùng batch.
4. Kiểm tra 42 receipts theo actual current claim ID, digest, whole shown digest, real heading ancestry và code evidence digest; 10 reference trùng được hợp về actual units, không double-own. Trace mọi historical ID về native gap/retired proof. Pending không tự đóng reverse units.
5. Kiểm tra mọi current-state sentence trong sáu sections: mandatory Work primary compatibility và non-weakening; đề xuất legal-only recommendation/driver verification, optional field chưa được consumer dùng; blocked evidence obligation khác conditional validator; toàn confidence ladder; giữ failure pane mặc định/closeAlways override; status/idleness không là completion/result truth; cite resolver, run.json updates và runner item đúng dòng.
6. Chạy lại gates theo nguyên argv trong verification JSON, với **hai** `--previous-registry` riêng biệt. Không opt-out authorship, không carry approval khi text/ancestry đổi, không baseline/checker/vocabulary/gate change. Không viết main, không dispatch/subagent trong execution này, không state-changing fgos/fgctl.

## Reports cần commit

- `review-2-carriage-labels-source.md`: `Reviewer`, `Author session`, `Review mode: ordinary`, `Pack commit: 91a899f1863b2147a0f96db855dd0b2695fddc95`; table `| Claim | Verdict | Source digest | Target digest | Note |` (48 verdicts). Native unit digest lấy nguyên từ native sidecar; full shown-text digests nằm trong supplementary sidecar và phải kiểm tra cả body.
- `review-2-carriage-labels-retired.md`: cùng header và table (114 verdicts); digest source/target native đã chứng minh từ commit.
- `review-2-carriage-labels-classifications.md`: `Reviewer`, `Author session`, `Receipt commit: e3989e217d932ced11b99f40f7cfd9c9097c6c31`; table content `| Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest |` (41 verdicts); structural-frame dùng table sáu cột bỏ Evidence digest (1 verdict).
- `review-2-carriage-labels-current.md`: sáu verdict section, format `| Section | Lines | Prior defect | Verdict | Finding and evidence |`; ghi pinned inventory/current text commit và code/file:line độc lập.

Commit reports bằng explicit paths, conventional message không phase/plan/finding codes; trước git write phải `pwd && git branch --show-current`. Chỉ report đã commit từ reviewer session khác mới được apply; không tự đánh reviewed.

## Proof hiện tại — không tô xanh strict E

| Check | Kết quả quan sát |
|---|---|
| Full D, previous reports/identity-registry.json | exit 0; fatal 0 |
| Full D, previous reports/phase-02-identity-registry.json | exit 0; fatal 0 |
| Strict E scoped toàn batch, mỗi prior riêng | cả hai exit 1: pending 74; identical-unit multiple owners 342; reverse-open 688 |
| Ratchet | 995 legacy files; 25 accounted edits; 1 accounted addition; exit 0 |
| Placement / vocabulary | 504 files; 503 matched + 1 recorded exception; 0 leftovers/ambiguous; 17/12/27 vocabulary unchanged |
| Routing H | 30 inherited findings; 0 new; 0 removed; baseline không đổi |
| Preservation / isolation | 74 historical witnesses; 867 payloads; history/five pins unchanged; 188 first-parent commits; 0 allowlist violations; exactly 8 allowed commit/path exceptions; authority/reader links unchanged |
| Tests | 51 explicit files; 912 pass; 0 fail/skip/cancel/todo |
| Real read-only smoke | 41 assertions; actual CLI descriptor + runtime/schema/resolver/recovery/stance APIs; không gọi mutation |

Strict E giữ đúng ba loại open đã ghi ở accounting trước: trước đây pending 136, identical 342, reverse 693; hiện 74/342/688. Không thêm baseline, không sửa gate để giả pass. Vì còn những open này, **review request này không hứa tự đóng batch**; sau apply committed reports phải rerun strict E toàn batch và xử lý phần open thực tế theo contract, giữ ba Coordination Rings holds. Independent acceptance, strict closure và live/mutating execution: **UNPROVEN**.

## Owner queue / bước kế tiếp

- Archive/delete: không có đề xuất mới. Promoted portal: không đổi. Sáu current-file edits cũ đã được ghi trong `promoted-edits.md`; không thêm prose/promoted edit trong A24.
- Main/code/spec conflict: không có yêu cầu mới; hai runner conflicts đã được main xử lý. Plan B đã xong, không làm thêm với main.
- Ba Coordination Rings holds vẫn pending, không approval; 46 history-source pending ngoài phạm vi và confinement-spec successor vẫn ở batch của chúng.
- Anh chuyển request này cho một reviewer session khác, reviewer commit bốn reports trên. Em **dừng ready for review**, không tự apply, không bắt đầu batch tiếp. Sau committed review mới được apply verdict và chứng minh closure.
