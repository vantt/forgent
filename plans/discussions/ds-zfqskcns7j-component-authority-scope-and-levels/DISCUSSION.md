---
id: ds-zfqskcns7j
title: "Component authority: what it covers and whether the model needs a module level"
status: open
source:
  - p-adv35azsca
created: 2026-11-25
---

discussion: open

# Component authority: phạm vi, module và các góc nhìn tầng

```txt
discussion: open
topic: backlog row p-adv35azsca; nối tiếp ds-at6x3xj2ng (component-authority, settled 2026-11-21)
shaper: head:shaper-component-authority
opened: 2026-11-25 (chủ dự án qua thư ký); round 1 ghi 2026-11-25 14:15
domain: platform (cross-area); không có domains/<domain>/AGENTS.md áp dụng
open owner questions: chưa đặt vào question store (đang thảo luận trực tiếp với chủ dự án)
```

## 1. Trạng thái hiện tại

2026-11-25 14:20 round 2: chủ dự án chọn A cho Q1 (component = sở hữu, module = đóng gói vật lý, không thêm hàng module; §3 hàng 7), tạm chốt, chưa mint D-ID. Đang bàn Q3 (các trục tầng). Q2 chưa bàn.

2026-11-25 14:15 round 1: chủ dự án hỏi mô hình đang quản những gì, rồi mở thêm hai hướng: (a) module có phải là cách đóng gói component, (b) "tầng" có nhiều góc nhìn chứ không chỉ một lát cắt, có lần từng bàn tầng chỉ có 3 lớp. Shaper đã dò mô hình và tài liệu (§3 hàng 1-6). Chưa chốt gì. Đề xuất đang chờ chủ dự án phản hồi: tách nghĩa chữ "module" khỏi "component" nhưng chưa thêm hàng module (§3 hàng 3); đặt tên riêng cho từng trục tầng (§3 hàng 9). Mở: Q1 module, Q2 ranh giới sở hữu, Q3 các trục tầng.

## 2. Mục tiêu & đề bài

