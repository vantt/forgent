# Root source completion: conservation pack 2

Author session: codex-session:22@2026-10-14
Content commit: cd82746a8ba169600d987eeb0f5ca274304712f3

## claim_25856ca74601abef51162fa1336661cd

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_25856ca74601abef51162fa1336661cd",
  "sourceUnitDigest": "adf8cd1c4e640fce2d39f13c990455e10e092d79033a5cc18f8d599a369be6e4",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "2-chu-trình-chung-nền-tảng-base-workflow",
  "targetUnitDigest": "462cec728e4f6e9a36949ac2ca364c7108c9d2e004040aa22fb2e61e21e9dbb2",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#2-chu-trình-chung-nền-tảng-base-workflow to docs/platform/vision.md#2-chu-trình-chung-nền-tảng-base-workflow. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#2-chu-trình-chung-nền-tảng-base-workflow`
Native unit SHA256: `adf8cd1c4e640fce2d39f13c990455e10e092d79033a5cc18f8d599a369be6e4`
Shown text SHA256: `48ff16990a3f573f8dd0588ae04972646ab93d072f0ef31e2084236c2d6bff66`

```text
## 2. Chu trình chung nền tảng (base workflow)

Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:

1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.

Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**
```

Complete current target: `docs/platform/vision.md#2-chu-trình-chung-nền-tảng-base-workflow`
Native unit SHA256: `462cec728e4f6e9a36949ac2ca364c7108c9d2e004040aa22fb2e61e21e9dbb2`
Shown text SHA256: `47763ac8462ea51d34998f13f6fb8e1260314d47e40b3217216752fcc6eb7663`

```text
### 2. Chu trình chung nền tảng (base workflow)

Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:

1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.

Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 2. Chu trình chung nền tảng (base workflow)
+### 2. Chu trình chung nền tảng (base workflow)
 
 Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
 finance…) **kế thừa base và thêm stage riêng**:

```
## claim_32dee7826c373d464b4efa13b6b5135b

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_32dee7826c373d464b4efa13b6b5135b",
  "sourceUnitDigest": "8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "2. Chu trình chung nền tảng (base workflow)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-6 to docs/platform/vision.md#unheaded-block-20. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-6`
Native unit SHA256: `8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2`
Shown text SHA256: `8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2`

```text
Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:
```

Complete current target: `docs/platform/vision.md#unheaded-block-20`
Native unit SHA256: `8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2`
Shown text SHA256: `8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2`

```text
Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:
```

Source/current diff:

```diff

```
## claim_e3bf13cdd8a7ad2f68c0f917e388297d

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_e3bf13cdd8a7ad2f68c0f917e388297d",
  "sourceUnitDigest": "148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "2. Chu trình chung nền tảng (base workflow)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-7 to docs/platform/vision.md#unheaded-block-21. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-7`
Native unit SHA256: `148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e`
Shown text SHA256: `148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e`

```text
1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.
```

Complete current target: `docs/platform/vision.md#unheaded-block-21`
Native unit SHA256: `148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e`
Shown text SHA256: `148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e`

```text
1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.
```

Source/current diff:

```diff

```
## claim_eb680bbc71ad8e238b210449a5d62b5f

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_eb680bbc71ad8e238b210449a5d62b5f",
  "sourceUnitDigest": "b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "2. Chu trình chung nền tảng (base workflow)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-8 to docs/platform/vision.md#unheaded-block-22. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-8`
Native unit SHA256: `b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63`
Shown text SHA256: `b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63`

```text
Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**
```

Complete current target: `docs/platform/vision.md#unheaded-block-22`
Native unit SHA256: `b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63`
Shown text SHA256: `b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63`

```text
Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**
```

Source/current diff:

```diff

```
## claim_61b5b211cd33d2be1871ed589eda69af

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_61b5b211cd33d2be1871ed589eda69af",
  "sourceUnitDigest": "b7d1403425ea892eddcdb7cd76553057b1d788a55dd46b574a26fa763f78ab2f",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "3-hai-chế-độ-intake",
  "targetUnitDigest": "6ca51cbbb54d354c99d3d662338e0f772e1290864e60ea675f3c698393ddbf81",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#3-hai-chế-độ-intake to docs/platform/vision.md#3-hai-chế-độ-intake. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#3-hai-chế-độ-intake`
Native unit SHA256: `b7d1403425ea892eddcdb7cd76553057b1d788a55dd46b574a26fa763f78ab2f`
Shown text SHA256: `4d39fb4ddfa3f6427c5e5d3914ad443cae0592715bcc6bc5e30db180d8c50c2a`

```text
## 3. Hai chế độ Intake

- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.
```

Complete current target: `docs/platform/vision.md#3-hai-chế-độ-intake`
Native unit SHA256: `6ca51cbbb54d354c99d3d662338e0f772e1290864e60ea675f3c698393ddbf81`
Shown text SHA256: `c9de352bfd671d8b492adf2f4b78451159caf7607f7a1d84238de6f2f26b6d35`

```text
### 3. Hai chế độ Intake

- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 3. Hai chế độ Intake
+### 3. Hai chế độ Intake
 
 - **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
   loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không

```
## claim_4be980669c1d0b976cc8e1d7e140df22

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_4be980669c1d0b976cc8e1d7e140df22",
  "sourceUnitDigest": "4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "3. Hai chế độ Intake"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-9 to docs/platform/vision.md#unheaded-block-23. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-9`
Native unit SHA256: `4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5`
Shown text SHA256: `4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5`

```text
- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.
```

Complete current target: `docs/platform/vision.md#unheaded-block-23`
Native unit SHA256: `4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5`
Shown text SHA256: `4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5`

```text
- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.
```

Source/current diff:

```diff

```
## claim_8116a777ce8821f8e5e6abd644aa2f56

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_8116a777ce8821f8e5e6abd644aa2f56",
  "sourceUnitDigest": "9ee5e7c70f7770e4c0cf18ee0112012d884f7daf9e408d1d920726c6683bb6a7",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "4-chu-trình-coding-cụ-thể-hoá-base-cho-coding",
  "targetUnitDigest": "f70ffecf1a9eb9c041562853060ce9963e29dbd6751366f6762e17c18fbeaf76",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#4-chu-trình-coding-cụ-thể-hoá-base-cho-coding to docs/platform/vision.md#4-chu-trình-coding-cụ-thể-hoá-base-cho-coding. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#4-chu-trình-coding-cụ-thể-hoá-base-cho-coding`
Native unit SHA256: `9ee5e7c70f7770e4c0cf18ee0112012d884f7daf9e408d1d920726c6683bb6a7`
Shown text SHA256: `21d09f8bf21a777dcc67e6f0f5795193412173c02e667054a42f98ed06128fc4`

```text
## 4. Chu trình coding (cụ thể hoá base cho coding)

1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.
```

Complete current target: `docs/platform/vision.md#4-chu-trình-coding-cụ-thể-hoá-base-cho-coding`
Native unit SHA256: `f70ffecf1a9eb9c041562853060ce9963e29dbd6751366f6762e17c18fbeaf76`
Shown text SHA256: `e2cf97c33718be35538c85048eb3cea551aed76d3c4d24389a3d65fe402c0c58`

```text
### 4. Chu trình coding (cụ thể hoá base cho coding)

1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 4. Chu trình coding (cụ thể hoá base cho coding)
+### 4. Chu trình coding (cụ thể hoá base cho coding)
 
 1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
 2. Hệ **ghi nhận một work-item** và phân loại như thường.

```
## claim_bd8d838ce4294b49b3a674383718a380

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_bd8d838ce4294b49b3a674383718a380",
  "sourceUnitDigest": "e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "4. Chu trình coding (cụ thể hoá base cho coding)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-10 to docs/platform/vision.md#unheaded-block-24. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-10`
Native unit SHA256: `e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea`
Shown text SHA256: `e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea`

```text
1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.
```

Complete current target: `docs/platform/vision.md#unheaded-block-24`
Native unit SHA256: `e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea`
Shown text SHA256: `e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea`

```text
1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.
```

Source/current diff:

```diff

```
## claim_eb9ecb187e1d4d79d553c157e852e57d

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_eb9ecb187e1d4d79d553c157e852e57d",
  "sourceUnitDigest": "619ebf21fa52684f8f2659a98e89631346c958772d156650a2f4e7f9796e5889",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "5-bản-đồ-người-tham-gia-human-involvement-map",
  "targetUnitDigest": "ff2ec54e319197c751c83fc0bf4330fefac68dc44c896ee1906705051d5670b4",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#5-bản-đồ-người-tham-gia-human-involvement-map to docs/platform/vision.md#5-bản-đồ-người-tham-gia-human-involvement-map. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#5-bản-đồ-người-tham-gia-human-involvement-map`
Native unit SHA256: `619ebf21fa52684f8f2659a98e89631346c958772d156650a2f4e7f9796e5889`
Shown text SHA256: `0e238b40f2cacb9899f98d51e230930df7c51d7f719bf6145911fc4365893fcc`

```text
## 5. Bản đồ người-tham-gia (human-involvement map)

| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |
```

Complete current target: `docs/platform/vision.md#5-bản-đồ-người-tham-gia-human-involvement-map`
Native unit SHA256: `ff2ec54e319197c751c83fc0bf4330fefac68dc44c896ee1906705051d5670b4`
Shown text SHA256: `1e05eeb82ad270cb9f7f28e4fecb312e9ad4ef0aa226b75b0c60702520a372b3`

```text
### 5. Bản đồ người-tham-gia (human-involvement map)

| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 5. Bản đồ người-tham-gia (human-involvement map)
+### 5. Bản đồ người-tham-gia (human-involvement map)
 
 | Giai đoạn | Người tham gia? |
 |---|---|

```
## claim_a3179d366545a11e763b6da69d4aa728

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_a3179d366545a11e763b6da69d4aa728",
  "sourceUnitDigest": "0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "5. Bản đồ người-tham-gia (human-involvement map)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-11 to docs/platform/vision.md#unheaded-block-25. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-11`
Native unit SHA256: `0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12`
Shown text SHA256: `0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12`

```text
| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |
```

Complete current target: `docs/platform/vision.md#unheaded-block-25`
Native unit SHA256: `0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12`
Shown text SHA256: `0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12`

```text
| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |
```

Source/current diff:

```diff

```
## claim_b927ea09f5baef6db3f71fc1fa56c43b

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_b927ea09f5baef6db3f71fc1fa56c43b",
  "sourceUnitDigest": "fde1e396073c969ed946ff59c7aaa21b9ab472ab9183c9961055c943686c7def",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "6-ánh-xạ-phase-123-hiện-có-vào-chu-trình",
  "targetUnitDigest": "60740db37bd20ae8f1514663a2b56de90a881bd4ae7cd9c3cb0a139ea493560f",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#6-ánh-xạ-phase-123-hiện-có-vào-chu-trình to docs/platform/vision.md#6-ánh-xạ-phase-123-hiện-có-vào-chu-trình. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#6-ánh-xạ-phase-123-hiện-có-vào-chu-trình`
Native unit SHA256: `fde1e396073c969ed946ff59c7aaa21b9ab472ab9183c9961055c943686c7def`
Shown text SHA256: `1d7cc07ee1bfc69766940059b8e78623cd942f1e7cc4e3caff7ab5850c58fab5`

```text
## 6. Ánh xạ Phase 1/2/3 hiện có vào chu trình

- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.
```

Complete current target: `docs/platform/vision.md#6-ánh-xạ-phase-123-hiện-có-vào-chu-trình`
Native unit SHA256: `60740db37bd20ae8f1514663a2b56de90a881bd4ae7cd9c3cb0a139ea493560f`
Shown text SHA256: `1f4fe97f22cef2a9ef1e291b98c336ff4963519ee2bccb5a2c912dd084749237`

```text
### 6. Ánh xạ Phase 1/2/3 hiện có vào chu trình

- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 6. Ánh xạ Phase 1/2/3 hiện có vào chu trình
+### 6. Ánh xạ Phase 1/2/3 hiện có vào chu trình
 
 - **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
   (work-state FSM, frontier, runner loop, recovery matrix).

```
## claim_328f8c31cf431aa1122b411eb2da7bab

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_328f8c31cf431aa1122b411eb2da7bab",
  "sourceUnitDigest": "672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "6. Ánh xạ Phase 1/2/3 hiện có vào chu trình"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-12 to docs/platform/vision.md#unheaded-block-26. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-12`
Native unit SHA256: `672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459`
Shown text SHA256: `672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459`

```text
- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.
```

Complete current target: `docs/platform/vision.md#unheaded-block-26`
Native unit SHA256: `672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459`
Shown text SHA256: `672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459`

```text
- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.
```

Source/current diff:

```diff

```
## claim_01cec51e08c6924e05c263d28d1e303a

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_01cec51e08c6924e05c263d28d1e303a",
  "sourceUnitDigest": "40ae23313bf17a2b39a0b3f5cb6e0596acc0869b61c0427b93f5a0ee5c5bb5b1",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "7-câu-hỏi-mở-chưa-quyết-cần-chốt-khi-tới-stage-tương-ứng",
  "targetUnitDigest": "ade213e6731f71df4adce7304edb1f18610c068dabbc68403871d0515edf74f7",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#7-câu-hỏi-mở-chưa-quyết-cần-chốt-khi-tới-stage-tương-ứng to docs/platform/vision.md#7-câu-hỏi-mở-chưa-quyết-cần-chốt-khi-tới-stage-tương-ứng. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#7-câu-hỏi-mở-chưa-quyết-cần-chốt-khi-tới-stage-tương-ứng`
Native unit SHA256: `40ae23313bf17a2b39a0b3f5cb6e0596acc0869b61c0427b93f5a0ee5c5bb5b1`
Shown text SHA256: `80d0e55bbb129deeca02e711538271ddc52d1c2b292e8f76ff2a658a4cf6f5c2`

```text
## 7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)

1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?
```

Complete current target: `docs/platform/vision.md#7-câu-hỏi-mở-chưa-quyết-cần-chốt-khi-tới-stage-tương-ứng`
Native unit SHA256: `ade213e6731f71df4adce7304edb1f18610c068dabbc68403871d0515edf74f7`
Shown text SHA256: `f976c38ef49640f3d2435a5eb86d9109ab97a81b1a675b815d69766d949a10ba`

```text
### 7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)

1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)
+### 7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)
 
 1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
    mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.

```
## claim_4d5c67adaadb4552a0879e92e2ca3690

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_4d5c67adaadb4552a0879e92e2ca3690",
  "sourceUnitDigest": "f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "7. Câu hỏi mở (chưa quyết — cần chốt khi tới stage tương ứng)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-13 to docs/platform/vision.md#unheaded-block-27. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-13`
Native unit SHA256: `f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709`
Shown text SHA256: `f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709`

```text
1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?
```

Complete current target: `docs/platform/vision.md#unheaded-block-27`
Native unit SHA256: `f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709`
Shown text SHA256: `f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709`

```text
1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?
```

Source/current diff:

```diff

```
## claim_29a458dda2e2bf7624ada68a74d28dbe

Entry kind: source-decision
Class: Judgment
Reason: no target digest match

```json
{
  "claimId": "claim_29a458dda2e2bf7624ada68a74d28dbe",
  "sourceUnitDigest": "307fd73e6f31c1b541110ba85668b8a4c4e63415dd0a237ba3932420a21e3471",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "8-ảnh-hưởng-tới-capture-2-kênh-phase-3-slice-2",
  "targetUnitDigest": "4eb54c36037c0944addf1c6b6ef995dc0d623be4a2b71fd71b58ca9b8d54ba72",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#8-ảnh-hưởng-tới-capture-2-kênh-phase-3-slice-2 to docs/platform/vision.md#8-ảnh-hưởng-tới-capture-2-kênh-phase-3-slice-2. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. This heading binds its complete unchanged following source payload at depth +1. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#8-ảnh-hưởng-tới-capture-2-kênh-phase-3-slice-2`
Native unit SHA256: `307fd73e6f31c1b541110ba85668b8a4c4e63415dd0a237ba3932420a21e3471`
Shown text SHA256: `45e3d135980b86db0eff2f1a8ca985f8fc58f82b2f4695b5d1952d01671c5781`

```text
## 8. Ảnh hưởng tới "capture 2 kênh" (Phase 3 slice 2)

Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.

- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).

→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
```

Complete current target: `docs/platform/vision.md#8-ảnh-hưởng-tới-capture-2-kênh-phase-3-slice-2`
Native unit SHA256: `4eb54c36037c0944addf1c6b6ef995dc0d623be4a2b71fd71b58ca9b8d54ba72`
Shown text SHA256: `dfb1337bebc44ebf05fbabd1dc6457229b89b5e903f1e4bee1d0aa692edac1df`

```text
### 8. Ảnh hưởng tới "capture 2 kênh" (Phase 3 slice 2)

Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.

- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).

→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
```

Source/current diff:

