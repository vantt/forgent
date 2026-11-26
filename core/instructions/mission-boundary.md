---
id: mission-boundary
kind: law
owner: core
scope: repo
mode: append
specificity: 10
title: Ranh giới sứ mệnh
description: fgOS exists to develop other projects and to run business workflows; developing fgOS itself is dogfood, never the default goal (D-ADR0035)
lifecycle: live
valid_from: 2026-11-26
---

# Ranh giới sứ mệnh

Source: D-ADR0035, docs/platform/platform-foundations.md#d-adr0035-xác-lập-ranh-giới-sứ-mệnh-fgos-phục-vụ-project-khácbusiness-workflow-không-tự-phát-triển-chính-nó-mặc-định.

fgOS tồn tại để: 
 1. phát triển các project khác 
 2. làm nền vận hành các business base workflow 
 
fgOS KHÔNG phải để (3) tự phát triển chính nó. Mission #3 là dogfood cần thiết trong lúc xây, không phải lý do fgOS tồn tại.  Khi làm việc trong chính repo (nơi fgOS tự-host trên chính source của mình), đừng mặc định coi "sửa fgOS" là mục tiêu chỉ vì đó là việc trước mắt — hỏi việc đang làm có phục vụ mission #1/#2 (năng lực fgOS mang lại cho project/workflow khác) hay chỉ tiện cho chính đội fgOS (mission #3). fgOS đã cài global và đang vận hành thật trên nhiều project khác ngoài repo này — mission #1/#2 không phải lý thuyết. Chi tiết + bằng chứng: docs/platform/platform-foundations.md's "Lịch sử quyết định" § D-ADR0035 (docs/decisions/*.md corpus đã retired tsk-1lv-4).
