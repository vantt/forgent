# Product Backlog

| ID | Story | CoS | Status | Feature |
|----|-------|-----|--------|---------|
| P2 | Routing trên state (Phase 2): frontier sẵn-sàng thành lệnh, chain handoff, recovery matrix + anti-loop | Agent lạ tự tìm việc kế tiếp bằng truy vấn derive, không danh sách tay (tiêu chí F3, luật L6) | proposed | — |
| P3 | Compound-learning trên routing (Phase 3): vòng predicted→actual, capture 2 kênh, entropy-trend, evolving human-gated | Vòng predicted→actual chạy thật với bằng chứng output (tiêu chí F4, luật L6) | proposed | — |
| P4 | Distillery lên state layer làm consumer thứ hai (porting lifecycle thành FSM) | Trạng thái porting đọc/ghi qua cùng một cửa state layer, dựng lại được từ event log | proposed | — |
| P5 | Xem xét thay bee bằng state layer của forgent — chỉ mở khi forgent đạt F3 (ngưỡng tên, per D2 phase-1-state-layer) | Quyết định có/không kèm case study vận hành song song | proposed | — |
| P1 | forgent tự quản work-state của chính nó qua tầng state/FSM (Phase 1: store zero-dep, transition có precondition, single-door, CAS, decisions event-sourced) | Một agent lạ, không chat history, trả lời "đang ở đâu / việc gì đang mở" từ state chứ không từ trí nhớ (tiêu chí F2, luật L6) | done | [phase-1-state-layer](history/phase-1-state-layer/) |