```diff
--- docs/work-item-lifecycle-vision.md
+++ docs/platform/vision.md
@@ -1,4 +1,4 @@
-## 8. Ảnh hưởng tới "capture 2 kênh" (Phase 3 slice 2)
+### 8. Ảnh hưởng tới "capture 2 kênh" (Phase 3 slice 2)
 
 Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
 lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.

```
## claim_1dd1ac4b9a7204b124b48287966a697f

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_1dd1ac4b9a7204b124b48287966a697f",
  "sourceUnitDigest": "c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "8. Ảnh hưởng tới \"capture 2 kênh\" (Phase 3 slice 2)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-14 to docs/platform/vision.md#unheaded-block-28. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-14`
Native unit SHA256: `c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf`
Shown text SHA256: `c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf`

```text
Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.
```

Complete current target: `docs/platform/vision.md#unheaded-block-28`
Native unit SHA256: `c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf`
Shown text SHA256: `c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf`

```text
Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.
```

Source/current diff:

```diff

```
## claim_c0781c4ec30dbafb691a63d86e9e2668

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_c0781c4ec30dbafb691a63d86e9e2668",
  "sourceUnitDigest": "05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "8. Ảnh hưởng tới \"capture 2 kênh\" (Phase 3 slice 2)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-15 to docs/platform/vision.md#unheaded-block-29. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-15`
Native unit SHA256: `05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60`
Shown text SHA256: `05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60`

```text
- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).
```

Complete current target: `docs/platform/vision.md#unheaded-block-29`
Native unit SHA256: `05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60`
Shown text SHA256: `05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60`

```text
- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).
```

Source/current diff:

```diff

```
## claim_45db468c617aaa882ba4aca00978f89e

Entry kind: source-decision
Class: Weak-exact
Reason: ancestor headings differ

```json
{
  "claimId": "claim_45db468c617aaa882ba4aca00978f89e",
  "sourceUnitDigest": "bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad",
  "targetAncestry": [
    "Platform Vision",
    "Chu trình Work-Item của fgOS — tầm nhìn nền tảng",
    "8. Ảnh hưởng tới \"capture 2 kênh\" (Phase 3 slice 2)"
  ],
  "rationale": "Frozen root map assigns docs/work-item-lifecycle-vision.md#unheaded-block-16 to docs/platform/vision.md#unheaded-block-30. The complete legacy source is added to its existing candidate owner; the earlier summary prose remains intact. Source heading depths shift by one to keep one H1; title, payload, law thresholds, dated claims and unresolved vision questions remain verbatim. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/work-item-lifecycle-vision.md#unheaded-block-16`
Native unit SHA256: `bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad`
Shown text SHA256: `bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad`

```text
→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
```

Complete current target: `docs/platform/vision.md#unheaded-block-30`
Native unit SHA256: `bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad`
Shown text SHA256: `bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad`

```text
→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
```

Source/current diff:

```diff

```
## claim_4b96f4f42ea417623dcc794155fa17ce

Entry kind: source-decision
Class: Weak-exact
Reason: Kept pending for bounded independent conservation review; no script approval requested.

```json
{
  "claimId": "claim_4b96f4f42ea417623dcc794155fa17ce",
  "sourceUnitDigest": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/contracts/architecture-manifest.json",
  "targetAnchor": "file-block",
  "targetUnitDigest": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
  "targetAncestry": [],
  "rationale": "Frozen root map assigns docs/architecture-manifest.json#file-block to docs/platform/contracts/architecture-manifest.json#file-block. The complete non-Markdown contract payload is copied byte-identically; no runtime consumer or embedded paths are rewritten. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/architecture-manifest.json#file-block`
Native unit SHA256: `c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85`
Shown text SHA256: `fb5b4a5569bf3ce3083f23a4af40b856b6a469a6ef9043c6c87fc7513c9bbfff`

```text
{
  "contract": "architecture-manifest.v1",
  "map": "docs/architecture-map.md",
  "layers": [
    "entry",
    "use-case",
    "infra",
    "domain",
    "kernel"
  ],
  "rules": [
    "one-directional-layer",
    "domain-siloing"
  ],
  "components": [
    "packaging-distribution"
  ],
  "domains": [
    "coding",
    "marketing"
  ],
  "files": {
    "bin/fgos.mjs": "entry",
    "bin/fgos-runner.mjs": "entry",
    "src/runner/loop.mjs": "use-case",
    "src/runner/paths.mjs": "infra",
    "src/runner/dispatch.mjs": "infra",
    "src/runner/operation-capability.mjs": "domain",
    "src/runner/rigor.mjs": "kernel",
    "src/runner/dispatch-log.mjs": "infra",
    "src/runner/fanout-batch.mjs": "infra",
    "src/runner/work-compat.mjs": "infra",
    "src/runner/dispatch/adapters.mjs": "infra",
    "src/runner/dispatch/config.mjs": "infra",
    "src/runner/dispatch/confinement/policies.mjs": "infra",
    "src/runner/dispatch/confinement/bypass-pairing.mjs": "infra",
    "src/runner/dispatch/confinement/backend-registry.mjs": "infra",
    "src/runner/dispatch/confinement/authority.mjs": "infra",
    "src/runner/dispatch/confinement/request.mjs": "infra",
    "src/runner/dispatch/confinement/resources.mjs": "infra",
    "src/runner/dispatch/confinement/cleanup.mjs": "infra",
    "src/runner/dispatch/confinement/attestation-store.mjs": "infra",
    "src/runner/dispatch/confinement/drivers/bwrap.mjs": "infra",
    "src/runner/dispatch/confinement/probes/harness.mjs": "infra",
    "src/runner/dispatch/resolve.mjs": "infra",
    "src/runner/dispatch/mechanism.mjs": "infra",
    "src/runner/dispatch/plan.mjs": "infra",
    "src/runner/dispatch/transport.mjs": "infra",
    "src/runner/dispatch/prepare.mjs": "infra",
    "src/runner/dispatch/result-ladder.mjs": "infra",
    "src/runner/dispatch/assignment.mjs": "infra",
    "src/runner/dispatch/assignment-layout.mjs": "infra",
    "src/runner/dispatch/assignment-normalizer.mjs": "infra",
    "src/runner/dispatch/execution-contract.mjs": "infra",
    "src/runner/dispatch/effective-execution-contract.mjs": "infra",
    "src/runner/dispatch/agent-result-claim-contract.mjs": "infra",
    "src/runner/dispatch/evidence-attribution.mjs": "infra",
    "src/runner/dispatch/run-result.mjs": "infra",
    "src/runner/dispatch/usage-parsers.mjs": "infra",
    "src/runner/dispatch/runtime-inspection.mjs": "infra",
    "src/runner/dispatch/reconciliation-planner.mjs": "infra",
    "src/runner/dispatch/assignment-policy.mjs": "infra",
    "src/runner/dispatch/operation-prompt-templates.mjs": "infra",
    "src/runner/dispatch/provider-adapter.mjs": "infra",
    "src/runner/dispatch/provider-capacity.mjs": "infra",
    "src/runner/dispatch/provider-auth-failure.mjs": "infra",
    "src/runner/dispatch/provider-credential-probe.mjs": "infra",
    "src/runner/dispatch/provider-account-probe.mjs": "infra",
    "src/runner/dispatch/provider-credential-renewal.mjs": "infra",
    "src/runner/dispatch/assignment-runner.mjs": "infra",
    "src/runner/dispatch/settlement.mjs": "infra",
    "src/runner/dispatch/reconcile-cli-spawn.mjs": "infra",
    "src/runner/dispatch/cli.mjs": "infra",
    "src/runner/dispatch/detached-run-supervisor.mjs": "infra",
    "src/runner/prompt-templates.mjs": "infra",
    "src/runner/worker-log.mjs": "infra",
    "src/runner/agent-roster.mjs": "infra",
    "src/runner/agent-definitions.mjs": "infra",
    "src/runner/agent-listing.mjs": "infra",
    "src/runner/worktree.mjs": "infra",
    "src/runner/promote-preflight.mjs": "infra",
    "src/runner/promote-engine.mjs": "infra",
    "src/runner/session.mjs": "infra",
    "src/runner/gateway-control.mjs": "infra",
    "src/runner/goal-check.mjs": "infra",
    "src/runner/iron-law-gate.mjs": "infra",
    "src/runner/frozen-judge.mjs": "domain",
    "src/runner/merge.mjs": "infra",
    "src/runner/main-checkout-lock.mjs": "infra",
    "src/runner/main-checkout-reset-guard.mjs": "infra",
    "src/runner/github-adapter.mjs": "infra",
    "src/state/drift-status.mjs": "infra",
    "src/state/postland-drift.mjs": "infra",
    "src/state/store.mjs": "infra",
    "src/state/gate-bypass.mjs": "infra",
    "src/state/cursor.mjs": "use-case",
    "src/state/porting-store.mjs": "infra",
    "src/state/tool-registry.mjs": "domain",
    "src/install/coexist.mjs": "infra",
    "src/runner/recovery.mjs": "domain",
    "src/runner/anti-loop.mjs": "domain",
    "src/runner/attestation-guard.mjs": "domain",
    "src/runner/claim-port.mjs": "infra",
    "src/runner/claim-liveness.mjs": "infra",
    "src/runner/lock-wait.mjs": "infra",
    "src/runner/write-queue.mjs": "domain",
    "src/runner/root-affinity.mjs": "domain",
    "src/state/status-fsm.mjs": "domain",
    "src/state/decision-question.mjs": "domain",
    "src/state/handoff.mjs": "domain",
    "src/state/porting.mjs": "domain",
    "src/state/frontier.mjs": "domain",
    "src/state/impact.mjs": "domain",
    "src/state/priority-formula.mjs": "domain",
    "src/state/replay.mjs": "domain",
    "src/state/events-compaction.mjs": "domain",
    "src/state/dep-graph.mjs": "domain",
    "src/state/graph-harness.mjs": "domain",
    "src/state/graph-metrics.mjs": "domain",
    "src/state/awaiting-context.mjs": "domain",
    "src/state/cleanup-harness.mjs": "domain",
    "src/state/cleanup-pool.mjs": "domain",
    "src/state/discover-pool.mjs": "domain",
    "src/state/plan-pool.mjs": "domain",
    "src/state/retro-pool.mjs": "domain",
    "src/state/retrospective-doors.mjs": "domain",
    "src/state/worker-slots.mjs": "domain",
    "src/intake/discovery.mjs": "use-case",
    "src/intake/plan.mjs": "use-case",
    "src/intake/plan-verdict-from-plan-md.mjs": "use-case",
    "src/intake/verify-pattern-check.mjs": "kernel",
    "src/cli/command-registry.mjs": "kernel",
    "src/cli/deprecation.mjs": "kernel",
    "src/cli/version.mjs": "kernel",
    "src/cli/invocation-fault-log.mjs": "infra",
    "src/cli/approve-fault-log.mjs": "infra",
    "src/report/enduser-index.mjs": "domain",
    "src/report/enduser-index-generate.mjs": "infra",
    "src/report/decision-index.mjs": "infra",
    "src/report/capability-plan-lint.mjs": "infra",
    "src/report/context-render.mjs": "domain",
    "src/report/frontmatter.mjs": "domain",
    "src/report/authoritative-match.mjs": "domain",
    "src/evolve/iron-law.mjs": "domain",
    "src/state/events.mjs": "kernel",
    "src/state/events-jsonl-truncation-guard.mjs": "kernel",
    "src/state/main-checkout-guard-warnings.mjs": "kernel",
    "src/state/work.mjs": "kernel",
    "src/state/envelope.mjs": "kernel",
    "src/intake/risk-keywords.mjs": "kernel",
    "src/verbs/merge/merge.mjs": "use-case",
    "src/verbs/merge/iron-law-level.mjs": "use-case",
    "src/verbs/merge/approve.mjs": "use-case",
    "src/verbs/merge/review.mjs": "use-case",
    "src/verbs/merge/sync-root.mjs": "use-case",
    "src/verbs/merge/catchup.mjs": "use-case",
    "src/verbs/merge/reject.mjs": "use-case",
    "src/verbs/merge/promote-to-component.mjs": "use-case",
    "src/verbs/state/edit.mjs": "use-case",
    "src/verbs/state/move.mjs": "use-case",
    "src/verbs/state/read.mjs": "use-case",
    "src/verbs/dispatch/show-run.mjs": "use-case",
    "src/verbs/dispatch/inspect.mjs": "use-case",
    "src/verbs/dispatch/reconcile.mjs": "use-case",
    "src/verbs/dispatch/watch.mjs": "use-case",
    "src/verbs/dispatch/recover.mjs": "use-case",
    "src/report/item-trace.mjs": "domain",
    "src/util/format-bytes.mjs": "kernel",
    "src/util/format-duration.mjs": "kernel",
    "src/util/normalize-path.mjs": "kernel",
    "src/util/release-binary-path.mjs": "kernel",
    "src/util/release-targets.mjs": "kernel",
    "src/util/session-identity.mjs": "kernel",
    "src/util/unique-tmp-tag.mjs": "kernel",
    "src/util/host-bin.mjs": "infra",
    "src/convention/convention-client.mjs": "infra",
    "src/observe/friction-client.mjs": "infra",
    "src/intake/classify.mjs": "use-case",
    "src/setup/ansi.mjs": "domain",
    "src/setup/config-merge.mjs": "domain",
    "src/setup/shell-rc.mjs": "infra",
    "src/setup/project-launcher.mjs": "infra",
    "src/setup/bin-discovery.mjs": "infra",
    "src/setup/skill-wrappers.mjs": "infra",
    "src/setup/instruction-registry.mjs": "infra",
    "src/setup/git-hooks.mjs": "infra",
    "src/setup/claude-code-hooks.mjs": "infra",
    "src/setup/agent-hooks.mjs": "infra",
    "src/setup/agy-permissions.mjs": "infra",
    "src/setup/agent-cli-trust.mjs": "infra",
    "src/setup/blind-steps-proven-pools.mjs": "use-case",
    "src/setup/workflow-pool-independence.mjs": "use-case",
    "src/setup/checks.mjs": "use-case",
    "src/setup/executor-profile-warnings.mjs": "infra",
    "src/config/global-config.mjs": "infra",
    "src/setup/registrations.mjs": "use-case",
    "src/config/shared-config-file.mjs": "domain",
    "src/state/knowledge-registry.mjs": "domain",
    "src/report/knowledge-resolver.mjs": "domain",
    "src/report/knowledge-projection.mjs": "domain",
    "src/state/fgos-file-registry.mjs": "kernel",
    "src/state/runtime-coordination.mjs": "infra",
    "src/runner/dispatch/brief.mjs": "infra",
    "src/runner/dispatch/dispatch-error.mjs": "infra",
    "src/runner/dispatch/proof-helpers.mjs": "infra",
    "src/runner/dispatch/herdr-agent.mjs": "infra",
    "src/runner/dispatch/herdr-diagnosis.mjs": "infra",
    "src/runner/dispatch/herdr-round.mjs": "infra",
    "src/runner/dispatch/herdr-reconcile.mjs": "infra",
    "src/runner/dispatch/worker-artifacts.mjs": "infra",
    "src/runner/dispatch/liveness.mjs": "infra",
    "src/runner/dispatch/visibility-session.mjs": "infra",
    "src/runner/dispatch/recovery-planner.mjs": "infra",
    "src/runner/dispatch/run-lock.mjs": "infra",
    "src/runner/dispatch/process-identity.mjs": "infra",
    "src/runner/dispatch/trust-store.mjs": "infra",
    "src/runner/dispatch/worker-home.mjs": "infra",
    "src/runner/dispatch/stop-processes-inside.mjs": "infra",
    "src/runner/dispatch/worker-session.mjs": "infra",
    "src/runner/dispatch/worker-session-boot.mjs": "infra",
    "src/runner/dispatch/recovery.mjs": "infra",
    "src/setup/instruction-composition.mjs": "infra",
    "src/setup/instruction-projections.mjs": "infra",
    "src/runner/execution/unit.mjs": "infra",
    "src/runner/execution/bind.mjs": "infra",
    "src/runner/execution/account-rotation.mjs": "infra",
    "src/runner/execution/dry-bind.mjs": "infra",
    "src/runner/execution/role-ledger.mjs": "infra",
    "src/runner/execution/commit-unit-work.mjs": "infra",
    "src/runner/execution/handoff-refs.mjs": "infra",
    "src/runner/execution/unit-run-history.mjs": "infra",
    "src/runner/execution/unit-summary.mjs": "infra",
    "src/runner/execution/run.mjs": "use-case",
    "src/runner/execution/patterns/index.mjs": "domain",
    "src/runner/execution/patterns/panel.mjs": "domain",
    "src/runner/execution/patterns/presets.mjs": "domain",
    "src/runner/execution/patterns/reviewed.mjs": "domain",
    "src/runner/execution/patterns/role-tasks.mjs": "domain",
    "src/runner/execution/patterns/solo.mjs": "domain",
    "src/workflow/definition.mjs": "kernel",
    "src/workflow/dir-guard.mjs": "infra",
    "src/workflow/loader.mjs": "infra",
    "src/workflow/store.mjs": "infra",
    "src/workflow/integrate.mjs": "infra",
    "src/workflow/plan-source.mjs": "infra",
    "src/workflow/runner.mjs": "use-case",
    "src/workflow/index.mjs": "use-case",
    "src/workflow/checked.mjs": "infra",
    "src/workflow/ref-digests.mjs": "infra",
    "src/workflow/seat-providers.mjs": "infra",
    "src/workflow/seats.mjs": "infra",
    "src/workflow/steps.mjs": "kernel",
    "src/state/domain-registry.mjs": "kernel",
    "src/state/step-fsm.mjs": "domain",
    "src/verbs/state/step.mjs": "use-case",
    "src/runner/operation-choice.mjs": "use-case",
    "src/runner/work-dispatch.mjs": "infra"
  }
}
```