Mô hình `packages/component-authority/model/` là nơi duy nhất trả lời "ai sở hữu gì" (ds-at6x3xj2ng). Chủ dự án muốn xem lại ba điểm: mô hình có cần biết cấp module (và submodule) không; những gì component-authority sở hữu hiện đã đúng chưa; và "tầng" nên được hiểu là nhiều trục nhìn khác nhau chứ không phải một lát cắt duy nhất. Mục tiêu là mô hình có từ vựng không trùng nghĩa (cùng chữ phải cùng nghĩa, bài học 3b của ds-at6x3xj2ng), và mỗi trục tầng mà hệ thống thật sự dùng để quyết chỗ đặt code đều có tên, có chủ và nếu cần thì có phép kiểm.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Bằng chứng | Trạng thái |
|---|---|---|---|
| 1 | **Mô hình đang quản những gì.** Component: 71 hàng (`owns`, `mustNotOwn`, `layer`, `tier`, `paths`, `spec`). Subcomponent: 16 hàng có `parent`, chỉ một cấp, không hàng nào có cháu. Tầng: `layers.yaml` 5 tầng + 3 luật xếp tầng + tier 0-9. Contract: chỉ mục 159 hàng (provider, consumers, path), không giữ nội dung. Loại quyết định: 9 hàng (owner + nơi để narrative), không giữ từng quyết định (D-ADR, D-ID). Cửa: 83 file `model/doors/`. Không có hàng module hay submodule. | `packages/component-authority/model/*.yaml`; spec `docs/platform/component-authority/spec.md` §2.2 và dòng 203 | Rõ |
| 2 | **Lệch nhỏ phát hiện khi dò.** (a) 8 subcomponent của `runner` mang id dạng băm (`h-02842f76ffd2` …), không phải tên có nghĩa. (b) Chỉ 9 loại quyết định cho 71 component: phần lớn component chưa khai mình quyết loại việc gì. (c) Hàng `component-authority` vẫn ghi `status: designed`, đúng ra là `live` (ghi ở ds-at6x3xj2ng §1, việc sửa giao thư ký). | `components.yaml` (parent = runner); `decision-kinds.yaml` | Rõ là lệch; (a), (b) thuộc Q2 |
| 3 | **Module là gì.** Repo dùng chữ "module" theo hai nghĩa. Nghĩa 1: `docs/platform/component-boundary.md` §4 viết "component/module" là một khái niệm, đơn vị đóng gói ("Use components to decide packaging"), tách khỏi bounded context và authority boundary. Nghĩa 2: `core/instructions/design-principles.md` dùng "function, module, helper", "shared leaf module", tức một file `.mjs` hay module Rust. Thực tế mô hình: 6 component trải nhiều thư mục (vd. `work-state` = `src/state/`, `src/intake/`, `src/evolve/`; `host-surface` = `bin/`, `src/cli/`, `src/verbs/`); 0 package/crate thuộc hai component. Tức là: component = đơn vị sở hữu; package/crate/thư mục/file = đơn vị đóng gói; một component có một hay nhiều đơn vị đóng gói, mỗi đơn vị thuộc đúng một component. | `component-boundary.md:274-309`; `design-principles.md:18,27-28`; đếm từ `components.yaml` | Rõ (sự thật); **đề xuất shaper, chưa chốt:** tách nghĩa (component = sở hữu, module = đóng gói vật lý) nhưng chưa thêm hàng module, vì `paths` + luật "mỗi đơn vị đóng gói thuộc đúng một component" đã giữ quan hệ mà không sinh sổ thứ hai |
| 4 | **Lớp "3 tầng" chủ dự án nhớ.** Là hướng của chủ dự án 2026-11-14, ghi ở `docs/platform/vision.md` §6: **Execution** (chạy chắc một Unit), **Workflow** (điều phối nhiều Unit, chỉ cơ chế chung), **Domain** (doctrine + nghiệp vụ từng lĩnh vực); Work không phải tầng nền, nằm trên Domain; kèm phép thử đặt chỗ (mang tên nghiệp vụ thì thuộc Domain). Trạng thái: hướng, chưa phải luật khóa. | `docs/platform/vision.md:83-186`; program board log 2026-11-14 15:08 | Rõ |
| 5 | **Các trục tầng đang cùng tồn tại.** (i) Hướng phụ thuộc code: 5 tầng `entry`, `use-case`, `infra`, `domain`, `kernel`, mỗi file một hạng, test kiểm. (ii) Tier 0-9: component đứng trên/dưới component nào, test kiểm. (iii) Execution / Workflow / Domain (+ Work bên trên): tầng sản phẩm, mô hình chưa biết, không gì kiểm. (iv) Core vs `domains/<name>/`: dùng chung hay riêng một domain; đã thực hiện (tsk-397), mô hình chỉ giữ danh sách `domains`. Ngoài ra có các cách chia 3 lớp **bên trong** một component (pure core / fs store / git shim ở ds-rgiiiu46gz; contract / integration / storage ở ops-metrics OM-D4; dispatch / routing / driving), không phải trục của toàn hệ. | `layers.yaml`; `vision.md` §6; `docs/explanation/core-foundation-domain-boundary.md`; `plans/261118-0936-ops-metrics/plan.md:41` | Rõ (sự thật) |
| 6 | **Xung đột giữa các trục (đã ghi sẵn ở vision.md "Known gaps").** (a) Tier đặt Work ở 7, Domain ở 8, tức Domain trên Work; trục (iii) đặt Work trên Domain. Vision ghi đây là khoảng trống, sửa cùng coding cutover. (b) Chữ `domain` ở trục (i) không cùng nghĩa với tầng Domain ở trục (iii): ca "cùng chữ, khác nghĩa". | `vision.md` §6 Known gaps | Rõ là xung đột; cách xử lý thuộc Q3 |
| 7 | **Q1 — cấp module.** Có cần (a) tách nghĩa chữ, (b) hàng riêng cho đơn vị đóng gói (crate, package) hay `paths` đủ? Ba hướng: A tách nghĩa, không thêm hàng; B thêm hàng module; C giữ nguyên. | hàng 3 | **Chủ dự án chọn A (round 2, 14:15).** Component = đơn vị sở hữu; module = đơn vị đóng gói vật lý (crate, package, thư mục); luật "mỗi module thuộc đúng một component" vào spec và kiểm bằng test qua `paths`; sửa chỗ gộp "component/module" ở `component-boundary.md` §4; không thêm hàng module. Mở lại sang B chỉ khi có câu hỏi thật mà `paths` không trả lời được (vd. một crate cần chủ khác thư mục chứa nó). Tạm chốt; mint D-ID khi giữ nguyên qua round sau. Chưa quyết: nghĩa "module = một file code" ở design principles đổi chữ thế nào (vd. "file" hay "source module"). |
| 8 | **Q2 — ranh giới sở hữu của component-authority.** Hiện tại có đúng không; có cần xử lý hàng 2 (a), (b) không. | hàng 1-2 | Mở, chưa bàn |
| 9 | **Q3 — nhiều trục tầng.** Mô hình nên giữ nhiều trục có tên riêng (vd. trục phụ thuộc code, trục tier, trục tầng sản phẩm, trục core/domain), mỗi component khai vị trí trên từng trục; hay giữ một trục và ánh xạ các trục kia sang? Trục (iii) có nên vào mô hình để có phép kiểm đặt chỗ không? | hàng 4-6 | Mở; **đề xuất shaper, chưa chốt:** mỗi trục một tên riêng, bỏ chữ "layer" chung chung, đổi tên hạng `domain` của trục (i) để hết trùng nghĩa |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Ngày | Nguồn |
|---|---|---|---|

