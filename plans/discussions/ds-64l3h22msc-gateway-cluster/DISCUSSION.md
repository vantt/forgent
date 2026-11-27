---
id: ds-64l3h22msc
title: "Gateway cluster: restore the gateway, split it into components, and make it the fast coordination fabric across machines and projects"
status: open
source:
  - p-i33nf2avje
created: 2026-11-27
---

discussion: open

## 1. Trạng thái hiện tại

Opened 2026-11-27 at the owner's request ("bật một shaper mới tìm cách khôi phục sự hoạt động của gateway"). Nothing is
settled yet. The seed below is what the opening session saw; the shaper scouts further and shapes it with the owner.

## 2. Mục tiêu & đề bài

Owner, 2026-11-27 15:54 (verbatim): "tìm cách khôi phục sự hoạt động của gateway, cần chia tách gateway lại thành
những component riêng biệt lo các việc riêng, và việc đầu tiên mong muốn nó xử lý là: 1) join các gateway ở các máy
khác nhau thành 1 cluster 2) gateway giúp điều phối nhiều project làm việc mượt trên nhiều máy 3) ứng dụng đầu tiên của
gateway là nhanh chóng truyền tải dữ liệu giữa các máy để việc điều phối của chúng luôn nhịp nhàng nhanh chóng và không
chồng lấp. ví du: mailbox quá chậm, events đi quá chậm, điều phối quá chậm. đầu tiên cần ứng dụng runtime để việc điều
phối plan/task được nhịp nhàng hơn (tất nhiên thông tin sự thật vẫn được lưu trữ trên file plan) nhưng có thể dữ liệu
sẽ đi trước bằng sự kiện điều phối trước."

Read as:

1. Bring the gateway back into service.
2. Split it into separate components, each owning one job.
3. First jobs: (a) gateways on different machines join one cluster; (b) the gateway coordinates many projects across
   many machines; (c) its first application is fast data transfer between machines so coordination stays quick and
   never overlaps (mailbox, events and coordination are too slow today).
4. First runtime use: plan/task coordination. The plan file stays the truth (L1, L3); a coordination event may travel
   ahead of it over the gateway.

## 3. Vấn đề rõ / chưa rõ

| Item | State | Evidence |
|---|---|---|
| The gateway is not running on fg-server | observed | `fgos gateway status --json` 2026-11-27 15:55: `running: false, reachable: false` |
| The gateway today is one binary `apps/fgos-gateway` (REST API, MCP search/execute, embedded web dashboard), owned by the `herdr-web-dashboard` row | observed | `docs/platform/system-overview/spec.md` lines 63, 185; `docs/platform/herdr-web-dashboard/spec.md` |
| An earlier split moved the gateway out of the herdr plugin | observed | `plans/261004-1534-fgos-gateway-boundary-split/plan.md` (done) |
| The gateway spans projects; fgOS core acts on one project | observed | commit 27b622317 (item component discussion) |
| Why the gateway stopped working, and since when | open | — |
| Mailbox and event delivery between machines are slow; how slow, measured where | open (owner observation) | `docs/platform/agent-mailbox/spec.md`, `docs/platform/event-store/spec.md` |
| Today plan placement and admission travel only through git pushes of `plan.md` (see `ds-izibwo45vm`, plan `261127-1535-plan-claim-who-and-where`) | observed | that plan; the gateway event would run ahead of this, never replace it |
| Cluster membership and trust between machines: Identity already has machine ids, signing keys and pins | observed | `docs/platform/identity/spec.md`; `fgos identity pins` |

## 4. Quyết định đã chốt

| ID | Decision | Date | Source |
|---|---|---|---|

## 5. Q&A log