Complete current target: `docs/platform/contracts/architecture-manifest.json#file-block`
Native unit SHA256: `c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85`
Shown text SHA256: `fb5b4a5569bf3ce3083f23a4af40b856b6a469a6ef9043c6c87fc7513c9bbfff`

```text
{
  "contract": "architecture-manifest.v1",
  "map": "docs/architecture-map.md",
  "layers": [
    "entry",
    "use-case",
    "infra",
    "domain",
    "kernel"
  ],
  "rules": [
    "one-directional-layer",
    "domain-siloing"
  ],
  "components": [
    "packaging-distribution"
  ],
  "domains": [
    "coding",
    "marketing"
  ],
  "files": {
    "bin/fgos.mjs": "entry",
    "bin/fgos-runner.mjs": "entry",
    "src/runner/loop.mjs": "use-case",
    "src/runner/paths.mjs": "infra",
    "src/runner/dispatch.mjs": "infra",
    "src/runner/operation-capability.mjs": "domain",
    "src/runner/rigor.mjs": "kernel",
    "src/runner/dispatch-log.mjs": "infra",
    "src/runner/fanout-batch.mjs": "infra",
    "src/runner/work-compat.mjs": "infra",
    "src/runner/dispatch/adapters.mjs": "infra",
    "src/runner/dispatch/config.mjs": "infra",
    "src/runner/dispatch/confinement/policies.mjs": "infra",
    "src/runner/dispatch/confinement/bypass-pairing.mjs": "infra",
    "src/runner/dispatch/confinement/backend-registry.mjs": "infra",
    "src/runner/dispatch/confinement/authority.mjs": "infra",
    "src/runner/dispatch/confinement/request.mjs": "infra",
    "src/runner/dispatch/confinement/resources.mjs": "infra",
    "src/runner/dispatch/confinement/cleanup.mjs": "infra",
    "src/runner/dispatch/confinement/attestation-store.mjs": "infra",
    "src/runner/dispatch/confinement/drivers/bwrap.mjs": "infra",
    "src/runner/dispatch/confinement/probes/harness.mjs": "infra",
    "src/runner/dispatch/resolve.mjs": "infra",
    "src/runner/dispatch/mechanism.mjs": "infra",
    "src/runner/dispatch/plan.mjs": "infra",
    "src/runner/dispatch/transport.mjs": "infra",
    "src/runner/dispatch/prepare.mjs": "infra",
    "src/runner/dispatch/result-ladder.mjs": "infra",
    "src/runner/dispatch/assignment.mjs": "infra",
    "src/runner/dispatch/assignment-layout.mjs": "infra",
    "src/runner/dispatch/assignment-normalizer.mjs": "infra",
    "src/runner/dispatch/execution-contract.mjs": "infra",
    "src/runner/dispatch/effective-execution-contract.mjs": "infra",
    "src/runner/dispatch/agent-result-claim-contract.mjs": "infra",
    "src/runner/dispatch/evidence-attribution.mjs": "infra",
    "src/runner/dispatch/run-result.mjs": "infra",
    "src/runner/dispatch/usage-parsers.mjs": "infra",
    "src/runner/dispatch/runtime-inspection.mjs": "infra",
    "src/runner/dispatch/reconciliation-planner.mjs": "infra",
    "src/runner/dispatch/assignment-policy.mjs": "infra",
    "src/runner/dispatch/operation-prompt-templates.mjs": "infra",
    "src/runner/dispatch/provider-adapter.mjs": "infra",
    "src/runner/dispatch/provider-capacity.mjs": "infra",
    "src/runner/dispatch/provider-auth-failure.mjs": "infra",
    "src/runner/dispatch/provider-credential-probe.mjs": "infra",
    "src/runner/dispatch/provider-account-probe.mjs": "infra",
    "src/runner/dispatch/provider-credential-renewal.mjs": "infra",
    "src/runner/dispatch/assignment-runner.mjs": "infra",
    "src/runner/dispatch/settlement.mjs": "infra",
    "src/runner/dispatch/reconcile-cli-spawn.mjs": "infra",
    "src/runner/dispatch/cli.mjs": "infra",
    "src/runner/dispatch/detached-run-supervisor.mjs": "infra",
    "src/runner/prompt-templates.mjs": "infra",
    "src/runner/worker-log.mjs": "infra",
    "src/runner/agent-roster.mjs": "infra",
    "src/runner/agent-definitions.mjs": "infra",
    "src/runner/agent-listing.mjs": "infra",
    "src/runner/worktree.mjs": "infra",
    "src/runner/promote-preflight.mjs": "infra",
    "src/runner/promote-engine.mjs": "infra",
    "src/runner/session.mjs": "infra",
    "src/runner/gateway-control.mjs": "infra",
    "src/runner/goal-check.mjs": "infra",
    "src/runner/iron-law-gate.mjs": "infra",
    "src/runner/frozen-judge.mjs": "domain",
    "src/runner/merge.mjs": "infra",
    "src/runner/main-checkout-lock.mjs": "infra",
    "src/runner/main-checkout-reset-guard.mjs": "infra",
    "src/runner/github-adapter.mjs": "infra",
    "src/state/drift-status.mjs": "infra",
    "src/state/postland-drift.mjs": "infra",
    "src/state/store.mjs": "infra",
    "src/state/gate-bypass.mjs": "infra",
    "src/state/cursor.mjs": "use-case",
    "src/state/porting-store.mjs": "infra",
    "src/state/tool-registry.mjs": "domain",
    "src/install/coexist.mjs": "infra",
    "src/runner/recovery.mjs": "domain",
    "src/runner/anti-loop.mjs": "domain",
    "src/runner/attestation-guard.mjs": "domain",
    "src/runner/claim-port.mjs": "infra",
    "src/runner/claim-liveness.mjs": "infra",
    "src/runner/lock-wait.mjs": "infra",
    "src/runner/write-queue.mjs": "domain",
    "src/runner/root-affinity.mjs": "domain",
    "src/state/status-fsm.mjs": "domain",
    "src/state/decision-question.mjs": "domain",
    "src/state/handoff.mjs": "domain",
    "src/state/porting.mjs": "domain",
    "src/state/frontier.mjs": "domain",
    "src/state/impact.mjs": "domain",
    "src/state/priority-formula.mjs": "domain",
    "src/state/replay.mjs": "domain",
    "src/state/events-compaction.mjs": "domain",
    "src/state/dep-graph.mjs": "domain",
    "src/state/graph-harness.mjs": "domain",
    "src/state/graph-metrics.mjs": "domain",
    "src/state/awaiting-context.mjs": "domain",
    "src/state/cleanup-harness.mjs": "domain",
    "src/state/cleanup-pool.mjs": "domain",
    "src/state/discover-pool.mjs": "domain",
    "src/state/plan-pool.mjs": "domain",
    "src/state/retro-pool.mjs": "domain",
    "src/state/retrospective-doors.mjs": "domain",
    "src/state/worker-slots.mjs": "domain",
    "src/intake/discovery.mjs": "use-case",
    "src/intake/plan.mjs": "use-case",
    "src/intake/plan-verdict-from-plan-md.mjs": "use-case",
    "src/intake/verify-pattern-check.mjs": "kernel",
    "src/cli/command-registry.mjs": "kernel",
    "src/cli/deprecation.mjs": "kernel",
    "src/cli/version.mjs": "kernel",
    "src/cli/invocation-fault-log.mjs": "infra",
    "src/cli/approve-fault-log.mjs": "infra",
    "src/report/enduser-index.mjs": "domain",
    "src/report/enduser-index-generate.mjs": "infra",
    "src/report/decision-index.mjs": "infra",
    "src/report/capability-plan-lint.mjs": "infra",
    "src/report/context-render.mjs": "domain",
    "src/report/frontmatter.mjs": "domain",
    "src/report/authoritative-match.mjs": "domain",
    "src/evolve/iron-law.mjs": "domain",
    "src/state/events.mjs": "kernel",
    "src/state/events-jsonl-truncation-guard.mjs": "kernel",
    "src/state/main-checkout-guard-warnings.mjs": "kernel",
    "src/state/work.mjs": "kernel",
    "src/state/envelope.mjs": "kernel",
    "src/intake/risk-keywords.mjs": "kernel",
    "src/verbs/merge/merge.mjs": "use-case",
    "src/verbs/merge/iron-law-level.mjs": "use-case",
    "src/verbs/merge/approve.mjs": "use-case",
    "src/verbs/merge/review.mjs": "use-case",
    "src/verbs/merge/sync-root.mjs": "use-case",
    "src/verbs/merge/catchup.mjs": "use-case",
    "src/verbs/merge/reject.mjs": "use-case",
    "src/verbs/merge/promote-to-component.mjs": "use-case",
    "src/verbs/state/edit.mjs": "use-case",
    "src/verbs/state/move.mjs": "use-case",
    "src/verbs/state/read.mjs": "use-case",
    "src/verbs/dispatch/show-run.mjs": "use-case",
    "src/verbs/dispatch/inspect.mjs": "use-case",
    "src/verbs/dispatch/reconcile.mjs": "use-case",
    "src/verbs/dispatch/watch.mjs": "use-case",
    "src/verbs/dispatch/recover.mjs": "use-case",
    "src/report/item-trace.mjs": "domain",
    "src/util/format-bytes.mjs": "kernel",
    "src/util/format-duration.mjs": "kernel",
    "src/util/normalize-path.mjs": "kernel",
    "src/util/release-binary-path.mjs": "kernel",
    "src/util/release-targets.mjs": "kernel",
    "src/util/session-identity.mjs": "kernel",
    "src/util/unique-tmp-tag.mjs": "kernel",
    "src/util/host-bin.mjs": "infra",
    "src/convention/convention-client.mjs": "infra",
    "src/observe/friction-client.mjs": "infra",
    "src/intake/classify.mjs": "use-case",
    "src/setup/ansi.mjs": "domain",
    "src/setup/config-merge.mjs": "domain",
    "src/setup/shell-rc.mjs": "infra",
    "src/setup/project-launcher.mjs": "infra",
    "src/setup/bin-discovery.mjs": "infra",
    "src/setup/skill-wrappers.mjs": "infra",
    "src/setup/instruction-registry.mjs": "infra",
    "src/setup/git-hooks.mjs": "infra",
    "src/setup/claude-code-hooks.mjs": "infra",
    "src/setup/agent-hooks.mjs": "infra",
    "src/setup/agy-permissions.mjs": "infra",
    "src/setup/agent-cli-trust.mjs": "infra",
    "src/setup/blind-steps-proven-pools.mjs": "use-case",
    "src/setup/workflow-pool-independence.mjs": "use-case",
    "src/setup/checks.mjs": "use-case",
    "src/setup/executor-profile-warnings.mjs": "infra",
    "src/config/global-config.mjs": "infra",
    "src/setup/registrations.mjs": "use-case",
    "src/config/shared-config-file.mjs": "domain",
    "src/state/knowledge-registry.mjs": "domain",
    "src/report/knowledge-resolver.mjs": "domain",
    "src/report/knowledge-projection.mjs": "domain",
    "src/state/fgos-file-registry.mjs": "kernel",
    "src/state/runtime-coordination.mjs": "infra",
    "src/runner/dispatch/brief.mjs": "infra",
    "src/runner/dispatch/dispatch-error.mjs": "infra",
    "src/runner/dispatch/proof-helpers.mjs": "infra",
    "src/runner/dispatch/herdr-agent.mjs": "infra",
    "src/runner/dispatch/herdr-diagnosis.mjs": "infra",
    "src/runner/dispatch/herdr-round.mjs": "infra",
    "src/runner/dispatch/herdr-reconcile.mjs": "infra",
    "src/runner/dispatch/worker-artifacts.mjs": "infra",
    "src/runner/dispatch/liveness.mjs": "infra",
    "src/runner/dispatch/visibility-session.mjs": "infra",
    "src/runner/dispatch/recovery-planner.mjs": "infra",
    "src/runner/dispatch/run-lock.mjs": "infra",
    "src/runner/dispatch/process-identity.mjs": "infra",
    "src/runner/dispatch/trust-store.mjs": "infra",
    "src/runner/dispatch/worker-home.mjs": "infra",
    "src/runner/dispatch/stop-processes-inside.mjs": "infra",
    "src/runner/dispatch/worker-session.mjs": "infra",
    "src/runner/dispatch/worker-session-boot.mjs": "infra",
    "src/runner/dispatch/recovery.mjs": "infra",
    "src/setup/instruction-composition.mjs": "infra",
    "src/setup/instruction-projections.mjs": "infra",
    "src/runner/execution/unit.mjs": "infra",
    "src/runner/execution/bind.mjs": "infra",
    "src/runner/execution/account-rotation.mjs": "infra",
    "src/runner/execution/dry-bind.mjs": "infra",
    "src/runner/execution/role-ledger.mjs": "infra",
    "src/runner/execution/commit-unit-work.mjs": "infra",
    "src/runner/execution/handoff-refs.mjs": "infra",
    "src/runner/execution/unit-run-history.mjs": "infra",
    "src/runner/execution/unit-summary.mjs": "infra",
    "src/runner/execution/run.mjs": "use-case",
    "src/runner/execution/patterns/index.mjs": "domain",
    "src/runner/execution/patterns/panel.mjs": "domain",
    "src/runner/execution/patterns/presets.mjs": "domain",
    "src/runner/execution/patterns/reviewed.mjs": "domain",
    "src/runner/execution/patterns/role-tasks.mjs": "domain",
    "src/runner/execution/patterns/solo.mjs": "domain",
    "src/workflow/definition.mjs": "kernel",
    "src/workflow/dir-guard.mjs": "infra",
    "src/workflow/loader.mjs": "infra",
    "src/workflow/store.mjs": "infra",
    "src/workflow/integrate.mjs": "infra",
    "src/workflow/plan-source.mjs": "infra",
    "src/workflow/runner.mjs": "use-case",
    "src/workflow/index.mjs": "use-case",
    "src/workflow/checked.mjs": "infra",
    "src/workflow/ref-digests.mjs": "infra",
    "src/workflow/seat-providers.mjs": "infra",
    "src/workflow/seats.mjs": "infra",
    "src/workflow/steps.mjs": "kernel",
    "src/state/domain-registry.mjs": "kernel",
    "src/state/step-fsm.mjs": "domain",
    "src/verbs/state/step.mjs": "use-case",
    "src/runner/operation-choice.mjs": "use-case",
    "src/runner/work-dispatch.mjs": "infra"
  }
}
```

Source/current diff:

```diff

```
## claim_f0f4828229b64bd6cc8959111c824e24

Entry kind: source-decision
Class: Weak-exact
Reason: Kept pending for bounded independent conservation review; no script approval requested.

```json
{
  "claimId": "claim_f0f4828229b64bd6cc8959111c824e24",
  "sourceUnitDigest": "9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:22@2026-10-14",
  "targetOwner": "docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml",
  "targetAnchor": "file-block",
  "targetUnitDigest": "9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f",
  "targetAncestry": [],
  "rationale": "Frozen root map assigns docs/contracts/fgos-gateway-api-v1.yaml#file-block to docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml#file-block. The complete non-Markdown contract payload is copied byte-identically; no runtime consumer or embedded paths are rewritten. Full native source/target unit digests are equal; heading ancestry may differ. This is conservation only, not truth approval, a changed locked law, source retirement or authority promotion."
}
```

Complete source/predecessor: `docs/contracts/fgos-gateway-api-v1.yaml#file-block`
Native unit SHA256: `9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f`
Shown text SHA256: `445be31f29f8480854aa28c3c3661363e80c0d60aabc21efa6790e9c8ba287b1`