Chưa có.

## 5. Q&A log

- 2026-11-25 13:40 — Chủ dự án: "hiện component này đang quản lý cả component, subcomponent, module, submodules, architect-layer và cả contract đúng không?" Shaper: component, subcomponent (một cấp), tầng, chỉ mục contract: có; module, submodule: không; thêm loại quyết định và cửa (§3 hàng 1).
- 2026-11-25 13:42 — Chủ dự án: "loại quyết định hay quyết định?" Shaper: chỉ loại quyết định (owner + nơi để narrative); từng quyết định nằm ở spec từng khu vực.
- 2026-11-25 14:00 — Chủ dự án: "với khái niệm layer, có thể có các góc nhìn khác nhau về layer chứ không phải chỉ có 1 lát layer … anh nhớ có lần từng thảo luận về layer chỉ có 3 lớp." Shaper: tìm thấy `vision.md` §6 (Execution / Workflow / Domain) và bốn trục tầng đang cùng tồn tại (§3 hàng 4-6).
- 2026-11-25 14:10 — Chủ dự án: "module có phải là cách đóng gói component?" Shaper: theo `component-boundary.md` §4 thì đúng, nhưng repo còn dùng "module" nghĩa một file code; thực tế component = sở hữu, package/crate/thư mục = đóng gói (§3 hàng 3).
- 2026-11-25 14:15 — Chủ dự án: "ok, ghi vào ds-zfqskcns7j đi em."
- 2026-11-25 14:15 — Shaper đặt Q1 với ba hướng A (tách nghĩa, không thêm hàng), B (thêm hàng module), C (giữ nguyên), nghiêng A. Chủ dự án: "A".

## 6. Thiết kế đã chốt {#design}

Chưa có thiết kế chốt. Hiện trạng đã dò: §3 hàng 1, 3, 5.

## 7. Danh mục hạng mục / task {#tasks}

Chưa có; chờ Q1-Q3.
