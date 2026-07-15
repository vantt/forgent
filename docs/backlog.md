# Product Backlog

| ID | Story | CoS | Status | Feature |
|----|-------|-----|--------|---------|
| P3 | Compound-learning trên routing (Phase 3): vòng predicted→actual, capture 2 kênh, entropy-trend, evolving human-gated | Vòng predicted→actual chạy thật với bằng chứng output (tiêu chí F4, luật L6) | in-flight | [phase-3-compound-learning](history/phase-3-compound-learning/) |
| P4 | Distillery lên state layer làm consumer thứ hai (porting lifecycle thành FSM) | Trạng thái porting đọc/ghi qua cùng một cửa state layer, dựng lại được từ event log | proposed | — |
| P5 | Xem xét thay bee bằng state layer của forgent — chỉ mở khi forgent đạt F3 (ngưỡng tên, per D2 phase-1-state-layer) | Quyết định có/không kèm case study vận hành song song | proposed | — |
| P6 | Fan-out song song N worker trên frontier | Anti-loop đã chứng minh trong vòng chạy thật (ngưỡng A1 phase-2-routing); N worker không phá single-writer | proposed | — |
| P7 | Trường priority cho frontier ordering | FIFO-theo-seq lộ giới hạn thật được ghi nhận | proposed | — |
| P8 | Intent-scoring + signal-driven chaining (hướng đã chốt từ consult) | Phase 2 đóng; có case cần reactive dispatch | proposed | — |
| P9 | Merge tự động đề xuất của worker khi review sạch | Vòng đề-xuất-duyệt chạy tay đủ tin cậy, có số liệu | proposed | — |
| P10 | Install/coexistence story của fgOS: cài vào project/global không giao thoa tiến trình với harness khác (doctrine scope lãnh địa, hook gate theo path, một-nhạc-trưởng-mỗi-phiên, phát hiện marker harness khác lúc cài) | Canary chạy trong project cài CẢ bee lẫn fgos: hai bên không chặn nhầm write của nhau, agent không nhận mệnh lệnh điều phối mâu thuẫn | proposed | — |
| P11 | Ly khai bee (xưởng, gốc) ↔ forgent (sản phẩm, ./repo): artifacts hai bên tách tuyệt đối, release sạch không rác | Baseline verify xanh nguyên trạng trong ./repo; một cell bee smoke chạy trọn vòng ghi vào ./repo; fgos ready + runner --dry-run chạy đúng chỗ mới; doctrine hai bên tách đôi | done | [repo-divorce](history/repo-divorce/) |
| P12 | Export chưng cất sử ký sản phẩm: sinh decision-records/changelog vào docs/decisions/ của forgent từ hồ sơ xưởng (per D3 repo-divorce) | Người ngoài đọc docs/decisions/ hiểu các quyết định lớn của sản phẩm mà không cần vào xưởng | done | [decision-records-export](history/decision-records-export/) |
| P13 | Evolving loop human-gated (F5): tự-sửa 2-gate (Gate A chọn / Gate B duyệt diff), explicit-accept-per-item, Iron Law cho skill sửa hệ, push never automatic | Vòng evolving chạy human-gated với outcome đo được (tiêu chí F5, luật L6); diff được người duyệt trước khi push, không bao giờ tự động | proposed | — |
| P2 | Routing trên state (Phase 2): frontier sẵn-sàng thành lệnh, chain handoff, recovery matrix + anti-loop, runner tuần tự | Agent lạ tự tìm việc kế tiếp bằng truy vấn derive, không danh sách tay (tiêu chí F3, luật L6) | done | [phase-2-routing](history/phase-2-routing/) |
| P1 | forgent tự quản work-state của chính nó qua tầng state/FSM (Phase 1: store zero-dep, transition có precondition, single-door, CAS, decisions event-sourced) | Một agent lạ, không chat history, trả lời "đang ở đâu / việc gì đang mở" từ state chứ không từ trí nhớ (tiêu chí F2, luật L6) | done | [phase-1-state-layer](history/phase-1-state-layer/) |