```text
openapi: 3.1.0
x-contract: "CTR010 · fgos-gateway.v1"
info:
  title: fgOS Gateway API
  version: 1.0.0
  description: |
    HTTP+JSON surface of the fgOS interface daemon (tsk-7l9, decision 0014
    "Kien truc giao tiep nguoi <-> fgOS", model 3: core-library + thin
    adapters). Written before the daemon is implemented, per this
    contract's own action: a stable spec for D9's future MCP search tool
    and any client (web dashboard, desktop) to build against, not
    reverse-engineered documentation of routes that already exist.

    Scope, locked by 0014:
      - The daemon is a CONSUMER of fgOS core, never a co-writer. Every
        write in this API is a thin wrapper over `spawn fgos <verb>`
        (CTR001/CTR002 one-door-write); every read is a wrapper over
        `fgos list` / `fgos rollup` / `fgos show` plus the `data_hash`
        cheap-poll field already on every envelope. This gateway invents
        no new write path into `.fgos/`.
      - The daemon becomes the one control-plane that can drive BOTH
        interactive session workflows (what herdr/TUI panes do today via
        `fgos session start/end`) and the headless runner
        (`fgos-runner --once`) — see `/v1/sessions` and `/v1/runner/tick`.
      - The attention/push channel (STR48, contract CTR008, status
        `idea`) is explicitly OUT of scope for v1 — 0014 point 6 keeps it
        a separate subsystem with its own delivery-semantics record.
        Clients poll `data_hash` on read endpoints until CTR008 lands.
      - Identity here is ATTRIBUTION, not authentication (same non-goal
        CTR001 already states for the CLI's own `writer` field): every
        route below other than `/contract` itself requires the shared
        per-machine bearer token (D4, `securitySchemes.bearerAuth`) — that
        token gates ACCESS to the gateway, not per-caller IDENTITY. Who a
        caller claims to be beyond holding that one shared token is STR38,
        explicitly out of scope of 0014 itself.

    Envelope reuse: every successful response body is the SAME `fgos.v1`
    envelope (CTR001) the CLI already emits on stdout — `{contract,
    generated_at, data_hash, data}` — carried unmodified inside the HTTP
    body. This mirrors the precedent `fgos-runner.mjs` already set
    (str46-io-contract D6): reuse CTR001's envelope as the version token
    across a new transport rather than minting a second, parallel one.
    HTTP status code + this envelope's `contract` field together answer
    "did the call succeed"; never branch on message text (docs/io-contract.md).

  contact:
    name: fgOS
    url: https://github.com
  x-decisions:
    - docs/decisions/0011-version-tuong-minh-cho-moi-contract.md
    - docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md
  x-specs:
    - docs/io-contract.md
    - docs/specs/work-state.md
    - docs/specs/runner.md

servers:
  - url: http://localhost:{port}/v1
    description: Local daemon (default deployment shape per 0014 point 3-4 — standalone adapter, not always-on by default)
    variables:
      port:
        default: "4170"

# tsk-4qf: every operation inherits this (D4's real, already-enforced
# require_token gate) unless it overrides with its own `security: []` --
# today only `/contract` does, since a client has to read the contract
# before it can know a token is even required.
security:
  - bearerAuth: []

tags:
  - name: work
    description: Work-item lifecycle (read + write), one-to-one with `fgos list/show/submit/move/ask/answer` etc.
  - name: frontier
    description: Read-only frontier/rollup/graph views used for dashboards.
  - name: orchestration
    description: The two process families the daemon controls per 0014 — interactive sessions and the headless runner.
  - name: meta
    description: Self-description of the gateway's own API surface — lets a client discover the contract instead of hand-tracking a separate doc.

paths:
  /contract:
    get:
      operationId: getContract
      tags: [meta]
      summary: The gateway's own OpenAPI spec, verbatim (this document)
      description: |
        Serves this exact spec file so an agent (or any other client) can
        read the full route/schema surface and self-implement a client
        against it, rather than needing this doc handed to it out of band.
        The one route NOT behind the auth gate below — a client has to be
        able to read the contract before it can know a token is even
        required (D4). Never wrapped in the `fgos.v1` envelope: this is the
        spec document itself, not a poll of fgOS state.
      security: []
      responses:
        '200':
          description: OK
          content:
            application/yaml:
              schema:
                type: string
                description: This same OpenAPI document, byte-for-byte.

  /work:
    get:
      operationId: listWork
      tags: [work]
      summary: List work items (wraps `fgos list`)
      description: |
        Read-only, no write side effect. Defaults to open-only (status not
        `done`/`wontfix`/`retrospective`/`cleanup`), same default as the
        CLI. Supports the CLI's own opaque-cursor pagination — pass
        neither `cursor` nor `limit` for the full set.
      parameters:
        - name: status
          in: query
          schema: { type: string }
          description: Filter by exact status value.
        - name: step
          in: query
          schema: { type: string }
        - name: all
          in: query
          schema: { type: boolean, default: false }
          description: Include done/wontfix/retrospective/cleanup items.
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        allOf:
                          - $ref: '#/components/schemas/Page'
                          - type: object
                            properties:
                              work:
                                type: object
                                additionalProperties: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

    post:
      operationId: submitWork
      tags: [work]
      summary: Intake free-text work (wraps `fgos submit`)
      description: |
        Derives title/tier/kind/risk and auto-classifies domain. This is
        the one gateway-side write that creates state that did not exist
        before — every other write endpoint below acts on an existing id.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text:
                  type: string
                  description: Untrusted free text (RUL45) — passed through as a single argv element, never spliced into a shell command.
      responses:
        '200':
          description: Created
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

  /work/{id}:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: showWork
      tags: [work]
      summary: Full detail of one item (wraps `fgos show`)
      description: The work record plus every log scoped to just this id (discovery/decisions/gates/outcome/friction/settlement/learning).
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      # tsk-4id: corrected from `WorkItem` -- this endpoint's
                      # own description already said "plus every log scoped
                      # to just this id", but the schema reference never
                      # matched it. Confirmed via a real `fgos show` run
                      # (docs/history/tsk-4id-task-detail-screen/RESEARCH.md):
                      # `data` is `{work, discovery, decisions, gates,
                      # outcome, friction, settlement, learning}`, never a
                      # bare `WorkItem`.
                      data: { $ref: '#/components/schemas/WorkDetail' }
        default:
          $ref: '#/components/responses/Error'
    patch:
      operationId: editWork
      tags: [work]
      summary: Partial update of an existing item's editable fields (wraps `fgos edit`)
      description: |
        PATCH, not PUT: only fields present in the body change (tsk-41h,
        D1 of docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md)
        -- this is `fgos edit`'s own partial-update semantics, never a
        full-resource replace. Every field is optional; the request body
        is `EditableWorkFields` (a strict subset of `WorkItem`'s own
        properties -- `id`/`status`/`domain` are never editable through
        this route). A field this route does not recognize is silently
        dropped, same as an unrecognized flag on the CLI's own `edit`
        command -- this route translates to `fgos edit`, it does not
        re-validate what the engine already validates (area spec R2).
        `fgos edit` itself refuses when no field actually changes; that
        refusal reaches the caller verbatim as the same `ErrorEnvelope`
        every other write route already uses, never swallowed or
        replaced with a client-side check.
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/EditableWorkFields' }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default:
          $ref: '#/components/responses/Error'

  /work/{id}/docs:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: getWorkDocs
      tags: [work]
      summary: An item's docsRef narrative -- CONTEXT.md/plan.md raw content (tsk-4id)
      description: |
        The task-detail screen's own primary content source for "what the
        agent did" (D3 of docs/history/herdr-web-dashboard/CONTEXT.md:
        CONTEXT.md/plan.md is the human narrative, the primary account --
        `decisions[]` on `GET /work/{id}` is expandable detail only, never
        the default). Did not exist before this item: a browser client
        has no filesystem access, and no other route reads an arbitrary
        repo file. `docsRef` is canonicalized and checked to resolve
        inside `docs/history/` before any read -- a value that escapes it
        is refused (`category: validation`), never followed.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          docsRef: { type: string, nullable: true }
                          contextMd: { type: string, nullable: true, description: "Raw CONTEXT.md content, or null if absent/unreadable." }
                          planMd: { type: string, nullable: true, description: "Raw plan.md content, or null if absent/unreadable." }
                          narrativeMissing:
                            type: boolean
                            description: "Present and true only when docsRef names a directory that does not exist on this machine (area spec Edge Cases: shown without its narrative, never a failure)."
        default:
          $ref: '#/components/responses/Error'

  /work/{id}/move:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: moveWork
      tags: [work]
      summary: Move a work item through the status FSM (wraps `fgos move`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [to]
              properties:
                to: { type: string, description: Target status. }
                expect: { type: string, description: Optional CAS guard — current status expected before the move. }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/ask:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: askWork
      tags: [work]
      summary: Park an item in awaiting-human with a question (wraps `fgos ask`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text: { type: string }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/answer:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: answerWork
      tags: [work]
      summary: Answer a parked question and resume the item (wraps `fgos answer`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text: { type: string }
                approve: { type: boolean, description: "Explicit approval signal for consent gates. When true, forwards --approve to fgos answer." }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/take:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: takeWork
      tags: [work]
      summary: Claim an item through the pull door (wraps `fgos take`/`fgos pick`)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                role:
                  type: string
                  enum: [human, session]
                  default: session
                  description: |
                    take --role's real, deliberately-scoped vocabulary
                    (bin/fgos.mjs's own S2-pull D1) — the pull door
                    excludes the runner role by design, not by omission.
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/return:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: returnWork
      tags: [work]
      summary: Complete a take — run verify, advance to awaiting-approval (wraps `fgos return`)
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/approve:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: approveWork
      tags: [work]
      summary: Merge an awaiting-approval item and move it to delivered (wraps `fgos approve`)
      description: "Carries `externalEffect: true` in the CLI's own verb registry (may open/merge a real PR) — same meaning here."
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/reject:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: rejectWork
      tags: [work]
      summary: Reject an awaiting-approval item back to todo (wraps `fgos reject`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [reason]
              properties:
                reason: { type: string }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /ready:
    get:
      operationId: listReady
      tags: [frontier]
      summary: The frontier — items ready to be taken right now (wraps `fgos ready`)
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        allOf:
                          - $ref: '#/components/schemas/Page'
                          - type: object
                            properties:
                              items:
                                type: array
                                items: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

  /rollup/{id}:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: rollupWork
      tags: [frontier]
      summary: Progress rollup of one root/goalTier item's children (wraps `fgos rollup`)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { type: object, description: Rollup shape, opaque to this contract — see docs/specs/work-state.md. }
        default:
          $ref: '#/components/responses/Error'

  /graph:
    get:
      operationId: workGraph
      tags: [frontier]
      summary: Work-graph metrics — connected components, critical path (wraps `fgos graph`)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { type: object, description: Graph metrics shape, opaque to this contract. }
        default:
          $ref: '#/components/responses/Error'

  /state/digest:
    get:
      operationId: stateDigest
      tags: [frontier]
      summary: Cheap-poll digest — `data_hash` + `generated_at` only, no `data` body
      description: |
        The poll-driven half of 0014's "poll `fgos list`/`rollup` +
        `data_hash`" pattern: a client holds the last `data_hash` it saw
        and calls this endpoint on an interval; a changed hash is the
        only signal needed to decide whether to re-fetch a full read
        endpoint. This is a genuinely new route (no CLI verb returns only
        the digest today) — it exists so a client never has to pay the
        cost of a full `fgos list` just to learn nothing changed.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [contract, generated_at, data_hash]
                properties:
                  contract: { type: string, const: fgos.v1 }
                  generated_at: { type: string, format: date-time }
                  data_hash: { type: string }
        default:
          $ref: '#/components/responses/Error'

  /sessions:
    post:
      operationId: startSession
      tags: [orchestration]
      summary: Open an interactive session worktree (wraps `fgos session start`)
      description: |
        Interactive-session half of 0014's orchestration scope — what a
        herdr/TUI pane does today by shelling out directly. A future
        web/desktop client drives the same lifecycle through this route
        instead of spawning its own git worktree.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                item: { type: string, description: Optional work item id to open the session against. }
      responses:
        '200':
          description: Session opened
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { $ref: '#/components/schemas/Session' }
        default:
          $ref: '#/components/responses/Error'

  /sessions/{sessionId}:
    parameters:
      - name: sessionId
        in: path
        required: true
        schema: { type: string }
    delete:
      operationId: endSession
      tags: [orchestration]
      summary: Close an interactive session worktree (wraps `fgos session end`)
      parameters:
        - name: force
          in: query
          schema: { type: boolean, default: false }
      responses:
        '200':
          description: Session closed
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Envelope' }
        default:
          $ref: '#/components/responses/Error'

  /sessions/{sessionId}/slots:
    parameters:
      - name: sessionId
        in: path
        required: true
        schema: { type: string }
    get:
      operationId: sessionSlots
      tags: [orchestration]
      summary: Worker-slot occupancy for one session (wraps `fgos slots`, session-scoped)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          execution:
                            type: object
                            properties:
                              occupied: { type: integer }
                              items:
                                type: array
                                items:
                                  type: object
                                  properties:
                                    id: { type: string }
                                    sessionId: { type: string }
                                    claimRole: { type: string }
        default:
          $ref: '#/components/responses/Error'

  /runner/tick:
    post:
      operationId: runnerTick
      tags: [orchestration]
      summary: Drive one headless-runner cycle (wraps `fgos-runner --once`)
      description: |
        Headless half of 0014's orchestration scope: gather-back, find
        work, dispatch it through its full "One vong --once" lifecycle
        (docs/specs/runner.md), and return once that cycle's own outcome
        is settled. A `--watch`-equivalent continuous mode is deliberately
        NOT exposed here in v1 — a long-lived HTTP request modeling a
        long-lived poll loop is a scope decision for the daemon
        implementation item, not something this contract should force by
        assuming a streaming transport (SSE/WebSocket) that 0014 never
        locked.
      responses:
        '200':
          description: Cycle completed (including "nothing to do")
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          dispatched: { type: array, items: { type: string }, description: Work item ids touched this cycle. }
        '429':
          description: Runner busy (mirrors CLI `EXIT_BUSY`, category `busy`).
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorEnvelope' }
        default:
          $ref: '#/components/responses/Error'

components:
  securitySchemes:
    # tsk-4qf: matches require_token's own real enforcement (D4) -- one
    # shared token per machine, read from ~/.fgos/config.json's
    # gateway.token, checked as a plain Bearer header (not a per-user
    # credential; see this document's own top-level "Identity here is
    # ATTRIBUTION, not authentication" note).
    bearerAuth:
      type: http
      scheme: bearer
      description: |
        The one shared per-machine token (D4). Every route below this
        component list requires it except `/contract`, which overrides
        with its own `security: []`.
  parameters:
    WorkId:
      name: id
      in: path
      required: true
      schema: { type: string }
      description: Work item id.
    Cursor:
      name: cursor
      in: query
      schema: { type: string }
      description: Opaque cursor from a prior page's `nextCursor`. Never hand-constructed by a client.
    Limit:
      name: limit
      in: query
      schema: { type: integer, minimum: 1 }
  responses:
    WorkOk:
      description: OK
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/Envelope'
              - type: object
                properties:
                  data: { $ref: '#/components/schemas/WorkItem' }
    Error:
      description: |
        Any non-2xx. Never bodied by the plain `fgos.v1` envelope — branch
        on HTTP status + this body's `category`, never on `message` text
        (docs/io-contract.md: "Consumer re nhanh theo ma thoat pham tru,
        khong bao gio theo thong diep" — the same rule, ported to HTTP).
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }

  schemas:
    Envelope:
      type: object
      required: [contract, generated_at, data_hash, data]
      properties:
        contract: { type: string, const: fgos.v1 }
        generated_at: { type: string, format: date-time }
        data_hash: { type: string }
        data: {}
      description: CTR001's envelope, reused verbatim as the HTTP body (see this contract's top-level description).

    Page:
      type: object
      properties:
        nextCursor:
          type: string
          nullable: true
          description: Opaque; null once the set is exhausted. Only present when `cursor`/`limit` was passed.

    WorkItem:
      type: object
      description: |
        Subset of the work-item shape stable enough to publish here; the
        authoritative shape is docs/specs/work-state.md (schema version
        carried in the event log per decision 0007, not duplicated here
        per 0011's own rule against re-deriving a schema this contract
        does not own).
      required: [id, title, kind, status]
      properties:
        id: { type: string }
        title: { type: string }
        description: { type: string }
        kind: { type: string }
        status: { type: string }
        workflowStep: { type: string }
        tier: { type: string }
        risk: { type: string }
        domain: { type: string }
        parent: { type: string, nullable: true }
        deps: { type: array, items: { type: string } }
        footprint: { type: array, items: { type: string } }
        verify: { type: string }
        docsRef: { type: string, nullable: true, description: "Path under docs/history/ -- content readable via GET /work/{id}/docs (tsk-4id)." }

    WorkDetail:
      type: object
      description: |
        `GET /work/{id}`'s real `data` shape (tsk-4id, corrected from a
        stale `WorkItem`-only reference -- this endpoint's own summary
        already said "plus every log scoped to just this id"). Every
        sub-shape below is `type: object` with `additionalProperties: true`
        rather than fully enumerated: these are the raw work-state logs
        (`docs/specs/work-state.md` is their authoritative shape per
        0011's own rule against re-deriving a schema this contract does
        not own), and the task-detail screen (tsk-4id) reads only a named
        few real keys from each (documented per-property below) rather
        than this contract asserting an exhaustive shape it would then
        have to keep in lockstep with every future log field.
      required: [work]
      properties:
        work: { $ref: '#/components/schemas/WorkItem' }
        discovery: { type: array, items: { type: object }, description: Verdict history for this item's discovery stage. }
        decisions:
          type: array
          description: The machine decision log -- NOT the primary "what the agent did" account (that is GET /work/{id}/docs's CONTEXT.md/plan.md); shown collapsed behind a disclosure, per its own count.
          items: { type: object }
        gates:
          type: object
          description: |
            Keyed by gate name (`contextApprove`/`planApprove`/
            `validateApprove`, each `{actor, at, verify}` when present)
            PLUS the ask/answer-parking fields on the SAME object:
            `ask` (string, most recent question), `askHistory` (string
            array, oldest-first, every question this item was ever
            parked with), `answer` (string, most recent answer),
            `statusAtAsk` (string, the status the item was in when most
            recently parked).
          additionalProperties: true
        outcome: { type: object }
        friction: { type: object }
        settlement:
          type: object
          description: |
            `count` (integer, the TRUE total) and `recent` (array, capped
            at 5 most-recent-first entries across every settlement kind --
            `SETTLEMENT_DISPLAY_CAP`. Each entry: `{kind, role, ts,
            detail, id}`; `kind: "answer"` entries are what pairs
            positionally with `gates.askHistory`, oldest-available-first
            after reversing `recent`'s own newest-first order). A round
            older than the 5-answer window has no entry here at all --
            this is a real, load-bearing cap, not a client-side choice.
          properties:
            count: { type: integer }
            recent: { type: array, items: { type: object } }
        learning: { type: object, nullable: true }

    EditableWorkFields:
      type: object
      description: |
        tsk-41h: `PATCH /work/{id}`'s request body -- every field
        `src/state/store.mjs`'s `EDITABLE_FIELDS` allows `fgos edit` to
        change (25 entries, read directly from that constant, never
        re-guessed). All optional; only fields present in the body are
        patched. `id`/`status`/`domain`/`workflowStep` are never editable through
        this route (`status` moves only through `/work/{id}/move`,
        `workflowStep`/`domain` only through the engine's own step
        transitions -- neither is in `EDITABLE_FIELDS`).
      properties:
        title: { type: string }
        description: { type: string }
        kind: { type: string }
        risk: { type: string }
        verify: { type: string }
        tier: { type: string }
        refs: { type: array, items: { type: string } }
        deps: { type: array, items: { type: string } }
        footprint: { type: array, items: { type: string } }
        acceptance:
          type: array
          description: Replaces the whole array (latest-wins), never a deep merge. Each clause is `{text, evidence}`.
          items: { type: object }
        priority: { type: integer }
        intent: { type: integer }
        docsRef: { type: string, description: "Non-empty path, or omit to leave unchanged. There is no clear-to-empty form on this route." }
        parent: { type: string, nullable: true, description: "Empty string clears (un-parents) the item." }
        urgent:
          type: string
          enum: [low, medium, high, critical]
          description: "Despite the name, a string enum (confirmed via a live `fgos edit --urgent` smoke test: the literal boolean `true` is rejected by the engine), not a boolean flag."
        impact: { type: number }
        effort: { type: number }
        action: { type: string, description: "Action directive prose." }
        mergeAfter: { type: array, items: { type: string } }
        supersededBy: { type: string, nullable: true, description: "Empty string clears." }
        duplicates: { type: array, items: { type: string } }
        domainFields:
          type: object
          description: Replaces the whole object (latest-wins) for the item's `domain`, never a deep merge of nested keys.
        goalTier: { type: string, description: "'mvp' or 'milestone'." }
        nextOperation: { type: string, nullable: true, description: "Next recommended stage operation or fix operation. Empty string or null clears." }
        secondaryOperation: { type: string, nullable: true, description: "Active secondary consult/review operation. Empty string or null clears." }

    Session:
      type: object
      required: [sessionId, worktree, branch]
      properties:
        sessionId: { type: string }
        worktree: { type: string }
        branch: { type: string }
        item: { type: string, nullable: true }

    ErrorEnvelope:
      type: object
      required: [category]
      properties:
        category:
          type: string
          description: |
            The one CLOSED taxonomy CTR001 already defines
            (src/state/store.mjs's EXIT_CODES + loop.mjs's EXIT_BUSY) —
            this gateway adds no categories of its own:
          enum:
            - precondition
            - conflict
            - validation
            - corrupt-log
            - lock-timeout
            - session-fail
            - merge-fail
            - busy
            - unexpected
        message:
          type: string
          description: Human-readable diagnostic. Never machine-branched on — `category` is the only field a client should switch on.
        exitCode:
          type: integer
          description: The underlying CLI exit code this category maps from, carried through for parity with docs/io-contract.md.
```

Complete current target: `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml#file-block`
Native unit SHA256: `9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f`
Shown text SHA256: `445be31f29f8480854aa28c3c3661363e80c0d60aabc21efa6790e9c8ba287b1`

```text
openapi: 3.1.0
x-contract: "CTR010 · fgos-gateway.v1"
info:
  title: fgOS Gateway API
  version: 1.0.0
  description: |
    HTTP+JSON surface of the fgOS interface daemon (tsk-7l9, decision 0014
    "Kien truc giao tiep nguoi <-> fgOS", model 3: core-library + thin
    adapters). Written before the daemon is implemented, per this
    contract's own action: a stable spec for D9's future MCP search tool
    and any client (web dashboard, desktop) to build against, not
    reverse-engineered documentation of routes that already exist.

    Scope, locked by 0014:
      - The daemon is a CONSUMER of fgOS core, never a co-writer. Every
        write in this API is a thin wrapper over `spawn fgos <verb>`
        (CTR001/CTR002 one-door-write); every read is a wrapper over
        `fgos list` / `fgos rollup` / `fgos show` plus the `data_hash`
        cheap-poll field already on every envelope. This gateway invents
        no new write path into `.fgos/`.
      - The daemon becomes the one control-plane that can drive BOTH
        interactive session workflows (what herdr/TUI panes do today via
        `fgos session start/end`) and the headless runner
        (`fgos-runner --once`) — see `/v1/sessions` and `/v1/runner/tick`.
      - The attention/push channel (STR48, contract CTR008, status
        `idea`) is explicitly OUT of scope for v1 — 0014 point 6 keeps it
        a separate subsystem with its own delivery-semantics record.
        Clients poll `data_hash` on read endpoints until CTR008 lands.
      - Identity here is ATTRIBUTION, not authentication (same non-goal
        CTR001 already states for the CLI's own `writer` field): every
        route below other than `/contract` itself requires the shared
        per-machine bearer token (D4, `securitySchemes.bearerAuth`) — that
        token gates ACCESS to the gateway, not per-caller IDENTITY. Who a
        caller claims to be beyond holding that one shared token is STR38,
        explicitly out of scope of 0014 itself.

    Envelope reuse: every successful response body is the SAME `fgos.v1`
    envelope (CTR001) the CLI already emits on stdout — `{contract,
    generated_at, data_hash, data}` — carried unmodified inside the HTTP
    body. This mirrors the precedent `fgos-runner.mjs` already set
    (str46-io-contract D6): reuse CTR001's envelope as the version token
    across a new transport rather than minting a second, parallel one.
    HTTP status code + this envelope's `contract` field together answer
    "did the call succeed"; never branch on message text (docs/io-contract.md).

  contact:
    name: fgOS
    url: https://github.com
  x-decisions:
    - docs/decisions/0011-version-tuong-minh-cho-moi-contract.md
    - docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md
  x-specs:
    - docs/io-contract.md
    - docs/specs/work-state.md
    - docs/specs/runner.md

servers:
  - url: http://localhost:{port}/v1
    description: Local daemon (default deployment shape per 0014 point 3-4 — standalone adapter, not always-on by default)
    variables:
      port:
        default: "4170"

# tsk-4qf: every operation inherits this (D4's real, already-enforced
# require_token gate) unless it overrides with its own `security: []` --
# today only `/contract` does, since a client has to read the contract
# before it can know a token is even required.
security:
  - bearerAuth: []

tags:
  - name: work
    description: Work-item lifecycle (read + write), one-to-one with `fgos list/show/submit/move/ask/answer` etc.
  - name: frontier
    description: Read-only frontier/rollup/graph views used for dashboards.
  - name: orchestration
    description: The two process families the daemon controls per 0014 — interactive sessions and the headless runner.
  - name: meta
    description: Self-description of the gateway's own API surface — lets a client discover the contract instead of hand-tracking a separate doc.

paths:
  /contract:
    get:
      operationId: getContract
      tags: [meta]
      summary: The gateway's own OpenAPI spec, verbatim (this document)
      description: |
        Serves this exact spec file so an agent (or any other client) can
        read the full route/schema surface and self-implement a client
        against it, rather than needing this doc handed to it out of band.
        The one route NOT behind the auth gate below — a client has to be
        able to read the contract before it can know a token is even
        required (D4). Never wrapped in the `fgos.v1` envelope: this is the
        spec document itself, not a poll of fgOS state.
      security: []
      responses:
        '200':
          description: OK
          content:
            application/yaml:
              schema:
                type: string
                description: This same OpenAPI document, byte-for-byte.

  /work:
    get:
      operationId: listWork
      tags: [work]
      summary: List work items (wraps `fgos list`)
      description: |
        Read-only, no write side effect. Defaults to open-only (status not
        `done`/`wontfix`/`retrospective`/`cleanup`), same default as the
        CLI. Supports the CLI's own opaque-cursor pagination — pass
        neither `cursor` nor `limit` for the full set.
      parameters:
        - name: status
          in: query
          schema: { type: string }
          description: Filter by exact status value.
        - name: step
          in: query
          schema: { type: string }
        - name: all
          in: query
          schema: { type: boolean, default: false }
          description: Include done/wontfix/retrospective/cleanup items.
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        allOf:
                          - $ref: '#/components/schemas/Page'
                          - type: object
                            properties:
                              work:
                                type: object
                                additionalProperties: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

    post:
      operationId: submitWork
      tags: [work]
      summary: Intake free-text work (wraps `fgos submit`)
      description: |
        Derives title/tier/kind/risk and auto-classifies domain. This is
        the one gateway-side write that creates state that did not exist
        before — every other write endpoint below acts on an existing id.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text:
                  type: string
                  description: Untrusted free text (RUL45) — passed through as a single argv element, never spliced into a shell command.
      responses:
        '200':
          description: Created
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

  /work/{id}:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: showWork
      tags: [work]
      summary: Full detail of one item (wraps `fgos show`)
      description: The work record plus every log scoped to just this id (discovery/decisions/gates/outcome/friction/settlement/learning).
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      # tsk-4id: corrected from `WorkItem` -- this endpoint's
                      # own description already said "plus every log scoped
                      # to just this id", but the schema reference never
                      # matched it. Confirmed via a real `fgos show` run
                      # (docs/history/tsk-4id-task-detail-screen/RESEARCH.md):
                      # `data` is `{work, discovery, decisions, gates,
                      # outcome, friction, settlement, learning}`, never a
                      # bare `WorkItem`.
                      data: { $ref: '#/components/schemas/WorkDetail' }
        default:
          $ref: '#/components/responses/Error'
    patch:
      operationId: editWork
      tags: [work]
      summary: Partial update of an existing item's editable fields (wraps `fgos edit`)
      description: |
        PATCH, not PUT: only fields present in the body change (tsk-41h,
        D1 of docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md)
        -- this is `fgos edit`'s own partial-update semantics, never a
        full-resource replace. Every field is optional; the request body
        is `EditableWorkFields` (a strict subset of `WorkItem`'s own
        properties -- `id`/`status`/`domain` are never editable through
        this route). A field this route does not recognize is silently
        dropped, same as an unrecognized flag on the CLI's own `edit`
        command -- this route translates to `fgos edit`, it does not
        re-validate what the engine already validates (area spec R2).
        `fgos edit` itself refuses when no field actually changes; that
        refusal reaches the caller verbatim as the same `ErrorEnvelope`
        every other write route already uses, never swallowed or
        replaced with a client-side check.
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/EditableWorkFields' }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default:
          $ref: '#/components/responses/Error'

  /work/{id}/docs:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: getWorkDocs
      tags: [work]
      summary: An item's docsRef narrative -- CONTEXT.md/plan.md raw content (tsk-4id)
      description: |
        The task-detail screen's own primary content source for "what the
        agent did" (D3 of docs/history/herdr-web-dashboard/CONTEXT.md:
        CONTEXT.md/plan.md is the human narrative, the primary account --
        `decisions[]` on `GET /work/{id}` is expandable detail only, never
        the default). Did not exist before this item: a browser client
        has no filesystem access, and no other route reads an arbitrary
        repo file. `docsRef` is canonicalized and checked to resolve
        inside `docs/history/` before any read -- a value that escapes it
        is refused (`category: validation`), never followed.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          docsRef: { type: string, nullable: true }
                          contextMd: { type: string, nullable: true, description: "Raw CONTEXT.md content, or null if absent/unreadable." }
                          planMd: { type: string, nullable: true, description: "Raw plan.md content, or null if absent/unreadable." }
                          narrativeMissing:
                            type: boolean
                            description: "Present and true only when docsRef names a directory that does not exist on this machine (area spec Edge Cases: shown without its narrative, never a failure)."
        default:
          $ref: '#/components/responses/Error'

  /work/{id}/move:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: moveWork
      tags: [work]
      summary: Move a work item through the status FSM (wraps `fgos move`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [to]
              properties:
                to: { type: string, description: Target status. }
                expect: { type: string, description: Optional CAS guard — current status expected before the move. }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/ask:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: askWork
      tags: [work]
      summary: Park an item in awaiting-human with a question (wraps `fgos ask`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text: { type: string }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/answer:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: answerWork
      tags: [work]
      summary: Answer a parked question and resume the item (wraps `fgos answer`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text: { type: string }
                approve: { type: boolean, description: "Explicit approval signal for consent gates. When true, forwards --approve to fgos answer." }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/take:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: takeWork
      tags: [work]
      summary: Claim an item through the pull door (wraps `fgos take`/`fgos pick`)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                role:
                  type: string
                  enum: [human, session]
                  default: session
                  description: |
                    take --role's real, deliberately-scoped vocabulary
                    (bin/fgos.mjs's own S2-pull D1) — the pull door
                    excludes the runner role by design, not by omission.
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/return:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: returnWork
      tags: [work]
      summary: Complete a take — run verify, advance to awaiting-approval (wraps `fgos return`)
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/approve:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: approveWork
      tags: [work]
      summary: Merge an awaiting-approval item and move it to delivered (wraps `fgos approve`)
      description: "Carries `externalEffect: true` in the CLI's own verb registry (may open/merge a real PR) — same meaning here."
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/reject:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: rejectWork
      tags: [work]
      summary: Reject an awaiting-approval item back to todo (wraps `fgos reject`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [reason]
              properties:
                reason: { type: string }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /ready:
    get:
      operationId: listReady
      tags: [frontier]
      summary: The frontier — items ready to be taken right now (wraps `fgos ready`)
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        allOf:
                          - $ref: '#/components/schemas/Page'
                          - type: object
                            properties:
                              items:
                                type: array
                                items: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

  /rollup/{id}:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: rollupWork
      tags: [frontier]
      summary: Progress rollup of one root/goalTier item's children (wraps `fgos rollup`)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { type: object, description: Rollup shape, opaque to this contract — see docs/specs/work-state.md. }
        default:
          $ref: '#/components/responses/Error'

  /graph:
    get:
      operationId: workGraph
      tags: [frontier]
      summary: Work-graph metrics — connected components, critical path (wraps `fgos graph`)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { type: object, description: Graph metrics shape, opaque to this contract. }
        default:
          $ref: '#/components/responses/Error'

  /state/digest:
    get:
      operationId: stateDigest
      tags: [frontier]
      summary: Cheap-poll digest — `data_hash` + `generated_at` only, no `data` body
      description: |
        The poll-driven half of 0014's "poll `fgos list`/`rollup` +
        `data_hash`" pattern: a client holds the last `data_hash` it saw
        and calls this endpoint on an interval; a changed hash is the
        only signal needed to decide whether to re-fetch a full read
        endpoint. This is a genuinely new route (no CLI verb returns only
        the digest today) — it exists so a client never has to pay the
        cost of a full `fgos list` just to learn nothing changed.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [contract, generated_at, data_hash]
                properties:
                  contract: { type: string, const: fgos.v1 }
                  generated_at: { type: string, format: date-time }
                  data_hash: { type: string }
        default:
          $ref: '#/components/responses/Error'

  /sessions:
    post:
      operationId: startSession
      tags: [orchestration]
      summary: Open an interactive session worktree (wraps `fgos session start`)
      description: |
        Interactive-session half of 0014's orchestration scope — what a
        herdr/TUI pane does today by shelling out directly. A future
        web/desktop client drives the same lifecycle through this route
        instead of spawning its own git worktree.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                item: { type: string, description: Optional work item id to open the session against. }
      responses:
        '200':
          description: Session opened
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { $ref: '#/components/schemas/Session' }
        default:
          $ref: '#/components/responses/Error'

  /sessions/{sessionId}:
    parameters:
      - name: sessionId
        in: path
        required: true
        schema: { type: string }
    delete:
      operationId: endSession
      tags: [orchestration]
      summary: Close an interactive session worktree (wraps `fgos session end`)
      parameters:
        - name: force
          in: query
          schema: { type: boolean, default: false }
      responses:
        '200':
          description: Session closed
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Envelope' }
        default:
          $ref: '#/components/responses/Error'

  /sessions/{sessionId}/slots:
    parameters:
      - name: sessionId
        in: path
        required: true
        schema: { type: string }
    get:
      operationId: sessionSlots
      tags: [orchestration]
      summary: Worker-slot occupancy for one session (wraps `fgos slots`, session-scoped)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          execution:
                            type: object
                            properties:
                              occupied: { type: integer }
                              items:
                                type: array
                                items:
                                  type: object
                                  properties:
                                    id: { type: string }
                                    sessionId: { type: string }
                                    claimRole: { type: string }
        default:
          $ref: '#/components/responses/Error'

  /runner/tick:
    post:
      operationId: runnerTick
      tags: [orchestration]
      summary: Drive one headless-runner cycle (wraps `fgos-runner --once`)
      description: |
        Headless half of 0014's orchestration scope: gather-back, find
        work, dispatch it through its full "One vong --once" lifecycle
        (docs/specs/runner.md), and return once that cycle's own outcome
        is settled. A `--watch`-equivalent continuous mode is deliberately
        NOT exposed here in v1 — a long-lived HTTP request modeling a
        long-lived poll loop is a scope decision for the daemon
        implementation item, not something this contract should force by
        assuming a streaming transport (SSE/WebSocket) that 0014 never
        locked.
      responses:
        '200':
          description: Cycle completed (including "nothing to do")
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          dispatched: { type: array, items: { type: string }, description: Work item ids touched this cycle. }
        '429':
          description: Runner busy (mirrors CLI `EXIT_BUSY`, category `busy`).
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorEnvelope' }
        default:
          $ref: '#/components/responses/Error'

components:
  securitySchemes:
    # tsk-4qf: matches require_token's own real enforcement (D4) -- one
    # shared token per machine, read from ~/.fgos/config.json's
    # gateway.token, checked as a plain Bearer header (not a per-user
    # credential; see this document's own top-level "Identity here is
    # ATTRIBUTION, not authentication" note).
    bearerAuth:
      type: http
      scheme: bearer
      description: |
        The one shared per-machine token (D4). Every route below this
        component list requires it except `/contract`, which overrides
        with its own `security: []`.
  parameters:
    WorkId:
      name: id
      in: path
      required: true
      schema: { type: string }
      description: Work item id.
    Cursor:
      name: cursor
      in: query
      schema: { type: string }
      description: Opaque cursor from a prior page's `nextCursor`. Never hand-constructed by a client.
    Limit:
      name: limit
      in: query
      schema: { type: integer, minimum: 1 }
  responses:
    WorkOk:
      description: OK
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/Envelope'
              - type: object
                properties:
                  data: { $ref: '#/components/schemas/WorkItem' }
    Error:
      description: |
        Any non-2xx. Never bodied by the plain `fgos.v1` envelope — branch
        on HTTP status + this body's `category`, never on `message` text
        (docs/io-contract.md: "Consumer re nhanh theo ma thoat pham tru,
        khong bao gio theo thong diep" — the same rule, ported to HTTP).
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }

  schemas:
    Envelope:
      type: object
      required: [contract, generated_at, data_hash, data]
      properties:
        contract: { type: string, const: fgos.v1 }
        generated_at: { type: string, format: date-time }
        data_hash: { type: string }
        data: {}
      description: CTR001's envelope, reused verbatim as the HTTP body (see this contract's top-level description).

    Page:
      type: object
      properties:
        nextCursor:
          type: string
          nullable: true
          description: Opaque; null once the set is exhausted. Only present when `cursor`/`limit` was passed.

    WorkItem:
      type: object
      description: |
        Subset of the work-item shape stable enough to publish here; the
        authoritative shape is docs/specs/work-state.md (schema version
        carried in the event log per decision 0007, not duplicated here
        per 0011's own rule against re-deriving a schema this contract
        does not own).
      required: [id, title, kind, status]
      properties:
        id: { type: string }
        title: { type: string }
        description: { type: string }
        kind: { type: string }
        status: { type: string }
        workflowStep: { type: string }
        tier: { type: string }
        risk: { type: string }
        domain: { type: string }
        parent: { type: string, nullable: true }
        deps: { type: array, items: { type: string } }
        footprint: { type: array, items: { type: string } }
        verify: { type: string }
        docsRef: { type: string, nullable: true, description: "Path under docs/history/ -- content readable via GET /work/{id}/docs (tsk-4id)." }

    WorkDetail:
      type: object
      description: |
        `GET /work/{id}`'s real `data` shape (tsk-4id, corrected from a
        stale `WorkItem`-only reference -- this endpoint's own summary
        already said "plus every log scoped to just this id"). Every
        sub-shape below is `type: object` with `additionalProperties: true`
        rather than fully enumerated: these are the raw work-state logs
        (`docs/specs/work-state.md` is their authoritative shape per
        0011's own rule against re-deriving a schema this contract does
        not own), and the task-detail screen (tsk-4id) reads only a named
        few real keys from each (documented per-property below) rather
        than this contract asserting an exhaustive shape it would then
        have to keep in lockstep with every future log field.
      required: [work]
      properties:
        work: { $ref: '#/components/schemas/WorkItem' }
        discovery: { type: array, items: { type: object }, description: Verdict history for this item's discovery stage. }
        decisions:
          type: array
          description: The machine decision log -- NOT the primary "what the agent did" account (that is GET /work/{id}/docs's CONTEXT.md/plan.md); shown collapsed behind a disclosure, per its own count.
          items: { type: object }
        gates:
          type: object
          description: |
            Keyed by gate name (`contextApprove`/`planApprove`/
            `validateApprove`, each `{actor, at, verify}` when present)
            PLUS the ask/answer-parking fields on the SAME object:
            `ask` (string, most recent question), `askHistory` (string
            array, oldest-first, every question this item was ever
            parked with), `answer` (string, most recent answer),
            `statusAtAsk` (string, the status the item was in when most
            recently parked).
          additionalProperties: true
        outcome: { type: object }
        friction: { type: object }
        settlement:
          type: object
          description: |
            `count` (integer, the TRUE total) and `recent` (array, capped
            at 5 most-recent-first entries across every settlement kind --
            `SETTLEMENT_DISPLAY_CAP`. Each entry: `{kind, role, ts,
            detail, id}`; `kind: "answer"` entries are what pairs
            positionally with `gates.askHistory`, oldest-available-first
            after reversing `recent`'s own newest-first order). A round
            older than the 5-answer window has no entry here at all --
            this is a real, load-bearing cap, not a client-side choice.
          properties:
            count: { type: integer }
            recent: { type: array, items: { type: object } }
        learning: { type: object, nullable: true }

    EditableWorkFields:
      type: object
      description: |
        tsk-41h: `PATCH /work/{id}`'s request body -- every field
        `src/state/store.mjs`'s `EDITABLE_FIELDS` allows `fgos edit` to
        change (25 entries, read directly from that constant, never
        re-guessed). All optional; only fields present in the body are
        patched. `id`/`status`/`domain`/`workflowStep` are never editable through
        this route (`status` moves only through `/work/{id}/move`,
        `workflowStep`/`domain` only through the engine's own step
        transitions -- neither is in `EDITABLE_FIELDS`).
      properties:
        title: { type: string }
        description: { type: string }
        kind: { type: string }
        risk: { type: string }
        verify: { type: string }
        tier: { type: string }
        refs: { type: array, items: { type: string } }
        deps: { type: array, items: { type: string } }
        footprint: { type: array, items: { type: string } }
        acceptance:
          type: array
          description: Replaces the whole array (latest-wins), never a deep merge. Each clause is `{text, evidence}`.
          items: { type: object }
        priority: { type: integer }
        intent: { type: integer }
        docsRef: { type: string, description: "Non-empty path, or omit to leave unchanged. There is no clear-to-empty form on this route." }
        parent: { type: string, nullable: true, description: "Empty string clears (un-parents) the item." }
        urgent:
          type: string
          enum: [low, medium, high, critical]
          description: "Despite the name, a string enum (confirmed via a live `fgos edit --urgent` smoke test: the literal boolean `true` is rejected by the engine), not a boolean flag."
        impact: { type: number }
        effort: { type: number }
        action: { type: string, description: "Action directive prose." }
        mergeAfter: { type: array, items: { type: string } }
        supersededBy: { type: string, nullable: true, description: "Empty string clears." }
        duplicates: { type: array, items: { type: string } }
        domainFields:
          type: object
          description: Replaces the whole object (latest-wins) for the item's `domain`, never a deep merge of nested keys.
        goalTier: { type: string, description: "'mvp' or 'milestone'." }
        nextOperation: { type: string, nullable: true, description: "Next recommended stage operation or fix operation. Empty string or null clears." }
        secondaryOperation: { type: string, nullable: true, description: "Active secondary consult/review operation. Empty string or null clears." }

    Session:
      type: object
      required: [sessionId, worktree, branch]
      properties:
        sessionId: { type: string }
        worktree: { type: string }
        branch: { type: string }
        item: { type: string, nullable: true }

    ErrorEnvelope:
      type: object
      required: [category]
      properties:
        category:
          type: string
          description: |
            The one CLOSED taxonomy CTR001 already defines
            (src/state/store.mjs's EXIT_CODES + loop.mjs's EXIT_BUSY) —
            this gateway adds no categories of its own:
          enum:
            - precondition
            - conflict
            - validation
            - corrupt-log
            - lock-timeout
            - session-fail
            - merge-fail
            - busy
            - unexpected
        message:
          type: string
          description: Human-readable diagnostic. Never machine-branched on — `category` is the only field a client should switch on.
        exitCode:
          type: integer
          description: The underlying CLI exit code this category maps from, carried through for parity with docs/io-contract.md.
```

Source/current diff:

```diff

```
## claim_cd630652a03e26ef20dc546ae2eed5bb

Entry kind: registry-gap
Class: Judgment
Reason: The existing candidate header adds required orientation fields and explicitly remains non-canonical Candidate. Exact old/current same-file header is shown; original summary prose remains untouched. Native predecessor identity retained, successor pending, no approval carry or authority change.

```json
{
  "claimId": "claim_cd630652a03e26ef20dc546ae2eed5bb",
  "sourcePath": "docs/platform/platform-foundations.md",
  "sourceAnchor": "unheaded-block-1",
  "sourceUnitDigest": "ad8150aa7423e01dbc47f52f5793a9a1846659c818215d0c3c2fae297c211dd0",
  "disposition": "supersede",
  "targetOwner": "docs/platform/platform-foundations.md",
  "targetAnchor": "unheaded-block-1",
  "targetUnitDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
  "targetAncestry": [
    "Platform Foundations"
  ],
  "authoredBy": "codex-session:22@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The existing candidate header adds required orientation fields and explicitly remains non-canonical Candidate. Exact old/current same-file header is shown; original summary prose remains untouched. Native predecessor identity retained, successor pending, no approval carry or authority change."
}
```

Complete source/predecessor: `docs/platform/platform-foundations.md#unheaded-block-1`
Native unit SHA256: `ad8150aa7423e01dbc47f52f5793a9a1846659c818215d0c3c2fae297c211dd0`
Shown text SHA256: `ad8150aa7423e01dbc47f52f5793a9a1846659c818215d0c3c2fae297c211dd0`

````text
```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
```
````

Complete current target: `docs/platform/platform-foundations.md#unheaded-block-1`
Native unit SHA256: `e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883`
Shown text SHA256: `e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883`

````text
```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

Source/current diff:

````diff
--- docs/platform/platform-foundations.md
+++ docs/platform/platform-foundations.md
@@ -2,9 +2,9 @@
 Document type: Platform foundations
 Audience: Human reviewer, architect, maintainer, agent
 Purpose: Route readers through locked platform laws and durable constraints
-Design status: Draft
+Design status: Candidate
 Implementation status: Partial
-Canonical: Yes, after review
+Canonical: No
 Owner: Platform documentation
 Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
 Last reviewed: 2026-09-13
@@ -13,4 +13,12 @@
 - docs/platform/vision.md
 - docs/platform-foundations.md
 - docs/specs/platform-foundations.md
+Implementation: Partial; carried source truth not certified
+Provenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339
+Writer type: Agent draft writer
+Canonical for: None until independent review and atomic cutover
+Use this when: Reviewing the full mapped legacy source and its retained direction
+Do not use this for: Proof that dated claims are currently implemented
+Supersedes: None; candidate carriage only
+Superseded by: None
 ```
````
## claim_795266a5e8c31c6935c7f5f7cea4fcb7

Entry kind: registry-gap
Class: Judgment
Reason: The existing candidate header adds required orientation fields and explicitly remains non-canonical Candidate. Exact old/current same-file header is shown; original summary prose remains untouched. Native predecessor identity retained, successor pending, no approval carry or authority change.

```json
{
  "claimId": "claim_795266a5e8c31c6935c7f5f7cea4fcb7",
  "sourcePath": "docs/platform/vision.md",
  "sourceAnchor": "unheaded-block-1",
  "sourceUnitDigest": "35c468a4c7b109636d7f8ad9b0b5a9906facab0f962acf110609a034acbe0edc",
  "disposition": "supersede",
  "targetOwner": "docs/platform/vision.md",
  "targetAnchor": "unheaded-block-1",
  "targetUnitDigest": "1354381d3c2de9618825b28b0ebbe1507ec4bc2c63983f90f386e72f6d30be4d",
  "targetAncestry": [
    "Platform Vision"
  ],
  "authoredBy": "codex-session:22@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The existing candidate header adds required orientation fields and explicitly remains non-canonical Candidate. Exact old/current same-file header is shown; original summary prose remains untouched. Native predecessor identity retained, successor pending, no approval carry or authority change."
}
```

Complete source/predecessor: `docs/platform/vision.md#unheaded-block-1`
Native unit SHA256: `35c468a4c7b109636d7f8ad9b0b5a9906facab0f962acf110609a034acbe0edc`
Shown text SHA256: `35c468a4c7b109636d7f8ad9b0b5a9906facab0f962acf110609a034acbe0edc`

````text
```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
```
````

Complete current target: `docs/platform/vision.md#unheaded-block-1`
Native unit SHA256: `1354381d3c2de9618825b28b0ebbe1507ec4bc2c63983f90f386e72f6d30be4d`
Shown text SHA256: `1354381d3c2de9618825b28b0ebbe1507ec4bc2c63983f90f386e72f6d30be4d`

````text
```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

Source/current diff:

````diff
--- docs/platform/vision.md
+++ docs/platform/vision.md
@@ -2,9 +2,9 @@
 Document type: Platform vision
 Audience: Human reviewer, architect, maintainer, agent
 Purpose: State the whole-platform mission, direction, and non-scope for fgOS
-Design status: Draft
+Design status: Candidate
 Implementation status: Partial
-Canonical: Yes, after review
+Canonical: No
 Owner: Platform documentation
 Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
 Last reviewed: 2026-09-13
@@ -13,4 +13,12 @@
 - docs/platform/platform-foundations.md
 - docs/work-item-lifecycle-vision.md
 - docs/platform-foundations.md
+Implementation: Partial; carried source truth not certified
+Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
+Writer type: Agent draft writer
+Canonical for: None until independent review and atomic cutover
+Use this when: Reviewing the full mapped legacy source and its retained direction
+Do not use this for: Proof that dated claims are currently implemented
+Supersedes: None; candidate carriage only
+Superseded by: None
 ```
````
## Stable native heading claim_cc9b0b6baebe1cb598291fbcd80cf899

Accounting only; native ID retained, header payload digest changes, no approval carried.

Complete before heading payload: `docs/platform/platform-foundations.md#platform-foundations`
Native unit SHA256: `ff9974e7de81ebf6ab98eeae39a5fe4c6433c5b23907e4b6c8d48498c19af645`
Shown text SHA256: `08032c329a3f3200604a2ecce55555cf6270705dd85a1c2c7ed8b49b4b33f84b`

````text
# Platform Foundations

```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
```
````

Complete current heading payload: `docs/platform/platform-foundations.md#platform-foundations`
Native unit SHA256: `5c759487c5bbaf994cc259125ee951974a5884b5d2ffb76e0c26f321cd77bb8a`
Shown text SHA256: `2a7c604b9048e3ac75bbb2e978ebf0d5224d039145a7407e5daa2bc0e8a28bf3`

````text
# Platform Foundations

```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

````diff
--- docs/platform/platform-foundations.md
+++ docs/platform/platform-foundations.md
@@ -4,9 +4,9 @@
 Document type: Platform foundations
 Audience: Human reviewer, architect, maintainer, agent
 Purpose: Route readers through locked platform laws and durable constraints
-Design status: Draft
+Design status: Candidate
 Implementation status: Partial
-Canonical: Yes, after review
+Canonical: No
 Owner: Platform documentation
 Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
 Last reviewed: 2026-09-13
@@ -15,4 +15,12 @@
 - docs/platform/vision.md
 - docs/platform-foundations.md
 - docs/specs/platform-foundations.md
+Implementation: Partial; carried source truth not certified
+Provenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339
+Writer type: Agent draft writer
+Canonical for: None until independent review and atomic cutover
+Use this when: Reviewing the full mapped legacy source and its retained direction
+Do not use this for: Proof that dated claims are currently implemented
+Supersedes: None; candidate carriage only
+Superseded by: None
 ```
````
## Stable native heading claim_da74ffc5a39c41249882475145eb2e63

Accounting only; native ID retained, header payload digest changes, no approval carried.

Complete before heading payload: `docs/platform/vision.md#platform-vision`
Native unit SHA256: `e8235e5bb60cb2461e140187b8eae1a37e3b5c5563b0576917dacc4b12c5f2be`
Shown text SHA256: `c96605d1a2760e2fea1816e7054adfd56068be112c1ca735bc7793e61134574b`

````text
# Platform Vision

```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
```
````

Complete current heading payload: `docs/platform/vision.md#platform-vision`
Native unit SHA256: `ea178ef136591f0a6a9475913040ed7a553a51f0ee7f9b88b4f1e6fae1f51c10`
Shown text SHA256: `b094aeb452b56c0512ebdf93aafeea9f8b013127b9cd3b86af603d59346cc162`

````text
# Platform Vision

```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

````diff
--- docs/platform/vision.md
+++ docs/platform/vision.md
@@ -4,9 +4,9 @@
 Document type: Platform vision
 Audience: Human reviewer, architect, maintainer, agent
 Purpose: State the whole-platform mission, direction, and non-scope for fgOS
-Design status: Draft
+Design status: Candidate
 Implementation status: Partial
-Canonical: Yes, after review
+Canonical: No
 Owner: Platform documentation
 Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
 Last reviewed: 2026-09-13
@@ -15,4 +15,12 @@
 - docs/platform/platform-foundations.md
 - docs/work-item-lifecycle-vision.md
 - docs/platform-foundations.md
+Implementation: Partial; carried source truth not certified
+Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
+Writer type: Agent draft writer
+Canonical for: None until independent review and atomic cutover
+Use this when: Reviewing the full mapped legacy source and its retained direction
+Do not use this for: Proof that dated claims are currently implemented
+Supersedes: None; candidate carriage only
+Superseded by: None
 ```
````
## Candidate-unverified claim_cc9b0b6baebe1cb598291fbcd80cf899

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_cc9b0b6baebe1cb598291fbcd80cf899",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "platform-foundations",
  "unitDigest": "5c759487c5bbaf994cc259125ee951974a5884b5d2ffb76e0c26f321cd77bb8a",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#platform-foundations`
Native unit SHA256: `5c759487c5bbaf994cc259125ee951974a5884b5d2ffb76e0c26f321cd77bb8a`
Shown text SHA256: `2a7c604b9048e3ac75bbb2e978ebf0d5224d039145a7407e5daa2bc0e8a28bf3`

````text
# Platform Foundations

```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

## Candidate-unverified claim_1e5b959ec4d25da5a56ea4b6dc313e96

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_1e5b959ec4d25da5a56ea4b6dc313e96",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-1`
Native unit SHA256: `e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883`
Shown text SHA256: `e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883`

````text
```txt
Document type: Platform foundations
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through locked platform laws and durable constraints
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/vision.md
- docs/platform-foundations.md
- docs/specs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

## Candidate-unverified claim_203299ed2dc9accaa27c5cee541a6c68

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_203299ed2dc9accaa27c5cee541a6c68",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "1-purpose",
  "unitDigest": "b1812bd18b7b88b58dd1aef1c97a743e50a59994ed395121e0b5fb46a55f1c79",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#1-purpose`
Native unit SHA256: `b1812bd18b7b88b58dd1aef1c97a743e50a59994ed395121e0b5fb46a55f1c79`
Shown text SHA256: `a240f30ed42518559e2fb65c793f56a7299e77671458313decae21feeb2e5438`

```text
## 1. Purpose

This is the target platform-docs anchor for fgOS foundations. The full legacy law text remains in `docs/platform-foundations.md` during migration.

Use this document to know which laws exist, when they apply, and where to read the full wording.
```

## Candidate-unverified claim_2c16dcf7e25396c56c18e719e440b68d

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_2c16dcf7e25396c56c18e719e440b68d",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "5682857e36dbe2f2257da713fe265fe2386dfdfa21da814d538db5e7cdef15da",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-2`
Native unit SHA256: `5682857e36dbe2f2257da713fe265fe2386dfdfa21da814d538db5e7cdef15da`
Shown text SHA256: `5682857e36dbe2f2257da713fe265fe2386dfdfa21da814d538db5e7cdef15da`

```text
This is the target platform-docs anchor for fgOS foundations. The full legacy law text remains in `docs/platform-foundations.md` during migration.
```

## Candidate-unverified claim_ab7778cdce4955b28736467a541b04b6

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_ab7778cdce4955b28736467a541b04b6",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "e167f297f95fde2d645fc8e9d211b27764b38e9f6ed5461bdbb8185cc3abfbae",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-3`
Native unit SHA256: `e167f297f95fde2d645fc8e9d211b27764b38e9f6ed5461bdbb8185cc3abfbae`
Shown text SHA256: `e167f297f95fde2d645fc8e9d211b27764b38e9f6ed5461bdbb8185cc3abfbae`

```text
Use this document to know which laws exist, when they apply, and where to read the full wording.
```

## Candidate-unverified claim_ab6a09abd0c9962aaa111ac673945505

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_ab6a09abd0c9962aaa111ac673945505",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "2-authority",
  "unitDigest": "e7977dd467f0763fc10b18e43770b94df399e8205fa2d73c37631fb61ec33560",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#2-authority`
Native unit SHA256: `e7977dd467f0763fc10b18e43770b94df399e8205fa2d73c37631fb61ec33560`
Shown text SHA256: `6f05f602192e1fbbb9b1ee85e109ca35e2a3538633a5a1ab8eb4193e6e5f0275`

```text
## 2. Authority

Platform laws are durable constraints. Changing a law requires superseding its decision record; do not silently edit the old rationale away.

During migration:

- this file is the target reader entry;
- `docs/platform-foundations.md` remains the full source text;
- `docs/specs/platform-foundations.md` remains the generated/curated spec projection.
```

## Candidate-unverified claim_2a6d0d0bf4e4ab6c47ee38c5e4dbc85f

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_2a6d0d0bf4e4ab6c47ee38c5e4dbc85f",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-4`
Native unit SHA256: `760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746`
Shown text SHA256: `760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746`

```text
Platform laws are durable constraints. Changing a law requires superseding its decision record; do not silently edit the old rationale away.
```

## Candidate-unverified claim_09f0919c5e299c8c230e0fee70c02c0f

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_09f0919c5e299c8c230e0fee70c02c0f",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "a0a0e5de1d354fb68d004fe2f754d907f01a2bf6eecaab15c3f42eafa65f5200",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-5`
Native unit SHA256: `a0a0e5de1d354fb68d004fe2f754d907f01a2bf6eecaab15c3f42eafa65f5200`
Shown text SHA256: `a0a0e5de1d354fb68d004fe2f754d907f01a2bf6eecaab15c3f42eafa65f5200`

```text
During migration:

- this file is the target reader entry;
- `docs/platform-foundations.md` remains the full source text;
- `docs/specs/platform-foundations.md` remains the generated/curated spec projection.
```

## Candidate-unverified claim_ec2e75abecc7de3c5fcc2b6bda8c23b9

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_ec2e75abecc7de3c5fcc2b6bda8c23b9",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "3-law-summary",
  "unitDigest": "8a9987cf7771997d2ead9b240368d21c35726fd55c7533ea6b93cbb3d157c7ab",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#3-law-summary`
Native unit SHA256: `8a9987cf7771997d2ead9b240368d21c35726fd55c7533ea6b93cbb3d157c7ab`
Shown text SHA256: `0a09efa8be07eb82991fa5dac285cd2743ccc64df7209066923180221cd942dc`

```text
## 3. Law Summary

| Law | Summary | Full source |
| --- | --- | --- |
| L1 | Durable data declares whether it is log or state. | `docs/platform-foundations.md` |
| L2 | Memory has lower mechanical layers and higher learning layers. | `docs/platform-foundations.md` |
| L3 | JSONL/event changesets are truth; databases are rebuildable views unless a named threshold supersedes this. | `docs/platform-foundations.md` |
| L4 | Routing depends on the audience of each interface; there is no one global routing model. | `docs/platform-foundations.md` |
| L5 | Definition of done is the six-question stranger-agent test. | `docs/platform-foundations.md` |
| L6 | Platform maturity uses the F0-F5 ladder and needs real evidence. | `docs/platform-foundations.md` |
| L7 | Run complete, merge complete, and durable are different states. | `docs/platform-foundations.md` |
| L8 | Always-loaded doctrine follows placement, transport, and anchor-suite rules. | `docs/platform-foundations.md` |
| L9 | A single work item has separate run, merge, and durability completion levels. | `docs/platform-foundations.md` |
| RUL11 | Tùm lum is not “heavy”; when the system is messy, consolidate boundaries and contracts. | `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` |
```

## Candidate-unverified claim_46c53960c0ca396b4728ba271a4486c5

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_46c53960c0ca396b4728ba271a4486c5",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "264fec538429723ca63f4d609493bde52c077526f20cc4ace32261c0d1ff7e96",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-6`
Native unit SHA256: `264fec538429723ca63f4d609493bde52c077526f20cc4ace32261c0d1ff7e96`
Shown text SHA256: `264fec538429723ca63f4d609493bde52c077526f20cc4ace32261c0d1ff7e96`

```text
| Law | Summary | Full source |
| --- | --- | --- |
| L1 | Durable data declares whether it is log or state. | `docs/platform-foundations.md` |
| L2 | Memory has lower mechanical layers and higher learning layers. | `docs/platform-foundations.md` |
| L3 | JSONL/event changesets are truth; databases are rebuildable views unless a named threshold supersedes this. | `docs/platform-foundations.md` |
| L4 | Routing depends on the audience of each interface; there is no one global routing model. | `docs/platform-foundations.md` |
| L5 | Definition of done is the six-question stranger-agent test. | `docs/platform-foundations.md` |
| L6 | Platform maturity uses the F0-F5 ladder and needs real evidence. | `docs/platform-foundations.md` |
| L7 | Run complete, merge complete, and durable are different states. | `docs/platform-foundations.md` |
| L8 | Always-loaded doctrine follows placement, transport, and anchor-suite rules. | `docs/platform-foundations.md` |
| L9 | A single work item has separate run, merge, and durability completion levels. | `docs/platform-foundations.md` |
| RUL11 | Tùm lum is not “heavy”; when the system is messy, consolidate boundaries and contracts. | `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` |
```

## Candidate-unverified claim_e7a58711fc263a61319de611617375d5

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_e7a58711fc263a61319de611617375d5",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "4-design-gate",
  "unitDigest": "85fcc60218f8b2752e0d5a40393d61e0768f416d388b42dbbf4ec54d0859f676",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#4-design-gate`
Native unit SHA256: `85fcc60218f8b2752e0d5a40393d61e0768f416d388b42dbbf4ec54d0859f676`
Shown text SHA256: `050c60b0259e360b75d094724e15628d270dd88b6c98e4a20dfdbdf38ef51df5`

```text
## 4. Design Gate

Before accepting a platform design, check:

| Question | Why |
| --- | --- |
| Is the artifact log or state? | Prevents ambiguous durability. |
| Which component owns the authority? | Prevents hidden ownership drift. |
| Which contract is touched? | Keeps boundaries explicit. |
| What proves done? | Keeps results reproducibly verifiable. |
| What learning remains? | Keeps the platform compounding. |
```

## Candidate-unverified claim_18bc93913b448431a0c855963911fe2b

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_18bc93913b448431a0c855963911fe2b",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "e0c8ac3c9a003bc9c5327c935fb9dce93fb8c05bc50c1a197d32333e8fba140c",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-7`
Native unit SHA256: `e0c8ac3c9a003bc9c5327c935fb9dce93fb8c05bc50c1a197d32333e8fba140c`
Shown text SHA256: `e0c8ac3c9a003bc9c5327c935fb9dce93fb8c05bc50c1a197d32333e8fba140c`

```text
Before accepting a platform design, check:
```

## Candidate-unverified claim_cdd858ddc77eff892c0d7595a2db233a

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_cdd858ddc77eff892c0d7595a2db233a",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "bdb17898e7cf55880fca4f9b8f0768512d63cc439553812987b32a4ad461774a",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-8`
Native unit SHA256: `bdb17898e7cf55880fca4f9b8f0768512d63cc439553812987b32a4ad461774a`
Shown text SHA256: `bdb17898e7cf55880fca4f9b8f0768512d63cc439553812987b32a4ad461774a`

```text
| Question | Why |
| --- | --- |
| Is the artifact log or state? | Prevents ambiguous durability. |
| Which component owns the authority? | Prevents hidden ownership drift. |
| Which contract is touched? | Keeps boundaries explicit. |
| What proves done? | Keeps results reproducibly verifiable. |
| What learning remains? | Keeps the platform compounding. |
```

## Candidate-unverified claim_01bad959c0d979694ccdbd7766f78e7a

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_01bad959c0d979694ccdbd7766f78e7a",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "5-component-boundary-link",
  "unitDigest": "7ade7273a7e33013be873ae48162d4851c168e14f09b8b08452fc3cf917634ab",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#5-component-boundary-link`
Native unit SHA256: `7ade7273a7e33013be873ae48162d4851c168e14f09b8b08452fc3cf917634ab`
Shown text SHA256: `a18d119391c995d3a0798155c249c52b89ac23ffc358d99d7827c3748a7982ba`

```text
## 5. Component Boundary Link

If a law-driven change affects component ownership or authority boundaries, also update `docs/platform/component-boundary.md` or record `No component-boundary change`.
```

## Candidate-unverified claim_b646f1ec8d56851edc383bc50c70482d

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_b646f1ec8d56851edc383bc50c70482d",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "f52b702a1f9d964fd1326c1dcf5f3d0d7b64c19f47d04ee8912714f80819312c",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-9`
Native unit SHA256: `f52b702a1f9d964fd1326c1dcf5f3d0d7b64c19f47d04ee8912714f80819312c`
Shown text SHA256: `f52b702a1f9d964fd1326c1dcf5f3d0d7b64c19f47d04ee8912714f80819312c`

```text
If a law-driven change affects component ownership or authority boundaries, also update `docs/platform/component-boundary.md` or record `No component-boundary change`.
```

## Candidate-unverified claim_dce530f30386e919cbaa50513f29fb1d

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_dce530f30386e919cbaa50513f29fb1d",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "6-related-docs",
  "unitDigest": "bd310233f65057b6deebb20219de85727322b6915586e7ae2c24d1b2a3f1f6ab",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#6-related-docs`
Native unit SHA256: `bd310233f65057b6deebb20219de85727322b6915586e7ae2c24d1b2a3f1f6ab`
Shown text SHA256: `cd2f9e91b48fe56c030ebdd9bc93d94fe9fe02ffdbe772aac8037b0b6f5ce03c`

```text
## 6. Related Docs

| Need | Read |
| --- | --- |
| Full law text | `docs/platform-foundations.md` |
| Spec projection | `docs/specs/platform-foundations.md` |
| Platform vision | `vision.md` |
| Component map | `component-boundary.md` |
```

## Candidate-unverified claim_e4f03a34cf0718c43c6faa9baac040ab

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_e4f03a34cf0718c43c6faa9baac040ab",
  "path": "docs/platform/platform-foundations.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "b8dfcdaaf4850b881b6b58c8f5d30c3ad90b9bf8f0c40c73416cff26ef0102fc",
  "fileStatus": {
    "kind": "platform-foundations",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/platform-foundations.md#unheaded-block-10`
Native unit SHA256: `b8dfcdaaf4850b881b6b58c8f5d30c3ad90b9bf8f0c40c73416cff26ef0102fc`
Shown text SHA256: `b8dfcdaaf4850b881b6b58c8f5d30c3ad90b9bf8f0c40c73416cff26ef0102fc`

```text
| Need | Read |
| --- | --- |
| Full law text | `docs/platform-foundations.md` |
| Spec projection | `docs/specs/platform-foundations.md` |
| Platform vision | `vision.md` |
| Component map | `component-boundary.md` |
```

## Candidate-unverified claim_da74ffc5a39c41249882475145eb2e63

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_da74ffc5a39c41249882475145eb2e63",
  "path": "docs/platform/vision.md",
  "anchor": "platform-vision",
  "unitDigest": "ea178ef136591f0a6a9475913040ed7a553a51f0ee7f9b88b4f1e6fae1f51c10",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#platform-vision`
Native unit SHA256: `ea178ef136591f0a6a9475913040ed7a553a51f0ee7f9b88b4f1e6fae1f51c10`
Shown text SHA256: `b094aeb452b56c0512ebdf93aafeea9f8b013127b9cd3b86af603d59346cc162`

````text
# Platform Vision

```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

## Candidate-unverified claim_e732b70a915be38bc24582c37b8a11d9

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_e732b70a915be38bc24582c37b8a11d9",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "1354381d3c2de9618825b28b0ebbe1507ec4bc2c63983f90f386e72f6d30be4d",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-1`
Native unit SHA256: `1354381d3c2de9618825b28b0ebbe1507ec4bc2c63983f90f386e72f6d30be4d`
Shown text SHA256: `1354381d3c2de9618825b28b0ebbe1507ec4bc2c63983f90f386e72f6d30be4d`

````text
```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Candidate
Implementation status: Partial
Canonical: No
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
Implementation: Partial; carried source truth not certified
Provenance: docs/work-item-lifecycle-vision.md at f0efa3330a14d117ad89feba91bdb9b61d768339
Writer type: Agent draft writer
Canonical for: None until independent review and atomic cutover
Use this when: Reviewing the full mapped legacy source and its retained direction
Do not use this for: Proof that dated claims are currently implemented
Supersedes: None; candidate carriage only
Superseded by: None
```
````

## Candidate-unverified claim_599e3b70255a1adae56db008765f98a1

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_599e3b70255a1adae56db008765f98a1",
  "path": "docs/platform/vision.md",
  "anchor": "1-purpose",
  "unitDigest": "41f9f26895a3fd15c1346b4dea51f499b791b07502e3274e42adfa44ac2b1326",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#1-purpose`
Native unit SHA256: `41f9f26895a3fd15c1346b4dea51f499b791b07502e3274e42adfa44ac2b1326`
Shown text SHA256: `83886c00287d5661ba7bf84a33e28d2a408d130b90ad55519b3922181d5fcfdf`

```text
## 1. Purpose

fgOS exists to make agent applications and business-base workflows faster, safer, more reusable, and less dependent on a human sitting in the loop.

This document is the whole-platform north star. Area visions, such as `docs/platform/packaging-distribution/vision.md`, should align with it.

The companion [intent-preservation-ledger.md](intent-preservation-ledger.md)
tracks parts of this direction that are only partially implemented or
deliberately deferred. A simplified implementation slice does not shrink this
vision unless an explicit decision says so.
```

## Candidate-unverified claim_c8feb2e73a6808945b3e28ecf6291b66

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_c8feb2e73a6808945b3e28ecf6291b66",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-2`
Native unit SHA256: `333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836`
Shown text SHA256: `333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836`

```text
fgOS exists to make agent applications and business-base workflows faster, safer, more reusable, and less dependent on a human sitting in the loop.
```

## Candidate-unverified claim_f653c9c029036673c35aeb5ff8ed2ae9

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_f653c9c029036673c35aeb5ff8ed2ae9",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "37d3dc5d4da6e21ac01d35aa2db581d5f3a7d58449c1f8a26e2d7fba753aec31",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-3`
Native unit SHA256: `37d3dc5d4da6e21ac01d35aa2db581d5f3a7d58449c1f8a26e2d7fba753aec31`
Shown text SHA256: `37d3dc5d4da6e21ac01d35aa2db581d5f3a7d58449c1f8a26e2d7fba753aec31`

```text
This document is the whole-platform north star. Area visions, such as `docs/platform/packaging-distribution/vision.md`, should align with it.
```

## Candidate-unverified claim_b6af228ec920c86ed2ca297d1fcd99dc

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_b6af228ec920c86ed2ca297d1fcd99dc",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "fcc7271ad97b4e8c16e9069eb29c9b20da361343bde1d1532d28c9a95dc0d0fa",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-4`
Native unit SHA256: `fcc7271ad97b4e8c16e9069eb29c9b20da361343bde1d1532d28c9a95dc0d0fa`
Shown text SHA256: `fcc7271ad97b4e8c16e9069eb29c9b20da361343bde1d1532d28c9a95dc0d0fa`

```text
The companion [intent-preservation-ledger.md](intent-preservation-ledger.md)
tracks parts of this direction that are only partially implemented or
deliberately deferred. A simplified implementation slice does not shrink this
vision unless an explicit decision says so.
```

## Candidate-unverified claim_efcca1f29fbb7c23724705d6a2980697

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_efcca1f29fbb7c23724705d6a2980697",
  "path": "docs/platform/vision.md",
  "anchor": "2-mission",
  "unitDigest": "44bf1aa91066c666a57b711d204ea7c350bcb97875c049f215650130a831d38b",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#2-mission`
Native unit SHA256: `44bf1aa91066c666a57b711d204ea7c350bcb97875c049f215650130a831d38b`
Shown text SHA256: `af1549db2bc7bd3487372e9e4a4dadc096e0249f99908c992e799ab4c67829ce`

```text
## 2. Mission

fgOS exists to:

- develop other projects;
- run business-base workflows;
- provide reusable platform infrastructure for agent applications.

fgOS does not exist primarily to develop itself. Dogfooding inside this repo is necessary, but it is not the mission.
```

## Candidate-unverified claim_744dfc7dabdb1afc35f335a71c4dfbcc

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_744dfc7dabdb1afc35f335a71c4dfbcc",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "57a466fc5e6510e5f79d43250a9365a26d5a6eb239cf50d7ae8f039c58479f6b",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-5`
Native unit SHA256: `57a466fc5e6510e5f79d43250a9365a26d5a6eb239cf50d7ae8f039c58479f6b`
Shown text SHA256: `57a466fc5e6510e5f79d43250a9365a26d5a6eb239cf50d7ae8f039c58479f6b`

```text
fgOS exists to:

- develop other projects;
- run business-base workflows;
- provide reusable platform infrastructure for agent applications.
```

## Candidate-unverified claim_3762f9bdc9ec0ade5909594d5df7bdfb

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_3762f9bdc9ec0ade5909594d5df7bdfb",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "d4f74d1a2ba7f80df408ede64e8421ed0a84414c0c5ba2ebc9d9925d992f2b9a",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-6`
Native unit SHA256: `d4f74d1a2ba7f80df408ede64e8421ed0a84414c0c5ba2ebc9d9925d992f2b9a`
Shown text SHA256: `d4f74d1a2ba7f80df408ede64e8421ed0a84414c0c5ba2ebc9d9925d992f2b9a`

```text
fgOS does not exist primarily to develop itself. Dogfooding inside this repo is necessary, but it is not the mission.
```

## Candidate-unverified claim_6e2947efa7ddeb725aa1d350ddc0cf8a

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_6e2947efa7ddeb725aa1d350ddc0cf8a",
  "path": "docs/platform/vision.md",
  "anchor": "3-product-priority",
  "unitDigest": "c39164e45f7ef6e3b519d7fcae12a48540afeb3b071e2676ad6ed1f295037de1",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#3-product-priority`
Native unit SHA256: `c39164e45f7ef6e3b519d7fcae12a48540afeb3b071e2676ad6ed1f295037de1`
Shown text SHA256: `ebc281f2288588253e2b85fa9146dd4f3e7c11780d8e51afbe205143b0faff27`

```text
## 3. Product Priority

When trade-offs collide, use this order:

1. Ship faster for projects using fgOS.
2. Release humans from waiting, babysitting, and repetitive coordination.
3. Produce reproducibly verifiable results with evidence-linked documentation.
4. Polish after the definition of done is satisfied.

Lower priorities do not override higher priorities.
```

## Candidate-unverified claim_494d8e8822be204801bf5ff8eb769ae4

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_494d8e8822be204801bf5ff8eb769ae4",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "cdba578e364cab804a6697f995d211ff840052b1290102be0ffeadd35a5427d7",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-7`
Native unit SHA256: `cdba578e364cab804a6697f995d211ff840052b1290102be0ffeadd35a5427d7`
Shown text SHA256: `cdba578e364cab804a6697f995d211ff840052b1290102be0ffeadd35a5427d7`

```text
When trade-offs collide, use this order:
```

## Candidate-unverified claim_14ea9b6dc062608fa5b63ed0631b96be

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_14ea9b6dc062608fa5b63ed0631b96be",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "3053f892e107efcb15cf5c0f575f74d7eb1abd5c99a147b68d5b31bc04931a82",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-8`
Native unit SHA256: `3053f892e107efcb15cf5c0f575f74d7eb1abd5c99a147b68d5b31bc04931a82`
Shown text SHA256: `3053f892e107efcb15cf5c0f575f74d7eb1abd5c99a147b68d5b31bc04931a82`

```text
1. Ship faster for projects using fgOS.
2. Release humans from waiting, babysitting, and repetitive coordination.
3. Produce reproducibly verifiable results with evidence-linked documentation.
4. Polish after the definition of done is satisfied.
```

## Candidate-unverified claim_0ea347963e49153158871a3235afc483

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_0ea347963e49153158871a3235afc483",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "f052f5c431c476ae9020646a613ddd9161c9e97274d52468cbce69b3e4cdbd38",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-9`
Native unit SHA256: `f052f5c431c476ae9020646a613ddd9161c9e97274d52468cbce69b3e4cdbd38`
Shown text SHA256: `f052f5c431c476ae9020646a613ddd9161c9e97274d52468cbce69b3e4cdbd38`

```text
Lower priorities do not override higher priorities.
```

## Candidate-unverified claim_204790a9e9721cc754228f6791d4ae15

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_204790a9e9721cc754228f6791d4ae15",
  "path": "docs/platform/vision.md",
  "anchor": "4-operating-shape",
  "unitDigest": "5bb304703ee71f6287b3ed62c1698e865404c2fc08ff8650ecb3250172c648f4",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#4-operating-shape`
Native unit SHA256: `5bb304703ee71f6287b3ed62c1698e865404c2fc08ff8650ecb3250172c648f4`
Shown text SHA256: `dc9b238caef7d1acc2c873f5866ec9f0d5e3ebf9d90411a963ca19821d803d2d`

````text
## 4. Operating Shape

The platform direction is:

```txt
human intent
  -> durable work/state
  -> domain-aware shaping and planning
  -> governed agent execution
  -> verifiable result
  -> retained learning
```

Humans should stay present for judgment, review, and direction. They should not need to manually preserve every useful design point or monitor every execution step.
````

## Candidate-unverified claim_d46e6059744853141c52690dd123172e

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_d46e6059744853141c52690dd123172e",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-10`
Native unit SHA256: `7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2`
Shown text SHA256: `7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2`

```text
The platform direction is:
```

## Candidate-unverified claim_97612b7e12b29ed8b81108acdf8a9285

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_97612b7e12b29ed8b81108acdf8a9285",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "78570f317b86844d5b6bce311cbe8446773d9690ba0d7b83c43e865375aba46b",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-11`
Native unit SHA256: `78570f317b86844d5b6bce311cbe8446773d9690ba0d7b83c43e865375aba46b`
Shown text SHA256: `78570f317b86844d5b6bce311cbe8446773d9690ba0d7b83c43e865375aba46b`

````text
```txt
human intent
  -> durable work/state
  -> domain-aware shaping and planning
  -> governed agent execution
  -> verifiable result
  -> retained learning
```
````

## Candidate-unverified claim_dcde5099b1a9c73ca23fdd0a3c3184f7

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_dcde5099b1a9c73ca23fdd0a3c3184f7",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-12`
Native unit SHA256: `f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1`
Shown text SHA256: `f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1`

```text
Humans should stay present for judgment, review, and direction. They should not need to manually preserve every useful design point or monitor every execution step.
```

## Candidate-unverified claim_4b30a105feac3a5125f176b76aafe247

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_4b30a105feac3a5125f176b76aafe247",
  "path": "docs/platform/vision.md",
  "anchor": "5-design-commitments",
  "unitDigest": "a64d8219274c479a080a4ab6cd028c02e7ae8de7a509707419313dd52d1ff31a",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#5-design-commitments`
Native unit SHA256: `a64d8219274c479a080a4ab6cd028c02e7ae8de7a509707419313dd52d1ff31a`
Shown text SHA256: `bbe25c674681f98bfa8a078d541deda8be7a69280cf231eedf5014b1d6cdb0cf`

```text
## 5. Design Commitments

- Keep boundaries clear: component ownership, contract authority, and state writes must be explicit.
- Keep docs useful to humans: reading paths, implementation status, proof, and related links are part of system quality.
- Prefer extensible registries and contracts over hidden one-off behavior.
- Treat generated docs as projections, not new authority.
- Keep work restartable by a stranger agent with no chat history.
```

## Candidate-unverified claim_e61a4b569537191f080ca673d3dead6c

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_e61a4b569537191f080ca673d3dead6c",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-13`
Native unit SHA256: `dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea`
Shown text SHA256: `dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea`

```text
- Keep boundaries clear: component ownership, contract authority, and state writes must be explicit.
- Keep docs useful to humans: reading paths, implementation status, proof, and related links are part of system quality.
- Prefer extensible registries and contracts over hidden one-off behavior.
- Treat generated docs as projections, not new authority.
- Keep work restartable by a stranger agent with no chat history.
```

## Candidate-unverified claim_b7c518d75199b375690ee0f92878a42a

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_b7c518d75199b375690ee0f92878a42a",
  "path": "docs/platform/vision.md",
  "anchor": "6-related-anchors",
  "unitDigest": "0f1fb36b7b9c371685c7d818752f200a5314fca16a15a2d833730d518e3dd656",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#6-related-anchors`
Native unit SHA256: `0f1fb36b7b9c371685c7d818752f200a5314fca16a15a2d833730d518e3dd656`
Shown text SHA256: `fc9a59b38ee3f261c822c82cf4b95985f47bb6d611b09aef21182cf93b13b257`

```text
## 6. Related Anchors

| Need | Read |
| --- | --- |
| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Platform laws | [platform-foundations.md](platform-foundations.md) |
| Whole-system architecture | [architecture-map.md](architecture-map.md) |
| Component authority map | [component-boundary.md](component-boundary.md) |
| Documentation governance | [../doc-governance.md](../doc-governance.md) |
| Legacy full law source | [../platform-foundations.md](../platform-foundations.md) |
```

## Candidate-unverified claim_908f25861679e06c2aab8286758c076c

A28 eligibility/equality only; no per-unit truth receipt.

```json
{
  "claimId": "claim_908f25861679e06c2aab8286758c076c",
  "path": "docs/platform/vision.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "47e992413c7b6cbe3b8e2c54b93e7924dc9bb7edd12d047d87c2c368079b4718",
  "fileStatus": {
    "kind": "vision",
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Complete new reverse-open unit: `docs/platform/vision.md#unheaded-block-14`
Native unit SHA256: `47e992413c7b6cbe3b8e2c54b93e7924dc9bb7edd12d047d87c2c368079b4718`
Shown text SHA256: `47e992413c7b6cbe3b8e2c54b93e7924dc9bb7edd12d047d87c2c368079b4718`

```text
| Need | Read |
| --- | --- |
| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Platform laws | [platform-foundations.md](platform-foundations.md) |
| Whole-system architecture | [architecture-map.md](architecture-map.md) |
| Component authority map | [component-boundary.md](component-boundary.md) |
| Documentation governance | [../doc-governance.md](../doc-governance.md) |
| Legacy full law source | [../platform-foundations.md](../platform-foundations.md) |
```


## Two intentional whole-file duplicate groups

The JSON/YAML carrier source decisions above preserve whole payloads byte-identically. Each new native duplicate-content group has exactly one mapped platform owner. Source rows remain pending. Review membership, full source/target bytes already shown at the named source claim and sole target owner as conservation accounting; resolution projection and cutover consumer rewrites remain final batch obligations after independent acceptance.

### Duplicate blob 11684583c2ac84357168e237f3ac045201377712

```json
{
  "blobSha": "11684583c2ac84357168e237f3ac045201377712",
  "paths": [
    "docs/contracts/fgos-gateway-api-v1.yaml",
    "docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml"
  ],
  "sourceClaimId": "claim_f0f4828229b64bd6cc8959111c824e24",
  "sourceUnitSHA256": "9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f",
  "targetUnitSHA256": "9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f",
  "wholeFileSHA256": "9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f",
  "fullShownText": "Complete source/target file-block shown above in sourceClaimId section; source and target bytes equal."
}
```

### Duplicate blob e923fa822dadf885952546d50b29fa88f352147e

```json
{
  "blobSha": "e923fa822dadf885952546d50b29fa88f352147e",
  "paths": [
    "docs/architecture-manifest.json",
    "docs/platform/contracts/architecture-manifest.json"
  ],
  "sourceClaimId": "claim_4b96f4f42ea417623dcc794155fa17ce",
  "sourceUnitSHA256": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
  "targetUnitSHA256": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
  "wholeFileSHA256": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
  "fullShownText": "Complete source/target file-block shown above in sourceClaimId section; source and target bytes equal."
}
```

