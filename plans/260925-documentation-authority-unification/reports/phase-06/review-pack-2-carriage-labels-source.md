# Review pack: s2-agent-coordination-carriage-labels-source

Pack commit: 91a899f1863b2147a0f96db855dd0b2695fddc95

Pack id: 809caa431a0e09d11a1879be649006ea37d88b69a6a4b2b35354622759b6d010

Author session: codex-session:1@2026-10-10

## claim_fb0f85ad508f7f857ba4c0963879790a

Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-49

Target: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fb0f85ad508f7f857ba4c0963879790a |
| sourceUnitDigest | 732cda65ebd7af7948f6c88b0edff5c2d628edd0c27eda62481934c9cda01e66 |
| targetOwner | docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md |
| targetAnchor | 12-dialogue-response-dialogue-responsemd |
| targetUnitDigest | 13d5476dee5a0e24b4fad8dd926f3d676fa2c6c2ea16c14a9e60067a6831221a |
| targetAncestry | \["Architecture Advisory Artifact Templates"\] |
| claimKind | contract |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | Whole-unit replacement, not a structural move or promotion: The full response-trace purpose is replaced by optional manual guidance, explicit absence of a companion-file recovery guarantee and the same authorized-response trace structure. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |

### Source unit

```text
**Why this exists.** This is the fourth and last layer of the Dialogue Turn
Protocol, and the one most likely to go unwritten — because a clarification
answered in conversation feels finished. It is not: a successor coordinator
reading `human/3-person.md` with no `dialogue/3-response.md` beside it cannot
tell whether the person was answered or dropped, and that is exactly the state
crash recovery is supposed to make impossible.
```

### Target unit

````text
## 12. Dialogue Response — `dialogue/<n>-response.md`

Optional manual response trace. Registered gates/continuation remain with
Workflow; no companion-directory crash-recovery guarantee is asserted.

**Why this exists.** An optional manual response trace can help a successor
understand whether a person was answered and which artifact supports the reply.
It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
registered Workflow does not guarantee crash recovery of these companion files.
The registered graph remains framing, shaping, critique, synthesis, explanation
and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).

It is also the layer where authority leaks. The response is produced under the
driver's authorization, and naming that authorization here is what makes it
checkable later that the panel did what it was permitted to do and not more.

When the owner chooses this manual convention, even a short cited response is
useful. A missing companion file is not a current Workflow completion failure.

```text
# Dialogue Response <n>

<provenance header — the role that authored the response. For a clarification
this is normally the lead advisor; for a reopen it is whichever advisors ran>

Responds to: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized by: dispositions.md § <D-id> — <the authorization in one line>

## What The Panel Says Back

<the actual response, in the person's vocabulary. If it defends a claim, it
cites the artifact the claim rests on; if it concedes, it says so plainly>

## What Ran To Produce This

<none — answered from existing artifacts | the actors dispatched, with their
run records. "None" is a legitimate and common answer for a clarification>

## What Changed As A Result

Artifacts revised: <path and revision, or: none>
Recommendation: <unchanged | changed, and how>

## What Did Not Change, And Why

<the conclusions this turn left standing. Stating these is what stops one
comment from being remembered later as having overturned more than it did>

## Still Open After This Turn

<or: nothing — the turn is closed>
```

**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
loses traceability; this rubric concern is not a registered runtime acceptance gate.

---
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-49"
+++ "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd"
@@ -1,6 +1,64 @@
-**Why this exists.** This is the fourth and last layer of the Dialogue Turn
-Protocol, and the one most likely to go unwritten — because a clarification
-answered in conversation feels finished. It is not: a successor coordinator
-reading `human/3-person.md` with no `dialogue/3-response.md` beside it cannot
-tell whether the person was answered or dropped, and that is exactly the state
-crash recovery is supposed to make impossible.
\ No newline at end of file
+## 12. Dialogue Response — `dialogue/<n>-response.md`
+
+Optional manual response trace. Registered gates/continuation remain with
+Workflow; no companion-directory crash-recovery guarantee is asserted.
+
+**Why this exists.** An optional manual response trace can help a successor
+understand whether a person was answered and which artifact supports the reply.
+It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
+registered Workflow does not guarantee crash recovery of these companion files.
+The registered graph remains framing, shaping, critique, synthesis, explanation
+and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).
+
+It is also the layer where authority leaks. The response is produced under the
+driver's authorization, and naming that authorization here is what makes it
+checkable later that the panel did what it was permitted to do and not more.
+
+When the owner chooses this manual convention, even a short cited response is
+useful. A missing companion file is not a current Workflow completion failure.
+
+```text
+# Dialogue Response <n>
+
+<provenance header — the role that authored the response. For a clarification
+this is normally the lead advisor; for a reopen it is whichever advisors ran>
+
+Responds to: human/<n>-person.md
+Reading applied: dialogue/<n>-impact.md
+Authorized by: dispositions.md § <D-id> — <the authorization in one line>
+
+## What The Panel Says Back
+
+<the actual response, in the person's vocabulary. If it defends a claim, it
+cites the artifact the claim rests on; if it concedes, it says so plainly>
+
+## What Ran To Produce This
+
+<none — answered from existing artifacts | the actors dispatched, with their
+run records. "None" is a legitimate and common answer for a clarification>
+
+## What Changed As A Result
+
+Artifacts revised: <path and revision, or: none>
+Recommendation: <unchanged | changed, and how>
+
+## What Did Not Change, And Why
+
+<the conclusions this turn left standing. Stating these is what stops one
+comment from being remembered later as having overturned more than it did>
+
+## Still Open After This Turn
+
+<or: nothing — the turn is closed>
+```
+
+**Bad fill.** A response with no `Authorized by` line, which means either the
+authorization was never recorded or the panel answered on its own initiative —
+both are findings for a red-team. A response that quietly exceeds its
+authorization: authorized to answer a clarification, it also revises the
+recommendation. A response that answers the impact assessment's reading rather
+than the person's actual words — the tell is that it never quotes or cites
+`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
+loses traceability; this rubric concern is not a registered runtime acceptance gate.
+
+---
\ No newline at end of file
````

## claim_234cfe4ee6319f76a699a920567daac2

Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-51

Target: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_234cfe4ee6319f76a699a920567daac2 |
| sourceUnitDigest | 054c801e9bc4afa2e28220d6e8687e0ed3f5dbcad32d9e4eb97f191b2e14d1b1 |
| targetOwner | docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md |
| targetAnchor | 12-dialogue-response-dialogue-responsemd |
| targetUnitDigest | 13d5476dee5a0e24b4fad8dd926f3d676fa2c6c2ea16c14a9e60067a6831221a |
| targetAncestry | \["Architecture Advisory Artifact Templates"\] |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | Whole-unit replacement, not a structural move or promotion: The whole response-file completeness rule is replaced by an owner-chosen manual convention: short cited replies remain useful, and a missing companion is not a registered completion failure. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |

### Source unit

```text
Every turn gets one, including the small ones. A one-paragraph response with a
citation is complete; a missing file is not.
```

### Target unit

````text
## 12. Dialogue Response — `dialogue/<n>-response.md`

Optional manual response trace. Registered gates/continuation remain with
Workflow; no companion-directory crash-recovery guarantee is asserted.

**Why this exists.** An optional manual response trace can help a successor
understand whether a person was answered and which artifact supports the reply.
It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
registered Workflow does not guarantee crash recovery of these companion files.
The registered graph remains framing, shaping, critique, synthesis, explanation
and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).

It is also the layer where authority leaks. The response is produced under the
driver's authorization, and naming that authorization here is what makes it
checkable later that the panel did what it was permitted to do and not more.

When the owner chooses this manual convention, even a short cited response is
useful. A missing companion file is not a current Workflow completion failure.

```text
# Dialogue Response <n>

<provenance header — the role that authored the response. For a clarification
this is normally the lead advisor; for a reopen it is whichever advisors ran>

Responds to: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized by: dispositions.md § <D-id> — <the authorization in one line>

## What The Panel Says Back

<the actual response, in the person's vocabulary. If it defends a claim, it
cites the artifact the claim rests on; if it concedes, it says so plainly>

## What Ran To Produce This

<none — answered from existing artifacts | the actors dispatched, with their
run records. "None" is a legitimate and common answer for a clarification>

## What Changed As A Result

Artifacts revised: <path and revision, or: none>
Recommendation: <unchanged | changed, and how>

## What Did Not Change, And Why

<the conclusions this turn left standing. Stating these is what stops one
comment from being remembered later as having overturned more than it did>

## Still Open After This Turn

<or: nothing — the turn is closed>
```

**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
loses traceability; this rubric concern is not a registered runtime acceptance gate.

---
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-51"
+++ "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd"
@@ -1,2 +1,64 @@
-Every turn gets one, including the small ones. A one-paragraph response with a
-citation is complete; a missing file is not.
\ No newline at end of file
+## 12. Dialogue Response — `dialogue/<n>-response.md`
+
+Optional manual response trace. Registered gates/continuation remain with
+Workflow; no companion-directory crash-recovery guarantee is asserted.
+
+**Why this exists.** An optional manual response trace can help a successor
+understand whether a person was answered and which artifact supports the reply.
+It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
+registered Workflow does not guarantee crash recovery of these companion files.
+The registered graph remains framing, shaping, critique, synthesis, explanation
+and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).
+
+It is also the layer where authority leaks. The response is produced under the
+driver's authorization, and naming that authorization here is what makes it
+checkable later that the panel did what it was permitted to do and not more.
+
+When the owner chooses this manual convention, even a short cited response is
+useful. A missing companion file is not a current Workflow completion failure.
+
+```text
+# Dialogue Response <n>
+
+<provenance header — the role that authored the response. For a clarification
+this is normally the lead advisor; for a reopen it is whichever advisors ran>
+
+Responds to: human/<n>-person.md
+Reading applied: dialogue/<n>-impact.md
+Authorized by: dispositions.md § <D-id> — <the authorization in one line>
+
+## What The Panel Says Back
+
+<the actual response, in the person's vocabulary. If it defends a claim, it
+cites the artifact the claim rests on; if it concedes, it says so plainly>
+
+## What Ran To Produce This
+
+<none — answered from existing artifacts | the actors dispatched, with their
+run records. "None" is a legitimate and common answer for a clarification>
+
+## What Changed As A Result
+
+Artifacts revised: <path and revision, or: none>
+Recommendation: <unchanged | changed, and how>
+
+## What Did Not Change, And Why
+
+<the conclusions this turn left standing. Stating these is what stops one
+comment from being remembered later as having overturned more than it did>
+
+## Still Open After This Turn
+
+<or: nothing — the turn is closed>
+```
+
+**Bad fill.** A response with no `Authorized by` line, which means either the
+authorization was never recorded or the panel answered on its own initiative —
+both are findings for a red-team. A response that quietly exceeds its
+authorization: authorized to answer a clarification, it also revises the
+recommendation. A response that answers the impact assessment's reading rather
+than the person's actual words — the tell is that it never quotes or cites
+`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
+loses traceability; this rubric concern is not a registered runtime acceptance gate.
+
+---
\ No newline at end of file
````

## claim_8c81cb12fcc0ff0408e9b5bb594cb1dc

Source: docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-53

Target: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8c81cb12fcc0ff0408e9b5bb594cb1dc |
| sourceUnitDigest | 5c25ba934123a77f41c1e242b1ef0746ca48edd4794f118dc40112830846a769 |
| targetOwner | docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md |
| targetAnchor | 12-dialogue-response-dialogue-responsemd |
| targetUnitDigest | 13d5476dee5a0e24b4fad8dd926f3d676fa2c6c2ea16c14a9e60067a6831221a |
| targetAncestry | \["Architecture Advisory Artifact Templates"\] |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | Whole-unit replacement, not a structural move or promotion: The full bad-fill rule retains authorization, scope and the person's words, while an undocumented manual reply is trace loss rather than a registered runtime gate. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |

### Source unit

```text
**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. And the worst one, because it is invisible: no file at
all, for a turn the coordinator answered in conversation and considered handled.

---
```

### Target unit

````text
## 12. Dialogue Response — `dialogue/<n>-response.md`

Optional manual response trace. Registered gates/continuation remain with
Workflow; no companion-directory crash-recovery guarantee is asserted.

**Why this exists.** An optional manual response trace can help a successor
understand whether a person was answered and which artifact supports the reply.
It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
registered Workflow does not guarantee crash recovery of these companion files.
The registered graph remains framing, shaping, critique, synthesis, explanation
and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).

It is also the layer where authority leaks. The response is produced under the
driver's authorization, and naming that authorization here is what makes it
checkable later that the panel did what it was permitted to do and not more.

When the owner chooses this manual convention, even a short cited response is
useful. A missing companion file is not a current Workflow completion failure.

```text
# Dialogue Response <n>

<provenance header — the role that authored the response. For a clarification
this is normally the lead advisor; for a reopen it is whichever advisors ran>

Responds to: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized by: dispositions.md § <D-id> — <the authorization in one line>

## What The Panel Says Back

<the actual response, in the person's vocabulary. If it defends a claim, it
cites the artifact the claim rests on; if it concedes, it says so plainly>

## What Ran To Produce This

<none — answered from existing artifacts | the actors dispatched, with their
run records. "None" is a legitimate and common answer for a clarification>

## What Changed As A Result

Artifacts revised: <path and revision, or: none>
Recommendation: <unchanged | changed, and how>

## What Did Not Change, And Why

<the conclusions this turn left standing. Stating these is what stops one
comment from being remembered later as having overturned more than it did>

## Still Open After This Turn

<or: nothing — the turn is closed>
```

**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
loses traceability; this rubric concern is not a registered runtime acceptance gate.

---
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-53"
+++ "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#12-dialogue-response-dialogue-responsemd"
@@ -1,10 +1,64 @@
+## 12. Dialogue Response — `dialogue/<n>-response.md`
+
+Optional manual response trace. Registered gates/continuation remain with
+Workflow; no companion-directory crash-recovery guarantee is asserted.
+
+**Why this exists.** An optional manual response trace can help a successor
+understand whether a person was answered and which artifact supports the reply.
+It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
+registered Workflow does not guarantee crash recovery of these companion files.
+The registered graph remains framing, shaping, critique, synthesis, explanation
+and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).
+
+It is also the layer where authority leaks. The response is produced under the
+driver's authorization, and naming that authorization here is what makes it
+checkable later that the panel did what it was permitted to do and not more.
+
+When the owner chooses this manual convention, even a short cited response is
+useful. A missing companion file is not a current Workflow completion failure.
+
+```text
+# Dialogue Response <n>
+
+<provenance header — the role that authored the response. For a clarification
+this is normally the lead advisor; for a reopen it is whichever advisors ran>
+
+Responds to: human/<n>-person.md
+Reading applied: dialogue/<n>-impact.md
+Authorized by: dispositions.md § <D-id> — <the authorization in one line>
+
+## What The Panel Says Back
+
+<the actual response, in the person's vocabulary. If it defends a claim, it
+cites the artifact the claim rests on; if it concedes, it says so plainly>
+
+## What Ran To Produce This
+
+<none — answered from existing artifacts | the actors dispatched, with their
+run records. "None" is a legitimate and common answer for a clarification>
+
+## What Changed As A Result
+
+Artifacts revised: <path and revision, or: none>
+Recommendation: <unchanged | changed, and how>
+
+## What Did Not Change, And Why
+
+<the conclusions this turn left standing. Stating these is what stops one
+comment from being remembered later as having overturned more than it did>
+
+## Still Open After This Turn
+
+<or: nothing — the turn is closed>
+```
+
 **Bad fill.** A response with no `Authorized by` line, which means either the
 authorization was never recorded or the panel answered on its own initiative —
 both are findings for a red-team. A response that quietly exceeds its
 authorization: authorized to answer a clarification, it also revises the
 recommendation. A response that answers the impact assessment's reading rather
 than the person's actual words — the tell is that it never quotes or cites
-`human/<n>-person.md`. And the worst one, because it is invisible: no file at
-all, for a turn the coordinator answered in conversation and considered handled.
+`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
+loses traceability; this rubric concern is not a registered runtime acceptance gate.
 
 ---
\ No newline at end of file
````

## claim_a3c5dcace145e25b55eeb9dca7a8221e

Source: docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-77

Target: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#what-this-rubric-deliberately-does-not-measure

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a3c5dcace145e25b55eeb9dca7a8221e |
| sourceUnitDigest | a976fc60a3892a75a48cec0a4158ba463d2e0f8acc1346ea6cfb37e196e73c7c |
| targetOwner | docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md |
| targetAnchor | what-this-rubric-deliberately-does-not-measure |
| targetUnitDigest | 9324fd893207958e7d4de33a9ec0259955a7107417fcbe9f707b94e0f5439366 |
| targetAncestry | \["Architecture Advisory Evaluation Rubric"\] |
| claimKind | decision |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | Whole-unit replacement, not a structural move or promotion: The whole non-measured rubric list remains, with current shipped Workflow/skill status and same-case advice-quality comparison replacing the future-productization claim. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |

### Source unit

```text
- **Length or polish.** A short session that reached a good decision beats a long
  one that reached the same decision more impressively.
- **Whether the person took the recommendation.** They hold the authority. A
  session where they decided against the panel, for reasons the panel helped them
  articulate, is a success.
- **Whether the panel agreed with itself.** Preserved disagreement is a feature.
- **Volume of alternatives.** Three real candidates beat six with three escorts.
- **Protocol conformance.** A conformance pass is not on this rubric at all, and
  that is intentional. If a future productized panel conforms perfectly to its
  protocol and scores worse here than this manual playbook did on the same case,
  the productization regressed — the rubric is the thing it has to beat, and the
  protocol is not a substitute for it.
```

### Target unit

```text
## What This Rubric Deliberately Does Not Measure

- **Length or polish.** A short session that reached a good decision beats a long
  one that reached the same decision more impressively.
- **Whether the person took the recommendation.** They hold the authority. A
  session where they decided against the panel, for reasons the panel helped them
  articulate, is a success.
- **Whether the panel agreed with itself.** Preserved disagreement is a feature.
- **Volume of alternatives.** Three real candidates beat six with three escorts.
- **Protocol conformance.** This manual quality rubric is not a runtime
  conformance gate. The architecture-advisory Workflow and skill already ship
  (`core/workflows/architecture-advisory.yaml`, `core/skills/fgos-architecture-panel/SKILL.md`).
  Compare advice quality on the same case without treating this rubric as a
  required score the registered runtime must pass; conformance alone is not quality.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-77"
+++ "docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#what-this-rubric-deliberately-does-not-measure"
@@ -1,3 +1,5 @@
+## What This Rubric Deliberately Does Not Measure
+
 - **Length or polish.** A short session that reached a good decision beats a long
   one that reached the same decision more impressively.
 - **Whether the person took the recommendation.** They hold the authority. A
@@ -5,8 +7,8 @@
   articulate, is a success.
 - **Whether the panel agreed with itself.** Preserved disagreement is a feature.
 - **Volume of alternatives.** Three real candidates beat six with three escorts.
-- **Protocol conformance.** A conformance pass is not on this rubric at all, and
-  that is intentional. If a future productized panel conforms perfectly to its
-  protocol and scores worse here than this manual playbook did on the same case,
-  the productization regressed — the rubric is the thing it has to beat, and the
-  protocol is not a substitute for it.
\ No newline at end of file
+- **Protocol conformance.** This manual quality rubric is not a runtime
+  conformance gate. The architecture-advisory Workflow and skill already ship
+  (`core/workflows/architecture-advisory.yaml`, `core/skills/fgos-architecture-panel/SKILL.md`).
+  Compare advice quality on the same case without treating this rubric as a
+  required score the registered runtime must pass; conformance alone is not quality.
\ No newline at end of file
```

## claim_1838df5e7c81c1fa79b336008e3b94bd

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1838df5e7c81c1fa79b336008e3b94bd |
| sourceUnitDigest | ce53d4284a859f9d95baf033102595aead78608a6a58c872b777da4dcd35e6a2 |
| claimKind | contract |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: The whole schema example is replaced by the current v2 reviewer contract with assessment; optional nextRecommendedOperation remains explicitly proposed, with its legal-only recommendation/driver-verification obligations retained. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | 7-agent-result-schema |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| targetUnitDigest | b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f |
| targetAncestry | \["Team Communication Protocol V1"\] |
| shownTargetDigest | cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920 |

### Source unit

````text
Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```
````

### Target unit

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28"
+++ "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema"
@@ -1,11 +1,49 @@
-Minimal schema:
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
+`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):
 
 ```json
 {
+  "contract": { "id": "agent-result-claim", "version": 2 },
   "status": "done",
   "summary": "One concise result sentence.",
   "findings": [],
   "evidenceRefs": [],
-  "nextRecommendedOperation": null
+  "assessment": { "verdict": "pass" }
 }
-```
\ No newline at end of file
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
+| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
+
+`nextRecommendedOperation` is a proposed optional extension, not a current
+validated schema field or a field the Work-layer caller presently consumes.
+
+For this proposed extension, the legality obligation remains:
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
+and undeclared-operation refusals enforce legal selection
+(`src/runner/operation-choice.mjs:747-761`,
+`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
+for the proposed field.
\ No newline at end of file
````

## claim_50cc0ff73dabd1642950365f358125c2

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_50cc0ff73dabd1642950365f358125c2 |
| sourceUnitDigest | f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-37 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-34 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-34: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f |
| targetAncestry | \["Team Communication Protocol V1","8. RunResult Confidence"\] |

### Source unit

```text
RunResult status and confidence are control-plane judgments.
```

### Target unit

```text
RunResult status and confidence are control-plane judgments.
```

### Unified diff

```diff
No text difference.
```

## claim_1c155ab462849e3ec4136ee9fa08a218

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1c155ab462849e3ec4136ee9fa08a218 |
| sourceUnitDigest | 09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6 |
| claimKind | contract |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: The whole confidence ladder is retained with the exact reported and failed branch qualifications, separate status/confidence and unchanged lifecycle restrictions. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-38 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| targetUnitDigest | 21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e |
| targetAncestry | \["Team Communication Protocol V1","8. RunResult Confidence"\] |

### Source unit

```text
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
```

### Target unit

```text
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35"
+++ "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38"
@@ -3,7 +3,7 @@ Confidence ladder:
 | Confidence | Meaning | Allowed use |
 |---|---|---|
 | `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
-| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
 | `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
 | `no-evidence` | Process settled without proof. | Must not advance Work. |
-| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
\ No newline at end of file
+| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
\ No newline at end of file
```

## claim_34284834ad2dd8f5a0fc5a924b8196a5

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_34284834ad2dd8f5a0fc5a924b8196a5 |
| sourceUnitDigest | 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-39 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-36 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-36: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a |
| targetAncestry | \["Team Communication Protocol V1","8. RunResult Confidence"\] |

### Source unit

```text
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Target unit

```text
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Unified diff

```diff
No text difference.
```

## claim_b602d530010f3b2f66ef5485bbff5bcb

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b602d530010f3b2f66ef5485bbff5bcb |
| sourceUnitDigest | 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-40 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-37 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-37: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269 |
| targetAncestry | \["Team Communication Protocol V1","9. Handoff Versus Assignment"\] |

### Source unit

```text
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
```

### Target unit

```text
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
```

### Unified diff

```diff
No text difference.
```

## claim_c37da632abaadd051eff58492f71c8c7

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c37da632abaadd051eff58492f71c8c7 |
| sourceUnitDigest | 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-41 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-38 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-38: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd |
| targetAncestry | \["Team Communication Protocol V1","9. Handoff Versus Assignment"\] |

### Source unit

```text
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
```

### Target unit

```text
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
```

### Unified diff

```diff
No text difference.
```

## claim_c52e0d7342545a9365e507c17a99e946

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c52e0d7342545a9365e507c17a99e946 |
| sourceUnitDigest | d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f |
| claimKind | decision |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-42 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-39 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-39: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f |
| targetAncestry | \["Team Communication Protocol V1","9. Handoff Versus Assignment"\] |

### Source unit

```text
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### Target unit

```text
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### Unified diff

```diff
No text difference.
```

## claim_f4f513bfd7ca5fd9708005243a624f95

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f4f513bfd7ca5fd9708005243a624f95 |
| sourceUnitDigest | 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-56 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-53 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-53: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3 |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

```text
Multi-agent implementation benefits from a durable operating harness:
```

### Target unit

```text
Multi-agent implementation benefits from a durable operating harness:
```

### Unified diff

```diff
No text difference.
```

## claim_b165c6ca3702ce5335599867e447ae55

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b165c6ca3702ce5335599867e447ae55 |
| sourceUnitDigest | 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-57 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-54 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-54: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

````text
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
````

### Target unit

````text
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
````

### Unified diff

```diff
No text difference.
```

## claim_8b6511ceef7788eaaecfbe1c17de0ccf

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8b6511ceef7788eaaecfbe1c17de0ccf |
| sourceUnitDigest | 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-58 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-55 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-55: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264 |
| targetAncestry | \["Team Communication Protocol V1","11. Coordination Operating Harness"\] |

### Source unit

```text
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
```

### Target unit

```text
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
```

### Unified diff

```diff
No text difference.
```

## claim_033a7b790516e8618c276525412173f8

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-64

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-61

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_033a7b790516e8618c276525412173f8 |
| sourceUnitDigest | 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-64 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-61 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-64 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-58: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | 734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5 |
| targetAncestry | \["Team Communication Protocol V1","13. Acceptance Criteria For V1 Protocol"\] |

### Source unit

```text
The protocol is ready for driver adoption when:
```

### Target unit

```text
The protocol is ready for driver adoption when:
```

### Unified diff

```diff
No text difference.
```

## claim_6ed12fe83f43ad052bbcde7a88beee1d

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-65

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6ed12fe83f43ad052bbcde7a88beee1d |
| sourceUnitDigest | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-65 is retained in docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-62 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-65 -\> PLAT:proposals/team-communication-protocol-v1.md#unheaded-block-59: Source unit is carried unchanged into the matching current section, true against code except where an exception is listed. |
| targetUnitDigest | aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae |
| targetAncestry | \["Team Communication Protocol V1","13. Acceptance Criteria For V1 Protocol"\] |

### Source unit

```text
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Target unit

```text
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```

### Unified diff

```diff
No text difference.
```

## claim_312c758a5236381993df5c20d5827ec8

Source: docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-16

Target: docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-16

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_312c758a5236381993df5c20d5827ec8 |
| sourceUnitDigest | 1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088 |
| claimKind | contract |
| disposition | move |
| rationale | The complete primitive conservation unit at docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-16 is retained in docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-16. Its frozen unit digest is identical. The full surrounding section is shown in the native pack and requires an independent semantic/current-code check; digest equality does not approve that context. The rejected whole-file retirement does not retire this surviving subject. The complete dated prior file remains in history, and no previous approval carries to this binding. |
| targetOwner | docs/platform/agent-coordination/architecture/protocol-model.md |
| targetAnchor | unheaded-block-16 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:architecture/protocol-model.md#unheaded-block-16 -\> PLAT:architecture/protocol-model.md#unheaded-block-16: Unit carried unchanged in the matching current section whose text is true against src/workflow and assignment code, except where an exception is listed. |
| targetUnitDigest | 1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088 |
| targetAncestry | \["Coordination Protocol Model","Compatibility"\] |

### Source unit

```text
The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
```

### Target unit

```text
The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
```

### Unified diff

```diff
No text difference.
```

## claim_9431e63ec3fc3f89927e22abc8f14a91

Source: docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-19

Target: docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-18

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9431e63ec3fc3f89927e22abc8f14a91 |
| sourceUnitDigest | 7e89be501e0db9edb0e49a5712a6e5d9f169db353ec4b9560e30b3d09410cb6e |
| claimKind | contract |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: Current Workflow definitions/operations and domain harnesses replace retired declared protocols; all other extension families and the two-consumer prerequisite remain. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/architecture/protocol-model.md |
| targetAnchor | unheaded-block-18 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| targetUnitDigest | 55cb6ba79e492af45076c573cbd3a10cbe633ce0684f83856244121df23a3800 |
| targetAncestry | \["Coordination Protocol Model","Domain Augmentation"\] |

### Source unit

```text
Domains and organizations may add knowledge, doctrine, Skills, declared
protocols, planning validators, resource/isolation analysis, evidence policy,
roles, souls, and quality criteria. The foundation introduces a shared extension
seam only after at least two unlike consumers prove the common responsibility.
```

### Target unit

```text
Domains and organizations may add knowledge, doctrine, Skills, declared
Workflow definitions/operations and domain harnesses, planning validators,
resource/isolation analysis, evidence policy, roles, souls and quality criteria.
The foundation introduces a shared extension seam only after at least two unlike
consumers prove the common responsibility.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-19"
+++ "docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-18"
@@ -1,4 +1,5 @@
 Domains and organizations may add knowledge, doctrine, Skills, declared
-protocols, planning validators, resource/isolation analysis, evidence policy,
-roles, souls, and quality criteria. The foundation introduces a shared extension
-seam only after at least two unlike consumers prove the common responsibility.
\ No newline at end of file
+Workflow definitions/operations and domain harnesses, planning validators,
+resource/isolation analysis, evidence policy, roles, souls and quality criteria.
+The foundation introduces a shared extension seam only after at least two unlike
+consumers prove the common responsibility.
\ No newline at end of file
```

## claim_c0ec44efc62ae8bbbf2c114f387739f5

Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-15

Target: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-12

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c0ec44efc62ae8bbbf2c114f387739f5 |
| sourceUnitDigest | bf271555e5896946f4460a8c4f0b5606bc316c4d4385dd44095744ffecc579e4 |
| claimKind | architecture |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: The whole collection/admission/cancellation/new-intent rule is now explicitly proposed; current cancel-unsupported precedence is named rather than asserting the proposal is implemented. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/architecture/runtime-recovery-design.md |
| targetAnchor | unheaded-block-12 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| targetUnitDigest | eb464ad4bcc6c521f6b0c5d435c1477899f37e122184bdb2e8277b560a3b5e06 |
| targetAncestry | \["Runtime Recovery And Work Continuity","4. Recovery Choice"\] |

### Source unit

```text
Result scanning wins before any new execution, including after budget exhaustion
or cancellation. Read/collect is not admission. Cancellation bars retry and
automatic continuation of the cancelled intent, but does not discard late results.
An explicit new user intent is a new request, not an escape through continuation.
```

### Target unit

```text
Proposed cancellation/budget rule: result collection would remain available after
budget exhaustion or cancellation, without admitting another execution; a new
intent would require a new request. This is not implemented cancellation precedence:
current Herdr/cli reconciliation returns `cancel-unsupported` before scanning
results (`herdr-reconcile.mjs:351-355`, `reconcile-cli-spawn.mjs:38-47`).
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-15"
+++ "docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-12"
@@ -1,4 +1,5 @@
-Result scanning wins before any new execution, including after budget exhaustion
-or cancellation. Read/collect is not admission. Cancellation bars retry and
-automatic continuation of the cancelled intent, but does not discard late results.
-An explicit new user intent is a new request, not an escape through continuation.
\ No newline at end of file
+Proposed cancellation/budget rule: result collection would remain available after
+budget exhaustion or cancellation, without admitting another execution; a new
+intent would require a new request. This is not implemented cancellation precedence:
+current Herdr/cli reconciliation returns `cancel-unsupported` before scanning
+results (`herdr-reconcile.mjs:351-355`, `reconcile-cli-spawn.mjs:38-47`).
\ No newline at end of file
```

## claim_11d149c1655503f91604b77b40e6a381

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-63

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-63

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_11d149c1655503f91604b77b40e6a381 |
| sourceUnitDigest | 34555a0470d333a0fdb8cb90fe3ec86b1b995f7eaeadb4045a94fe923af517f8 |
| claimKind | architecture |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: Operation-over-base constraint precedence and the reserved most-specific fallback list replace union/broader-append rules; all other field families retain their explicit rules. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-63 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| targetUnitDigest | 1fbaaf88c36de2e7e4edd84567ee5fe71382be4b94cd04f3d9ad0f7b7e38994d |
| targetAncestry | \["Dispatch Control Plane Redesign","7. Governance And Egress","7.2 Policy Resolution Before DispatchPlan"\] |

### Source unit

```text
| Field family | Rule |
|---|---|
| Constraints | union, then fail closed if unsatisfied |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |
```

### Target unit

```text
| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-63"
+++ "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-63"
@@ -1,8 +1,8 @@
 | Field family | Rule |
 |---|---|
-| Constraints | union, then fail closed if unsatisfied |
+| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
 | Provider / executor preference | highest-specificity wins |
-| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
+| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
 | Tier / rigor | strongest required tier wins |
 | Model name | resolve from provider/model policy after effective provider and tier are known |
 | Literal model name | assignment or human/CLI override only |
```

## claim_5eef231348dcdc9566a29285fce97d59

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5eef231348dcdc9566a29285fce97d59 |
| sourceUnitDigest | d21190bae4555d4ffb7422c076dc0aae42515ab18733c6e8d9206e97565bbca3 |
| claimKind | architecture |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: The example replaces role minTier/risk fields with operation/work rigor while retaining persona preference, explicit executor and the final egress gate. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-64 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| targetUnitDigest | 02ee7e3e7835a160002d151febae81ba521e7a0346444890f38df54bdbf0cdaa |
| targetAncestry | \["Dispatch Control Plane Redesign","7. Governance And Egress","7.2 Policy Resolution Before DispatchPlan"\] |

### Source unit

````text
Example:

```txt
role reviewer requires minTier=standard
operation validate-plan prefers persona=code-reviewer
work risk=high raises minTier=critical
assignment prefers executor=claude
governance checks effective egress
```
````

### Target unit

````text
Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64"
+++ "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64"
@@ -1,9 +1,9 @@
 Example:
 
 ```txt
-role reviewer requires minTier=standard
+operation reviewer requires rigor=standard
 operation validate-plan prefers persona=code-reviewer
-work risk=high raises minTier=critical
+work.rigor=critical raises the effective rigor
 assignment prefers executor=claude
 governance checks effective egress
 ```
\ No newline at end of file
````

## claim_7c56791bc2955ef63687b7134d2cd053

Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership

Target: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7c56791bc2955ef63687b7134d2cd053 |
| sourceUnitDigest | e1304a6a126e9f403638d42ccb4476b132e6aa74cdf84bbca3bf92cfb26e1678 |
| targetOwner | docs/platform/agent-coordination/architecture/dispatch-control-plane.md |
| targetAnchor | component-internal-ownership |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| targetUnitDigest | 2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce |
| targetAncestry | \["Dispatch Control Plane"\] |
| shownTargetDigest | 0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833 |

### Source unit

```text
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer** — accepts only a normalized capability/executor
   target plus PolicyPatch/provenance; performs no Work graph traversal.
2. **Capability binding resolver** — resolves capability aliases, `prefer`,
   and executor `for[]` declarations (`resolveExecutorAndOverrides`).
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`/
   `mergePolicyStack`; owns provider/model/tier derivation and provenance.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()`; joins the prior
   decisions into one plan. Remains the sole execution chooser.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private dispatch path for a coordination or domain harness —
  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
  pre-dispatch feasibility check; it never spawns and never bypasses them.
```

### Target unit

```text
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership"
+++ "docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership"
@@ -4,21 +4,25 @@ The Dispatch And Execution Engine owns exactly these authorities. No other
 component performs any of them; this control plane performs none of the
 Component-Outer Boundary Note's responsibilities.
 
-1. **Request normalizer** — accepts only a normalized capability/executor
-   target plus PolicyPatch/provenance; performs no Work graph traversal.
-2. **Capability binding resolver** — resolves capability aliases, `prefer`,
-   and executor `for[]` declarations (`resolveExecutorAndOverrides`).
+1. **Request normalizer (design)** — the normalized target/policy/provenance
+   boundary is proposed; current inputs are the compiler options above.
+2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
+   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
+   inform capability labels separately in `resolveCapabilityDetailsFromHints`
+   (`resolve.mjs:25-66,269-310`), not this binding resolver.
 3. **Executor registry resolver** — resolves a literal executor-id to its
    concrete invocation/tool/agent shape (`resolveExecutorConfig`).
-4. **Policy resolver** — `resolveAssignmentDispatchPolicy`/
-   `mergePolicyStack`; owns provider/model/tier derivation and provenance.
+4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
+   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
 5. **Governance resolver** — checks egress/provider/executor/content
    constraints (cross-provider gate, `allowCrossProvider`, `carries`).
 6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
    and MCP/tool handback (`decideDispatchMechanism`,
    `decideExecutorDispatchMechanism`).
-7. **DispatchPlan compiler** — `compileDispatchPlan()`; joins the prior
-   decisions into one plan. Remains the sole execution chooser.
+7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
+   dispatch decisions. Unit execution first obtains its binding through
+   `bind()`; assignment-runner revalidates that binding and compiles the
+   governed execution plan. The domain harness owns neither choice.
 8. **Run runtime/adapters** — creates, launches, observes, settles, and
    retries a Run without choosing semantic operation
    (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
@@ -27,12 +31,10 @@ Forbidden dependencies for all eight:
 
 - no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
 - no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
-- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);
+- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
 - no semantic operation choice;
 - no direct protocol/skill/domain executor launch;
 - no RunResult confidence decision (owned by the Run Result Evaluator);
 - no provider/model selection outside the policy resolver (item 4);
-- no second private dispatch path for a coordination or domain harness —
-  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
-  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
-  pre-dispatch feasibility check; it never spawns and never bypasses them.
\ No newline at end of file
+- no second private executor-launch path for a domain or coordinating harness.
+  The retired `cohort-planner.mjs` is not a current exception or authority.
\ No newline at end of file
```

## claim_901dae1b8039d130359712125f4d69f9

Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

Target: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_901dae1b8039d130359712125f4d69f9 |
| sourceUnitDigest | dbaf1434220173d1544ccc02f9daa13ca9f87453ace7ad899ef0b8167d758b97 |
| targetOwner | docs/platform/agent-coordination/architecture/executor-health-and-fallback.md |
| targetAnchor | 2-production-ladder-semantics |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/architecture/executor-health-and-fallback.md","targetAnchor":"2-production-ladder-semantics","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | 21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8 |
| targetAncestry | \["Executor Fallback And Effect Eligibility"\] |

### Source unit

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.

A screen request is a second stage of the same sample, not another death reading.
Keep all failure panes by default. Paused-limit survives automated closeAlways;
operator destructive intent is separate and guarded. Never infer Run completion
from agent_status or pane idleness.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

### Target unit

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics"
+++ "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics"
@@ -2,16 +2,22 @@
 
 The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
 1. Worker result file beats all runtime readings; it still requires normalization.
-2. Blocked beats timeout: answer the existing question, do not retry.
+2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
 3. Death requires consecutive absent readings (default 3); unknown/present reset.
 4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
-5. Only stale evaluation reads screen; working itself is progress even with zero
-   stdout, and blind intervals are subtracted from idle duration.
+5. Idle/stale evaluation subtracts blind time; working is progress even with
+   zero stdout. Screen reads are requested at the stale boundary, and an early
+   credential probe also runs after fifteen seconds of non-working idle time
+   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.
 
-A screen request is a second stage of the same sample, not another death reading.
-Keep all failure panes by default. Paused-limit survives automated closeAlways;
-operator destructive intent is separate and guarded. Never infer Run completion
-from agent_status or pane idleness.
+A requested screen is the second stage of the sample, not another death read.
+`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
+Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
+Keep all failure panes by default; both limit outcomes survive automated
+`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
+and guarded. Never infer Run completion from `agent_status` or pane idleness;
+the ladder settles on the result file, which still requires normalization
+(`liveness.mjs:238-246`).
 
 Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
 be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
```

## claim_37887f05ca0822cd7c415eaadda42c55

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_37887f05ca0822cd7c415eaadda42c55 |
| sourceUnitDigest | fd36ed4ee645f1e8a36bd3a20ac076a9c70d7bc1c89c2b3488edcb551816a21b |
| claimKind | contract |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | 7-agent-result-schema |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md","targetAnchor":"7-agent-result-schema","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920 |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f |
| targetAncestry | \["Team Communication Protocol V1"\] |

### Source unit

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |
```

### Target unit

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32"
+++ "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema"
@@ -1,6 +1,49 @@
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
+`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):
+
+```json
+{
+  "contract": { "id": "agent-result-claim", "version": 2 },
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "assessment": { "verdict": "pass" }
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
 | Status | Required fields |
 |---|---|
-| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
-| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
+| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
 | `failed` | `summary`; `error`. |
-| `no-evidence` | `summary`; reason why evidence is absent. |
\ No newline at end of file
+| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
+
+`nextRecommendedOperation` is a proposed optional extension, not a current
+validated schema field or a field the Work-layer caller presently consumes.
+
+For this proposed extension, the legality obligation remains:
+
+Optional `nextRecommendedOperation` may name another legal stage operation, but
+it is only a recommendation. The driver must verify legality before acting.
+The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
+and undeclared-operation refusals enforce legal selection
+(`src/runner/operation-choice.mjs:747-761`,
+`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
+for the proposed field.
\ No newline at end of file
````

## claim_3d5dc31cf6cf90ba661de6bb1fafb486

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3d5dc31cf6cf90ba661de6bb1fafb486 |
| sourceUnitDigest | 546c59ef10ff886d2fd256b488c6193c117c59d5e82632dbb8c14b30cd072efc |
| claimKind | contract |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | 7-agent-result-schema |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md","targetAnchor":"7-agent-result-schema","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920 |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f |
| targetAncestry | \["Team Communication Protocol V1"\] |

### Source unit

```text
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
```

### Target unit

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33"
+++ "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema"
@@ -1,2 +1,49 @@
+## 7. Agent Result Schema
+
+`agent-result.json` is the worker's structured claim. It is not proof by
+itself.
+
+Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
+`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):
+
+```json
+{
+  "contract": { "id": "agent-result-claim", "version": 2 },
+  "status": "done",
+  "summary": "One concise result sentence.",
+  "findings": [],
+  "evidenceRefs": [],
+  "assessment": { "verdict": "pass" }
+}
+```
+
+Allowed status values:
+
+| Status | Meaning |
+|---|---|
+| `done` | The worker believes the assignment objective is complete. |
+| `blocked` | The worker could not complete because a named blocker remains. |
+| `failed` | The worker attempted the assignment and produced an error or invalid output. |
+| `no-evidence` | The worker can report context but cannot support a completion claim. |
+
+Required fields by status:
+
+| Status | Required fields |
+|---|---|
+| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
+| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
+| `failed` | `summary`; `error`. |
+| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
+
+`nextRecommendedOperation` is a proposed optional extension, not a current
+validated schema field or a field the Work-layer caller presently consumes.
+
+For this proposed extension, the legality obligation remains:
+
 Optional `nextRecommendedOperation` may name another legal stage operation, but
-it is only a recommendation. The driver must verify legality before acting.
\ No newline at end of file
+it is only a recommendation. The driver must verify legality before acting.
+The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
+and undeclared-operation refusals enforce legal selection
+(`src/runner/operation-choice.mjs:747-761`,
+`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
+for the proposed field.
\ No newline at end of file
````

## claim_57f26b5acbd6bb500ca353f84f486488

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_57f26b5acbd6bb500ca353f84f486488 |
| sourceUnitDigest | 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-44 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-41 -\> proposals/team-communication-protocol-v1.md#unheaded-block-41 (move): unit unheaded-block-41 -\> unheaded-block-41 (249-256): current target text discovery is machine-alone: feature.yaml discovery declares judge-ambiguity and resolve-question only, and the human gate sits on exploring; the old claim is preserved or correctly retired |
| targetUnitDigest | 538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.1 Discovery"\] |

### Source unit

```text
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
```

### Target unit

```text
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
```

### Unified diff

```diff
No text difference.
```

## claim_78524c36c6f57c543377be47620d748c

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_78524c36c6f57c543377be47620d748c |
| sourceUnitDigest | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-45 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-42 -\> proposals/team-communication-protocol-v1.md#unheaded-block-42 (move): unit unheaded-block-42 -\> unheaded-block-42 (258-263): current target text discovery is machine-alone: feature.yaml discovery declares judge-ambiguity and resolve-question only, and the human gate sits on exploring; the old claim is preserved or correctly retired |
| targetUnitDigest | b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.1 Discovery"\] |

### Source unit

```text
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### Target unit

```text
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### Unified diff

```diff
No text difference.
```

## claim_242208b542d4bb24c84796f43f775d4a

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_242208b542d4bb24c84796f43f775d4a |
| sourceUnitDigest | 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 |
| claimKind | decision |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-46 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-43 -\> proposals/team-communication-protocol-v1.md#unheaded-block-43 (move): unit unheaded-block-43 -\> unheaded-block-43 (267-267): current target text feature.yaml exploring carries the human gate plus lock-decisions, answer-question (dispatch human-only) and resolve-question, matching the text; the old claim is preserved or correctly retired |
| targetUnitDigest | 8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.2 Exploring"\] |

### Source unit

```text
Exploring is the human-adjacent decision-locking stage.
```

### Target unit

```text
Exploring is the human-adjacent decision-locking stage.
```

### Unified diff

```diff
No text difference.
```

## claim_88cf23510b37d2048b1a578efc2ebb10

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_88cf23510b37d2048b1a578efc2ebb10 |
| sourceUnitDigest | 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-47 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-44 -\> proposals/team-communication-protocol-v1.md#unheaded-block-44 (move): unit unheaded-block-44 -\> unheaded-block-44 (269-273): current target text feature.yaml exploring carries the human gate plus lock-decisions, answer-question (dispatch human-only) and resolve-question, matching the text; the old claim is preserved or correctly retired |
| targetUnitDigest | 6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.2 Exploring"\] |

### Source unit

```text
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
```

### Target unit

```text
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
```

### Unified diff

```diff
No text difference.
```

## claim_abb60eb206ce120877cc9c06f826ab57

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_abb60eb206ce120877cc9c06f826ab57 |
| sourceUnitDigest | 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-48 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-45 -\> proposals/team-communication-protocol-v1.md#unheaded-block-45 (move): unit unheaded-block-45 -\> unheaded-block-45 (275-276): current target text feature.yaml exploring carries the human gate plus lock-decisions, answer-question (dispatch human-only) and resolve-question, matching the text; the old claim is preserved or correctly retired |
| targetUnitDigest | 6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.2 Exploring"\] |

### Source unit

```text
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### Target unit

```text
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### Unified diff

```diff
No text difference.
```

## claim_a6f71d465ebccd696428b94ff6f664af

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a6f71d465ebccd696428b94ff6f664af |
| sourceUnitDigest | 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-49 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-46 -\> proposals/team-communication-protocol-v1.md#unheaded-block-46 (move): unit unheaded-block-46 -\> unheaded-block-46 (280-280): current target text feature.yaml:64-100 declares shape-plan (implementer) and validate-plan (reviewer, fgos-coding-validating), so the claim that no future adoption is needed is true; the old claim is preserved or correctly retired |
| targetUnitDigest | 14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.3 Planning"\] |

### Source unit

```text
Planning has two main operation families:
```

### Target unit

```text
Planning has two main operation families:
```

### Unified diff

```diff
No text difference.
```

## claim_6b4789439adfb6eb3b05c85b7ed8f7e0

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6b4789439adfb6eb3b05c85b7ed8f7e0 |
| sourceUnitDigest | f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-50 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-47 -\> proposals/team-communication-protocol-v1.md#unheaded-block-47 (move): unit unheaded-block-47 -\> unheaded-block-47 (282-283): current target text feature.yaml:64-100 declares shape-plan (implementer) and validate-plan (reviewer, fgos-coding-validating), so the claim that no future adoption is needed is true; the old claim is preserved or correctly retired |
| targetUnitDigest | f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.3 Planning"\] |

### Source unit

```text
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
```

### Target unit

```text
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
```

### Unified diff

```diff
No text difference.
```

## claim_8b79ab2d01c7ce85912eb9f0a25bf3ea

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8b79ab2d01c7ce85912eb9f0a25bf3ea |
| sourceUnitDigest | 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-52 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-49 -\> proposals/team-communication-protocol-v1.md#unheaded-block-49 (move): unit unheaded-block-49 -\> unheaded-block-49 (289-291): current target text feature.yaml:64-100 declares shape-plan (implementer) and validate-plan (reviewer, fgos-coding-validating), so the claim that no future adoption is needed is true; the old claim is preserved or correctly retired |
| targetUnitDigest | 999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.3 Planning"\] |

### Source unit

```text
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### Target unit

```text
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### Unified diff

```diff
No text difference.
```

## claim_e16b56644d520a0fe0a4cd6b40c2459a

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e16b56644d520a0fe0a4cd6b40c2459a |
| sourceUnitDigest | 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-53 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-50 -\> proposals/team-communication-protocol-v1.md#unheaded-block-50 (move): unit unheaded-block-50 -\> unheaded-block-50 (295-295): current target text feature.yaml executing declares implement-item, review-item, fix-verify-red, scoped-subtask, scout-blast-radius and resolve-question with the roles named in the text; the old claim is preserved or correctly retired |
| targetUnitDigest | 62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.4 Executing"\] |

### Source unit

```text
Executing has the richest team protocol:
```

### Target unit

```text
Executing has the richest team protocol:
```

### Unified diff

```diff
No text difference.
```

## claim_a86887b78fbc23319db13f3bf4816dd8

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a86887b78fbc23319db13f3bf4816dd8 |
| sourceUnitDigest | 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-54 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-51 -\> proposals/team-communication-protocol-v1.md#unheaded-block-51 (move): unit unheaded-block-51 -\> unheaded-block-51 (297-301): current target text feature.yaml executing declares implement-item, review-item, fix-verify-red, scoped-subtask, scout-blast-radius and resolve-question with the roles named in the text; the old claim is preserved or correctly retired |
| targetUnitDigest | 3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.4 Executing"\] |

### Source unit

```text
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
```

### Target unit

```text
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
```

### Unified diff

```diff
No text difference.
```

## claim_fad0d749adc5ef611ee344c16b7c661e

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fad0d749adc5ef611ee344c16b7c661e |
| sourceUnitDigest | 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 |
| claimKind | contract |
| disposition | move |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-55 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-52 -\> proposals/team-communication-protocol-v1.md#unheaded-block-52 (move): unit unheaded-block-52 -\> unheaded-block-52 (303-305): current target text feature.yaml executing declares implement-item, review-item, fix-verify-red, scoped-subtask, scout-blast-radius and resolve-question with the roles named in the text; the old claim is preserved or correctly retired |
| targetUnitDigest | 3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962 |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.4 Executing"\] |

### Source unit

```text
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### Target unit

```text
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### Unified diff

```diff
No text difference.
```

## claim_d277029b4e3a80bc6eb3c33a7990b182

Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-29

Target: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d277029b4e3a80bc6eb3c33a7990b182 |
| sourceUnitDigest | 95a2b7c5b5d00e917f2c042d1d49d3829b707933cfea28a3d65f1887744d1c08 |
| claimKind | architecture |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/architecture/dispatch-control-plane.md |
| targetAnchor | component-internal-ownership |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/architecture/dispatch-control-plane.md","targetAnchor":"component-internal-ownership","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | 0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833 |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | 2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce |
| targetAncestry | \["Dispatch Control Plane"\] |

### Source unit

```text
1. **Request normalizer** — accepts only a normalized capability/executor
   target plus PolicyPatch/provenance; performs no Work graph traversal.
2. **Capability binding resolver** — resolves capability aliases, `prefer`,
   and executor `for[]` declarations (`resolveExecutorAndOverrides`).
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`/
   `mergePolicyStack`; owns provider/model/tier derivation and provenance.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()`; joins the prior
   decisions into one plan. Remains the sole execution chooser.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
```

### Target unit

```text
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-29"
+++ "docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership"
@@ -1,18 +1,40 @@
-1. **Request normalizer** — accepts only a normalized capability/executor
-   target plus PolicyPatch/provenance; performs no Work graph traversal.
-2. **Capability binding resolver** — resolves capability aliases, `prefer`,
-   and executor `for[]` declarations (`resolveExecutorAndOverrides`).
+## Component-Internal Ownership
+
+The Dispatch And Execution Engine owns exactly these authorities. No other
+component performs any of them; this control plane performs none of the
+Component-Outer Boundary Note's responsibilities.
+
+1. **Request normalizer (design)** — the normalized target/policy/provenance
+   boundary is proposed; current inputs are the compiler options above.
+2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
+   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
+   inform capability labels separately in `resolveCapabilityDetailsFromHints`
+   (`resolve.mjs:25-66,269-310`), not this binding resolver.
 3. **Executor registry resolver** — resolves a literal executor-id to its
    concrete invocation/tool/agent shape (`resolveExecutorConfig`).
-4. **Policy resolver** — `resolveAssignmentDispatchPolicy`/
-   `mergePolicyStack`; owns provider/model/tier derivation and provenance.
+4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
+   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
 5. **Governance resolver** — checks egress/provider/executor/content
    constraints (cross-provider gate, `allowCrossProvider`, `carries`).
 6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
    and MCP/tool handback (`decideDispatchMechanism`,
    `decideExecutorDispatchMechanism`).
-7. **DispatchPlan compiler** — `compileDispatchPlan()`; joins the prior
-   decisions into one plan. Remains the sole execution chooser.
+7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
+   dispatch decisions. Unit execution first obtains its binding through
+   `bind()`; assignment-runner revalidates that binding and compiles the
+   governed execution plan. The domain harness owns neither choice.
 8. **Run runtime/adapters** — creates, launches, observes, settles, and
    retries a Run without choosing semantic operation
-   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
\ No newline at end of file
+   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
+
+Forbidden dependencies for all eight:
+
+- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
+- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
+- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
+- no semantic operation choice;
+- no direct protocol/skill/domain executor launch;
+- no RunResult confidence decision (owned by the Run Result Evaluator);
+- no provider/model selection outside the policy resolver (item 4);
+- no second private executor-launch path for a domain or coordinating harness.
+  The retired `cohort-planner.mjs` is not a current exception or authority.
\ No newline at end of file
```

## claim_194da7d0a9b40e6ba93d40df2b58eaec

Source: docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-31

Target: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_194da7d0a9b40e6ba93d40df2b58eaec |
| sourceUnitDigest | e9b40512995229674223f2e51e2cf80e9bc9f95814714f443178d73d8bcece52 |
| claimKind | contract |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/architecture/dispatch-control-plane.md |
| targetAnchor | component-internal-ownership |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| targetUnitDigest | 2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce |
| targetAncestry | \["Dispatch Control Plane"\] |
| shownTargetDigest | 0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833 |

### Source unit

```text
- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private dispatch path for a coordination or domain harness —
  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
  pre-dispatch feasibility check; it never spawns and never bypasses them.
```

### Target unit

```text
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-31"
+++ "docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership"
@@ -1,11 +1,40 @@
+## Component-Internal Ownership
+
+The Dispatch And Execution Engine owns exactly these authorities. No other
+component performs any of them; this control plane performs none of the
+Component-Outer Boundary Note's responsibilities.
+
+1. **Request normalizer (design)** — the normalized target/policy/provenance
+   boundary is proposed; current inputs are the compiler options above.
+2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
+   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
+   inform capability labels separately in `resolveCapabilityDetailsFromHints`
+   (`resolve.mjs:25-66,269-310`), not this binding resolver.
+3. **Executor registry resolver** — resolves a literal executor-id to its
+   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
+4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
+   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
+5. **Governance resolver** — checks egress/provider/executor/content
+   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
+6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
+   and MCP/tool handback (`decideDispatchMechanism`,
+   `decideExecutorDispatchMechanism`).
+7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
+   dispatch decisions. Unit execution first obtains its binding through
+   `bind()`; assignment-runner revalidates that binding and compiles the
+   governed execution plan. The domain harness owns neither choice.
+8. **Run runtime/adapters** — creates, launches, observes, settles, and
+   retries a Run without choosing semantic operation
+   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
+
+Forbidden dependencies for all eight:
+
 - no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
 - no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
-- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);
+- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
 - no semantic operation choice;
 - no direct protocol/skill/domain executor launch;
 - no RunResult confidence decision (owned by the Run Result Evaluator);
 - no provider/model selection outside the policy resolver (item 4);
-- no second private dispatch path for a coordination or domain harness —
-  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
-  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
-  pre-dispatch feasibility check; it never spawns and never bypasses them.
\ No newline at end of file
+- no second private executor-launch path for a domain or coordinating harness.
+  The retired `cohort-planner.mjs` is not a current exception or authority.
\ No newline at end of file
```

## claim_f35f68bb3feae40702d02c97d02cea0b

Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-7

Target: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f35f68bb3feae40702d02c97d02cea0b |
| sourceUnitDigest | 3cf3dc60ee31fd5df6ab2864b92ed1f3bdc96982df814f65c4afb545b4458957 |
| claimKind | architecture |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/architecture/executor-health-and-fallback.md |
| targetAnchor | 2-production-ladder-semantics |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/architecture/executor-health-and-fallback.md","targetAnchor":"2-production-ladder-semantics","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | 21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8 |
| targetAncestry | \["Executor Fallback And Effect Eligibility"\] |

### Source unit

```text
The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.
```

### Target unit

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-7"
+++ "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics"
@@ -1,7 +1,27 @@
+## 2. Production Ladder Semantics
+
 The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
 1. Worker result file beats all runtime readings; it still requires normalization.
-2. Blocked beats timeout: answer the existing question, do not retry.
+2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
 3. Death requires consecutive absent readings (default 3); unknown/present reset.
 4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
-5. Only stale evaluation reads screen; working itself is progress even with zero
-   stdout, and blind intervals are subtracted from idle duration.
\ No newline at end of file
+5. Idle/stale evaluation subtracts blind time; working is progress even with
+   zero stdout. Screen reads are requested at the stale boundary, and an early
+   credential probe also runs after fifteen seconds of non-working idle time
+   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.
+
+A requested screen is the second stage of the sample, not another death read.
+`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
+Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
+Keep all failure panes by default; both limit outcomes survive automated
+`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
+and guarded. Never infer Run completion from `agent_status` or pane idleness;
+the ladder settles on the result file, which still requires normalization
+(`liveness.mjs:238-246`).
+
+Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
+be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
+Handshake timeout with unknown delivery is not proof of launch failure.
+The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
+An adapter may parse a known provider reset format, preserving the original line;
+otherwise retryAfter is absent. RetryAfter only schedules inspection.
\ No newline at end of file
```

## claim_06019161f3eadb87a1a6fe714da0d8e6

Source: docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-8

Target: docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_06019161f3eadb87a1a6fe714da0d8e6 |
| sourceUnitDigest | 16a6a7ab095e99754b130605651b5c88ba99d377a3a22f140b254077ba6733fb |
| claimKind | architecture |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/architecture/executor-health-and-fallback.md |
| targetAnchor | 2-production-ladder-semantics |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| targetUnitDigest | 21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8 |
| targetAncestry | \["Executor Fallback And Effect Eligibility"\] |
| shownTargetDigest | a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc |

### Source unit

```text
A screen request is a second stage of the same sample, not another death reading.
Keep all failure panes by default. Paused-limit survives automated closeAlways;
operator destructive intent is separate and guarded. Never infer Run completion
from agent_status or pane idleness.
```

### Target unit

```text
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-8"
+++ "docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics"
@@ -1,4 +1,27 @@
-A screen request is a second stage of the same sample, not another death reading.
-Keep all failure panes by default. Paused-limit survives automated closeAlways;
-operator destructive intent is separate and guarded. Never infer Run completion
-from agent_status or pane idleness.
\ No newline at end of file
+## 2. Production Ladder Semantics
+
+The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
+1. Worker result file beats all runtime readings; it still requires normalization.
+2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
+3. Death requires consecutive absent readings (default 3); unknown/present reset.
+4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
+5. Idle/stale evaluation subtracts blind time; working is progress even with
+   zero stdout. Screen reads are requested at the stale boundary, and an early
+   credential probe also runs after fifteen seconds of non-working idle time
+   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.
+
+A requested screen is the second stage of the sample, not another death read.
+`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
+Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
+Keep all failure panes by default; both limit outcomes survive automated
+`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
+and guarded. Never infer Run completion from `agent_status` or pane idleness;
+the ladder settles on the result file, which still requires normalization
+(`liveness.mjs:238-246`).
+
+Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
+be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
+Handshake timeout with unknown delivery is not proof of launch failure.
+The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
+An adapter may parse a known provider reset format, preserving the original line;
+otherwise retryAfter is absent. RetryAfter only schedules inspection.
\ No newline at end of file
```

## claim_9e039b5f6acdd3eb0fa002d35c2a3f54

Source: docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-15

Target: docs/platform/agent-coordination/architecture/protocol-model.md#compatibility

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9e039b5f6acdd3eb0fa002d35c2a3f54 |
| sourceUnitDigest | 4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c |
| claimKind | contract |
| disposition | supersede |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| targetOwner | docs/platform/agent-coordination/architecture/protocol-model.md |
| targetAnchor | compatibility |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/architecture/protocol-model.md","targetAnchor":"compatibility","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | a0a50b9e5327a33e11548c30917dac1b43360b9cf2e8932cb762ef7c1829fb8c |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | 83aa85a06907fe314ff287f9c63d0d67417933bd0af40a8426180ee499369f64 |
| targetAncestry | \["Coordination Protocol Model"\] |

### Source unit

```text
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it.
```

### Target unit

```text
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/protocol-model.md#unheaded-block-15"
+++ "docs/platform/agent-coordination/architecture/protocol-model.md#compatibility"
@@ -1,2 +1,20 @@
+## Compatibility
+
+`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
+first); `skillForStep` reads `step.skill` separately and falls back to a declared
+status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
+an operation. Compatibility remains a projection, not permission to weaken the
+mandatory declared-operation, transition or evidence constraints. The existing
+`operationsForStep`/`isLegalStepMove` projections preserve declared legality
+(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.
+
 This compatibility path remains mandatory for Work-attached declared workflows.
-Adding an agent-led path must not weaken or reinterpret it.
\ No newline at end of file
+Adding an agent-led path must not weaken or reinterpret it. The current Work
+driver resolves the legal normalized operations, preserves their primary default
+and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
+declared Assignment creation independently requires a legal operation and its
+TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
+compatibility and legality obligations, not a revival of the retired engine.
+
+The exact normalized contract is defined in
+[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
\ No newline at end of file
```

## claim_66366a2de3e810733eaaf6905e57628b

Source: docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-34

Target: docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-38

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_66366a2de3e810733eaaf6905e57628b |
| sourceUnitDigest | 98815955352ea016dd5a0d03b1302502496a4fec5202fe95e2f7b126e1cc007f |
| claimKind | contract |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: Current v3 default/v4 support replaces the historical v2-default wording while preserving all result, observation, wrapper, classification, legacy and corruption boundaries. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/contracts/assignment-run-runresult.md |
| targetAnchor | unheaded-block-38 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/contracts/assignment-run-runresult.md","targetAnchor":"unheaded-block-38","disposition":"move","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| targetUnitDigest | 23d3360350d9203713ffa49ccd90c47fae6eff15620a38f2a36e3b9b40a6b48e |
| targetAncestry | \["Assignment, Run, And RunResult Contract","RunResult","Dispatch Operability Addendum"\] |
| shownTargetDigest | 23d3360350d9203713ffa49ccd90c47fae6eff15620a38f2a36e3b9b40a6b48e |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |

### Source unit

```text
- `RunResult` remains the only immutable terminal truth for a Run.
- `RunObservation` is a mutable read projection for in-flight, ambiguous, or
  incomplete facts; it cannot settle, retry, cancel, authorize, or clear a
  guard.
- `ProviderOutcome` is a host-invocation wrapper, not Run truth.
- `agent-result.json` becomes `agent-result-claim.v2`, a worker claim consumed
  by the normalizer, never independent proof.
- New v2 results classify execution, assessment, confidence, failure, policy,
  delivery, and provenance separately.
- Historical v1 results are interpreted deterministically as `legacy-derived`
  and are not rewritten on read.
- A v2 result whose compatibility `status`/`confidence` disagrees with its
  classification is `contract-corrupt` and fails closed.
```

### Target unit

```text
- `RunResult` remains the only immutable terminal truth for a Run.
- `RunObservation` is a mutable read projection for in-flight, ambiguous, or
  incomplete facts; it cannot settle, retry, cancel, authorize, or clear a
  guard.
- `ProviderOutcome` is a host-invocation wrapper, not Run truth.
- `agent-result.json` becomes `agent-result-claim.v2`, a worker claim consumed
  by the normalizer, never independent proof.
- Current normalization defaults to RunResult v3 and also supports v4
  (`run-result.mjs:350-351,557-563`); v2 is the historical interpretation
  recorded by this design addendum, not the current default. Execution,
  assessment, confidence, failure, policy, delivery and provenance stay separate.
- Historical v1 results are interpreted deterministically as `legacy-derived`
  and are not rewritten on read.
- A v2 result whose compatibility `status`/`confidence` disagrees with its
  classification is `contract-corrupt` and fails closed.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-34"
+++ "docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-38"
@@ -5,8 +5,10 @@
 - `ProviderOutcome` is a host-invocation wrapper, not Run truth.
 - `agent-result.json` becomes `agent-result-claim.v2`, a worker claim consumed
   by the normalizer, never independent proof.
-- New v2 results classify execution, assessment, confidence, failure, policy,
-  delivery, and provenance separately.
+- Current normalization defaults to RunResult v3 and also supports v4
+  (`run-result.mjs:350-351,557-563`); v2 is the historical interpretation
+  recorded by this design addendum, not the current default. Execution,
+  assessment, confidence, failure, policy, delivery and provenance stay separate.
 - Historical v1 results are interpreted deterministically as `legacy-derived`
   and are not rewritten on read.
 - A v2 result whose compatibility `status`/`confidence` disagrees with its
```

## claim_432d7c4b1684e3d11aade76846dc2193

Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-66

Target: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_432d7c4b1684e3d11aade76846dc2193 |
| sourceUnitDigest | 74d1a79c159657dabd64e7bc2d04c0737ede2b74bbf3c1a4dcea0053f6b8b3c6 |
| claimKind | architecture |
| disposition | supersede |
| rationale | Whole-unit replacement, not a structural move or promotion: Dated first-proof recommendations replace live defaults; the proof table remains historical, and effective configuration/binding owns current execution. The source remains completely accounted by its pinned source unit and the literal historical carriage. Independent review 9351a257f accepted the corrected truth; this relabelled decision requires its own pending targeted check under A23. |
| targetOwner | docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md |
| targetAnchor | unheaded-block-67 |
| authoredBy | codex-session:1@2026-10-10 |
| reviewStatus | pending |
| reviewNote | Pending independent carriage-label verification after the accepted truth verdict; no earlier approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md","targetAnchor":"unheaded-block-67","disposition":"move","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| targetUnitDigest | 40bd432c24f73273a929aa993f623685addfa0720d7b0568ee06f005bc403ea6 |
| targetAncestry | \["Dispatch Control Plane Redesign","7. Governance And Egress","7.3 Recommended V1 Provider Policy For Coding Feature Flow"\] |
| shownTargetDigest | 40bd432c24f73273a929aa993f623685addfa0720d7b0568ee06f005bc403ea6 |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |

### Source unit

```text
Use these as defaults for the first team-dispatch proof, not permanent hard
bindings.
```

### Target unit

```text
The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-66"
+++ "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67"
@@ -1,2 +1,2 @@
-Use these as defaults for the first team-dispatch proof, not permanent hard
-bindings.
\ No newline at end of file
+The table records dated proof recommendations only. It supplies neither current
+defaults nor live bindings; use effective configuration and binding for execution.
\ No newline at end of file
```

## claim_6ce1d10cc50a8bd04bd82b4b65486125

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6ce1d10cc50a8bd04bd82b4b65486125 |
| sourceUnitDigest | b62841ac251963f3384c9cb2db74e6c3df5579d39869c29fe4a96fa25b5dd47a |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | 7-agent-result-schema |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| beforeTargetedFix | {"targetOwner":"docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md","targetAnchor":"7-agent-result-schema","disposition":"supersede","shownTargetDigest":null,"reviewCommit":"947f6169e826564b6e00bafb8a0535ec2ff6f0ea"} |
| shownTargetDigest | cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920 |
| truthFixEvidence | plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json |
| targetUnitDigest | b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f |
| targetAncestry | \["Team Communication Protocol V1"\] |

### Source unit

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
````

### Target unit

````text
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
````

### Unified diff

````diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema"
+++ "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema"
@@ -3,15 +3,17 @@
 `agent-result.json` is the worker's structured claim. It is not proof by
 itself.
 
-Minimal schema:
+Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
+`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):
 
 ```json
 {
+  "contract": { "id": "agent-result-claim", "version": 2 },
   "status": "done",
   "summary": "One concise result sentence.",
   "findings": [],
   "evidenceRefs": [],
-  "nextRecommendedOperation": null
+  "assessment": { "verdict": "pass" }
 }
 ```
 
@@ -28,10 +30,20 @@ Required fields by status:
 
 | Status | Required fields |
 |---|---|
-| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
-| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
+| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
+| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
 | `failed` | `summary`; `error`. |
-| `no-evidence` | `summary`; reason why evidence is absent. |
+| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
+
+`nextRecommendedOperation` is a proposed optional extension, not a current
+validated schema field or a field the Work-layer caller presently consumes.
+
+For this proposed extension, the legality obligation remains:
 
 Optional `nextRecommendedOperation` may name another legal stage operation, but
-it is only a recommendation. The driver must verify legality before acting.
\ No newline at end of file
+it is only a recommendation. The driver must verify legality before acting.
+The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
+and undeclared-operation refusals enforce legal selection
+(`src/runner/operation-choice.mjs:747-761`,
+`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
+for the proposed field.
\ No newline at end of file
````

## claim_f7388f36e2422375b8acf615e169e8c3

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f7388f36e2422375b8acf615e169e8c3 |
| sourceUnitDigest | dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | unheaded-block-43 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | The frozen primitive is still byte-identical at docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40; only its owning heading ancestry was corrected in 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The move/carriage decision is unchanged. Heading/context changes invalidate the prior approval even when the primitive text digest is equal. The current section and its specific code evidence in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json are pending independent truth review. |
| reviewNote | LEG:proposals/team-communication-protocol-v1.md#unheaded-block-40 -\> proposals/team-communication-protocol-v1.md#unheaded-block-40 (move): unit unheaded-block-40 -\> unheaded-block-40 (247-247): current target text discovery is machine-alone: feature.yaml discovery declares judge-ambiguity and resolve-question only, and the human gate sits on exploring; the old claim is preserved or correctly retired |
| targetUnitDigest | dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a |
| targetAncestry | \["Team Communication Protocol V1","10. Coding-Domain Workflow Step Operations","10.1 Discovery"\] |

### Source unit

```text
Discovery is machine-alone.
```

### Target unit

```text
Discovery is machine-alone.
```

### Unified diff

```diff
No text difference.
```

## claim_1053b6e0b639f5a2970343078b6e04fe

Source: docs/architect/agent-coordination/architecture/protocol-model.md#domain-augmentation

Target: docs/platform/agent-coordination/architecture/protocol-model.md#domain-augmentation

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1053b6e0b639f5a2970343078b6e04fe |
| sourceUnitDigest | 6a06c2d7a1a48d21bd95a1f73670aa6d5eb42e4493199e35e1b4b1bbe8a439e7 |
| targetOwner | docs/platform/agent-coordination/architecture/protocol-model.md |
| targetAnchor | domain-augmentation |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | Supersede the complete older Domain Augmentation section with its whole current counterpart: the extension list replaces declared protocols with Workflow definitions/operations and domain harnesses while preserving the full extension responsibilities and two-unlike-consumers common-seam condition. These claim-bearing words make the inherited move label false under A23; A24 permits this same-batch label correction. The current and source whole sections are shown for independent verification, with no approval carry. |
| reviewNote | A24 inherited same-batch changed-claim move label corrected; pending independent whole-unit verification. |
| targetUnitDigest | 719057129311d43f8d206c76a7d74e0e5ba1410de21d3b527729f45561e80ef1 |
| targetAncestry | \["Coordination Protocol Model"\] |

### Source unit

```text
## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
protocols, planning validators, resource/isolation analysis, evidence policy,
roles, souls, and quality criteria. The foundation introduces a shared extension
seam only after at least two unlike consumers prove the common responsibility.
```

### Target unit

```text
## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
Workflow definitions/operations and domain harnesses, planning validators,
resource/isolation analysis, evidence policy, roles, souls and quality criteria.
The foundation introduces a shared extension seam only after at least two unlike
consumers prove the common responsibility.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/protocol-model.md#domain-augmentation"
+++ "docs/platform/agent-coordination/architecture/protocol-model.md#domain-augmentation"
@@ -1,6 +1,7 @@
 ## Domain Augmentation
 
 Domains and organizations may add knowledge, doctrine, Skills, declared
-protocols, planning validators, resource/isolation analysis, evidence policy,
-roles, souls, and quality criteria. The foundation introduces a shared extension
-seam only after at least two unlike consumers prove the common responsibility.
\ No newline at end of file
+Workflow definitions/operations and domain harnesses, planning validators,
+resource/isolation analysis, evidence policy, roles, souls and quality criteria.
+The foundation introduces a shared extension seam only after at least two unlike
+consumers prove the common responsibility.
\ No newline at end of file
```

## claim_f0435011b158171bddbfd8053eb545be

Source: docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-23

Target: docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-19

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f0435011b158171bddbfd8053eb545be |
| sourceUnitDigest | faf435fea61e67b20d66133614123271cfb0290e4faade45546a7513ffd9d49a |
| targetOwner | docs/platform/agent-coordination/architecture/runtime-recovery-design.md |
| targetAnchor | unheaded-block-19 |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23. |
| reviewNote | Shown target text changed under the authorized citation/wording or full-unit obligation correction; rebound to its real native digest and ancestry, pending independent targeted verification. No approval is carried. |
| targetUnitDigest | 8b0822d6aee06fb803ed5f4d5ee08be2d6971c66153ef18b4707e7cd8f327e11 |
| targetAncestry | \["Runtime Recovery And Work Continuity","6. Local Concurrency And Durability"\] |
| shownTargetDigest | 8b0822d6aee06fb803ed5f4d5ee08be2d6971c66153ef18b4707e7cd8f327e11 |

### Source unit

```text
Publication uses a fully written/fsynced temp file in the same directory,
followed by atomic non-overwriting publication (local filesystem hard-link on
the initial Linux adapter), then directory fsync. State replacement uses
temp+rename+directory fsync under the owning lock. This retains exclusive-create
semantics while avoiding empty-lock and conditional-unlink races seen in P12.
Implemented (Phase 02 H3) for the mutable Run/Assignment artifacts named in
the contract doc (`result.json`, `run.json`, the effective-execution-contract
projection, and the per-attempt dispatch-bookkeeping marker) via
`publishMutableProjection`/`publishMarkerOnce`; a resume that finds an
existing `result.json` which fails to parse refuses rather than relaunching
over unreadable evidence. Unsupported filesystem guarantees refuse mutation
with a named diagnostic; doctor must probe them before this writer profile is
enabled. No distributed
lease, background renew service or TTL-only takeover is required by default.
```

### Target unit

```text
The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-23"
+++ "docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-19"
@@ -1,14 +1,15 @@
-Publication uses a fully written/fsynced temp file in the same directory,
-followed by atomic non-overwriting publication (local filesystem hard-link on
-the initial Linux adapter), then directory fsync. State replacement uses
-temp+rename+directory fsync under the owning lock. This retains exclusive-create
-semantics while avoiding empty-lock and conditional-unlink races seen in P12.
-Implemented (Phase 02 H3) for the mutable Run/Assignment artifacts named in
-the contract doc (`result.json`, `run.json`, the effective-execution-contract
-projection, and the per-attempt dispatch-bookkeeping marker) via
-`publishMutableProjection`/`publishMarkerOnce`; a resume that finds an
-existing `result.json` which fails to parse refuses rather than relaunching
-over unreadable evidence. Unsupported filesystem guarantees refuse mutation
-with a named diagnostic; doctor must probe them before this writer profile is
-enabled. No distributed
-lease, background renew service or TTL-only takeover is required by default.
\ No newline at end of file
+The proposed durability profile requires a fully written/fsynced temp file in
+the same directory, atomic non-overwriting publication and directory fsync.
+It calls for temp+rename+directory fsync under the owning lock for replacement.
+Those are design requirements; the implementation's best-effort directory
+fsync and other limits are stated below, not silently promoted to guarantees.
+Current terminal `result.json` is published by `publishImmutableProof`
+(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
+effective-execution-contract projection and bookkeeping markers use their
+mutable/marker writers. An unreadable existing result refuses relaunch rather
+than overwriting evidence. The proof helper fsyncs the file, hard-links it
+without overwrite, treats `EEXIST` as an existing proof and rethrows other link
+errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
+A dedicated unsupported-filesystem diagnostic/doctor probe is a design
+requirement, not an implemented check. No distributed lease, background
+renewal service or TTL-only takeover is required by this local design.
\ No newline at end of file
```

## claim_2ef5d353dab2d57f38906df73e709125

Source: docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence

Target: docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2ef5d353dab2d57f38906df73e709125 |
| sourceUnitDigest | b930743c66d1a445599637265e539d903ae758f754be54c8a992ce2eaf080872 |
| targetOwner | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md |
| targetAnchor | 8-runresult-confidence |
| claimKind | architecture |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-10 |
| rationale | Supersede the complete older RunResult Confidence section with its whole current counterpart. All five confidence classes, the separate status/confidence boundary and the done/no-evidence driver obligation are addressed; reported includes the current blocked/read-only/findings branches and failed has the actual finding-verdict exception (run-result.mjs:1250-1285). Those changed claim-bearing statements make the inherited move label false under A23; A24 permits correcting it. No approval carries; independent review checks the complete source/current sections. |
| reviewNote | A24 inherited same-batch changed-claim move label corrected; pending independent whole-unit verification. |
| targetUnitDigest | df9d32cf08bb1d1ad7eeb00936e175005cfd2305b9de8a713672fbc3c690039e |
| targetAncestry | \["Team Communication Protocol V1"\] |

### Source unit

```text
## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Target unit

```text
## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence"
+++ "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence"
@@ -7,10 +7,10 @@ Confidence ladder:
 | Confidence | Meaning | Allowed use |
 |---|---|---|
 | `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
-| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
+| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
 | `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
 | `no-evidence` | Process settled without proof. | Must not advance Work. |
-| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
+| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
 
 The driver must treat `done/no-evidence` as not done. It may retry, ask for a
 proper artifact, or route to a different legal operation.
\ No newline at end of file
```

## Unmatched candidate units

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatch-control-plane

````text
# Dispatch Control Plane

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/dispatch-control-plane.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-1

````text
```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/dispatch-control-plane.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#implementation-and-design-status

```text
## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Responsibility | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:1-10 (executeAssignment; 'Never mutates Work lifecycle state') |
| Flow | Implemented compiler pipeline; capability-set declaration remains design | compileDispatchPlan plan.mjs:45,444-461; no standalone execution-capability-set step is claimed |
| Routing Identities | Legacy resolver implementation, distinct from host binding | resolve.mjs:33-66,269; executor for[] remains read by that resolver; runner.md contradiction is queued separately |
| Contracts | Current implementation plus explicitly labelled target interfaces | DispatchRequest normalizer is proposed; compiled fields and accepted policy inputs are stated locally |
| DispatchRequest (outer → core) | Unimplemented design proposal | git grep DispatchRequest src packages apps domains bin test: zero hits; plan.mjs:45 options bag is still the de facto request |
| PolicyPatch | Current policy resolver; normalized patch API remains design | assignment-policy.mjs:181,334-380; supported preference and rigor differ from runner.md's removal narrative, queued separately |
| DispatchPlan (core → runtime) | Current compiled fields; example target shape is not literal output | plan.mjs:444-461; policy.executor-mismatch-ignored is a real reason code |
| Executor Kinds | Current contract/invariant | src/runner/dispatch/config.mjs:452 EXECUTOR_KINDS=['agent','tool']; src/runner/dispatch/resolve.mjs:385 Gate B3; test/runner/dispatch.test.mjs |
| Component-Internal Ownership | Current owners; proposed normalizer labelled design | resolve, assignment-policy, mechanism, plan, assignment-runner, transport and herdr-round; no live cohort exception |
| Component-Outer Boundary Note | Current authority boundary and proposed normalized handoff | assignment-runner.mjs:523-539; outer callers cannot create an ungoverned launch door |
| Governance | Current contract/invariant | assignment-policy.mjs:146; config.mjs:454-488; actual invocation/confinement validation before launch |
| Separation Of Concerns | Current owner boundary | assignment.mjs, plan.mjs, assignment-runner.mjs, run-result.mjs; semantic operation selection belongs outside dispatch |
| Source Inventory | Current source owners; no unsupported manifest registration | src/runner/work-compat.mjs and operation-choice.mjs are Work-layer modules; boundary tests prohibit lifecycle mutation, not all occurrences of claim |
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-3

```text
The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-4

```text
| Section | Status | Evidence / limit |
|---|---|---|
| Responsibility | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:1-10 (executeAssignment; 'Never mutates Work lifecycle state') |
| Flow | Implemented compiler pipeline; capability-set declaration remains design | compileDispatchPlan plan.mjs:45,444-461; no standalone execution-capability-set step is claimed |
| Routing Identities | Legacy resolver implementation, distinct from host binding | resolve.mjs:33-66,269; executor for[] remains read by that resolver; runner.md contradiction is queued separately |
| Contracts | Current implementation plus explicitly labelled target interfaces | DispatchRequest normalizer is proposed; compiled fields and accepted policy inputs are stated locally |
| DispatchRequest (outer → core) | Unimplemented design proposal | git grep DispatchRequest src packages apps domains bin test: zero hits; plan.mjs:45 options bag is still the de facto request |
| PolicyPatch | Current policy resolver; normalized patch API remains design | assignment-policy.mjs:181,334-380; supported preference and rigor differ from runner.md's removal narrative, queued separately |
| DispatchPlan (core → runtime) | Current compiled fields; example target shape is not literal output | plan.mjs:444-461; policy.executor-mismatch-ignored is a real reason code |
| Executor Kinds | Current contract/invariant | src/runner/dispatch/config.mjs:452 EXECUTOR_KINDS=['agent','tool']; src/runner/dispatch/resolve.mjs:385 Gate B3; test/runner/dispatch.test.mjs |
| Component-Internal Ownership | Current owners; proposed normalizer labelled design | resolve, assignment-policy, mechanism, plan, assignment-runner, transport and herdr-round; no live cohort exception |
| Component-Outer Boundary Note | Current authority boundary and proposed normalized handoff | assignment-runner.mjs:523-539; outer callers cannot create an ungoverned launch door |
| Governance | Current contract/invariant | assignment-policy.mjs:146; config.mjs:454-488; actual invocation/confinement validation before launch |
| Separation Of Concerns | Current owner boundary | assignment.mjs, plan.mjs, assignment-runner.mjs, run-result.mjs; semantic operation selection belongs outside dispatch |
| Source Inventory | Current source owners; no unsupported manifest registration | src/runner/work-compat.mjs and operation-choice.mjs are Work-layer modules; boundary tests prohibit lifecycle mutation, not all occurrences of claim |
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#responsibility

```text
## Responsibility

The dispatch control plane converts one semantic Assignment into one governed
execution attempt. It resolves target, capability, provider/model/tier,
soul/profile, mechanism, adapter, policy checks, result channel, and runtime
metadata.

It does not choose the Work lifecycle transition or invent a semantic operation.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-5

```text
The dispatch control plane converts one semantic Assignment into one governed
execution attempt. It resolves target, capability, provider/model/tier,
soul/profile, mechanism, adapter, policy checks, result channel, and runtime
metadata.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-6

```text
It does not choose the Work lifecycle transition or invent a semantic operation.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow

````text
## Flow

```txt
Assignment
  -> policy resolver
  -> executor/target resolution
  -> governance and egress checks
  -> mechanism/adapter selection
  -> execution capability set
  -> Run creation and launch
  -> settlement/result collection
  -> RunResult normalization
```

Execution requirements are not inferred merely from the mechanism name.
The current implementation expresses prompt delivery, permission posture and
confinement through executor/configuration and adapter checks. A unified
`execution capability set` is a design description, not a separately emitted
plan field or an implemented compiler stage. Unsupported requirements must
not be silently weakened; check the owning adapter and confinement authority.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-7

````text
```txt
Assignment
  -> policy resolver
  -> executor/target resolution
  -> governance and egress checks
  -> mechanism/adapter selection
  -> execution capability set
  -> Run creation and launch
  -> settlement/result collection
  -> RunResult normalization
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-8

```text
Execution requirements are not inferred merely from the mechanism name.
The current implementation expresses prompt delivery, permission posture and
confinement through executor/configuration and adapter checks. A unified
`execution capability set` is a design description, not a separately emitted
plan field or an implemented compiler stage. Unsupported requirements must
not be silently weakened; check the owning adapter and confinement authority.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities

````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-9

```text
The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-10

````text
```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-11

```text
`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-12

```text
`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-13

```text
Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts

```text
## Contracts

The following shapes describe the intended request/policy/plan boundary.
The status below each distinguishes design fields from the actual exported
function inputs and compiled output; do not send the illustrative JSON as if
all fields were already accepted by a typed normalizer.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-14

```text
The following shapes describe the intended request/policy/plan boundary.
The status below each distinguishes design fields from the actual exported
function inputs and compiled output; do not send the illustrative JSON as if
all fields were already accepted by a typed normalizer.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core

````text
### DispatchRequest (outer → core)

```json
{
  "target": { "kind": "capability | executor", "value": "code:implement" },
  "policy": {
    "rigor": "standard",
    "preferExecutor": "agy-herdr",
    "fallbackExecutors": ["codex-herdr"],
    "preferPersona": "code-reviewer",
    "visibility": "headless"
  },
  "provenance": {
    "source": "workflow-operation",
    "domain": "coding",
    "workflow": "feature",
    "workflowStep": "executing",
    "operation": "implement-item",
    "taskSpec": "implement-item",
    "skill": "fgos-coding-implement"
  }
}
```

Rules:

- `target.kind: capability` resolves through `runner.capabilities` and
  executor `for[]` bindings.
- `target.kind: executor` is an explicit concrete override and remains
  visible as an override — it must not silently discard a requested
  capability's provenance.
- `provenance` is explanatory/audit metadata, not an extra route key.
- Work/workflow/task/skill objects never cross this boundary as semantic
  resolver input; they are read by the component-outer caller only, before
  a DispatchRequest is built.
- An unavailable capability is a valid resolution result (`mechanism:
  "unavailable"`), not malformed config.

**Implementation status.** No single typed `DispatchRequest` object exists
yet. `compileDispatchPlan()`'s options bag
(`executorId | for | work | assignment | needsSoul | hasLiveTaskAccess |
caller | workItem | workExecutorId | assignmentItem | cliOverride | options`)
is the current input shape (`plan.mjs:46-60`). Work compatibility context is
resolved through that path, not through a shipped typed DispatchRequest helper.
The proposed normalized outer request remains an unimplemented design.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-15

````text
```json
{
  "target": { "kind": "capability | executor", "value": "code:implement" },
  "policy": {
    "rigor": "standard",
    "preferExecutor": "agy-herdr",
    "fallbackExecutors": ["codex-herdr"],
    "preferPersona": "code-reviewer",
    "visibility": "headless"
  },
  "provenance": {
    "source": "workflow-operation",
    "domain": "coding",
    "workflow": "feature",
    "workflowStep": "executing",
    "operation": "implement-item",
    "taskSpec": "implement-item",
    "skill": "fgos-coding-implement"
  }
}
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-16

```text
Rules:

- `target.kind: capability` resolves through `runner.capabilities` and
  executor `for[]` bindings.
- `target.kind: executor` is an explicit concrete override and remains
  visible as an override — it must not silently discard a requested
  capability's provenance.
- `provenance` is explanatory/audit metadata, not an extra route key.
- Work/workflow/task/skill objects never cross this boundary as semantic
  resolver input; they are read by the component-outer caller only, before
  a DispatchRequest is built.
- An unavailable capability is a valid resolution result (`mechanism:
  "unavailable"`), not malformed config.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-17

```text
**Implementation status.** No single typed `DispatchRequest` object exists
yet. `compileDispatchPlan()`'s options bag
(`executorId | for | work | assignment | needsSoul | hasLiveTaskAccess |
caller | workItem | workExecutorId | assignmentItem | cliOverride | options`)
is the current input shape (`plan.mjs:46-60`). Work compatibility context is
resolved through that path, not through a shipped typed DispatchRequest helper.
The proposed normalized outer request remains an unimplemented design.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch

````text
### PolicyPatch

```txt
Global defaults
→ Domain defaults
→ Workflow defaults
→ Step defaults
→ Operation/taskSpec defaults
→ Role defaults
→ Persona defaults
→ Work policy
→ Assignment policy
→ Human/CLI inputs
→ Governance
```

This is the documented policy composition order, not a claim that every scope
is separately discovered by the leaf resolver. Callers supply composed inputs;
`resolveAssignmentDispatchPolicy` resolves Assignment/Work/config/caller inputs.

- Explicit rigor requirements cannot be weakened by a later lower requirement;
  the implicit standard is a fallback, not a floor. Derived tiers retain the
  strongest requirement (`assignment-policy.mjs:224-325`).
- Executor/persona preferences use the most-specific supported input, subject
  to governance (`assignment-policy.mjs:332-380`).
- Provider/model selection belongs to the registered executor/policy path.
- Portable YAML uses rigor rather than removed `minTier` or explicit tier/model
  pins; the resolver rejects those retired/forbidden inputs
  (`assignment-policy.mjs:203-215`). A general
  `assertNoPortableExecutorPin` helper is not current implementation.
- Effective provenance records winning values and sources
  (`assignment-policy.mjs:493-505`); no current `mergePolicyStack` function is
  implied by the composition diagram.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-18

````text
```txt
Global defaults
→ Domain defaults
→ Workflow defaults
→ Step defaults
→ Operation/taskSpec defaults
→ Role defaults
→ Persona defaults
→ Work policy
→ Assignment policy
→ Human/CLI inputs
→ Governance
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-19

```text
This is the documented policy composition order, not a claim that every scope
is separately discovered by the leaf resolver. Callers supply composed inputs;
`resolveAssignmentDispatchPolicy` resolves Assignment/Work/config/caller inputs.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-20

```text
- Explicit rigor requirements cannot be weakened by a later lower requirement;
  the implicit standard is a fallback, not a floor. Derived tiers retain the
  strongest requirement (`assignment-policy.mjs:224-325`).
- Executor/persona preferences use the most-specific supported input, subject
  to governance (`assignment-policy.mjs:332-380`).
- Provider/model selection belongs to the registered executor/policy path.
- Portable YAML uses rigor rather than removed `minTier` or explicit tier/model
  pins; the resolver rejects those retired/forbidden inputs
  (`assignment-policy.mjs:203-215`). A general
  `assertNoPortableExecutorPin` helper is not current implementation.
- Effective provenance records winning values and sources
  (`assignment-policy.mjs:493-505`); no current `mergePolicyStack` function is
  implied by the composition diagram.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime

````text
### DispatchPlan (core → runtime)

```json
{
  "requestedTarget": { "kind": "capability", "value": "code:implement" },
  "requestedCapability": "code:implement",
  "selectedExecutor": "agy-herdr",
  "bindingSource": "capability.prefer",
  "providerModel": "gemini",
  "tier": "standard",
  "model": "<resolved-from-policy>",
  "mechanism": "out-of-process",
  "invocation": { "via": "cli", "adapter": "herdr-spawn" },
  "governance": {},
  "provenance": {}
}
```

An explicit executor override remains visible as an override; it must not
silently replace the requested capability's own provenance.

**Implementation status.** The illustrative `requestedTarget`,
`requestedCapability` and `selectedExecutor` names above are target-state
vocabulary, not current compiled output keys. `compileDispatchPlan()` returns
`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,
`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,
`bindingSource`, `tier`, `model`, `providerModel`, `provenance` and `policy`
(`plan.mjs:444-461`). Policy resolution delegates to
`resolveAssignmentDispatchPolicy`; it is not duplicated by the caller.

For a real Assignment, policy resolution failure or a
decided-executor-versus-policy-executor mismatch remains a hard
`RunnerConfigError`. For a non-Assignment compatibility request
(`decide --for`, `decide <executor-id>`, `decide --work`), `plan.mjs`
synthesizes an Assignment policy with `preferExecutor` and, when configured,
capability `rigor` and `capability` (`plan.mjs:403-411`).
Removed capability `overrides` are rejected by config validation, not folded
into policy. Synthetic policy failures leave policy fields null; an executor
mismatch also records `policy.executor-mismatch-ignored`
(`plan.mjs:422-441`). A real Assignment's corresponding failure remains fatal.

Governance-blocked and genuinely unavailable plans also leave
`tier`/`model`/`providerModel`/`provenance`/`policy` unset so they never
publish a partial policy for a Run that will not launch.

`selector.type: 'purpose'` in the current implementation corresponds to
`requestedTarget.kind: 'capability'` in the target contract above (see
Routing Identities). It is a compatibility label on the public shape, not a
semantic third identity.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-21

````text
```json
{
  "requestedTarget": { "kind": "capability", "value": "code:implement" },
  "requestedCapability": "code:implement",
  "selectedExecutor": "agy-herdr",
  "bindingSource": "capability.prefer",
  "providerModel": "gemini",
  "tier": "standard",
  "model": "<resolved-from-policy>",
  "mechanism": "out-of-process",
  "invocation": { "via": "cli", "adapter": "herdr-spawn" },
  "governance": {},
  "provenance": {}
}
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-22

```text
An explicit executor override remains visible as an override; it must not
silently replace the requested capability's own provenance.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-23

```text
**Implementation status.** The illustrative `requestedTarget`,
`requestedCapability` and `selectedExecutor` names above are target-state
vocabulary, not current compiled output keys. `compileDispatchPlan()` returns
`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,
`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,
`bindingSource`, `tier`, `model`, `providerModel`, `provenance` and `policy`
(`plan.mjs:444-461`). Policy resolution delegates to
`resolveAssignmentDispatchPolicy`; it is not duplicated by the caller.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-24

```text
For a real Assignment, policy resolution failure or a
decided-executor-versus-policy-executor mismatch remains a hard
`RunnerConfigError`. For a non-Assignment compatibility request
(`decide --for`, `decide <executor-id>`, `decide --work`), `plan.mjs`
synthesizes an Assignment policy with `preferExecutor` and, when configured,
capability `rigor` and `capability` (`plan.mjs:403-411`).
Removed capability `overrides` are rejected by config validation, not folded
into policy. Synthetic policy failures leave policy fields null; an executor
mismatch also records `policy.executor-mismatch-ignored`
(`plan.mjs:422-441`). A real Assignment's corresponding failure remains fatal.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-25

```text
Governance-blocked and genuinely unavailable plans also leave
`tier`/`model`/`providerModel`/`provenance`/`policy` unset so they never
publish a partial policy for a Run that will not launch.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-26

```text
`selector.type: 'purpose'` in the current implementation corresponds to
`requestedTarget.kind: 'capability'` in the target contract above (see
Routing Identities). It is a compatibility label on the public shape, not a
semantic third identity.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#executor-kinds

```text
## Executor Kinds

An executor is not assumed to be an agent. `runner.executors.<id>.kind` is
one of `agent | tool` (`src/runner/dispatch/config.mjs`,
`EXECUTOR_KINDS`) — orthogonal to the invocation mechanism
(`invocations[].via`, one of `cli | task | mcp | api`). A `tool`/MCP-only
executor (e.g. `gitnexus`, `invocations: [{via: "mcp"}]`) is never spawned
as a subprocess: `resolveExecutorConfig()`'s own Gate B3 throws rather than
silently falling through to the global CLI executor when a caller asks an
MCP-only executor to resolve for CLI dispatch. This is how impact-analysis
tools like GitNexus participate in dispatch as executors without pretending
to be agents — the same control plane, the same capability/executor-id
routing, a different declared mechanism.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-27

```text
An executor is not assumed to be an agent. `runner.executors.<id>.kind` is
one of `agent | tool` (`src/runner/dispatch/config.mjs`,
`EXECUTOR_KINDS`) — orthogonal to the invocation mechanism
(`invocations[].via`, one of `cli | task | mcp | api`). A `tool`/MCP-only
executor (e.g. `gitnexus`, `invocations: [{via: "mcp"}]`) is never spawned
as a subprocess: `resolveExecutorConfig()`'s own Gate B3 throws rather than
silently falling through to the global CLI executor when a caller asks an
MCP-only executor to resolve for CLI dispatch. This is how impact-analysis
tools like GitNexus participate in dispatch as executors without pretending
to be agents — the same control plane, the same capability/executor-id
routing, a different declared mechanism.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-28

```text
The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-29

```text
1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-30

```text
Forbidden dependencies for all eight:
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-31

```text
- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-outer-boundary-note

```text
## Component-Outer Boundary Note

Work, host, CLI/API and domain callers choose the semantic task and pass its
target/capability, policy inputs and provenance into governed execution.
They retain lifecycle decisions and consume returned evidence; they must not
resolve executor configuration and launch around dispatch governance or
confinement. The proposed outer normalizer is not a shipped alternate door.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-32

```text
Work, host, CLI/API and domain callers choose the semantic task and pass its
target/capability, policy inputs and provenance into governed execution.
They retain lifecycle decisions and consume returned evidence; they must not
resolve executor configuration and launch around dispatch governance or
confinement. The proposed outer normalizer is not a shipped alternate door.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#governance

```text
## Governance

- Executor identifiers must resolve through configured/approved targets.
- Cross-provider/model/tier dispatch must remain explicit and auditable.
- Capability, role, soul/profile, privacy, and context-egress requirements must
  be resolved through policy rather than hard-wired to a Workflow.
- CLI spawn is an execution mechanism, not a governance bypass.
- Read-only/mutating policy must be checked before launch.
- Result and artifact locations must be bounded and attributable to the Run.
- Direct executor calls from protocol, Skill, coordinator, or domain-harness
  prose are invalid.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-33

```text
- Executor identifiers must resolve through configured/approved targets.
- Cross-provider/model/tier dispatch must remain explicit and auditable.
- Capability, role, soul/profile, privacy, and context-egress requirements must
  be resolved through policy rather than hard-wired to a Workflow.
- CLI spawn is an execution mechanism, not a governance bypass.
- Read-only/mutating policy must be checked before launch.
- Result and artifact locations must be bounded and attributable to the Run.
- Direct executor calls from protocol, Skill, coordinator, or domain-harness
  prose are invalid.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#separation-of-concerns

````text
## Separation Of Concerns

Planning may be agent-led, declared by a Workflow, or supplied by a domain
harness. A validated Assignment still enters the same governed execution path;
the planning source does not grant a private launch or result-acceptance path.

```txt
planner     proposes a declared or dynamic semantic action
policy      validates legality, authority, bounds, and selected domain rules
builder     creates Assignment
resolver    produces governed DispatchPlan
dispatcher  launches and observes Run
normalizer  creates RunResult
caller      consumes evidence and invokes authorized lifecycle behavior, if any
```

The detailed redesign source remains a
[proposal](../proposals/dispatch-control-plane-redesign.md) until its unresolved
target-state sections are reconciled with implementation.
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-34

```text
Planning may be agent-led, declared by a Workflow, or supplied by a domain
harness. A validated Assignment still enters the same governed execution path;
the planning source does not grant a private launch or result-acceptance path.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-35

````text
```txt
planner     proposes a declared or dynamic semantic action
policy      validates legality, authority, bounds, and selected domain rules
builder     creates Assignment
resolver    produces governed DispatchPlan
dispatcher  launches and observes Run
normalizer  creates RunResult
caller      consumes evidence and invokes authorized lifecycle behavior, if any
```
````

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-36

```text
The detailed redesign source remains a
[proposal](../proposals/dispatch-control-plane-redesign.md) until its unresolved
target-state sections are reconciled with implementation.
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#source-inventory

```text
## Source Inventory

| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |
```

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-37

```text
| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#executor-fallback-and-effect-eligibility

````text
# Executor Fallback And Effect Eligibility

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/executor-health-and-fallback.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-1

````text
```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/executor-health-and-fallback.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#implementation-and-design-status

```text
## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| 1. Responsibility And Inputs | Unimplemented design proposal | FailureObservationV1/executor-failure-observation absent (git grep src/ packages/ apps/ core/ domains/ bin/ = 0); owners named in the stage table exist: src/runner/dispatch/liveness.mjs:211 evaluateLadder, src/runner/dispatch/plan.mjs:45 compileDispatchPlan, src/runner/dispatch/run-result.mjs:350 normalizeRunResult |
| 2. Production Ladder Semantics | Current contract/invariant | src/runner/dispatch/liveness.mjs:211 evaluateLadder (truth>blocked>died>ceiling>stale), :63 DEFAULT_DEATH_THRESHOLD=3, :105 paneFateFor keeps paused-limit under closeAlways, :99 keep-always |
| 3. Coarse Matrix Mapping | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/herdr-round.mjs:350-357 ERROR_CLASS_FOR_OUTCOME (died->worker-spawn-fail, others->worker-timeout); src/runner/recovery.mjs:106-115,133 resolveAction; src/runner/loop.mjs:515 resolveStaleDoing; blocked/paused-limit park is explicitly "Proposed behavior change" |
| 4. One Attempt History, Explicit Caps | Mixed implementation and proposal; no blanket implementation claim | Not implemented: maxAttemptsPerAssignment/maxAttemptsPerExecutor = 0 hits in code; src/runner/dispatch/assignment-policy.mjs:380-388 fallbackExecutors "reserved-not-executed"; admission counting live at src/runner/dispatch/assignment-runner.mjs:672-783 (runId per attempt); src/runner/recovery.mjs:91 DEFAULT_MAX_RETRIES=2 |
| 5. EffectGuaranteePort | Unimplemented design proposal | EffectGuaranteePort absent in code; related live subset: src/runner/dispatch/recovery.mjs:201 assess(plan, repeatMode, confinement, attestation) with ASSESS_OUTCOMES :56 and REPEAT_MODE never inferred from Assignment.mutation :202-206 |
| 6. Resolver Output And Apply | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/recovery.mjs:93 resolveFallback (FALLBACK_STATUSES :53), src/runner/dispatch/assignment-policy.mjs:334-339 cliOverride.preferExecutor; FallbackDecisionV1/rejectedCandidates absent; apply re-check in src/runner/dispatch/recovery-planner.mjs:281 checkApply |
| 7. Proof, Rollout And Future Work | Unimplemented design proposal | Refers to proof matrix runtime-recovery-design.md#10 (E-a..E-f, X01..X06) and future work; no code symbols |
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-3

```text
The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-4

```text
| Section | Status | Evidence / limit |
|---|---|---|
| 1. Responsibility And Inputs | Unimplemented design proposal | FailureObservationV1/executor-failure-observation absent (git grep src/ packages/ apps/ core/ domains/ bin/ = 0); owners named in the stage table exist: src/runner/dispatch/liveness.mjs:211 evaluateLadder, src/runner/dispatch/plan.mjs:45 compileDispatchPlan, src/runner/dispatch/run-result.mjs:350 normalizeRunResult |
| 2. Production Ladder Semantics | Current contract/invariant | src/runner/dispatch/liveness.mjs:211 evaluateLadder (truth>blocked>died>ceiling>stale), :63 DEFAULT_DEATH_THRESHOLD=3, :105 paneFateFor keeps paused-limit under closeAlways, :99 keep-always |
| 3. Coarse Matrix Mapping | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/herdr-round.mjs:350-357 ERROR_CLASS_FOR_OUTCOME (died->worker-spawn-fail, others->worker-timeout); src/runner/recovery.mjs:106-115,133 resolveAction; src/runner/loop.mjs:515 resolveStaleDoing; blocked/paused-limit park is explicitly "Proposed behavior change" |
| 4. One Attempt History, Explicit Caps | Mixed implementation and proposal; no blanket implementation claim | Not implemented: maxAttemptsPerAssignment/maxAttemptsPerExecutor = 0 hits in code; src/runner/dispatch/assignment-policy.mjs:380-388 fallbackExecutors "reserved-not-executed"; admission counting live at src/runner/dispatch/assignment-runner.mjs:672-783 (runId per attempt); src/runner/recovery.mjs:91 DEFAULT_MAX_RETRIES=2 |
| 5. EffectGuaranteePort | Unimplemented design proposal | EffectGuaranteePort absent in code; related live subset: src/runner/dispatch/recovery.mjs:201 assess(plan, repeatMode, confinement, attestation) with ASSESS_OUTCOMES :56 and REPEAT_MODE never inferred from Assignment.mutation :202-206 |
| 6. Resolver Output And Apply | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/recovery.mjs:93 resolveFallback (FALLBACK_STATUSES :53), src/runner/dispatch/assignment-policy.mjs:334-339 cliOverride.preferExecutor; FallbackDecisionV1/rejectedCandidates absent; apply re-check in src/runner/dispatch/recovery-planner.mjs:281 checkApply |
| 7. Proof, Rollout And Future Work | Unimplemented design proposal | Refers to proof matrix runtime-recovery-design.md#10 (E-a..E-f, X01..X06) and future work; no code symbols |
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs

```text
## 1. Responsibility And Inputs

| Stage | Owner | Output |
|---|---|---|
| Worker result interpretation | Existing normalizer/evaluator | Per-Run result; not an executor-health judgment. |
| Liveness classification | Existing signal ladder | Nonterminal or settled/blocked/died/timed-out-ceiling/provider-limit/timed-out-idle; `paused-limit` is a compatibility pane-fate alias, not evaluateLadder's emitted limit outcome. |
| Effect and workspace retry eligibility | Operation recovery adapter plus runtime facts | Eligible/reconcile/forbidden verdict. |
| Retry/park/halt and bounds | Existing recovery matrix, extended with an explicit runtime projection | Coarse decision and cap reasons. |
| Candidate ordering | Pure fallback resolver | Ordered selection/rejections. |
| Governance | Existing compileDispatchPlan and Confinement Authority | Governed plan, then runtime enforcement before launch. |
| Admission | Run repository | One durable current attempt under authority. |

The application service composes these stages. Fallback receives values, never
calls herdr, traverses session graphs, moves Work or normalizes evidence.

FailureObservationV1:
`{contract: executor-failure-observation.v1, observationId,
assignmentId, runId, attempt, executorId, capability,
resourceScope, outcome, evidenceRefs, observedAt}`.
ResourceScope is optional provider/account/model identifiers without credentials.
Outcome is a discriminated union:
- infra-ok;
- ladder with `outcome` nullable while nonterminal, delivery, outputBytes,
  rawLimitLineRef?, retryAfter?;
- launch-failed with phase and creation/delivery certainty;
- config-invalid with typed code;
- confinement-refused with attestation/refusal ref.
Success/config/launch outcomes do not require fabricated ladder values.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-5

```text
| Stage | Owner | Output |
|---|---|---|
| Worker result interpretation | Existing normalizer/evaluator | Per-Run result; not an executor-health judgment. |
| Liveness classification | Existing signal ladder | Nonterminal or settled/blocked/died/timed-out-ceiling/provider-limit/timed-out-idle; `paused-limit` is a compatibility pane-fate alias, not evaluateLadder's emitted limit outcome. |
| Effect and workspace retry eligibility | Operation recovery adapter plus runtime facts | Eligible/reconcile/forbidden verdict. |
| Retry/park/halt and bounds | Existing recovery matrix, extended with an explicit runtime projection | Coarse decision and cap reasons. |
| Candidate ordering | Pure fallback resolver | Ordered selection/rejections. |
| Governance | Existing compileDispatchPlan and Confinement Authority | Governed plan, then runtime enforcement before launch. |
| Admission | Run repository | One durable current attempt under authority. |
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-6

```text
The application service composes these stages. Fallback receives values, never
calls herdr, traverses session graphs, moves Work or normalizes evidence.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-7

```text
FailureObservationV1:
`{contract: executor-failure-observation.v1, observationId,
assignmentId, runId, attempt, executorId, capability,
resourceScope, outcome, evidenceRefs, observedAt}`.
ResourceScope is optional provider/account/model identifiers without credentials.
Outcome is a discriminated union:
- infra-ok;
- ladder with `outcome` nullable while nonterminal, delivery, outputBytes,
  rawLimitLineRef?, retryAfter?;
- launch-failed with phase and creation/delivery certainty;
- config-invalid with typed code;
- confinement-refused with attestation/refusal ref.
Success/config/launch outcomes do not require fabricated ladder values.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-8

```text
The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-9

```text
A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-10

```text
Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping

```text
## 3. Coarse Matrix Mapping

Extend the existing recovery module's runtime-facing pure entry rather than
creating a parallel matrix. Preserve `resolveAction(errorClass, claimAttempt)`
for its current Work-runner callers and `resolveStaleDoing` semantics.

| Observation | Existing class / composed action |
|---|---|
| Creation failure proven before delivery | worker-spawn-fail; retry eligibility and bounds still required. |
| timed-out-idle or timed-out-ceiling | worker-timeout; never proof the worker is dead. |
| died without result | worker-spawn-fail for coarse retry class, with original died outcome retained; effect/quiescence gate remains mandatory. |
| paused-limit / blocked | **Proposed behavior change:** park current Run, before retry matrix. Existing callers currently classify these through the retry matrix; S0 must freeze that behavior and this mapping cannot ship as a silent port. |
| Nonterminal/present worker | wait; no failure classification or candidate selection. |
| Unknown delivery or effects | reconcile then park if unresolved. |
| Config-invalid / confinement-refused | refuse current dispatch; do not try another candidate to bypass policy. |
| Semantic RunResult rejection | No infrastructure fallback; caller decides a new semantic operation/recheck if authorized. |
| Unmapped internal error class | Preserve recovery matrix halt, scope reported to caller. |
| dispatch-in-flight | Admission contention, not health; wait/re-read without consuming a Run attempt. |

`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, the Run's applicable admission/budget bounds remain
binding. Retry does not extend the failed Run's ceiling; a replacement needs
its own eligible admission. No current session graph grants fallback authority.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-11

```text
Extend the existing recovery module's runtime-facing pure entry rather than
creating a parallel matrix. Preserve `resolveAction(errorClass, claimAttempt)`
for its current Work-runner callers and `resolveStaleDoing` semantics.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-12

```text
| Observation | Existing class / composed action |
|---|---|
| Creation failure proven before delivery | worker-spawn-fail; retry eligibility and bounds still required. |
| timed-out-idle or timed-out-ceiling | worker-timeout; never proof the worker is dead. |
| died without result | worker-spawn-fail for coarse retry class, with original died outcome retained; effect/quiescence gate remains mandatory. |
| paused-limit / blocked | **Proposed behavior change:** park current Run, before retry matrix. Existing callers currently classify these through the retry matrix; S0 must freeze that behavior and this mapping cannot ship as a silent port. |
| Nonterminal/present worker | wait; no failure classification or candidate selection. |
| Unknown delivery or effects | reconcile then park if unresolved. |
| Config-invalid / confinement-refused | refuse current dispatch; do not try another candidate to bypass policy. |
| Semantic RunResult rejection | No infrastructure fallback; caller decides a new semantic operation/recheck if authorized. |
| Unmapped internal error class | Preserve recovery matrix halt, scope reported to caller. |
| dispatch-in-flight | Admission contention, not health; wait/re-read without consuming a Run attempt. |
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-13

```text
`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, the Run's applicable admission/budget bounds remain
binding. Retry does not extend the failed Run's ceiling; a replacement needs
its own eligible admission. No current session graph grants fallback authority.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps

```text
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-14

```text
Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-15

```text
The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-16

```text
The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-17

```text
Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport

```text
## 5. EffectGuaranteePort

`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.

An operation's repeat mode must be explicit; it is not inferred from
`Assignment.mutation`. Supported current policy values are checked by
`assignment-policy.mjs:439-453`, and recovery assessment refuses to infer mode
(`src/runner/dispatch/recovery.mjs:201-206`). No current review/red-team YAML
profile is claimed here to declare `repeatMode: read-only`.

The following effect-sink, deduplication and guarantee model belongs to the
proposed EffectGuaranteePort, not a shipped generic effect ledger. Operations
would need their own effect identity and adapter proof before enabling it.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.

| Guarantee | Required evidence |
|---|---|
| no-delivery | Proof original launch/input was never delivered and no pending command can later deliver it. |
| read-only | Actual permitted effect scope; writable output artifacts isolated per Run and no unaccounted external mutation. |
| idempotent | Operation contract version, same logical input/effect identity, and evidence that repetition satisfies its operation-specific invariant. |
| deduplicated | Stable effect key, input digest, effect-boundary namespace, verified dedup capability, validity window and destination compatibility. |

All eligible outcomes carry source Run, operation contract digest, input/effect
identity, evidence refs and assessedAt; window end is explicit when relevant.
The effect identity stays stable across attempts, unlike runId. Destination
selection revalidates that the same guarantee holds for that candidate.
`Assignment.mutation` remains descriptive and is not an effect guarantee.
`effectsObserved: false` is not proof of no effects; boolean labels cannot replace
typed unknown/reconcile outcomes. A generic effect ledger is not required.

For writable takeover, eligibility additionally requires proof all old writers
are stopped or deprived of access, and a held exclusive workspace grant. A dead
main PID or a closed pane is insufficient for surviving descendants. New isolated
workspaces can retain read-only snapshots of prior work, but cannot bypass
unknown external effects. Material and grants are passed through the existing
confinement/runtime boundary, not written into immutable Assignment semantics.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-18

```text
`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-19

```text
An operation's repeat mode must be explicit; it is not inferred from
`Assignment.mutation`. Supported current policy values are checked by
`assignment-policy.mjs:439-453`, and recovery assessment refuses to infer mode
(`src/runner/dispatch/recovery.mjs:201-206`). No current review/red-team YAML
profile is claimed here to declare `repeatMode: read-only`.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-20

```text
The following effect-sink, deduplication and guarantee model belongs to the
proposed EffectGuaranteePort, not a shipped generic effect ledger. Operations
would need their own effect identity and adapter proof before enabling it.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-21

```text
| Guarantee | Required evidence |
|---|---|
| no-delivery | Proof original launch/input was never delivered and no pending command can later deliver it. |
| read-only | Actual permitted effect scope; writable output artifacts isolated per Run and no unaccounted external mutation. |
| idempotent | Operation contract version, same logical input/effect identity, and evidence that repetition satisfies its operation-specific invariant. |
| deduplicated | Stable effect key, input digest, effect-boundary namespace, verified dedup capability, validity window and destination compatibility. |
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-22

```text
All eligible outcomes carry source Run, operation contract digest, input/effect
identity, evidence refs and assessedAt; window end is explicit when relevant.
The effect identity stays stable across attempts, unlike runId. Destination
selection revalidates that the same guarantee holds for that candidate.
`Assignment.mutation` remains descriptive and is not an effect guarantee.
`effectsObserved: false` is not proof of no effects; boolean labels cannot replace
typed unknown/reconcile outcomes. A generic effect ledger is not required.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-23

```text
For writable takeover, eligibility additionally requires proof all old writers
are stopped or deprived of access, and a held exclusive workspace grant. A dead
main PID or a closed pane is insufficient for surviving descendants. New isolated
workspaces can retain read-only snapshots of prior work, but cannot bypass
unknown external effects. Material and grants are passed through the existing
confinement/runtime boundary, not written into immutable Assignment semantics.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#6-resolver-output-and-apply

```text
## 6. Resolver Output And Apply

FallbackDecisionV1:
`{contract: executor-fallback-decision.v1, assignmentId, sourceRunId,
historyRevision, policyProvenance, observationRef, decision,
rejectedCandidates[]}`.

Decision variants:
- collect-result with resultRef;
- wait with runId and optional nextCheckAt;
- reconcile with requiredFacts[];
- fallback with executorId and compiledPlanRef;
- park/refuse/halt with typed reasonCode and remedy;
- retry-same exists only when a non-default policy explicitly permits it.

Remedy is a typed union: inspect-run, reconcile-effect, repair-config,
request-budget, await-driver-input, none. Human display text is supplementary.
Reasons include run-live, delivery-unknown, effect-unknown, writer-not-quiescent,
candidate-unregistered, capability-mismatch, compile-refused, confinement-refused,
assignment-budget-exhausted, executor-budget-exhausted, candidates-exhausted,
deadline-exceeded, no-fallback-pinned, cancelled, unknown-error-class.

Candidate resolution rejects duplicates/previously exhausted executors, preserves
original capability, tier, provider/egress constraints, persona and provenance,
then calls the existing compiler. A fallback candidate is passed as an explicit
`cliOverride.preferExecutor` with
`policyProvenance.executor: {scope: fallback, id}`; the policy resolver must
recognize that scoped candidate as valid. If the current compiler still hard-
errors on this mismatch, fallback remains parked until that compiler contract is
amended. Its output is advice, not a permission token.
Apply re-reads admission history, budget, late results, cancellation and effect
window before Run admission. Compiling does not replace final confinement checks.

No fallback candidate does not imply a failed semantic task. Return parked/refused
with the precise reason; the caller can continue independent work. A quota pause
does not consume another attempt. Admission contention is neither a quota event
nor evidence an executor is unhealthy.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-24

```text
FallbackDecisionV1:
`{contract: executor-fallback-decision.v1, assignmentId, sourceRunId,
historyRevision, policyProvenance, observationRef, decision,
rejectedCandidates[]}`.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-25

```text
Decision variants:
- collect-result with resultRef;
- wait with runId and optional nextCheckAt;
- reconcile with requiredFacts[];
- fallback with executorId and compiledPlanRef;
- park/refuse/halt with typed reasonCode and remedy;
- retry-same exists only when a non-default policy explicitly permits it.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-26

```text
Remedy is a typed union: inspect-run, reconcile-effect, repair-config,
request-budget, await-driver-input, none. Human display text is supplementary.
Reasons include run-live, delivery-unknown, effect-unknown, writer-not-quiescent,
candidate-unregistered, capability-mismatch, compile-refused, confinement-refused,
assignment-budget-exhausted, executor-budget-exhausted, candidates-exhausted,
deadline-exceeded, no-fallback-pinned, cancelled, unknown-error-class.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-27

```text
Candidate resolution rejects duplicates/previously exhausted executors, preserves
original capability, tier, provider/egress constraints, persona and provenance,
then calls the existing compiler. A fallback candidate is passed as an explicit
`cliOverride.preferExecutor` with
`policyProvenance.executor: {scope: fallback, id}`; the policy resolver must
recognize that scoped candidate as valid. If the current compiler still hard-
errors on this mismatch, fallback remains parked until that compiler contract is
amended. Its output is advice, not a permission token.
Apply re-reads admission history, budget, late results, cancellation and effect
window before Run admission. Compiling does not replace final confinement checks.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-28

```text
No fallback candidate does not imply a failed semantic task. Return parked/refused
with the precise reason; the caller can continue independent work. A quota pause
does not consume another attempt. Admission contention is neither a quota event
nor evidence an executor is unhealthy.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#7-proof-rollout-and-future-work

```text
## 7. Proof, Rollout And Future Work

E-a..E-f and X01..X06 in
[the common proof matrix](runtime-recovery-design.md#10-proof-matrix)
are the acceptance scenarios. In particular E-b is reconcile then eligible
fallback, not unknown-delivery retry-same followed by an impossible third attempt.
Pair pure resolver tests with real admission/confinement integration.

Node changes extend recovery/assignment-policy/assignment-runner and runtime
interfaces; do not rename/rebuild dispatch core. Doctor validates referenced
executors, supported recovery guarantees and any introduced policy defaults.
Configuration still merges project over global through existing setup.

Future observation history is scoped by actual provider/account/model resource;
cooldown/scoring is not needed for correctness. Distributed effect ledgers,
cross-project health and additional repeat strategies remain explicitly unsupported
until their adapters and proof exist.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-29

```text
E-a..E-f and X01..X06 in
[the common proof matrix](runtime-recovery-design.md#10-proof-matrix)
are the acceptance scenarios. In particular E-b is reconcile then eligible
fallback, not unknown-delivery retry-same followed by an impossible third attempt.
Pair pure resolver tests with real admission/confinement integration.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-30

```text
Node changes extend recovery/assignment-policy/assignment-runner and runtime
interfaces; do not rename/rebuild dispatch core. Doctor validates referenced
executors, supported recovery guarantees and any introduced policy defaults.
Configuration still merges project over global through existing setup.
```

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-31

```text
Future observation history is scoped by actual provider/account/model resource;
cooldown/scoring is not needed for correctness. Distributed effect ledgers,
cross-project health and additional repeat strategies remain explicitly unsupported
until their adapters and proof exist.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#coordination-protocol-model

````text
# Coordination Protocol Model

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/protocol-model.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-1

````text
```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/protocol-model.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources

````text
## Planning Sources

Planning need not begin with a predeclared Workflow. Current execution accepts
Unit requests and Workflow execution; the retired CoordinationProtocol is not
another current declared-planning source.

```txt
Agent-led
  objective -> bounded Unit or validated inline Assignment

Declared
  Workflow -> dependent steps and operations -> Unit execution

Domain-assisted
  either source -> registered domain TaskSpecs, skills and validation
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.
````

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-3

```text
Planning need not begin with a predeclared Workflow. Current execution accepts
Unit requests and Workflow execution; the retired CoordinationProtocol is not
another current declared-planning source.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-4

````text
```txt
Agent-led
  objective -> bounded Unit or validated inline Assignment

Declared
  Workflow -> dependent steps and operations -> Unit execution

Domain-assisted
  either source -> registered domain TaskSpecs, skills and validation
```
````

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-5

```text
All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#declared-model

````text
## Declared Model

```txt
Workflow
  -> step graph
    -> step operations
      -> TaskSpec
      -> Skill(s)
      -> Role
      -> policy hints
```

Current Workflow definitions normalize operations directly
(`src/workflow/definition.mjs:81-109`). No separately shipped Stage Protocol,
CoordinationProtocol or FlowDefinition engine sits between steps and operations.
````

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-6

````text
```txt
Workflow
  -> step graph
    -> step operations
      -> TaskSpec
      -> Skill(s)
      -> Role
      -> policy hints
```
````

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-7

```text
Current Workflow definitions normalize operations directly
(`src/workflow/definition.mjs:81-109`). No separately shipped Stage Protocol,
CoordinationProtocol or FlowDefinition engine sits between steps and operations.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split

```text
## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Step dependencies, gates and sequencing boundaries. |
| Step | A declared node in the Workflow graph. |
| Step operation | Semantic action declared by the definition. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

Agent-led callers supply a bounded Unit or validated inline contract. Current
inline fields and normalization are implemented by
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`, rather than left
as an open schema question. Domain-specific validators must be checked against
their registered implementation; this extension model does not imply research
and marketing harnesses already ship.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-8

```text
| Element | Responsibility |
|---|---|
| Workflow/graph | Step dependencies, gates and sequencing boundaries. |
| Step | A declared node in the Workflow graph. |
| Step operation | Semantic action declared by the definition. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-9

```text
Agent-led callers supply a bounded Unit or validated inline contract. Current
inline fields and normalization are implemented by
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`, rather than left
as an open schema question. Domain-specific validators must be checked against
their registered implementation; this extension model does not imply research
and marketing harnesses already ship.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#hard-and-soft-coordination

```text
## Hard And Soft Coordination

When a declared model is selected, its graph and TaskSpec are hard constraints.
Skill prose supplies flexibility inside those constraints. The driver chooses a
legal operation using current state and doctrine; the dispatcher chooses
execution infrastructure.

When agent-led planning is selected, the validated runtime execution contract,
foundation policy, budgets, authority, mutation rules, and evidence expectations
are the hard constraints. The task graph may be trivial or created dynamically.
Absence of a predeclared graph never means absence of hard runtime boundaries.

No layer may absorb all responsibilities:

- Skill prose cannot authorize illegal transitions or evidence-free success.
- Coordinator prose cannot bypass dispatch or grant its own authority/budget.
- TaskSpec should not encode every reasoning move.
- Dispatcher must not select business operations.
- Driver must not bypass dispatch governance.
- Domain harnesses may validate or enrich a plan but must not fork the execution
  runtime or become hidden lifecycle authorities.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-10

```text
When a declared model is selected, its graph and TaskSpec are hard constraints.
Skill prose supplies flexibility inside those constraints. The driver chooses a
legal operation using current state and doctrine; the dispatcher chooses
execution infrastructure.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-11

```text
When agent-led planning is selected, the validated runtime execution contract,
foundation policy, budgets, authority, mutation rules, and evidence expectations
are the hard constraints. The task graph may be trivial or created dynamically.
Absence of a predeclared graph never means absence of hard runtime boundaries.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-12

```text
No layer may absorb all responsibilities:
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-13

```text
- Skill prose cannot authorize illegal transitions or evidence-free success.
- Coordinator prose cannot bypass dispatch or grant its own authority/budget.
- TaskSpec should not encode every reasoning move.
- Dispatcher must not select business operations.
- Driver must not bypass dispatch governance.
- Domain harnesses may validate or enrich a plan but must not fork the execution
  runtime or become hidden lifecycle authorities.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-14

```text
`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-15

```text
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#standalone-coordination

```text
## Standalone Coordination

The former session/FlowDefinition profile is historical, not the Workflow operation contract. See the complete historical snapshot linked above.
```

### docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-17

```text
The former session/FlowDefinition profile is historical, not the Workflow operation contract. See the complete historical snapshot linked above.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#runtime-recovery-and-work-continuity

````text
# Runtime Recovery And Work Continuity

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/runtime-recovery-design.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-1

````text
```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/runtime-recovery-design.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#implementation-and-design-status

```text
## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| 1. Scope And Reading Order | Current Run owners; session continuation is history | Dispatch recovery is the live door; historical reading pointers do not create runtime support |
| 2. Identity And Existing Reality | Current Run/Assignment identities and explicit proposals | assignment-runner.mjs:697,1563; launch name includes runId and launchCommandId at confinement/authority.mjs:1595 |
| 3. Ownership And Dependencies | Current admission, recovery planner, fallback and local fencing | recovery-planner.mjs:243-316, recovery.mjs and run-lock.mjs:306-412; no live coordination-session owner |
| 4. Recovery Choice | Current standalone Run recovery; manual track progression stays outside dispatch | recovery-planner.mjs:92-102; recover.mjs:304-322; no session transfer is implemented here |
| 5. Arbitrary Interruption Is Not A Checkpoint | Explicit deferred inherited-edit design | evidence-attribution.mjs:25-59 is per-Run dirty-before attribution, not a generic lineage evaluator |
| 6. Local Concurrency And Durability | Current local fencing; no distributed lease | run-lock.mjs:47-79,306-412; append-only local generations and release markers |
| 7. Agent-Facing Contract | Implemented standalone dispatch recovery | src/verbs/dispatch/recover.mjs:116-132,266-408; recovery-planner.mjs:118-173,243-316. Observation is read-only; apply records a checked recovery action, not a session transition or automatic worker launch. |
| 8. Compatibility And Rollout | Current writer version; additional ownership refusal is design | assignment-run.v2 writer at assignment-runner.mjs:1563; owner-runtime-unavailable is not a current error enum |
| 9. Implementation Slices And Gates | Dated slice status, not freshly rerun proof | Current modules are cited locally; S5 retired; S6/S7 remain unimplemented designs |
| 10. Proof Matrix | Required scenarios, not passing-test claims | X03, X05, X06, X07 and X10 require additional link/lineage/transfer/runtime-version ownership; standalone recover does not claim them |
| 11. Review Finding Resolution And Limits | Current local limits distinguished from retired/deferred design | run-lock.mjs:306-412; naming includes launchCommandId; generic inherited-edit/effect ownership remains unsupported |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-3

```text
The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-4

```text
| Section | Status | Evidence / limit |
|---|---|---|
| 1. Scope And Reading Order | Current Run owners; session continuation is history | Dispatch recovery is the live door; historical reading pointers do not create runtime support |
| 2. Identity And Existing Reality | Current Run/Assignment identities and explicit proposals | assignment-runner.mjs:697,1563; launch name includes runId and launchCommandId at confinement/authority.mjs:1595 |
| 3. Ownership And Dependencies | Current admission, recovery planner, fallback and local fencing | recovery-planner.mjs:243-316, recovery.mjs and run-lock.mjs:306-412; no live coordination-session owner |
| 4. Recovery Choice | Current standalone Run recovery; manual track progression stays outside dispatch | recovery-planner.mjs:92-102; recover.mjs:304-322; no session transfer is implemented here |
| 5. Arbitrary Interruption Is Not A Checkpoint | Explicit deferred inherited-edit design | evidence-attribution.mjs:25-59 is per-Run dirty-before attribution, not a generic lineage evaluator |
| 6. Local Concurrency And Durability | Current local fencing; no distributed lease | run-lock.mjs:47-79,306-412; append-only local generations and release markers |
| 7. Agent-Facing Contract | Implemented standalone dispatch recovery | src/verbs/dispatch/recover.mjs:116-132,266-408; recovery-planner.mjs:118-173,243-316. Observation is read-only; apply records a checked recovery action, not a session transition or automatic worker launch. |
| 8. Compatibility And Rollout | Current writer version; additional ownership refusal is design | assignment-run.v2 writer at assignment-runner.mjs:1563; owner-runtime-unavailable is not a current error enum |
| 9. Implementation Slices And Gates | Dated slice status, not freshly rerun proof | Current modules are cited locally; S5 retired; S6/S7 remain unimplemented designs |
| 10. Proof Matrix | Required scenarios, not passing-test claims | X03, X05, X06, X07 and X10 require additional link/lineage/transfer/runtime-version ownership; standalone recover does not claim them |
| 11. Review Finding Resolution And Limits | Current local limits distinguished from retired/deferred design | run-lock.mjs:306-412; naming includes launchCommandId; generic inherited-edit/effect ownership remains unsupported |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#1-scope-and-reading-order

```text
## 1. Scope And Reading Order

Current Run control/recovery responsibilities belong to the dispatch modules cited by each section. Session continuation is retired and retained only in historical snapshots. RunHandle, RecoveryMaterial and effect-grant schemas not implemented by those modules remain explicit proposals, not shipped interfaces.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-5

```text
Current Run control/recovery responsibilities belong to the dispatch modules cited by each section. Session continuation is retired and retained only in historical snapshots. RunHandle, RecoveryMaterial and effect-grant schemas not implemented by those modules remain explicit proposals, not shipped interfaces.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#2-identity-and-existing-reality

```text
## 2. Identity And Existing Reality

| Identity | Owner | Current evidence and design consequence |
|---|---|---|
| Track/cell | Consuming track/domain harness | A manual-harness convention, not a universal core entity or current session-chain API. See the owner-retained operating harness and its trace contract. |
| Assignment | Assignment builder/store | Immutable semantic task; execution attempts are separate Run records. |
| Run | Dispatch runtime | One attempt, deterministic identity, eligibility and settlement; retry retains Assignment. |

The former session-owned workUnits/chain correlation proposal is preserved in the complete historical snapshot. It is not a current execution identity or acceptance owner. Current Run admission and recovery retain the Assignment/Run identities above.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-6

```text
| Identity | Owner | Current evidence and design consequence |
|---|---|---|
| Track/cell | Consuming track/domain harness | A manual-harness convention, not a universal core entity or current session-chain API. See the owner-retained operating harness and its trace contract. |
| Assignment | Assignment builder/store | Immutable semantic task; execution attempts are separate Run records. |
| Run | Dispatch runtime | One attempt, deterministic identity, eligibility and settlement; retry retains Assignment. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-7

```text
The former session-owned workUnits/chain correlation proposal is preserved in the complete historical snapshot. It is not a current execution identity or acceptance owner. Current Run admission and recovery retain the Assignment/Run identities above.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#3-ownership-and-dependencies

````text
## 3. Ownership And Dependencies

```mermaid
flowchart TD
    T[Track or application caller] --> D[Dispatch application service]
    D --> R[Run repository: admission and settlement]
    D --> F[Pure fallback resolver]
    D --> C[Existing dispatch compiler]
    D --> G[RunHandle guard]
    G --> A[Runtime adapter]
    D --> O[Operation recovery and effect adapter]
    D --> X[Confinement authority before launch]
```

| Responsibility | Sole owner | Excluded responsibility |
|---|---|---|
| Next-action recommendation | Pure planner | No store import, I/O, executor selection or authority. |
| Attempt admission and result eligibility | Run repository/runtime | No separate attempt-admission service. |
| Runtime control | Guard over repository + runtime adapter | No graph policy or result acceptance. |
| Effect/recovery-material interpretation | Operation recovery adapter | Runtime observations never certify external effects. |
| Run evidence and lineage evaluation | Run Result Evaluator | Must distinguish inherited artifacts from current-Run delta; no runtime adapter or planner may perform acceptance. |
| Workspace grant/identity | Workspace-grant repository or Work-runner claim (profile-specific) | No implicit "existing owner"; absent issuer means writable takeover parks. |
| Executor candidate order | Fallback resolver | Compiler and confinement retain governance. |

Two persistence ports plus one guard service in RunHandle are enough. Do not
create crates per method or a shared mutable recovery manager. Data schemas
below specify persisted/exchanged boundaries; in-process APIs can use native types.
````

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-8

````text
```mermaid
flowchart TD
    T[Track or application caller] --> D[Dispatch application service]
    D --> R[Run repository: admission and settlement]
    D --> F[Pure fallback resolver]
    D --> C[Existing dispatch compiler]
    D --> G[RunHandle guard]
    G --> A[Runtime adapter]
    D --> O[Operation recovery and effect adapter]
    D --> X[Confinement authority before launch]
```
````

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-9

```text
| Responsibility | Sole owner | Excluded responsibility |
|---|---|---|
| Next-action recommendation | Pure planner | No store import, I/O, executor selection or authority. |
| Attempt admission and result eligibility | Run repository/runtime | No separate attempt-admission service. |
| Runtime control | Guard over repository + runtime adapter | No graph policy or result acceptance. |
| Effect/recovery-material interpretation | Operation recovery adapter | Runtime observations never certify external effects. |
| Run evidence and lineage evaluation | Run Result Evaluator | Must distinguish inherited artifacts from current-Run delta; no runtime adapter or planner may perform acceptance. |
| Workspace grant/identity | Workspace-grant repository or Work-runner claim (profile-specific) | No implicit "existing owner"; absent issuer means writable takeover parks. |
| Executor candidate order | Fallback resolver | Compiler and confinement retain governance. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-10

```text
Two persistence ports plus one guard service in RunHandle are enough. Do not
create crates per method or a shared mutable recovery manager. Data schemas
below specify persisted/exchanged boundaries; in-process APIs can use native types.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#4-recovery-choice

```text
## 4. Recovery Choice

| Situation | Action | Identity retained |
|---|---|---|
| Worker result available | Normalize/store, publish only if eligible | Original Run. |
| Observer lost, worker still working | Inspect/reattach/wait | Same Run and Assignment. |
| Worker cannot continue | Reconcile effects and writers, then eligible replacement Run | Same Assignment and unit objective. |
| Cell accepted, next cell begins | Consuming track/domain transition; outside dispatch recovery | Track acceptance history, if the consuming harness records it. |

Proposed cancellation/budget rule: result collection would remain available after
budget exhaustion or cancellation, without admitting another execution; a new
intent would require a new request. This is not implemented cancellation precedence:
current Herdr/cli reconciliation returns `cancel-unsupported` before scanning
results (`herdr-reconcile.mjs:351-355`, `reconcile-cli-spawn.mjs:38-47`).
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-11

```text
| Situation | Action | Identity retained |
|---|---|---|
| Worker result available | Normalize/store, publish only if eligible | Original Run. |
| Observer lost, worker still working | Inspect/reattach/wait | Same Run and Assignment. |
| Worker cannot continue | Reconcile effects and writers, then eligible replacement Run | Same Assignment and unit objective. |
| Cell accepted, next cell begins | Consuming track/domain transition; outside dispatch recovery | Track acceptance history, if the consuming harness records it. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#5-arbitrary-interruption-is-not-a-checkpoint

```text
## 5. Arbitrary Interruption Is Not A Checkpoint

Default recovery preserves recoverable state. The old worker need not publish a
progress report, commit, or recognize an internal milestone. A half-edited file
is permitted input to a replacement, not completion evidence.

| Recovery level | Required interpretation |
|---|---|
| Baseline | Immutable Assignment and original inputs; no claim partial work survived. |
| Recoverable state | Workspace/artifact capture plus explicit completeness/unknowns; replacement inspects before using. |
| Declared checkpoint | Operation-specific checkpoint schema, version and resume validator; optional capability. |

Task notes are untrusted advisory context. Never restore claimed worker reasoning
as authority. Preserve prior acceptance criteria and validate the final state.
Failed-attempt edits inherited by the next Run must be attributed as inherited;
they must not masquerade as newly produced changes under dirty-before checks.
The evaluator may assess the cumulative Assignment outcome only with an explicit
lineage of admitted Runs and artifacts; otherwise it reports insufficient proof.
This requires a named Run Result Evaluator owner only for profiles that accept
inherited edits as part of acceptance. Read-only replacement or a new isolated
workspace can continue to use the current per-Run delta evaluator. The
cumulative-Assignment view and `inherited` attribution are dependencies of the
same-workspace writable profile; X05 remains a proof gate for that profile, not
for all S2 recovery.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-13

```text
Default recovery preserves recoverable state. The old worker need not publish a
progress report, commit, or recognize an internal milestone. A half-edited file
is permitted input to a replacement, not completion evidence.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-14

```text
| Recovery level | Required interpretation |
|---|---|
| Baseline | Immutable Assignment and original inputs; no claim partial work survived. |
| Recoverable state | Workspace/artifact capture plus explicit completeness/unknowns; replacement inspects before using. |
| Declared checkpoint | Operation-specific checkpoint schema, version and resume validator; optional capability. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-15

```text
Task notes are untrusted advisory context. Never restore claimed worker reasoning
as authority. Preserve prior acceptance criteria and validate the final state.
Failed-attempt edits inherited by the next Run must be attributed as inherited;
they must not masquerade as newly produced changes under dirty-before checks.
The evaluator may assess the cumulative Assignment outcome only with an explicit
lineage of admitted Runs and artifacts; otherwise it reports insufficient proof.
This requires a named Run Result Evaluator owner only for profiles that accept
inherited edits as part of acceptance. Read-only replacement or a new isolated
workspace can continue to use the current per-Run delta evaluator. The
cumulative-Assignment view and `inherited` attribution are dependencies of the
same-workspace writable profile; X05 remains a proof gate for that profile, not
for all S2 recovery.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#6-local-concurrency-and-durability

```text
## 6. Local Concurrency And Durability

Control acquisition must not reclaim a live process merely because TTL expired.
Holder identity is `{hostId, bootId, pid, processStartTime}` of the process doing
control, not a guessed Rust parent. Unknown liveness is not dead. A dead holder
may leave a remotely queued command: successor first reconciles pending control.

Implemented (Phase 02 H1, `src/runner/dispatch/run-lock.mjs`): holder identity
is `{id, pid, bootId, processStartTime, host}` (`buildRunControlHolder`,
`host` in place of this section's `hostId`), and `resolveHolderLiveness`
encodes the reclaim decision above as a table — a live pid, a pid whose
liveness cannot be disproven (unreadable `/proc/<pid>/stat`), or a pre-H1
holder record with no `processStartTime` to cross-check all resolve to
`held`, never `dead`; only a genuinely dead pid, a pid reused by a different
process (`processStartTime` mismatch), or a `bootId` predating the current
boot resolve to `dead`.

Recommended local implementation for safe reclaim without unlink races:
one per-scope lock directory containing immutable generation records and
token-specific release markers. Contenders publish generation `g+1` only after
`g` is released or its exact process identity is proven dead. Exactly one wins
exclusive publication. Never unlink/overwrite an earlier generation during
acquire/release, so a delayed release cannot delete its successor. A live holder
never self-recognizes a second concurrent acquisition as reentrant. Generation
records are retained with the runtime/session artifacts; compaction is offline
only after the scope is quiescent.

The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-16

```text
Control acquisition must not reclaim a live process merely because TTL expired.
Holder identity is `{hostId, bootId, pid, processStartTime}` of the process doing
control, not a guessed Rust parent. Unknown liveness is not dead. A dead holder
may leave a remotely queued command: successor first reconciles pending control.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-17

```text
Implemented (Phase 02 H1, `src/runner/dispatch/run-lock.mjs`): holder identity
is `{id, pid, bootId, processStartTime, host}` (`buildRunControlHolder`,
`host` in place of this section's `hostId`), and `resolveHolderLiveness`
encodes the reclaim decision above as a table — a live pid, a pid whose
liveness cannot be disproven (unreadable `/proc/<pid>/stat`), or a pre-H1
holder record with no `processStartTime` to cross-check all resolve to
`held`, never `dead`; only a genuinely dead pid, a pid reused by a different
process (`processStartTime` mismatch), or a `bootId` predating the current
boot resolve to `dead`.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-18

```text
Recommended local implementation for safe reclaim without unlink races:
one per-scope lock directory containing immutable generation records and
token-specific release markers. Contenders publish generation `g+1` only after
`g` is released or its exact process identity is proven dead. Exactly one wins
exclusive publication. Never unlink/overwrite an earlier generation during
acquire/release, so a delayed release cannot delete its successor. A live holder
never self-recognizes a second concurrent acquisition as reentrant. Generation
records are retained with the runtime/session artifacts; compaction is offline
only after the scope is quiescent.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract

```text
## 7. Agent-Facing Contract

The current door is `fgos dispatch recover <runId>`, without `--action` for
read-only observation. It builds a snapshot of the Run, visibility, outbox,
controller evidence, real control epoch and settled signal, then returns a
recommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;
the default is defined by the CLI/use case, not by a coordination-session scan.

Resume requires explicit non-fresh driver-liveness evidence; fresh or unknown
freshness parks. Reassignment requires replacement-authority evidence naming a
driver, read from controller-owned state, never worker-writable outbox claims.
Unknown evidence parks; a settled Run has nothing to recover. A recommendation
contains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,
`action`, `expiresAt` and `reason`; the default lifetime is five minutes.

Apply uses the same door with `--action`, `--expected-snapshot`,
`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.
It re-reads facts, checks action-key binding, snapshot, epoch, expiry and
present legality, then acquires real Run control and checks settlement again.
Stale/expired plans, missing authority and held live control are refused or
parked rather than overridden. Repeating a consumed action key returns the
recorded `already-applied` outcome.

Successful apply records the recovery command, updates the control-epoch
projection and attempts the applicable dispatch-claim clear. It does not itself
launch a replacement worker, close a session or advance a Workflow. Dormant
session-ownership checks still refuse `resume-driver` for old session-owned
Assignments; this is not a claim that the retired coordination door exists.

Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,
243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.
Read the [area portal](../README.md) and [runner spec](../../../specs/runner.md)
for the wider execution boundary; recovery here does not own Work lifecycle.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-20

```text
The current door is `fgos dispatch recover <runId>`, without `--action` for
read-only observation. It builds a snapshot of the Run, visibility, outbox,
controller evidence, real control epoch and settled signal, then returns a
recommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;
the default is defined by the CLI/use case, not by a coordination-session scan.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-21

```text
Resume requires explicit non-fresh driver-liveness evidence; fresh or unknown
freshness parks. Reassignment requires replacement-authority evidence naming a
driver, read from controller-owned state, never worker-writable outbox claims.
Unknown evidence parks; a settled Run has nothing to recover. A recommendation
contains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,
`action`, `expiresAt` and `reason`; the default lifetime is five minutes.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-22

```text
Apply uses the same door with `--action`, `--expected-snapshot`,
`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.
It re-reads facts, checks action-key binding, snapshot, epoch, expiry and
present legality, then acquires real Run control and checks settlement again.
Stale/expired plans, missing authority and held live control are refused or
parked rather than overridden. Repeating a consumed action key returns the
recorded `already-applied` outcome.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-23

```text
Successful apply records the recovery command, updates the control-epoch
projection and attempts the applicable dispatch-claim clear. It does not itself
launch a replacement worker, close a session or advance a Workflow. Dormant
session-ownership checks still refuse `resume-driver` for old session-owned
Assignments; this is not a claim that the retired coordination door exists.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-24

```text
Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,
243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.
Read the [area portal](../README.md) and [runner spec](../../../specs/runner.md)
for the wider execution boundary; recovery here does not own Work lifecycle.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#8-compatibility-and-rollout

```text
## 8. Compatibility And Rollout

Single-writer compatibility is an invariant. Cross-runtime control/version
negotiation and the proposed `owner-runtime-unavailable` refusal below are
rollout design obligations, not implemented generic error handling.

One runtime owns a scope's writes. A Node-launched Run keeps its Node writer;
Rust readers may inspect a supported version or return version-unsupported.
Rust control of a Node-owned Run must route to the owning implementation, or
refuse `owner-runtime-unavailable`. A new CLI process of the same owning runtime
may recover a dead controller; spawn ownership is not controller PID identity.
Move the complete writer boundary only after parity, quiescence and rollback
compatibility proof; never dual-run writers for shadow testing.

`bin/fgos.mjs` remains the legacy payload entry. No file relocation or new host
composition root. Setup/doctor must register filesystem publication checks,
adapter reconcile/control capabilities, workspace-preservation support and any
new config defaults. Project-over-global precedence remains unchanged.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-25

```text
Single-writer compatibility is an invariant. Cross-runtime control/version
negotiation and the proposed `owner-runtime-unavailable` refusal below are
rollout design obligations, not implemented generic error handling.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-26

```text
One runtime owns a scope's writes. A Node-launched Run keeps its Node writer;
Rust readers may inspect a supported version or return version-unsupported.
Rust control of a Node-owned Run must route to the owning implementation, or
refuse `owner-runtime-unavailable`. A new CLI process of the same owning runtime
may recover a dead controller; spawn ownership is not controller PID identity.
Move the complete writer boundary only after parity, quiescence and rollback
compatibility proof; never dual-run writers for shadow testing.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-27

```text
`bin/fgos.mjs` remains the legacy payload entry. No file relocation or new host
composition root. Setup/doctor must register filesystem publication checks,
adapter reconcile/control capabilities, workspace-preservation support and any
new config defaults. Project-over-global precedence remains unchanged.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#9-implementation-slices-and-gates

```text
## 9. Implementation Slices And Gates

| Slice | Scope | Exit evidence; dependency | Status (2026-09-14) |
|---|---|---|---|
| S0 | Freeze fixtures for existing ladder, budgets, retry/recheck, context and close behavior | Existing Node suites green; capture known deficiencies without marking them solved. | **Implemented** — P00 |
| S1 | Versioned Run admission, strict publish fencing and local lock/reclaim | Concurrent admission and every pre-launch crash window; no two winners. Node first. | **Implemented** — P01 (`run-lock.mjs`) |
| S2 | Herdr launch reconciliation, handle guard, pending-control reconciliation, material capture | Reattach/observe/reconcile through the public door; isolated or read-only takeover only. Launch identity uses `runId` plus persisted `launchCommandId` (`fgos-<runId>-<launchCommandId>`); duplicate-name refusal and no resurrection after close require adapter proof. | **Partial** — Herdr launch reconciliation exists in `herdr-reconcile.mjs`; the proposed RunHandle/scope guard, pending-control reconciliation and RecoveryMaterial capture are not implemented as that contract. Writable partial-edit takeover remains deferred (`herdr-reconcile.mjs:356-357`). |
| S3 | Eligible fallback through compiler and confinement | Same Assignment, bounded attempts, unknown effects park; depends on S1/S2 for takeover. | **Implemented** — P03 (`recovery.mjs`) |
| S4 | Pure snapshot/planner + show | Can develop beside S1-S3 using recorded facts; no claim of automatic repair. | **Implemented** — P04 (pure evaluators) + P05 (standalone `dispatch recover`) |
| S5 | Retired coordination-session recovery/continuation | Full dated record remains in the historical snapshot; no current coordination recover door is claimed. | Retired in 2180b4e72 |
| S6 | Additional runtime/operation adapters and optional checkpoint support | Capability-specific proof before enabling; no promise all adapters ship with S2. | **Not implemented** — out of this track's scope |
| S7 | Rust writer port | Same fixtures for all supported Node semantics, sole writer and recovery compatibility. | **Not implemented** — separate track (see the `rust-host-r1-kernel` track) |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-28

```text
| Slice | Scope | Exit evidence; dependency | Status (2026-09-14) |
|---|---|---|---|
| S0 | Freeze fixtures for existing ladder, budgets, retry/recheck, context and close behavior | Existing Node suites green; capture known deficiencies without marking them solved. | **Implemented** — P00 |
| S1 | Versioned Run admission, strict publish fencing and local lock/reclaim | Concurrent admission and every pre-launch crash window; no two winners. Node first. | **Implemented** — P01 (`run-lock.mjs`) |
| S2 | Herdr launch reconciliation, handle guard, pending-control reconciliation, material capture | Reattach/observe/reconcile through the public door; isolated or read-only takeover only. Launch identity uses `runId` plus persisted `launchCommandId` (`fgos-<runId>-<launchCommandId>`); duplicate-name refusal and no resurrection after close require adapter proof. | **Partial** — Herdr launch reconciliation exists in `herdr-reconcile.mjs`; the proposed RunHandle/scope guard, pending-control reconciliation and RecoveryMaterial capture are not implemented as that contract. Writable partial-edit takeover remains deferred (`herdr-reconcile.mjs:356-357`). |
| S3 | Eligible fallback through compiler and confinement | Same Assignment, bounded attempts, unknown effects park; depends on S1/S2 for takeover. | **Implemented** — P03 (`recovery.mjs`) |
| S4 | Pure snapshot/planner + show | Can develop beside S1-S3 using recorded facts; no claim of automatic repair. | **Implemented** — P04 (pure evaluators) + P05 (standalone `dispatch recover`) |
| S5 | Retired coordination-session recovery/continuation | Full dated record remains in the historical snapshot; no current coordination recover door is claimed. | Retired in 2180b4e72 |
| S6 | Additional runtime/operation adapters and optional checkpoint support | Capability-specific proof before enabling; no promise all adapters ship with S2. | **Not implemented** — out of this track's scope |
| S7 | Rust writer port | Same fixtures for all supported Node semantics, sole writer and recovery compatibility. | **Not implemented** — separate track (see the `rust-host-r1-kernel` track) |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#10-proof-matrix

```text
## 10. Proof Matrix

These are required design scenarios, not tests claimed to have passed.
Run/control scenarios have current owners, but X03/X05/X06/X07/X10 require
additional result-link, inherited-edit, transfer or runtime-version guarantees.
They do not describe a shipped session-recovery contract.

| ID | One primary verifiable scenario |
|---|---|
| F-a | Reused pane locator with stale handle/incarnation: destructive control refused; unrelated pane unchanged. |
| F-b | Coordinator dies after bind; recovery finds live worker, same Run, zero new spawn. |
| F-c | Caller timeout while worker present/working: stale observation, no failure settlement or new Run. |
| F-d | Provider pause through automated cleanup and retryAfter: preserve pane, inspect only. |
| F-e | Worker-liveness branch is explicit: live/working writer yields partial or deferred capture; dead writer after quiescence yields preserved capture; unknown liveness parks. Zero stdout never infers launch failure or completion. |
| F-f | Two callers race admission through launch/bind, including injected crash: one admitted launch identity and no duplicate resource. |
| F-g | In-flight refusal identifies Run/handle when known, explicit pre-bind/ambiguous cause otherwise. |
| E-a | Real zero-output ceiling shape: reconcile workspace/effects; fallback only after proven eligibility, not by stdout heuristic. |
| E-b | Handshake unknown: reconcile or park; proven not-delivered branch uses next candidate within the same Assignment cap. |
| E-c | Quota line with/without parseable reset: park same Run, preserve line, no timed relaunch. |
| E-d | Observer timeout with nonterminal ladder and live worker: wait, no fallback/cooldown. |
| E-e | Candidate rejected by capability/governance/confinement cannot launch; next eligible candidate retains original constraints. |
| E-f | Table-driven config failure, launch failure and semantic rejection remain distinct; semantic rejection does not trigger infra fallback. |
| X01 | Pause live lock holder past TTL, race acquire/release: no successor until release; dead generation takeover cannot delete successor. |
| X02 | Crash after control send but before ack: reconcile the pending command; Herdr may resend only while the adapter reports ready and no ack, and must not resend after ack/working. Unknown delivery remains unknown. |
| X03 | Delayed superseded result before/after new link: retained per Run, never becomes current authoritative link. |
| X04 | Capture half-edited file and untracked artifact after writer quiescence: replacement sees exact manifest or explicit incomplete coverage. |
| X05 | Writable/inherited-acceptance profile: Run Result Evaluator attributes preserved failed-attempt edits as inherited and independently verifies final acceptance. Read-only/isolated profiles use per-Run delta evaluation and do not claim X05. |
| X06 | Cancel during admission/control/transfer: ordering documented, no later unauthorized attempt; late result retained. |
| X07 | Crash at each transfer step: resume through public request; no manual claim-file deletion or second child. |
| X10 | Unknown state version or foreign owning runtime: explicit refusal; unchanged schema-1 requests retain behavior. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-29

```text
These are required design scenarios, not tests claimed to have passed.
Run/control scenarios have current owners, but X03/X05/X06/X07/X10 require
additional result-link, inherited-edit, transfer or runtime-version guarantees.
They do not describe a shipped session-recovery contract.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-30

```text
| ID | One primary verifiable scenario |
|---|---|
| F-a | Reused pane locator with stale handle/incarnation: destructive control refused; unrelated pane unchanged. |
| F-b | Coordinator dies after bind; recovery finds live worker, same Run, zero new spawn. |
| F-c | Caller timeout while worker present/working: stale observation, no failure settlement or new Run. |
| F-d | Provider pause through automated cleanup and retryAfter: preserve pane, inspect only. |
| F-e | Worker-liveness branch is explicit: live/working writer yields partial or deferred capture; dead writer after quiescence yields preserved capture; unknown liveness parks. Zero stdout never infers launch failure or completion. |
| F-f | Two callers race admission through launch/bind, including injected crash: one admitted launch identity and no duplicate resource. |
| F-g | In-flight refusal identifies Run/handle when known, explicit pre-bind/ambiguous cause otherwise. |
| E-a | Real zero-output ceiling shape: reconcile workspace/effects; fallback only after proven eligibility, not by stdout heuristic. |
| E-b | Handshake unknown: reconcile or park; proven not-delivered branch uses next candidate within the same Assignment cap. |
| E-c | Quota line with/without parseable reset: park same Run, preserve line, no timed relaunch. |
| E-d | Observer timeout with nonterminal ladder and live worker: wait, no fallback/cooldown. |
| E-e | Candidate rejected by capability/governance/confinement cannot launch; next eligible candidate retains original constraints. |
| E-f | Table-driven config failure, launch failure and semantic rejection remain distinct; semantic rejection does not trigger infra fallback. |
| X01 | Pause live lock holder past TTL, race acquire/release: no successor until release; dead generation takeover cannot delete successor. |
| X02 | Crash after control send but before ack: reconcile the pending command; Herdr may resend only while the adapter reports ready and no ack, and must not resend after ack/working. Unknown delivery remains unknown. |
| X03 | Delayed superseded result before/after new link: retained per Run, never becomes current authoritative link. |
| X04 | Capture half-edited file and untracked artifact after writer quiescence: replacement sees exact manifest or explicit incomplete coverage. |
| X05 | Writable/inherited-acceptance profile: Run Result Evaluator attributes preserved failed-attempt edits as inherited and independently verifies final acceptance. Read-only/isolated profiles use per-Run delta evaluation and do not claim X05. |
| X06 | Cancel during admission/control/transfer: ordering documented, no later unauthorized attempt; late result retained. |
| X07 | Crash at each transfer step: resume through public request; no manual claim-file deletion or second child. |
| X10 | Unknown state version or foreign owning runtime: explicit refusal; unchanged schema-1 requests retain behavior. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits

```text
## 11. Review Finding Resolution And Limits

| Findings | Design response |
|---|---|
| R01/R02 | Run amendment specifies exact supersession identity, serialized admit/publish, pending declaration recovery and launch reconciliation. |
| R03 | Section 6 and RunHandle specify no TTL theft, immutable lock generation and pending remote-control handling. |
| R04/R05/R06 | Retired session continuation design; preserved in the complete historical snapshot, not a current contract. |
| R07/R08/R09 | Fallback defines one default, ceiling/spawn mapping, budget arithmetic and typed effect eligibility. |
| R10 | Historical session-policy proof correction; not a current engine implementation claim. |
| R11/R12/R13 | RunHandle separates liveness/progress, defines transitions/control coverage and one visibility binding source. |
| R14/R15 | Ownership table, shared mutation door, versioned rollout and dependency gates. |

No distributed lease, live session transfer, shared chain-budget allocator,
health scoring store or generic business-effect ledger is implemented here.
Current recovery plans park or request authority for unsafe/unknown cases;
do not infer a universal typed unsupported enum from this design.

The current Herdr launch identity uses normalized
`fgos-<runId>-<launchCommandId>`, with a persisted random launch command, not
runId alone. The standalone reassign action is a fenced controller-epoch
record with a checked authority input; it does not launch a replacement
worker or execute the retired session `driver-replaced` continuation door.

Operation-specific grants/effect policies must be supplied by their owner;
no adapter may infer permission to duplicate external effects. Live-process
force-release is not a current local-lock capability.

R3 may add an audited force-release door. Until then every control critical
section must release its token in `finally` and append a release marker, even
when the controlled process remains alive.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-31

```text
| Findings | Design response |
|---|---|
| R01/R02 | Run amendment specifies exact supersession identity, serialized admit/publish, pending declaration recovery and launch reconciliation. |
| R03 | Section 6 and RunHandle specify no TTL theft, immutable lock generation and pending remote-control handling. |
| R04/R05/R06 | Retired session continuation design; preserved in the complete historical snapshot, not a current contract. |
| R07/R08/R09 | Fallback defines one default, ceiling/spawn mapping, budget arithmetic and typed effect eligibility. |
| R10 | Historical session-policy proof correction; not a current engine implementation claim. |
| R11/R12/R13 | RunHandle separates liveness/progress, defines transitions/control coverage and one visibility binding source. |
| R14/R15 | Ownership table, shared mutation door, versioned rollout and dependency gates. |
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-32

```text
No distributed lease, live session transfer, shared chain-budget allocator,
health scoring store or generic business-effect ledger is implemented here.
Current recovery plans park or request authority for unsafe/unknown cases;
do not infer a universal typed unsupported enum from this design.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-33

```text
The current Herdr launch identity uses normalized
`fgos-<runId>-<launchCommandId>`, with a persisted random launch command, not
runId alone. The standalone reassign action is a fenced controller-epoch
record with a checked authority input; it does not launch a replacement
worker or execute the retired session `driver-replaced` continuation door.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-34

```text
Operation-specific grants/effect policies must be supplied by their owner;
no adapter may infer permission to duplicate external effects. Live-process
force-release is not a current local-lock capability.
```

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-35

```text
R3 may add an audited force-release door. Until then every control critical
section must release its token in `finally` and append a release marker, even
when the controlled process remains alive.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment-run-and-runresult-contract

````text
# Assignment, Run, And RunResult Contract

```txt
Document type: Contract
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-1

````text
```txt
Document type: Contract
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#implementation-and-design-status

```text
## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Assignment | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/assignment.mjs:17,276; assignment-normalizer.mjs:2-20 (stamps mutation/evidence.required); assignment-runner.mjs:431,560,574 (provenance.kind inline/declared/unit-run) |
| Run | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:697-940 (admitRunAttempt, attempt numbering, prior Runs kept), :1565-1590 (run.json contents) |
| Run Phases And Admission | Mixed implementation and proposal; no blanket implementation claim | assignment-runner.mjs:932 admission-run-in-flight, :784 expectedRunId refusal, :1941 result-corrupt, :1016/2024 publishMutableProjection/publishMarkerOnce; run-lock.mjs acquireRunControl/buildRunControlHolder/resolveHolderLiveness (assignment-runner.mjs:70-81); runtime-inspection.mjs:160 VALID_PHASES; git grep run-retried src -> none |
| Proposed Runtime Recovery Amendment | Mixed implementation and proposal; no blanket implementation claim | assignment-runner.mjs:1565-1585 writes contract 'assignment-run.v2' with phase/delivery/supersedesRunId/retryId/payloadDigest; launchCommandId at :2118; recovery-planner.mjs:251-327 (snapshotHash, expectedControlEpoch, actionKey); admission-* refusal codes at :917-940; admitRun/admissionKey/authorityRef/writerRuntime not in src |
| RunResult | Current contract/invariant | src/runner/dispatch/run-result.mjs:350-385 (normalizeRunResult fields), :1305-1325 (runOutcome) |
| Dispatch Operability Addendum | Current contract/invariant | src/runner/dispatch/run-result.mjs:7,22-23 (legacy-derived, contract-corrupt); agent-result-claim-contract.mjs:5 (claim v2); runtime-inspection.mjs:255; test/runner/dispatch-operability-production-door.test.mjs |
| Confidence | Current contract/invariant | src/runner/dispatch/run-result.mjs:1276-1285; packages/run-result/rust/src/lib.rs:129 CONFIDENCE_LEVELS; assignment-normalizer.mjs:67-69 |
| Evidence Freshness | Current contract/invariant | src/runner/dispatch/evidence-attribution.mjs:10 (levels proven/correlated/excluded/unattributed), :69,:197; test/runner/evidence-attribution.test.mjs |
| Work Boundary | Current contract/invariant | docs/specs/runner.md:3072-3081 (0049); no src/state import in src/runner/dispatch or src/runner/execution |
| Required Negative Tests | Mixed implementation and proposal; no blanket implementation claim | test/runner/assignment-runresult.test.mjs, evidence-attribution.test.mjs, run-lock-identity.test.mjs, dispatch-liveness.test.mjs; items about 'superseded Run late result' tied to run-retried (retired) |
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-3

```text
The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-4

```text
| Section | Status | Evidence / limit |
|---|---|---|
| Assignment | Mixed implementation and proposal; no blanket implementation claim | src/runner/dispatch/assignment.mjs:17,276; assignment-normalizer.mjs:2-20 (stamps mutation/evidence.required); assignment-runner.mjs:431,560,574 (provenance.kind inline/declared/unit-run) |
| Run | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:697-940 (admitRunAttempt, attempt numbering, prior Runs kept), :1565-1590 (run.json contents) |
| Run Phases And Admission | Mixed implementation and proposal; no blanket implementation claim | assignment-runner.mjs:932 admission-run-in-flight, :784 expectedRunId refusal, :1941 result-corrupt, :1016/2024 publishMutableProjection/publishMarkerOnce; run-lock.mjs acquireRunControl/buildRunControlHolder/resolveHolderLiveness (assignment-runner.mjs:70-81); runtime-inspection.mjs:160 VALID_PHASES; git grep run-retried src -> none |
| Proposed Runtime Recovery Amendment | Mixed implementation and proposal; no blanket implementation claim | assignment-runner.mjs:1565-1585 writes contract 'assignment-run.v2' with phase/delivery/supersedesRunId/retryId/payloadDigest; launchCommandId at :2118; recovery-planner.mjs:251-327 (snapshotHash, expectedControlEpoch, actionKey); admission-* refusal codes at :917-940; admitRun/admissionKey/authorityRef/writerRuntime not in src |
| RunResult | Current contract/invariant | src/runner/dispatch/run-result.mjs:350-385 (normalizeRunResult fields), :1305-1325 (runOutcome) |
| Dispatch Operability Addendum | Current contract/invariant | src/runner/dispatch/run-result.mjs:7,22-23 (legacy-derived, contract-corrupt); agent-result-claim-contract.mjs:5 (claim v2); runtime-inspection.mjs:255; test/runner/dispatch-operability-production-door.test.mjs |
| Confidence | Current contract/invariant | src/runner/dispatch/run-result.mjs:1276-1285; packages/run-result/rust/src/lib.rs:129 CONFIDENCE_LEVELS; assignment-normalizer.mjs:67-69 |
| Evidence Freshness | Current contract/invariant | src/runner/dispatch/evidence-attribution.mjs:10 (levels proven/correlated/excluded/unattributed), :69,:197; test/runner/evidence-attribution.test.mjs |
| Work Boundary | Current contract/invariant | docs/specs/runner.md:3072-3081 (0049); no src/state import in src/runner/dispatch or src/runner/execution |
| Required Negative Tests | Mixed implementation and proposal; no blanket implementation claim | test/runner/assignment-runresult.test.mjs, evidence-attribution.test.mjs, run-lock-identity.test.mjs, dispatch-liveness.test.mjs; items about 'superseded Run late result' tied to run-retried (retired) |
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment

```text
## Assignment

Assignment is an immutable semantic request. It should identify:

- Assignment ID and schema version;
- optional Work/context reference;
- operation and Role;
- objective and bounded inputs;
- constraints and mutation policy;
- expected outputs and evidence requirements;
- dispatch policy inputs;
- result/artifact destination contract;
- creation timestamp and caller provenance.

Current construction has three provenance kinds:

1. declared Workflow step operation/TaskSpec;
2. validated inline contract and applicable registered domain harness;
3. Unit-run execution and its computed binding.

[ADR-006](../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md)
distinguishes their shapes. Declared/inline builders stamp policy/normalizer
versions; Unit-run provenance is written by `execution/run.mjs:334-338`.
Mutation/evidence normalization is current implementation, not an assumption
that the retired session stamp-producing door still exists.

Assignment does not contain attempt status as lifecycle truth. Retry does not
rewrite the Assignment.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-5

```text
Assignment is an immutable semantic request. It should identify:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-6

```text
- Assignment ID and schema version;
- optional Work/context reference;
- operation and Role;
- objective and bounded inputs;
- constraints and mutation policy;
- expected outputs and evidence requirements;
- dispatch policy inputs;
- result/artifact destination contract;
- creation timestamp and caller provenance.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-7

```text
Current construction has three provenance kinds:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-8

```text
1. declared Workflow step operation/TaskSpec;
2. validated inline contract and applicable registered domain harness;
3. Unit-run execution and its computed binding.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-9

```text
[ADR-006](../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md)
distinguishes their shapes. Declared/inline builders stamp policy/normalizer
versions; Unit-run provenance is written by `execution/run.mjs:334-338`.
Mutation/evidence normalization is current implementation, not an assumption
that the retired session stamp-producing door still exists.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-10

```text
Assignment does not contain attempt status as lifecycle truth. Retry does not
rewrite the Assignment.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run

```text
## Run

Run is one execution attempt for one Assignment. It should identify:

- Run ID and Assignment reference;
- resolved DispatchPlan/executor/mechanism;
- start/settlement timestamps;
- process/transport metadata;
- result and artifact refs;
- exit/timeout/launch failure details;
- evidence snapshot boundaries needed for post-run comparison.

One Assignment may have multiple Runs. Prior attempts remain immutable evidence.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-11

```text
Run is one execution attempt for one Assignment. It should identify:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-12

```text
- Run ID and Assignment reference;
- resolved DispatchPlan/executor/mechanism;
- start/settlement timestamps;
- process/transport metadata;
- result and artifact refs;
- exit/timeout/launch failure details;
- evidence snapshot boundaries needed for post-run comparison.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-13

```text
One Assignment may have multiple Runs. Prior attempts remain immutable evidence.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#run-phases-and-admission

```text
### Run Phases And Admission

A Run is the unit of admission: it is the one record that says "this attempt
is allowed to exist". Every runtime-layer concern (RunHandle, continuation
planning, executor fallback) reads and references Run; none of them admits an
attempt on its own.

Proposed phase vocabulary, not a claim that the writer persists every transition:

| Phase | Meaning | Must hold before entering |
|---|---|---|
| `admitted` | Run record durably written: `runId`, `assignmentId`, `attempt`, resolved DispatchPlan. | No runtime resource exists yet. `runId` is the launch identity used to reconcile crashes and orphaned runtimes; it is deterministic per (Assignment, attempt). |
| `launched` | The runtime adapter created a runtime resource (pane, process, job). | An admitted Run. A runtime found without an admitted Run is an orphan: reconcile it by `runId`, never adopt it as a new Run. |
| `bound` | The RunHandle binding (locator + owner) is durably recorded. | Launched. Binding is written before any non-idempotent prompt or input is delivered. |
| `delivered` | The work prompt/input reached the worker. | Bound. Delivery is a tri-state fact: `not-sent`, `sent`, `unknown`. A request sent without acknowledgment is `unknown`, never "launch failed". |
| `settled` | A normalized RunResult or an explicit failure record exists. | Any earlier phase; crash windows settle as explicit failure with the phase reached. |

The current writer initializes `phase: admitted` and `delivery: not-sent`
(`assignment-runner.mjs:1562-1582`). Runtime inspection derives additional
observations; recognizing `bound`/`delivered` does not prove those proposed
phase transitions are durably written. Herdr launch reconciliation uses both
Run identity and its persisted launch-command identity.

Admission rules:

- Admission uses immutable generation records and deterministic attempt identity
  (`assignment-runner.mjs:697-714,895-910`).
- When a `retryId` is supplied, the same destination/payload tuple reuses its
  admission; a changed tuple or invalid predecessor refuses
  (`assignment-runner.mjs:724-730,914-924`). This stricter tuple behavior is opt-in,
  not the behavior of every legacy attempt caller.
- A prior un-settled Run with live/unknown control holder refuses another
  admission unless the caller explicitly requests `forceNewAttempt`; settled
  result refusal is separately opt-in (`assignment-runner.mjs:926-940,1554-1561`).
- Admission observations are not semantic acceptance. Corrupt settlement must
  not be overwritten by a fresh launch.

Three guarantees, kept distinct:

- **Control fencing** — one controller per un-settled Run, implemented via
  `run-lock.mjs`'s exclusive-create generation ledger (`acquireRunControl`/
  `releaseRunControl`). Holder identity is `{id, pid, bootId, processStartTime,
  host}` (`buildRunControlHolder`); reclaim requires proven-dead identity
  (`resolveHolderLiveness`) — a live PID, a PID whose liveness cannot be
  disproven, or a PID reused after a host reboot is never mistaken for a dead
  holder's slot. Observers hold no lock. A controller that lost the lock may
  not deliver input, terminate, or write Run/RunHandle state.
- **Result fencing (stronger proposal)** — authoritative result-link exclusion
  for superseded Runs requires its own implemented eligibility owner. The old
  session `result-linked`/`run-retried` event order is historical, not a current
  standalone event API or proven guarantee.
- **Effect protection** — deduplication or isolation at the place the effect
  occurs. Owned by the operation contract and its adapter. Run promises no
  exactly-once external effect; a stopped worker does not mean its effects
  are absent.

Current admission uses deterministic Run identities, attempt numbering and existing-result refusal in `src/runner/dispatch/assignment-runner.mjs:697-940`. Run control is epoch/token-fenced in `run-lock.mjs:306-412`; corrupt settlement refuses rather than relaunching. `runtime-inspection.mjs:160-175` recognizes phase observations including bound/delivered; that is not proof that every proposed RunHandle transition/schema below has been implemented.

The former session `run-retried` event-order and result-link fencing rules are preserved in history. The current standalone Run record writes the implemented `assignment-run.v2` subset (`assignment-runner.mjs:1563-1590`). The admissionKey/admitRun/authorityRef/writerRuntime interface and stronger proposed supersession contract below remain design targets, not asserted runtime APIs.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-14

```text
A Run is the unit of admission: it is the one record that says "this attempt
is allowed to exist". Every runtime-layer concern (RunHandle, continuation
planning, executor fallback) reads and references Run; none of them admits an
attempt on its own.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-15

```text
Proposed phase vocabulary, not a claim that the writer persists every transition:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-16

```text
| Phase | Meaning | Must hold before entering |
|---|---|---|
| `admitted` | Run record durably written: `runId`, `assignmentId`, `attempt`, resolved DispatchPlan. | No runtime resource exists yet. `runId` is the launch identity used to reconcile crashes and orphaned runtimes; it is deterministic per (Assignment, attempt). |
| `launched` | The runtime adapter created a runtime resource (pane, process, job). | An admitted Run. A runtime found without an admitted Run is an orphan: reconcile it by `runId`, never adopt it as a new Run. |
| `bound` | The RunHandle binding (locator + owner) is durably recorded. | Launched. Binding is written before any non-idempotent prompt or input is delivered. |
| `delivered` | The work prompt/input reached the worker. | Bound. Delivery is a tri-state fact: `not-sent`, `sent`, `unknown`. A request sent without acknowledgment is `unknown`, never "launch failed". |
| `settled` | A normalized RunResult or an explicit failure record exists. | Any earlier phase; crash windows settle as explicit failure with the phase reached. |
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-17

```text
The current writer initializes `phase: admitted` and `delivery: not-sent`
(`assignment-runner.mjs:1562-1582`). Runtime inspection derives additional
observations; recognizing `bound`/`delivered` does not prove those proposed
phase transitions are durably written. Herdr launch reconciliation uses both
Run identity and its persisted launch-command identity.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-18

```text
Admission rules:

- Admission uses immutable generation records and deterministic attempt identity
  (`assignment-runner.mjs:697-714,895-910`).
- When a `retryId` is supplied, the same destination/payload tuple reuses its
  admission; a changed tuple or invalid predecessor refuses
  (`assignment-runner.mjs:724-730,914-924`). This stricter tuple behavior is opt-in,
  not the behavior of every legacy attempt caller.
- A prior un-settled Run with live/unknown control holder refuses another
  admission unless the caller explicitly requests `forceNewAttempt`; settled
  result refusal is separately opt-in (`assignment-runner.mjs:926-940,1554-1561`).
- Admission observations are not semantic acceptance. Corrupt settlement must
  not be overwritten by a fresh launch.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-19

```text
Three guarantees, kept distinct:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-20

```text
- **Control fencing** — one controller per un-settled Run, implemented via
  `run-lock.mjs`'s exclusive-create generation ledger (`acquireRunControl`/
  `releaseRunControl`). Holder identity is `{id, pid, bootId, processStartTime,
  host}` (`buildRunControlHolder`); reclaim requires proven-dead identity
  (`resolveHolderLiveness`) — a live PID, a PID whose liveness cannot be
  disproven, or a PID reused after a host reboot is never mistaken for a dead
  holder's slot. Observers hold no lock. A controller that lost the lock may
  not deliver input, terminate, or write Run/RunHandle state.
- **Result fencing (stronger proposal)** — authoritative result-link exclusion
  for superseded Runs requires its own implemented eligibility owner. The old
  session `result-linked`/`run-retried` event order is historical, not a current
  standalone event API or proven guarantee.
- **Effect protection** — deduplication or isolation at the place the effect
  occurs. Owned by the operation contract and its adapter. Run promises no
  exactly-once external effect; a stopped worker does not mean its effects
  are absent.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-21

```text
Current admission uses deterministic Run identities, attempt numbering and existing-result refusal in `src/runner/dispatch/assignment-runner.mjs:697-940`. Run control is epoch/token-fenced in `run-lock.mjs:306-412`; corrupt settlement refuses rather than relaunching. `runtime-inspection.mjs:160-175` recognizes phase observations including bound/delivered; that is not proof that every proposed RunHandle transition/schema below has been implemented.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-22

```text
The former session `run-retried` event-order and result-link fencing rules are preserved in history. The current standalone Run record writes the implemented `assignment-run.v2` subset (`assignment-runner.mjs:1563-1590`). The admissionKey/admitRun/authorityRef/writerRuntime interface and stronger proposed supersession contract below remain design targets, not asserted runtime APIs.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#proposed-runtime-recovery-amendment

```text
### Proposed Runtime Recovery Amendment

Status: PROPOSED technical refinement beyond the implemented assignment-run.v2 subset, not an implicit
promotion of the linked designs to Accepted. The accepted identity/authority
principles above remain; this section defines the proposed writer profile that
would make their guarantees verifiable. See
[Runtime Recovery Design](../architecture/runtime-recovery-design.md) for scope,
local publication/locking, compatibility and proof.

**Proposed stronger Run record.** The implemented `assignment-run.v2` subset is described above; the full field set below is not today's writer schema:

| Field | Semantics |
|---|---|
| contract, revision | Version and nonnegative CAS counter; writer must understand both. |
| runId, assignmentId, attempt | Existing deterministic identity; attempt positive, monotonic, never reused. |
| admissionKey, admissionPayloadDigest | Stable logical initial-dispatch/retry identity; same key with different payload refuses. |
| authorityRef | Trusted source declaration reference/digest; not a worker-provided permission assertion. |
| dispatchPlanRef | Immutable compiled plan digest/reference. |
| supersedesRunId | Null for initial Run, otherwise exact prior current Run. |
| phase, delivery | Phases above; delivered requires receipt/ack according to adapter contract. Unknown delivery retains bound plus unknown. |
| launchCommandId, launchState | Stable launch command; not-requested/pending/reconciled. |
| writerRuntime | Owning Node/Rust implementation and release reference. |
| recoveryMaterialRef | Optional pinned material manifest; not a mutation of Assignment or evidence of success. |
| settlement | Null or normalized result/explicit failure reference, reachedPhase and timestamp. |

One committed `run.json` under `assignments/<id>/runs/<attempt>/` owns each Run's
record. Mutable phase/settlement fields are atomically replaced under the runtime
write lock; admission identity/plan/provenance never change. Completed older Runs
and their evidence are never repurposed. Current admission is derived from
committed records and declared supersession; directory presence alone is not
admission. No second current-run database is required. An optional index is a
rebuildable projection, never a writer authority.

**Admission door.** `admitRun(assignmentId, admissionKey, expectedCurrentRunId,
authorityRef, compiledPlanRef, recoveryMaterialRef?)` returns created(existing
Run record), already-admitted(same record), or typed refused(reason). It is an
operation of the Run repository/runtime, not a new component. Under Assignment
serialization, scan committed admissions, return a matching prior key first,
otherwise check expected-current, authority, budget, result and writer-quiescence
requirements, then atomically publish one complete Run record before launch.
The planned initial key derives from Assignment identity; retry key derives from
the durable retry declaration identity. Unknown leftover metadata refuses; a
staging directory is not guessed to be a dispatched Run.

The former session-owned retry allocation is historical, not an available session-engine mutation door. Current standalone admission and control fencing are owned by assignment-runner.mjs and run-lock.mjs.

Standalone runtime persists equivalent supersession intent with the new Run's
atomic admission record; the record itself is the declared equivalent, rather
than an unrelated event stream. The predecessor identity is required. A superseded
Run may still be physically alive: new writable execution still needs quiescence
or isolation/effect proof. Result fencing alone is insufficient.

**Proposed launch gate and crash reconciliation.** Under an Assignment-owned gate
and Run control lock, check the Run is still authorized/current, then durably
record launch pending. Release outer locks before adapter I/O. Cancellation or
transfer after this point sees an in-flight launch, not a free slot. The adapter
receives runId as launch identity before creating a resource and must find that
identity after a crash, including before locator persistence. `absent-proven`
means both no resource and no pending launch that could create it later. Unknown
does not permit another launch. Confinement remains the only gate invoking the
launch adapter; RunHandle runtime methods cannot bypass its prepared invocation.

| Crash window | Recovery behavior |
|---|---|
| Before committed admission | No Run authorized; retry same admission request under locks. |
| Admitted, no pending launch | Resume same Run after fresh authority checks. |
| Pending launch, locator absent | Reconcile by runId/commandId; found binds, unknown parks, absent-proven may resubmit same command. |
| Launched, before bound | Reconcile and persist binding; never allocate another attempt because locator file is missing. |
| Bound, delivery pending/unknown | Reconcile command/receipt; no blind resend. |
| Result on disk, no settlement/link | Normalize/store and publish only if exact Run remains eligible. |
| Retry declared but parent cancelled | No new launch; keep declaration/admitted record as cancelled-before-launch explicit failure when applicable. |

**Result eligibility.** Per-Run normalization/storage is permitted for late and
superseded Runs. Publishing an Assignment's authoritative result requires exact
runId eligibility under the runtime-owned admission/control boundary, serialized with retry
declaration/admission. A pending retry fences its previous Run at declaration;
after abort before admission, the previous Run regains eligibility only through
the explicit abort event. Other historical Runs never gain eligibility from a
generic `allowSupersede` flag. A late initial link is checked just like a later
replacement link. Accepted prior result remains readable as historical/current
last-published view until an eligible new result links; readers expose that it is
superseded for execution when a retry is pending.


Typed refusal reasons include admission-conflict, admission-payload-conflict,
retry-pending, authority-revoked, budget-exhausted, writer-not-quiescent,
launch-unknown, result-superseded, version-unsupported and owner-runtime-unavailable.
They carry subject refs; no caller branches on message prose.

**Proposed profile migration.** Enable stronger runtime profiles only after adapters prove launch reconciliation and bind-before-delivery. Do not force unsupported adapters to claim RunHandle support. Existing Node/Rust readers and writers must agree on the supported `assignment-run.v2` subset; the stronger fields above remain proposed unless their writer is cited. The retired session-schema migration design is retained only in history.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-23

```text
Status: PROPOSED technical refinement beyond the implemented assignment-run.v2 subset, not an implicit
promotion of the linked designs to Accepted. The accepted identity/authority
principles above remain; this section defines the proposed writer profile that
would make their guarantees verifiable. See
[Runtime Recovery Design](../architecture/runtime-recovery-design.md) for scope,
local publication/locking, compatibility and proof.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-24

```text
**Proposed stronger Run record.** The implemented `assignment-run.v2` subset is described above; the full field set below is not today's writer schema:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-25

```text
| Field | Semantics |
|---|---|
| contract, revision | Version and nonnegative CAS counter; writer must understand both. |
| runId, assignmentId, attempt | Existing deterministic identity; attempt positive, monotonic, never reused. |
| admissionKey, admissionPayloadDigest | Stable logical initial-dispatch/retry identity; same key with different payload refuses. |
| authorityRef | Trusted source declaration reference/digest; not a worker-provided permission assertion. |
| dispatchPlanRef | Immutable compiled plan digest/reference. |
| supersedesRunId | Null for initial Run, otherwise exact prior current Run. |
| phase, delivery | Phases above; delivered requires receipt/ack according to adapter contract. Unknown delivery retains bound plus unknown. |
| launchCommandId, launchState | Stable launch command; not-requested/pending/reconciled. |
| writerRuntime | Owning Node/Rust implementation and release reference. |
| recoveryMaterialRef | Optional pinned material manifest; not a mutation of Assignment or evidence of success. |
| settlement | Null or normalized result/explicit failure reference, reachedPhase and timestamp. |
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-26

```text
One committed `run.json` under `assignments/<id>/runs/<attempt>/` owns each Run's
record. Mutable phase/settlement fields are atomically replaced under the runtime
write lock; admission identity/plan/provenance never change. Completed older Runs
and their evidence are never repurposed. Current admission is derived from
committed records and declared supersession; directory presence alone is not
admission. No second current-run database is required. An optional index is a
rebuildable projection, never a writer authority.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-27

```text
**Admission door.** `admitRun(assignmentId, admissionKey, expectedCurrentRunId,
authorityRef, compiledPlanRef, recoveryMaterialRef?)` returns created(existing
Run record), already-admitted(same record), or typed refused(reason). It is an
operation of the Run repository/runtime, not a new component. Under Assignment
serialization, scan committed admissions, return a matching prior key first,
otherwise check expected-current, authority, budget, result and writer-quiescence
requirements, then atomically publish one complete Run record before launch.
The planned initial key derives from Assignment identity; retry key derives from
the durable retry declaration identity. Unknown leftover metadata refuses; a
staging directory is not guessed to be a dispatched Run.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-28

```text
The former session-owned retry allocation is historical, not an available session-engine mutation door. Current standalone admission and control fencing are owned by assignment-runner.mjs and run-lock.mjs.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-29

```text
Standalone runtime persists equivalent supersession intent with the new Run's
atomic admission record; the record itself is the declared equivalent, rather
than an unrelated event stream. The predecessor identity is required. A superseded
Run may still be physically alive: new writable execution still needs quiescence
or isolation/effect proof. Result fencing alone is insufficient.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-30

```text
**Proposed launch gate and crash reconciliation.** Under an Assignment-owned gate
and Run control lock, check the Run is still authorized/current, then durably
record launch pending. Release outer locks before adapter I/O. Cancellation or
transfer after this point sees an in-flight launch, not a free slot. The adapter
receives runId as launch identity before creating a resource and must find that
identity after a crash, including before locator persistence. `absent-proven`
means both no resource and no pending launch that could create it later. Unknown
does not permit another launch. Confinement remains the only gate invoking the
launch adapter; RunHandle runtime methods cannot bypass its prepared invocation.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-31

```text
| Crash window | Recovery behavior |
|---|---|
| Before committed admission | No Run authorized; retry same admission request under locks. |
| Admitted, no pending launch | Resume same Run after fresh authority checks. |
| Pending launch, locator absent | Reconcile by runId/commandId; found binds, unknown parks, absent-proven may resubmit same command. |
| Launched, before bound | Reconcile and persist binding; never allocate another attempt because locator file is missing. |
| Bound, delivery pending/unknown | Reconcile command/receipt; no blind resend. |
| Result on disk, no settlement/link | Normalize/store and publish only if exact Run remains eligible. |
| Retry declared but parent cancelled | No new launch; keep declaration/admitted record as cancelled-before-launch explicit failure when applicable. |
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-32

```text
**Result eligibility.** Per-Run normalization/storage is permitted for late and
superseded Runs. Publishing an Assignment's authoritative result requires exact
runId eligibility under the runtime-owned admission/control boundary, serialized with retry
declaration/admission. A pending retry fences its previous Run at declaration;
after abort before admission, the previous Run regains eligibility only through
the explicit abort event. Other historical Runs never gain eligibility from a
generic `allowSupersede` flag. A late initial link is checked just like a later
replacement link. Accepted prior result remains readable as historical/current
last-published view until an eligible new result links; readers expose that it is
superseded for execution when a retry is pending.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-33

```text
Typed refusal reasons include admission-conflict, admission-payload-conflict,
retry-pending, authority-revoked, budget-exhausted, writer-not-quiescent,
launch-unknown, result-superseded, version-unsupported and owner-runtime-unavailable.
They carry subject refs; no caller branches on message prose.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-34

```text
**Proposed profile migration.** Enable stronger runtime profiles only after adapters prove launch reconciliation and bind-before-delivery. Do not force unsupported adapters to claim RunHandle support. Existing Node/Rust readers and writers must agree on the supported `assignment-run.v2` subset; the stronger fields above remain proposed unless their writer is cited. The retired session-schema migration design is retained only in history.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#runresult

```text
## RunResult

RunResult is the normalized outcome for one Run. It should identify:

- Run and Assignment refs;
- normalized status and confidence;
- worker claim and structured result ref;
- accepted/rejected evidence refs and reasons;
- artifacts and expected-output checks;
- verification commands/results when applicable;
- failure classification;
- timestamps and normalizer provenance.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-35

```text
RunResult is the normalized outcome for one Run. It should identify:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-36

```text
- Run and Assignment refs;
- normalized status and confidence;
- worker claim and structured result ref;
- accepted/rejected evidence refs and reasons;
- artifacts and expected-output checks;
- verification commands/results when applicable;
- failure classification;
- timestamps and normalizer provenance.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#dispatch-operability-addendum

```text
### Dispatch Operability Addendum

The dispatch-operability design track
(`archive/plans/260914-dispatch-operability-evidence-attribution/`) records RunResult
v2 interpretation and read-only Dispatch runtime inspection while preserving
`result.json` as the one terminal RunResult location:

- `RunResult` remains the only immutable terminal truth for a Run.
- `RunObservation` is a mutable read projection for in-flight, ambiguous, or
  incomplete facts; it cannot settle, retry, cancel, authorize, or clear a
  guard.
- `ProviderOutcome` is a host-invocation wrapper, not Run truth.
- `agent-result.json` becomes `agent-result-claim.v2`, a worker claim consumed
  by the normalizer, never independent proof.
- Current normalization defaults to RunResult v3 and also supports v4
  (`run-result.mjs:350-351,557-563`); v2 is the historical interpretation
  recorded by this design addendum, not the current default. Execution,
  assessment, confidence, failure, policy, delivery and provenance stay separate.
- Historical v1 results are interpreted deterministically as `legacy-derived`
  and are not rewritten on read.
- A v2 result whose compatibility `status`/`confidence` disagrees with its
  classification is `contract-corrupt` and fails closed.

The archived design record is
`archive/plans/260914-dispatch-operability-evidence-attribution/contracts/run-result-and-observation.md`;
it is historical design evidence, not a second live authority overriding code.
The implementation proof for this slice is
`test/runner/dispatch-operability-production-door.test.mjs`, which exercises
the production Assignment door, public inspect CLI, historical/replayed result
interpretation, and negative reconciliation routes. Reconciliation remains
guard/projection repair only; it does not recover, retry, relaunch, resume,
reattach, reassign, take over, admit, cancel, kill, or signal execution.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-37

```text
The dispatch-operability design track
(`archive/plans/260914-dispatch-operability-evidence-attribution/`) records RunResult
v2 interpretation and read-only Dispatch runtime inspection while preserving
`result.json` as the one terminal RunResult location:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-39

```text
The archived design record is
`archive/plans/260914-dispatch-operability-evidence-attribution/contracts/run-result-and-observation.md`;
it is historical design evidence, not a second live authority overriding code.
The implementation proof for this slice is
`test/runner/dispatch-operability-production-door.test.mjs`, which exercises
the production Assignment door, public inspect CLI, historical/replayed result
interpretation, and negative reconciliation routes. Reconciliation remains
guard/projection repair only; it does not recover, retry, relaunch, resume,
reattach, reassign, take over, admit, cancel, kill, or signal execution.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#confidence

```text
## Confidence

The exact vocabulary may evolve, but these boundaries are mandatory:

- verified confidence requires independently checkable required evidence;
- reported confidence is allowed only when the operation permits analytical or
  advisory output without external verification;
- no-evidence cannot satisfy evidence-required success;
- malformed, stale, or cross-context evidence cannot raise confidence;
- process success cannot substitute for semantic success.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-40

```text
The exact vocabulary may evolve, but these boundaries are mandatory:
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-41

```text
- verified confidence requires independently checkable required evidence;
- reported confidence is allowed only when the operation permits analytical or
  advisory output without external verification;
- no-evidence cannot satisfy evidence-required success;
- malformed, stale, or cross-context evidence cannot raise confidence;
- process success cannot substitute for semantic success.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#evidence-freshness

```text
## Evidence Freshness

Mutating operations must distinguish pre-existing state from changes attributable
to the Run. Evidence checks should use pre/post snapshots, git state, artifact
timestamps/hashes, expected-file rules, or equivalent operation-specific proof.

Implemented evidence attribution makes this distinction explicit (src/runner/dispatch/evidence-attribution.mjs:10,69,197): pre/post Git
snapshots provide correlation only, not proof of process authorship. Attribution
levels are `proven`, `correlated`, `excluded`, and `unattributed`; only
adapter/confinement evidence with declared positive coverage can produce
`proven`.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-42

```text
Mutating operations must distinguish pre-existing state from changes attributable
to the Run. Evidence checks should use pre/post snapshots, git state, artifact
timestamps/hashes, expected-file rules, or equivalent operation-specific proof.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-43

```text
Implemented evidence attribution makes this distinction explicit (src/runner/dispatch/evidence-attribution.mjs:10,69,197): pre/post Git
snapshots provide correlation only, not proof of process authorship. Attribution
levels are `proven`, `correlated`, `excluded`, and `unattributed`; only
adapter/confinement evidence with declared positive coverage can produce
`proven`.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#work-boundary

```text
## Work Boundary

Assignment, Run and RunResult may reference Work and inform its driver. None
independently owns Work status/workflowStep, acceptance, approval, claim/return
or merge; lifecycle actions go through the authorized Work verbs.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-44

```text
Assignment, Run and RunResult may reference Work and inform its driver. None
independently owns Work status/workflowStep, acceptance, approval, claim/return
or merge; lifecycle actions go through the authorized Work verbs.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#required-negative-tests

```text
## Required Negative Tests

- missing or malformed worker result;
- exit zero with absent expected output;
- stale result artifact;
- evidence belonging to another Assignment/Run;
- dirty-before file claimed as new output;
- mutating claim with no post-run delta;
- dispatch rejection before launch;
- timeout/non-zero exit with misleading success text;
- retry preserving prior Run and evidence;
- RunResult persistence failure not reported as success;
- crash after `admitted` before `launched`: reconcile finds no runtime, admits
  no duplicate;
- crash after `launched` before `bound`: orphan runtime reconciled by `runId`;
- delivery `unknown` never classified as launch failure;
- second controller on an un-settled Run refused;
- coordinator restart does not reset `attempt`;
- superseded Run's late result stored and validated, never accepted as the
  Assignment's authoritative result.

Implementation-era detail remains in [Step 03](../history/retired-engine/files/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#literal-snapshot)
and [Step 04](../history/retired-engine/files/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#literal-snapshot).
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-45

```text
- missing or malformed worker result;
- exit zero with absent expected output;
- stale result artifact;
- evidence belonging to another Assignment/Run;
- dirty-before file claimed as new output;
- mutating claim with no post-run delta;
- dispatch rejection before launch;
- timeout/non-zero exit with misleading success text;
- retry preserving prior Run and evidence;
- RunResult persistence failure not reported as success;
- crash after `admitted` before `launched`: reconcile finds no runtime, admits
  no duplicate;
- crash after `launched` before `bound`: orphan runtime reconciled by `runId`;
- delivery `unknown` never classified as launch failure;
- second controller on an un-settled Run refused;
- coordinator restart does not reset `attempt`;
- superseded Run's late result stored and validated, never accepted as the
  Assignment's authoritative result.
```

### docs/platform/agent-coordination/contracts/assignment-run-runresult.md#unheaded-block-46

```text
Implementation-era detail remains in [Step 03](../history/retired-engine/files/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#literal-snapshot)
and [Step 04](../history/retired-engine/files/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#literal-snapshot).
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#architecture-advisory-artifact-templates

````text
# Architecture Advisory Artifact Templates

```txt
Document type: Guide / runbook
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-1

````text
```txt
Document type: Guide / runbook
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#registered-output-boundary

```text
## Registered Output Boundary

These are cognitive artifact shapes and optional manual-harness examples. They do not prescribe a session.md filesystem ledger, manual run records, storage ownership or a nine-phase runtime for the registered architecture-advisory Workflow. Its synthesis template requires a final RAW JSON packet; Workflow owns persistence, gates and resumption. Evidence: core/workflows/architecture-advisory.yaml:43-84 and core/skills/fgos-architecture-panel/SKILL.md:17-37,135-142.

| Optional manual artifact | Current registered counterpart |
|---|---|
| intake, interpretation, scout report | Verbatim request and framing report |
| proposals/system, alternative, constraint | Three blind shaping reports |
| critique / constraint findings | Reviewed critique reports and findings |
| synthesis / dispositions | Final synthesis RAW JSON packet |
| explanation | Explanation report preserving the packet |
| human turn | Actual owner close-gate answer; no fabricated user input |
| decision request / specialist / dialogue impact | No automatic graph step; material revisit requires separately authorized reopen |
| session board / prompts / runs / rubric | Optional manual trace/evaluation; not Workflow storage or completion authority |

All numbered templates below are manual shapes, not phase IDs in the registered
graph. Their local checklists are cognitive guidance, not new mandatory runtime
fields, gates, provider rosters or a requirement to write the named files.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-3

```text
These are cognitive artifact shapes and optional manual-harness examples. They do not prescribe a session.md filesystem ledger, manual run records, storage ownership or a nine-phase runtime for the registered architecture-advisory Workflow. Its synthesis template requires a final RAW JSON packet; Workflow owns persistence, gates and resumption. Evidence: core/workflows/architecture-advisory.yaml:43-84 and core/skills/fgos-architecture-panel/SKILL.md:17-37,135-142.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-4

```text
| Optional manual artifact | Current registered counterpart |
|---|---|
| intake, interpretation, scout report | Verbatim request and framing report |
| proposals/system, alternative, constraint | Three blind shaping reports |
| critique / constraint findings | Reviewed critique reports and findings |
| synthesis / dispositions | Final synthesis RAW JSON packet |
| explanation | Explanation report preserving the packet |
| human turn | Actual owner close-gate answer; no fabricated user input |
| decision request / specialist / dialogue impact | No automatic graph step; material revisit requires separately authorized reopen |
| session board / prompts / runs / rubric | Optional manual trace/evaluation; not Workflow storage or completion authority |
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-5

```text
All numbered templates below are manual shapes, not phase IDs in the registered
graph. Their local checklists are cognitive guidance, not new mandatory runtime
fields, gates, provider rosters or a requirement to write the named files.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#current-boundary

```text
## Current Boundary

The registered `fgos-architecture-panel` skill consumes this document for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`). It starts only the registered architecture-advisory definitions and leaves routing to config/bind and execution/human gates to Workflow (`core/skills/fgos-architecture-panel/SKILL.md:17-24`). Provider/model strings in worked examples are dated examples, not a current roster or permission to dispatch.

The complete classified input, including the historical operational sections, is [preserved verbatim](../history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md#literal-snapshot). The former engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md`’s historical CoordinationSession section.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-6

```text
The registered `fgos-architecture-panel` skill consumes this document for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`). It starts only the registered architecture-advisory definitions and leaves routing to config/bind and execution/human gates to Workflow (`core/skills/fgos-architecture-panel/SKILL.md:17-24`). Provider/model strings in worked examples are dated examples, not a current roster or permission to dispatch.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-7

```text
The complete classified input, including the historical operational sections, is [preserved verbatim](../history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md#literal-snapshot). The former engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md`’s historical CoordinationSession section.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#what-these-templates-are-for

```text
## What These Templates Are For

These are reasoning aids, not forms.

A template in this document exists because there is a specific way of thinking
that the artifact is supposed to force. The Decision Request template exists so
that nobody can ask a question without first writing down what happens if it goes
unanswered. The proposal template exists so that falsification criteria get
written before critique rather than reconstructed afterwards. The Decision Packet
template exists so that dissent has a place it cannot be edited out of.

Fill them in that spirit. Every section header below is followed by *why the
section is there* and *what a bad fill looks like*, because a section filled to
satisfy the header is worse than a missing section — it looks complete and
carries nothing.

Three rules apply to every artifact here:

1. **Attribute manual evidence.** Record the actual role, source revision and
   observed run reference; do not fill executor/provider/model claims from a
   requested roster. Registered reports retain their own runtime provenance.
2. **Preserve revision trace.** Append-only manual exports can retain changed
   reasoning, but this does not define Workflow's storage or mandate a second
   ledger beside its registered run records.
3. **A section you cannot fill honestly gets "not determined" plus what would
   determine it.** Never a plausible-sounding placeholder. The gap is the
   information.

The role doctrine supplies cognitive expectations. Executable operating rules belong to the registered `fgos-architecture-panel` skill and Workflow; the coordinator companion is not a manual dispatch door.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-8

```text
These are reasoning aids, not forms.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-9

```text
A template in this document exists because there is a specific way of thinking
that the artifact is supposed to force. The Decision Request template exists so
that nobody can ask a question without first writing down what happens if it goes
unanswered. The proposal template exists so that falsification criteria get
written before critique rather than reconstructed afterwards. The Decision Packet
template exists so that dissent has a place it cannot be edited out of.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-10

```text
Fill them in that spirit. Every section header below is followed by *why the
section is there* and *what a bad fill looks like*, because a section filled to
satisfy the header is worse than a missing section — it looks complete and
carries nothing.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-11

```text
Three rules apply to every artifact here:
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-12

```text
1. **Attribute manual evidence.** Record the actual role, source revision and
   observed run reference; do not fill executor/provider/model claims from a
   requested roster. Registered reports retain their own runtime provenance.
2. **Preserve revision trace.** Append-only manual exports can retain changed
   reasoning, but this does not define Workflow's storage or mandate a second
   ledger beside its registered run records.
3. **A section you cannot fill honestly gets "not determined" plus what would
   determine it.** Never a plausible-sounding placeholder. The gap is the
   information.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-13

```text
The role doctrine supplies cognitive expectations. Executable operating rules belong to the registered `fgos-architecture-panel` skill and Workflow; the coordinator companion is not a manual dispatch door.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#standard-provenance-header

````text
## Standard Provenance Header

Optional manual provenance header; registered reports do not require this literal header or the example prompts/runs directory layout.

```text
Role: <role name>
Author: <executor id> / <provider> / <model> / <tier>
Dispatch: prompts/<role>.md -> runs/<ordinal>-<role>.json
Reads: <the exact artifacts this actor was shown>
Revision: v<n>  (supersedes v<n-1>, which stays below)
Written: <timestamp>
```

`Reads` is an explicit input claim to check against actual input/confinement
evidence. A hand-written list alone does not prove machine-enforced isolation.
Check that critique actually received the proposals it claims to examine.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-14

```text
Optional manual provenance header; registered reports do not require this literal header or the example prompts/runs directory layout.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-15

````text
```text
Role: <role name>
Author: <executor id> / <provider> / <model> / <tier>
Dispatch: prompts/<role>.md -> runs/<ordinal>-<role>.json
Reads: <the exact artifacts this actor was shown>
Revision: v<n>  (supersedes v<n-1>, which stays below)
Written: <timestamp>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-16

```text
`Reads` is an explicit input claim to check against actual input/confinement
evidence. A hand-written list alone does not prove machine-enforced isolation.
Check that critique actually received the proposals it claims to examine.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#1-intake-record-intakemd

````text
## 1. Intake Record — `intake.md`

Registered counterpart: preserve the verbatim request and use the framing
report. This optional intake file adds no roster-selection or recovery door.

**Why this exists.** It is the only artifact that predates the panel's opinion. It
is what every later interpretation is checked against, and it is the first thing a
recovering coordinator reads. If it is contaminated by interpretation, nothing
downstream can be audited.

```text
# Intake — <case slug>

Author: external driver (coordinator)
Written: <timestamp>

## The Person's Words (verbatim, never edited)

> <exactly what they said, including the vagueness, the hedges, the asides, and
> anything that seems irrelevant>

Channel: <how this arrived — typed, pasted, relayed, transcribed>

## Who Is Asking

<who they are; what authority they hold over this decision; who else must live
with it>

## Case Boundary

Project under advice: <absolute path>
Genuinely undecided: <what is actually open>
Explicitly out of bounds: <what they ruled out, in their words>
Constraints they volunteered: <verbatim where possible>

## Coordinator's Boundary Check

Is this actually undecided, or is the person seeking ratification?
<answer, with what led you to it>

## Roster Resolved At Intake

<the routing table, fixed before any advisor has an opinion>
```

**Bad fill.** Rewriting "EOD and intraday evolution is becoming difficult" as
"the user requires a maintainability improvement for their dual-pipeline
architecture". That is an interpretation with a diagnosis in it, recorded in the
one place that is supposed to be interpretation-free. Every downstream artifact
now inherits a diagnosis nobody made and nobody can trace.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-17

```text
Registered counterpart: preserve the verbatim request and use the framing
report. This optional intake file adds no roster-selection or recovery door.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-18

```text
**Why this exists.** It is the only artifact that predates the panel's opinion. It
is what every later interpretation is checked against, and it is the first thing a
recovering coordinator reads. If it is contaminated by interpretation, nothing
downstream can be audited.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-19

````text
```text
# Intake — <case slug>

Author: external driver (coordinator)
Written: <timestamp>

## The Person's Words (verbatim, never edited)

> <exactly what they said, including the vagueness, the hedges, the asides, and
> anything that seems irrelevant>

Channel: <how this arrived — typed, pasted, relayed, transcribed>

## Who Is Asking

<who they are; what authority they hold over this decision; who else must live
with it>

## Case Boundary

Project under advice: <absolute path>
Genuinely undecided: <what is actually open>
Explicitly out of bounds: <what they ruled out, in their words>
Constraints they volunteered: <verbatim where possible>

## Coordinator's Boundary Check

Is this actually undecided, or is the person seeking ratification?
<answer, with what led you to it>

## Roster Resolved At Intake

<the routing table, fixed before any advisor has an opinion>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-20

```text
**Bad fill.** Rewriting "EOD and intraday evolution is becoming difficult" as
"the user requires a maintainability improvement for their dual-pipeline
architecture". That is an interpretation with a diagnosis in it, recorded in the
one place that is supposed to be interpretation-free. Every downstream artifact
now inherits a diagnosis nobody made and nobody can trace.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#2-interpretation-interpretationmd

````text
## 2. Interpretation — `interpretation.md`

Registered counterpart: the framing report. This optional filename is not a
separate interpretation step or mandatory runtime artifact.

**Why this exists.** To make the lead advisor's reading a separate, attributable,
challengeable object rather than an invisible assumption. This is the artifact
that keeps "what they said" and "what we think they meant" apart forever.

```text
# Interpretation — <case slug>

<provenance header>

Reading of: intake.md (verbatim section)

## Intent
<what they are actually trying to achieve>
Confidence: <high | medium | low> — <what the confidence rests on>

## Altitude
<module / boundary / service / team / product bet>
Confidence: <...>

## Vocabulary To Adopt
<their terms, and the panel terms they replace>

## Constraints
Stated: <...>
Implied, and why I infer them: <...>

## Risk Appetite
<inferred, with the observation it is inferred from>
Confidence: <...>

## Decision Burden
<what makes this hard for this person specifically>

## Largest Uncertainty
<the single uncertainty that most changes what the panel should do, and which
candidate options it would separate>

## Ambiguities I Deliberately Did Not Resolve
<readings held open for evidence to collapse, and what would collapse them>
```

**Bad fill.** Uniform confidence, or no confidence at all. If every inference
reads as equally certain, downstream roles cannot tell which one to verify, and
the "largest uncertainty" section becomes arbitrary. The section that most often
gets skipped is the last one — and skipping it means an ambiguity got resolved by
choice rather than by evidence, silently.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-21

```text
Registered counterpart: the framing report. This optional filename is not a
separate interpretation step or mandatory runtime artifact.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-22

```text
**Why this exists.** To make the lead advisor's reading a separate, attributable,
challengeable object rather than an invisible assumption. This is the artifact
that keeps "what they said" and "what we think they meant" apart forever.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-23

````text
```text
# Interpretation — <case slug>

<provenance header>

Reading of: intake.md (verbatim section)

## Intent
<what they are actually trying to achieve>
Confidence: <high | medium | low> — <what the confidence rests on>

## Altitude
<module / boundary / service / team / product bet>
Confidence: <...>

## Vocabulary To Adopt
<their terms, and the panel terms they replace>

## Constraints
Stated: <...>
Implied, and why I infer them: <...>

## Risk Appetite
<inferred, with the observation it is inferred from>
Confidence: <...>

## Decision Burden
<what makes this hard for this person specifically>

## Largest Uncertainty
<the single uncertainty that most changes what the panel should do, and which
candidate options it would separate>

## Ambiguities I Deliberately Did Not Resolve
<readings held open for evidence to collapse, and what would collapse them>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-24

```text
**Bad fill.** Uniform confidence, or no confidence at all. If every inference
reads as equally certain, downstream roles cannot tell which one to verify, and
the "largest uncertainty" section becomes arbitrary. The section that most often
gets skipped is the last one — and skipping it means an ambiguity got resolved by
choice rather than by evidence, silently.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#3-scout-report-scout-reportmd

````text
## 3. Scout Report — `scout-report.md`

Registered counterpart: repository investigation in the framing report. There
is no separately scheduled scout step in the registered advisory graph.

**Why this exists.** To separate what is observed from what is believed, and to
force disconfirmation to happen before divergence rather than during critique.

```text
# Scout Report — <case slug>

<provenance header>

## Hypothesis I Was Asked To Attack
<the panel's current belief, stated plainly>

## Evidence Against That Hypothesis
<lead with this — it is the section most likely to change the session>
<each finding: the observation, the path or command, the count or magnitude>

## Evidence Supporting It
<same standard: path, count, magnitude>

## What This Means For The Framing
<whether the question's own axis survives; state it, do not recommend>

## Magnitudes And Trends
<numbers over adjectives; rate of change over current state>

## Absences
<what is missing: no tests here, no owner there, no monitoring at all. State
"I looked and it is not there" distinctly from "I did not look">

## Could Not Determine
<each item: what it is, what I tried, and what would determine it. Flag anything
that no amount of repository reading can answer — retain it as a user-exclusive gap>
```

**Bad fill.** Adjectives with no counts ("tightly coupled", "limited coverage"),
a supporting-evidence section with no disconfirmation section, or any sentence
beginning "the architecture would benefit from". The last one is out of lane and
contaminates every shaper who reads it.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-25

```text
Registered counterpart: repository investigation in the framing report. There
is no separately scheduled scout step in the registered advisory graph.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-26

```text
**Why this exists.** To separate what is observed from what is believed, and to
force disconfirmation to happen before divergence rather than during critique.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-27

````text
```text
# Scout Report — <case slug>

<provenance header>

## Hypothesis I Was Asked To Attack
<the panel's current belief, stated plainly>

## Evidence Against That Hypothesis
<lead with this — it is the section most likely to change the session>
<each finding: the observation, the path or command, the count or magnitude>

## Evidence Supporting It
<same standard: path, count, magnitude>

## What This Means For The Framing
<whether the question's own axis survives; state it, do not recommend>

## Magnitudes And Trends
<numbers over adjectives; rate of change over current state>

## Absences
<what is missing: no tests here, no owner there, no monitoring at all. State
"I looked and it is not there" distinctly from "I did not look">

## Could Not Determine
<each item: what it is, what I tried, and what would determine it. Flag anything
that no amount of repository reading can answer — retain it as a user-exclusive gap>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-28

```text
**Bad fill.** Adjectives with no counts ("tightly coupled", "limited coverage"),
a supporting-evidence section with no disconfirmation section, or any sentence
beginning "the architecture would benefit from". The last one is out of lane and
contaminates every shaper who reads it.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#4-decision-request-decision-requestmd

````text
## 4. Decision Request — `decision-request.md`

Optional manual missing-input discipline, not a registered pre-recommendation
human gate. The current close gate asks one missing-expertise question; carry
safe defaults for nonblocking gaps and do not invent an intermediate gate.

**Why this exists.** This is the one artifact the person is asked to act on
before the recommendation exists, so it is the one place premature or ceremonial
questions do real damage. The template's job is to make an unnecessary question
hard to write: you cannot fill "what we will assume if you do not answer" for a
question that does not matter.

```text
# Decision Request — <case slug>

<provenance header — lead advisor authors, driver authorizes>
Authorized by: external driver, <timestamp>
Sent once, on: <timestamp>

## Before We Ask

We investigated first. Here is what we found on our own, so you are not being
asked to be our search engine:
<two or three sentences of what the scouting established>

## Questions

### Q1 — <the question in the person's own vocabulary>

Why it matters: <which candidate options the answer eliminates. If the answer
changes nothing, delete this question>

What we could not find: <where we looked and what was not there — this is the
proof the question survived investigation>

If you do not answer, we will assume: <the panel's default, stated so plainly
that the person can simply not reply if it is fine>

### Q2 — ...

## What We Are Doing While We Wait

<the work continuing that does not depend on these answers — a pending question
must not idle the panel>

## What We Are Not Asking

<questions the panel considered and dropped, with why. This section protects the
person from a second round and shows the discipline was real>
```

**Bad fill.** A question whose "if you do not answer" line reads "we cannot
proceed" for something the panel could have defaulted; a "why it matters" that
says "to better understand your requirements" instead of naming the options it
separates; or any question that a `git log` would have answered. If the *What We
Are Not Asking* section is empty, the filter probably was not applied.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-29

```text
Optional manual missing-input discipline, not a registered pre-recommendation
human gate. The current close gate asks one missing-expertise question; carry
safe defaults for nonblocking gaps and do not invent an intermediate gate.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-30

```text
**Why this exists.** This is the one artifact the person is asked to act on
before the recommendation exists, so it is the one place premature or ceremonial
questions do real damage. The template's job is to make an unnecessary question
hard to write: you cannot fill "what we will assume if you do not answer" for a
question that does not matter.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-31

````text
```text
# Decision Request — <case slug>

<provenance header — lead advisor authors, driver authorizes>
Authorized by: external driver, <timestamp>
Sent once, on: <timestamp>

## Before We Ask

We investigated first. Here is what we found on our own, so you are not being
asked to be our search engine:
<two or three sentences of what the scouting established>

## Questions

### Q1 — <the question in the person's own vocabulary>

Why it matters: <which candidate options the answer eliminates. If the answer
changes nothing, delete this question>

What we could not find: <where we looked and what was not there — this is the
proof the question survived investigation>

If you do not answer, we will assume: <the panel's default, stated so plainly
that the person can simply not reply if it is fine>

### Q2 — ...

## What We Are Doing While We Wait

<the work continuing that does not depend on these answers — a pending question
must not idle the panel>

## What We Are Not Asking

<questions the panel considered and dropped, with why. This section protects the
person from a second round and shows the discipline was real>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-32

```text
**Bad fill.** A question whose "if you do not answer" line reads "we cannot
proceed" for something the panel could have defaulted; a "why it matters" that
says "to better understand your requirements" instead of naming the options it
separates; or any question that a `git log` would have answered. If the *What We
Are Not Asking* section is empty, the filter probably was not applied.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#5-candidate-architecture-proposal-proposalsmd

````text
## 5. Candidate Architecture Proposal — `proposals/<role>.md`

Registered counterpart: blind system/alternative/constraint shaping reports.
Falsification criteria are quality guidance, not required fields in the current
shaping template; a claimed timestamp must be backed by an actual observation.

**Why this exists.** To make a proposal into a hypothesis instead of a pitch. The
falsification section is the load-bearing part of this template and it must be
written before any critique is visible — its timestamp is checkable evidence that
the debate was honest.

```text
# Proposal — <case slug> (<role>)

<provenance header — Reads must list the frame and evidence only, no siblings>

## Priors I Am Applying
<especially for the alternative shaper and constraint advocate: what you are
weighting and why, grounded in something observed>

## The Proposal
<what to do, concretely, in this system, referencing real paths>

## Why This Follows From The Evidence
<each claim tied to a scout observation; where the chain is inference, say so>

## Load-Bearing Constraint
<the one thing that, if it changed, would change this whole proposal>

## What This Makes Harder
<every architecture trades something. Name the cost precisely, including who
feels it and how often>

## The Half-Adopted State
<what this looks like when it is 40% done, because that is where it will live
for months>

## First Reversible Step
<what could be done in about a week that validates or kills this cheaply>

## Resting On Evidence vs Resting On Assumption
Evidence: <claims backed by a cited observation>
Assumption: <claims that are not, named plainly so critics can target them>

## Falsification Criteria — written before critique
1. <a condition that could actually occur and would make this wrong>
2. ...
```

**Bad fill.** A benefits list with no cost section. A proposal that would read
identically for a different codebase (the give-away is no paths). Falsification
criteria that cannot occur ("this is wrong if the requirements were entirely
different"). And for the alternative shaper specifically: any proposal written
*relative to* another proposal ("as an alternative to X") — that phrasing is
proof the isolation failed or was imagined.
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-33

```text
Registered counterpart: blind system/alternative/constraint shaping reports.
Falsification criteria are quality guidance, not required fields in the current
shaping template; a claimed timestamp must be backed by an actual observation.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-34

```text
**Why this exists.** To make a proposal into a hypothesis instead of a pitch. The
falsification section is the load-bearing part of this template and it must be
written before any critique is visible — its timestamp is checkable evidence that
the debate was honest.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-35

````text
```text
# Proposal — <case slug> (<role>)

<provenance header — Reads must list the frame and evidence only, no siblings>

## Priors I Am Applying
<especially for the alternative shaper and constraint advocate: what you are
weighting and why, grounded in something observed>

## The Proposal
<what to do, concretely, in this system, referencing real paths>

## Why This Follows From The Evidence
<each claim tied to a scout observation; where the chain is inference, say so>

## Load-Bearing Constraint
<the one thing that, if it changed, would change this whole proposal>

## What This Makes Harder
<every architecture trades something. Name the cost precisely, including who
feels it and how often>

## The Half-Adopted State
<what this looks like when it is 40% done, because that is where it will live
for months>

## First Reversible Step
<what could be done in about a week that validates or kills this cheaply>

## Resting On Evidence vs Resting On Assumption
Evidence: <claims backed by a cited observation>
Assumption: <claims that are not, named plainly so critics can target them>

## Falsification Criteria — written before critique
1. <a condition that could actually occur and would make this wrong>
2. ...
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-36

```text
**Bad fill.** A benefits list with no cost section. A proposal that would read
identically for a different codebase (the give-away is no paths). Falsification
criteria that cannot occur ("this is wrong if the requirements were entirely
different"). And for the alternative shaper specifically: any proposal written
*relative to* another proposal ("as an alternative to X") — that phrasing is
proof the isolation failed or was imagined.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#no-build-path-cognitive-quality-sub-shape

````text
### No-Build Path — cognitive quality sub-shape

The no-build path is a candidate, not a placeholder. It gets the same treatment:

```text
## No-Build Path
Current cost of doing nothing: <observed rate × observed cost, with the source>
Trend: <is the cost rising, and how fast>
What breaks first, and how it is noticed: <or: it is not noticed, which is a
finding in itself>
Trigger to revisit: <a condition someone will actually observe>
```

**Bad fill.** "Alternatively, we could do nothing." A no-build path without a
rate, a consequence, and an observable trigger has not been offered — and it is
the option most likely to be correct.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-37

```text
The no-build path is a candidate, not a placeholder. It gets the same treatment:
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-38

````text
```text
## No-Build Path
Current cost of doing nothing: <observed rate × observed cost, with the source>
Trend: <is the cost rising, and how fast>
What breaks first, and how it is noticed: <or: it is not noticed, which is a
finding in itself>
Trigger to revisit: <a condition someone will actually observe>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-39

```text
**Bad fill.** "Alternatively, we could do nothing." A no-build path without a
rate, a consequence, and an observable trigger has not been offered — and it is
the option most likely to be correct.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#6-critique-attack-record-critiquesmd

````text
## 6. Critique / Attack Record — `critiques/<role>.md`

Registered counterpart: reviewed critique. Findings remain attributed; this
manual record does not automatically reopen shaping or authorize a new run.

**Why this exists.** To turn criticism into something settleable. Every attack
carries the observation that would resolve it, so the panel can distinguish "we
argued" from "we found out".

```text
# Critique — <case slug> (<role>)

<provenance header — Reads must list every proposal, and no shaper's private notes>

## Attack <n> — on <target proposal>: <the specific claim being attacked>

Decision-changing if it lands: <yes | no> — <what flips>

The claim: <quote or cite it precisely>
Why it may be false: <the mechanism, not a vibe>
What would settle it: <a specific, bounded observation, with an effort estimate
where you can give one>

## Attacks That Failed

<attack attempted, what you checked, why it held. Reporting these is how the
packet distinguishes tested claims from untested ones>

## Contradictions Between Proposals

<where two proposals assert incompatible things about the same system — at least
one is wrong and evidence can usually say which>

## Shared Unexamined Assumption

<anything every proposal assumes without checking. You are the only role
positioned to see this>
```

**Bad fill.** Symmetric one-paragraph criticism of each proposal (conveys no
signal about which is weakest); unfalsifiable attacks ("may not scale"); attacks
on solution classes in general rather than on this system; and an empty
"attacks that failed" section, which usually means the critic attacked only what
was easy.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-40

```text
Registered counterpart: reviewed critique. Findings remain attributed; this
manual record does not automatically reopen shaping or authorize a new run.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-41

```text
**Why this exists.** To turn criticism into something settleable. Every attack
carries the observation that would resolve it, so the panel can distinguish "we
argued" from "we found out".
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-42

````text
```text
# Critique — <case slug> (<role>)

<provenance header — Reads must list every proposal, and no shaper's private notes>

## Attack <n> — on <target proposal>: <the specific claim being attacked>

Decision-changing if it lands: <yes | no> — <what flips>

The claim: <quote or cite it precisely>
Why it may be false: <the mechanism, not a vibe>
What would settle it: <a specific, bounded observation, with an effort estimate
where you can give one>

## Attacks That Failed

<attack attempted, what you checked, why it held. Reporting these is how the
packet distinguishes tested claims from untested ones>

## Contradictions Between Proposals

<where two proposals assert incompatible things about the same system — at least
one is wrong and evidence can usually say which>

## Shared Unexamined Assumption

<anything every proposal assumes without checking. You are the only role
positioned to see this>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-43

```text
**Bad fill.** Symmetric one-paragraph criticism of each proposal (conveys no
signal about which is weakest); unfalsifiable attacks ("may not scale"); attacks
on solution classes in general rather than on this system; and an empty
"attacks that failed" section, which usually means the critic attacked only what
was easy.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#7-constraint-findings-optional-manual-constraintcritique-shape

````text
## 7. Constraint Findings — optional manual constraint/critique shape

Registered counterparts: constraint-lens shaping and reviewed critique reports,
not a separate numbered runtime phase or mandatory file.

**Why this exists.** To force ranking and reversibility judgment, which is the
entire value of this role. A flat risk list is indistinguishable from noise.

```text
## Constraint Findings — ranked

### 1. <proposal> — <the concern> (<HIGH | MEDIUM | LOW>, <reversible | IRREVERSIBLE>)

The mechanism: <what actually goes wrong, with the path>
Magnitude: <how long the exposure lasts, how many people, how it is noticed>
Cheapest mitigation: <the smallest thing that makes this survivable>

### 2. ...

## Concerns I Considered And Did Not Raise
<security, scale, supply chain — say explicitly when a candidate does not touch
them. This is more useful than listing them for completeness>
```

**Bad fill.** The generic five (security, scalability, maintainability,
operations, migration) recited without reference to any proposal or path.
Symmetric findings across candidates. No reversibility marking — which is the one
judgment nobody else in the panel is making.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-44

```text
Registered counterparts: constraint-lens shaping and reviewed critique reports,
not a separate numbered runtime phase or mandatory file.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-45

```text
**Why this exists.** To force ranking and reversibility judgment, which is the
entire value of this role. A flat risk list is indistinguishable from noise.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-46

````text
```text
## Constraint Findings — ranked

### 1. <proposal> — <the concern> (<HIGH | MEDIUM | LOW>, <reversible | IRREVERSIBLE>)

The mechanism: <what actually goes wrong, with the path>
Magnitude: <how long the exposure lasts, how many people, how it is noticed>
Cheapest mitigation: <the smallest thing that makes this survivable>

### 2. ...

## Concerns I Considered And Did Not Raise
<security, scale, supply chain — say explicitly when a candidate does not touch
them. This is more useful than listing them for completeness>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-47

```text
**Bad fill.** The generic five (security, scalability, maintainability,
operations, migration) recited without reference to any proposal or path.
Symmetric findings across candidates. No reversibility marking — which is the one
judgment nobody else in the panel is making.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#8-decision-packet-synthesismd

````text
## 8. Decision Packet — `synthesis.md`

Registered counterpart: the final RAW JSON synthesis packet. This Markdown
shape is an optional manual reading aid, not a substitute for the required
packet fields. Per-claim confidence is optional; `"missing expertise"` is a
required array in the registered packet.

**Why this exists.** This is what the person receives. It has to be decisive
enough to be useful and honest enough to be trustworthy, and those pull against
each other. The template resolves the tension by separating the recommendation
from the confidence from the dissent, so decisiveness never requires hiding
anything.

```text
# Decision Packet — <case slug>

<provenance header — Reads must list the full ledger>

## Recommendation

<one thing. If the evidence genuinely cannot separate two candidates, say that
decisively and name the one observation that would separate them — that is a
recommendation, not a hedge>

## Why This, Over The Others

<what you are choosing against, and what it costs to choose against it>

## Conditional Branches
<if the recommendation depends on an open check, give the person the branches now
so they are not left waiting on the panel>

## True Regardless Of The Outcome
<findings that stand independent of which candidate wins. These are often the
most immediately useful part of the packet>

## Confidence, Per Claim

- <claim>: <high | medium | low | unverified> — <what it rests on>
- ...

<never a single document-level confidence — a diagnosis, a cost estimate, and a
prediction about people do not deserve the same number>

## Surviving Dissent

<who holds it, what they hold, what would settle it, and the explicit statement
of whether it was refuted. Attributed by role, never anonymous — the person needs
to be able to weigh the source>

## Values Choices Evidence Cannot Settle

<where the disagreement is about what the person wants rather than what is true.
Naming these prevents the panel from pretending a preference is a finding>

## Unchecked Falsification Criteria

<criteria the shapers stated that nobody verified, recorded as open rather than
quietly treated as satisfied>

## Provenance And Gaps

<per actor: executor/provider/model/tier, which proposal revision each critique
applies to, and any actor that failed or was never dispatched>
```

**Bad fill.** A recommendation that merges the proposals into a fourth
architecture no advisor proposed and no critic attacked — this is synthesis
becoming silent authorship and it is the most dangerous single failure in the
packet. A single "Confidence: high". Dissent demoted to "minor considerations for
the future". "The panel is aligned" where there was an unrefuted disagreement.
Missing provenance.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-48

```text
Registered counterpart: the final RAW JSON synthesis packet. This Markdown
shape is an optional manual reading aid, not a substitute for the required
packet fields. Per-claim confidence is optional; `"missing expertise"` is a
required array in the registered packet.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-49

```text
**Why this exists.** This is what the person receives. It has to be decisive
enough to be useful and honest enough to be trustworthy, and those pull against
each other. The template resolves the tension by separating the recommendation
from the confidence from the dissent, so decisiveness never requires hiding
anything.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-50

````text
```text
# Decision Packet — <case slug>

<provenance header — Reads must list the full ledger>

## Recommendation

<one thing. If the evidence genuinely cannot separate two candidates, say that
decisively and name the one observation that would separate them — that is a
recommendation, not a hedge>

## Why This, Over The Others

<what you are choosing against, and what it costs to choose against it>

## Conditional Branches
<if the recommendation depends on an open check, give the person the branches now
so they are not left waiting on the panel>

## True Regardless Of The Outcome
<findings that stand independent of which candidate wins. These are often the
most immediately useful part of the packet>

## Confidence, Per Claim

- <claim>: <high | medium | low | unverified> — <what it rests on>
- ...

<never a single document-level confidence — a diagnosis, a cost estimate, and a
prediction about people do not deserve the same number>

## Surviving Dissent

<who holds it, what they hold, what would settle it, and the explicit statement
of whether it was refuted. Attributed by role, never anonymous — the person needs
to be able to weigh the source>

## Values Choices Evidence Cannot Settle

<where the disagreement is about what the person wants rather than what is true.
Naming these prevents the panel from pretending a preference is a finding>

## Unchecked Falsification Criteria

<criteria the shapers stated that nobody verified, recorded as open rather than
quietly treated as satisfied>

## Provenance And Gaps

<per actor: executor/provider/model/tier, which proposal revision each critique
applies to, and any actor that failed or was never dispatched>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-51

```text
**Bad fill.** A recommendation that merges the proposals into a fourth
architecture no advisor proposed and no critic attacked — this is synthesis
becoming silent authorship and it is the most dangerous single failure in the
packet. A single "Confidence: high". Dissent demoted to "minor considerations for
the future". "The panel is aligned" where there was an unrefuted disagreement.
Missing provenance.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#9-human-facing-explanation-explanationmd

````text
## 9. Human-Facing Explanation — `explanation.md`

**Why this exists.** Explanation is a distinct registered report preserving
the final packet's verdict, expertise list and dissent. The optional manual
`explanation.md` below is a human-facing reading aid, not a required separate
filesystem export or the output of a retired Phase 8 graph.
The explanation supports ownership: the person should be able to defend the
recommendation's consequences and evidence to a colleague, without changing
the packet's verdict or laundering its unresolved dissent.

```text
# Explanation — <case slug>

<provenance header — lead advisor; Reads: synthesis.md, intake.md, and every
human/ turn. Never a shaper's private notes>

Revision: v<n> — <if v2+, what dialogue turn prompted it. Append below the
previous revision; never overwrite one>

## What We Think You Should Do

<the recommendation, in their vocabulary and at their altitude. If they said
"job" and "EOD", this section says "job" and "EOD">

## What This Means For Your System, Concretely

<name real paths and real behaviors. "You will be able to change the intraday
path without re-testing EOD" — not "this improves modularity">

## What Gets Easier

<...>

## What Gets Harder

<every architecture trades something, and the person needs to have been told
what before they commit, not after. Name who feels it and how often>

## The First Reversible Step

<what to do this week that validates or kills this cheaply, and what it costs>

## When You Should Reverse This

<the observed condition — a number, a rate, an event they will actually see —
that means this was the wrong call. "If cross-pipeline breakages exceed 3 a
month after the change, this did not work">

## What We Are Not Sure About

<the panel's live uncertainty, in plain terms, including any dissent that
survived into the packet, attributed. Do not smooth it>

## What Stays Yours

<explicitly: the judgment the panel cannot make for them, and why it is theirs.
Usually a values or appetite call — how much disruption is acceptable, how much
optionality is worth paying for. Name it as a decision, not as a caveat>
```

**Bad fill.** Restating `synthesis.md` with the provenance stripped out — that is
a shorter packet, not an explanation, and the tell is that it still uses the
panel's vocabulary rather than the person's. A "what gets harder" section that
lists only mild costs while the constraint advocate's HIGH finding stays in the
packet. Surviving dissent softened to "some considerations", which is the same
laundering the packet forbids, committed one document later where nobody is
checking. And an explanation with no "what stays yours" section, or one that
reads as a disclaimer ("of course, the final decision is yours") rather than
naming the specific judgment — that sentence is the difference between a person
owning a decision and a person complying with one.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-52

```text
**Why this exists.** Explanation is a distinct registered report preserving
the final packet's verdict, expertise list and dissent. The optional manual
`explanation.md` below is a human-facing reading aid, not a required separate
filesystem export or the output of a retired Phase 8 graph.
The explanation supports ownership: the person should be able to defend the
recommendation's consequences and evidence to a colleague, without changing
the packet's verdict or laundering its unresolved dissent.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-53

````text
```text
# Explanation — <case slug>

<provenance header — lead advisor; Reads: synthesis.md, intake.md, and every
human/ turn. Never a shaper's private notes>

Revision: v<n> — <if v2+, what dialogue turn prompted it. Append below the
previous revision; never overwrite one>

## What We Think You Should Do

<the recommendation, in their vocabulary and at their altitude. If they said
"job" and "EOD", this section says "job" and "EOD">

## What This Means For Your System, Concretely

<name real paths and real behaviors. "You will be able to change the intraday
path without re-testing EOD" — not "this improves modularity">

## What Gets Easier

<...>

## What Gets Harder

<every architecture trades something, and the person needs to have been told
what before they commit, not after. Name who feels it and how often>

## The First Reversible Step

<what to do this week that validates or kills this cheaply, and what it costs>

## When You Should Reverse This

<the observed condition — a number, a rate, an event they will actually see —
that means this was the wrong call. "If cross-pipeline breakages exceed 3 a
month after the change, this did not work">

## What We Are Not Sure About

<the panel's live uncertainty, in plain terms, including any dissent that
survived into the packet, attributed. Do not smooth it>

## What Stays Yours

<explicitly: the judgment the panel cannot make for them, and why it is theirs.
Usually a values or appetite call — how much disruption is acceptable, how much
optionality is worth paying for. Name it as a decision, not as a caveat>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-54

```text
**Bad fill.** Restating `synthesis.md` with the provenance stripped out — that is
a shorter packet, not an explanation, and the tell is that it still uses the
panel's vocabulary rather than the person's. A "what gets harder" section that
lists only mild costs while the constraint advocate's HIGH finding stays in the
packet. Surviving dissent softened to "some considerations", which is the same
laundering the packet forbids, committed one document later where nobody is
checking. And an explanation with no "what stays yours" section, or one that
reads as a disclaimer ("of course, the final decision is yours") rather than
naming the specific judgment — that sentence is the difference between a person
owning a decision and a person complying with one.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#10-dialogue-turn-human-personmd

````text
## 10. Dialogue Turn — `human/<n>-person.md`

Registered counterpart: the actual human close answer. This optional transcript
file cannot replace the public Workflow answer or fabricate approval.

**Why this exists.** The person's words are evidence with the highest authority
in the session. They are stored alone, unedited, so that no later artifact can be
mistaken for them.

```text
# Dialogue Turn <n> — the person

Received: <timestamp>
Channel: <typed | pasted | relayed | transcribed>
Recorded by: external driver

## Verbatim

> <exactly what they said>

## Nothing Else Goes In This File
```

That last line is part of the template. No interpretation, no summary, no
paraphrase, no "the user is asking about…". Those go in the impact assessment.

**Absolutely forbidden.** Writing this file when no person has spoken. Not as a
placeholder, not as a best guess, not clearly labelled as simulated. If no person
is available, the session parks. A fabricated human turn invalidates the session
even if the guess was correct.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-55

```text
Registered counterpart: the actual human close answer. This optional transcript
file cannot replace the public Workflow answer or fabricate approval.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-56

```text
**Why this exists.** The person's words are evidence with the highest authority
in the session. They are stored alone, unedited, so that no later artifact can be
mistaken for them.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-57

````text
```text
# Dialogue Turn <n> — the person

Received: <timestamp>
Channel: <typed | pasted | relayed | transcribed>
Recorded by: external driver

## Verbatim

> <exactly what they said>

## Nothing Else Goes In This File
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-58

```text
That last line is part of the template. No interpretation, no summary, no
paraphrase, no "the user is asking about…". Those go in the impact assessment.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-59

```text
**Absolutely forbidden.** Writing this file when no person has spoken. Not as a
placeholder, not as a best guess, not clearly labelled as simulated. If no person
is available, the session parks. A fabricated human turn invalidates the session
even if the guess was correct.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#11-dialogue-impact-assessment-dialogue-impactmd

````text
## 11. Dialogue Impact Assessment — `dialogue/<n>-impact.md`

Optional manual interpretation of a turn; not a conditional graph node.
Material revisit uses the separately authorized registered reopen Workflow.

**Why this exists.** A dialogue turn is not self-interpreting. This artifact is
where the lead advisor says what it thinks the turn means, what it changes, and
what it does *not* change — separately from the person's words, separately from
the driver's authorization to act, and separately from the panel's eventual
response. It is the hinge of the four-layer separation, and it is the artifact
that makes "the panel answered what was actually asked" checkable months later.

```text
# Dialogue Impact Assessment <n>

<provenance header — lead advisor; Reads: human/<n>-person.md>

## Turn Classification

<clarification | challenge | new context | alternative requested |
composition requested | decision | deferral>

Why I classify it this way: <the words that led you here — classification drives
whether anything reopens, so it must be defensible>

## What They Said, In My Reading

<interpretation, explicitly labelled, with uncertainty. Never quoted back as if
it were their words>

## What This Changes

Conclusions affected: <name them, and say how>
Conclusions NOT affected: <equally important — this is what stops a single
comment from spuriously reopening the whole session>

## What Reopens, If Anything

Affected registered report: <framing | shaping | critique | synthesis | explanation; no automatic jump>
Scope of the reopen: <bounded, specific, predeclared>
Why nothing smaller would do: <a reopen is expensive; justify it>

## Consumes A Reopen Cycle?

<clarification never does; material change does. State which and why>

## What I Would Need From The Person To Go Further

<or: nothing — we have what we need>
```

**Bad fill.** Classifying a challenge as a clarification to avoid reopening — the
tell is a "what this changes" section reading "nothing" for a turn where the
person disputed a claim. Also: an assessment that quietly folds the
interpretation into the person's voice, and a reopen with unbounded scope
("revisit the design"), which is how a bounded dialogue becomes an unbounded one.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-60

```text
Optional manual interpretation of a turn; not a conditional graph node.
Material revisit uses the separately authorized registered reopen Workflow.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-61

```text
**Why this exists.** A dialogue turn is not self-interpreting. This artifact is
where the lead advisor says what it thinks the turn means, what it changes, and
what it does *not* change — separately from the person's words, separately from
the driver's authorization to act, and separately from the panel's eventual
response. It is the hinge of the four-layer separation, and it is the artifact
that makes "the panel answered what was actually asked" checkable months later.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-62

````text
```text
# Dialogue Impact Assessment <n>

<provenance header — lead advisor; Reads: human/<n>-person.md>

## Turn Classification

<clarification | challenge | new context | alternative requested |
composition requested | decision | deferral>

Why I classify it this way: <the words that led you here — classification drives
whether anything reopens, so it must be defensible>

## What They Said, In My Reading

<interpretation, explicitly labelled, with uncertainty. Never quoted back as if
it were their words>

## What This Changes

Conclusions affected: <name them, and say how>
Conclusions NOT affected: <equally important — this is what stops a single
comment from spuriously reopening the whole session>

## What Reopens, If Anything

Affected registered report: <framing | shaping | critique | synthesis | explanation; no automatic jump>
Scope of the reopen: <bounded, specific, predeclared>
Why nothing smaller would do: <a reopen is expensive; justify it>

## Consumes A Reopen Cycle?

<clarification never does; material change does. State which and why>

## What I Would Need From The Person To Go Further

<or: nothing — we have what we need>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-63

```text
**Bad fill.** Classifying a challenge as a clarification to avoid reopening — the
tell is a "what this changes" section reading "nothing" for a turn where the
person disputed a claim. Also: an assessment that quietly folds the
interpretation into the person's voice, and a reopen with unbounded scope
("revisit the design"), which is how a bounded dialogue becomes an unbounded one.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-64

```text
Optional manual response trace. Registered gates/continuation remain with
Workflow; no companion-directory crash-recovery guarantee is asserted.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-65

```text
**Why this exists.** An optional manual response trace can help a successor
understand whether a person was answered and which artifact supports the reply.
It is not the retired Dialogue Turn Protocol's fourth runtime layer, and the
registered Workflow does not guarantee crash recovery of these companion files.
The registered graph remains framing, shaping, critique, synthesis, explanation
and the human close gate (`core/workflows/architecture-advisory.yaml:8-84`).
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-66

```text
It is also the layer where authority leaks. The response is produced under the
driver's authorization, and naming that authorization here is what makes it
checkable later that the panel did what it was permitted to do and not more.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-67

```text
When the owner chooses this manual convention, even a short cited response is
useful. A missing companion file is not a current Workflow completion failure.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-68

````text
```text
# Dialogue Response <n>

<provenance header — the role that authored the response. For a clarification
this is normally the lead advisor; for a reopen it is whichever advisors ran>

Responds to: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized by: dispositions.md § <D-id> — <the authorization in one line>

## What The Panel Says Back

<the actual response, in the person's vocabulary. If it defends a claim, it
cites the artifact the claim rests on; if it concedes, it says so plainly>

## What Ran To Produce This

<none — answered from existing artifacts | the actors dispatched, with their
run records. "None" is a legitimate and common answer for a clarification>

## What Changed As A Result

Artifacts revised: <path and revision, or: none>
Recommendation: <unchanged | changed, and how>

## What Did Not Change, And Why

<the conclusions this turn left standing. Stating these is what stops one
comment from being remembered later as having overturned more than it did>

## Still Open After This Turn

<or: nothing — the turn is closed>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-69

```text
**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. Under the chosen manual convention, an undocumented reply
loses traceability; this rubric concern is not a registered runtime acceptance gate.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#13-disposition-entry-dispositionsmd-append-only

````text
## 13. Disposition Entry — `dispositions.md` (append-only)

Registered counterpart: disposition content in the final RAW JSON packet,
challenged by its reviewer/red-team. This manual append-only ledger is optional
and grants no independent driver authorization or human decision authority.

**Why this exists.** Disposition is an authority act. Recording it with its
evidence is what makes the authority auditable, and what lets a red-team catch a
driver deciding a technical question it was never shown evidence for.

```text
## <D-id> — <the finding, in one line>

Source: <role, artifact path>
Disposition: <accepted | answered | mitigated | deferred | unresolved |
invalidated-by-evidence>
Rationale: <why>
Evidence: <path or run result — REQUIRED for answered and
invalidated-by-evidence; the advisor who observed it, named>
Changes: <what actually changes as a result — required for accepted>
Residual: <required for mitigated: what risk remains after the mitigation>
Supersedes: <prior D-id, if this is a changed mind>
```

**Bad fill.** `invalidated-by-evidence` with a rationale beginning "probably" and
an empty Evidence line — that is the driver deciding a technical claim on its own
authority, which the doctrine forbids. `mitigated` with a mitigation the driver
wrote itself and no residual. `answered` with no citation. And any disposition of
a finding about the driver's own conduct — those escalate, they never
self-clear.
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-70

```text
Registered counterpart: disposition content in the final RAW JSON packet,
challenged by its reviewer/red-team. This manual append-only ledger is optional
and grants no independent driver authorization or human decision authority.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-71

```text
**Why this exists.** Disposition is an authority act. Recording it with its
evidence is what makes the authority auditable, and what lets a red-team catch a
driver deciding a technical question it was never shown evidence for.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-72

````text
```text
## <D-id> — <the finding, in one line>

Source: <role, artifact path>
Disposition: <accepted | answered | mitigated | deferred | unresolved |
invalidated-by-evidence>
Rationale: <why>
Evidence: <path or run result — REQUIRED for answered and
invalidated-by-evidence; the advisor who observed it, named>
Changes: <what actually changes as a result — required for accepted>
Residual: <required for mitigated: what risk remains after the mitigation>
Supersedes: <prior D-id, if this is a changed mind>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-73

```text
**Bad fill.** `invalidated-by-evidence` with a rationale beginning "probably" and
an empty Evidence line — that is the driver deciding a technical claim on its own
authority, which the doctrine forbids. `mitigated` with a mitigation the driver
wrote itself and no residual. `answered` with no citation. And any disposition of
a finding about the driver's own conduct — those escalate, they never
self-clear.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#dialogue-authorization-sub-shape-in-the-same-file

````text
### Dialogue Authorization — sub-shape in the same file

A dialogue turn's authorization is recorded here too, under its own id, because
it is the same kind of act: the driver saying what the panel may do. It is not a
disposition of a finding, so it takes a shorter shape:

```text
## <D-id> — authorization for dialogue turn <n>

Turn: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized: <what the panel may do — which phase reopens, which actors run, what
the response may cover>
NOT authorized: <the adjacent thing the panel may not do on this turn. Naming it
is what makes an overreach detectable>
Reopen consumed: <yes | no>
Response: dialogue/<n>-response.md
```

**Bad fill.** An authorization phrased as an opinion about the architecture
("authorized: option B does look stronger, revisit it") — the authorization
grants permission and says nothing about which option is right, and a driver
that editorializes here is one step from its authorization being read later as
the person's decision. An empty `NOT authorized` line for a reopen, which turns
a bounded reopen into an unbounded one.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-74

```text
A dialogue turn's authorization is recorded here too, under its own id, because
it is the same kind of act: the driver saying what the panel may do. It is not a
disposition of a finding, so it takes a shorter shape:
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-75

````text
```text
## <D-id> — authorization for dialogue turn <n>

Turn: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized: <what the panel may do — which phase reopens, which actors run, what
the response may cover>
NOT authorized: <the adjacent thing the panel may not do on this turn. Naming it
is what makes an overreach detectable>
Reopen consumed: <yes | no>
Response: dialogue/<n>-response.md
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-76

```text
**Bad fill.** An authorization phrased as an opinion about the architecture
("authorized: option B does look stronger, revisit it") — the authorization
grants permission and says nothing about which option is right, and a driver
that editorializes here is one step from its authorization being read later as
the person's decision. An empty `NOT authorized` line for a reopen, which turns
a bounded reopen into an unbounded one.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#14-session-status-board-sessionmd

````text
## 14. Session Status Board — `session.md`

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

**Why this exists.** This is the crash-recovery entry point. A fresh coordinator
with no chat history reads this file first and must be oriented by it alone.

```text
# Session — <case slug>

Phase: <1-9>, <phase name>
Status: <in-progress | awaiting-person | parked | closed>
Next action: <one imperative sentence — "dispatch alternative shaper against
frame v2 using agy-bwrap/analytical">
Last updated: <timestamp>

## Case

<one line, in the person's words>
Project under advice: <path>

## Roster

| Role | Executor | Tier | Derived model | Prompt | Run |
|---|---|---|---|---|---|
| ... | ... | ... | ... | prompts/... | runs/... |

## Phase Ledger

| Phase | Status | Artifact |
|---|---|---|
| 1 Intake | done | intake.md |
| ... | | |

## Open Threads

<anything awaiting a person, an actor, or an observation>

## Recovery Note

<anything a successor genuinely could not infer from the artifacts>
```

**Bad fill.** A "Next action" like "continue the session" — that is the one field
a successor depends on, and a vague fill makes the whole recovery procedure fail.
A roster table with requested executors but no derived models. A phase ledger
that says "in progress" for three phases at once.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-77

```text
**Optional manual-harness example only; not registered Workflow storage or completion instructions.**
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-78

```text
**Why this exists.** This is the crash-recovery entry point. A fresh coordinator
with no chat history reads this file first and must be oriented by it alone.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-79

````text
```text
# Session — <case slug>

Phase: <1-9>, <phase name>
Status: <in-progress | awaiting-person | parked | closed>
Next action: <one imperative sentence — "dispatch alternative shaper against
frame v2 using agy-bwrap/analytical">
Last updated: <timestamp>

## Case

<one line, in the person's words>
Project under advice: <path>

## Roster

| Role | Executor | Tier | Derived model | Prompt | Run |
|---|---|---|---|---|---|
| ... | ... | ... | ... | prompts/... | runs/... |

## Phase Ledger

| Phase | Status | Artifact |
|---|---|---|
| 1 Intake | done | intake.md |
| ... | | |

## Open Threads

<anything awaiting a person, an actor, or an observation>

## Recovery Note

<anything a successor genuinely could not infer from the artifacts>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-80

```text
**Bad fill.** A "Next action" like "continue the session" — that is the one field
a successor depends on, and a vague fill makes the whole recovery procedure fail.
A roster table with requested executors but no derived models. A phase ledger
that says "in progress" for three phases at once.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#15-prompt-package-promptsmd

````text
## 15. Prompt Package — `prompts/<role>.md`

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

**Why this exists.** The prompt is the isolation. In manual mode, "the shapers
could not see each other" means precisely "these files contained no sibling
output", so the files are the evidence and they are immutable once dispatched.

```text
# Prompt — <role>, <case slug>

Ordinal: <n>
Executor: <id> / tier <tier>
Immutable: yes — if this prompt was wrong, dispatch a new ordinal

## Your Role

<point at the role doctrine by path; do not paste it>
Read: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md,
section <role>

## The Case

<the frame, as settled — identical across a cohort of isolated actors>

## Evidence You May Read

<paths only. Never paste documents into a prompt>

## What You Must Not Read

<for isolated cohorts: name the sibling artifacts explicitly, so a breach is
detectable rather than deniable>

## What You Produce

<artifact path, and the template section of this document that shapes it>

## Finish With

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
plus a two-line summary.
```

**Bad fill.** Pasting the scout report inline instead of passing the path (bloats
context and makes revisions untraceable). Omitting the "must not read" section for
an isolated cohort. Editing a prompt after dispatch — which destroys the only
evidence that isolation held.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-81

```text
**Optional manual-harness example only; not registered Workflow storage or completion instructions.**
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-82

```text
**Why this exists.** The prompt is the isolation. In manual mode, "the shapers
could not see each other" means precisely "these files contained no sibling
output", so the files are the evidence and they are immutable once dispatched.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-83

````text
```text
# Prompt — <role>, <case slug>

Ordinal: <n>
Executor: <id> / tier <tier>
Immutable: yes — if this prompt was wrong, dispatch a new ordinal

## Your Role

<point at the role doctrine by path; do not paste it>
Read: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md,
section <role>

## The Case

<the frame, as settled — identical across a cohort of isolated actors>

## Evidence You May Read

<paths only. Never paste documents into a prompt>

## What You Must Not Read

<for isolated cohorts: name the sibling artifacts explicitly, so a breach is
detectable rather than deniable>

## What You Produce

<artifact path, and the template section of this document that shapes it>

## Finish With

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
plus a two-line summary.
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-84

```text
**Bad fill.** Pasting the scout report inline instead of passing the path (bloats
context and makes revisions untraceable). Omitting the "must not read" section for
an isolated cohort. Editing a prompt after dispatch — which destroys the only
evidence that isolation held.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#16-run-record-runs-json

````text
## 16. Run Record — `runs/<ordinal>-<role>.json`

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

**Why this exists.** Provenance the packet's claims are checked against. The
red-team opens these files; a roster claim with no matching run record is an
overclaim.

```json
{
  "ordinal": 3,
  "role": "alternative-shaper",
  "requested": { "executor": "agy-bwrap", "tier": "analytical", "persona": "..." },
  "decision": { "mechanism": "out-of-process", "configured": true },
  "derived": { "provider": "gemini", "model": "gemini-3.1-pro-low" },
  "tierMaterial": true,
  "promptPath": "prompts/alternative-shaper.md",
  "artifactPath": "proposals/alternative-shaper.md",
  "startedAt": "...",
  "completedAt": "...",
  "status": "DONE",
  "notes": "..."
}
```

`tierMaterial` records whether the actual derived model changed materially for the requested tier. Determine it from the current governed routing result; dated provider examples do not prove today’s tier behaviour.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-85

```text
**Optional manual-harness example only; not registered Workflow storage or completion instructions.**
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-86

```text
**Why this exists.** Provenance the packet's claims are checked against. The
red-team opens these files; a roster claim with no matching run record is an
overclaim.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-87

````text
```json
{
  "ordinal": 3,
  "role": "alternative-shaper",
  "requested": { "executor": "agy-bwrap", "tier": "analytical", "persona": "..." },
  "decision": { "mechanism": "out-of-process", "configured": true },
  "derived": { "provider": "gemini", "model": "gemini-3.1-pro-low" },
  "tierMaterial": true,
  "promptPath": "prompts/alternative-shaper.md",
  "artifactPath": "proposals/alternative-shaper.md",
  "startedAt": "...",
  "completedAt": "...",
  "status": "DONE",
  "notes": "..."
}
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-88

```text
`tierMaterial` records whether the actual derived model changed materially for the requested tier. Determine it from the current governed routing result; dated provider examples do not prove today’s tier behaviour.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#17-red-team-report-redteammd

````text
## 17. Red-Team Report — `redteam.md`

**Why this exists.** This optional manual attack-record shape supports cognitive
red-team quality. The registered red-team checker reads the actual final RAW
JSON packet and emits concrete findings/evidence or explicitly none; it does
not require a file named `redteam.md` or a manual `APPROVE` enum.
An attack names what was actually checked, the observed result and its
consequence. Failed attacks are reported too, so a reader distinguishes tested
claims from untested ones; no check may be fabricated from a filled template.

The current target is the final producer packet. Check actual checker inputs
before claiming independence; manual file ordering alone does not prove it.

```text
# Red-Team — <case slug> (verdict: <APPROVE | REVISE | INSUFFICIENT-EVIDENCE>)

<actual observed provenance, not a mandated provider-family roster;
Reads: the actual packet and supplied evidence references>

## Attack <letter> — <what I tried to falsify>: <PASSED | FAILED | PARTIAL>

What I checked: <the files opened, by path. Not "I reviewed the artifacts">
What I found: <the observation, quoted or cited>
What it means: <not proven | false | holds — and these are different>
Severity: <HIGH | MEDIUM | LOW> — <only for FAILED and PARTIAL>
Named remedy: <the specific thing that would close it. A finding with no remedy
is harder to disposition and easier to wave away>

## Attacks That Failed, Reported

<the ones where the session held up. Omitting these makes the report look
thorough and makes it useless as evidence that anything was tested>

## Process, Authority, And Provenance

<the attacks that are not about architecture at all: did the isolation hold, do
the run records match the roster claims, did any disposition decide a technical
question without an advisor's evidence, is any human turn unsourced, do the
falsification timestamps precede the critique they claim to>

## Verdict

<APPROVE | REVISE | INSUFFICIENT-EVIDENCE>
<one paragraph: which findings drive it. INSUFFICIENT-EVIDENCE is a real verdict
for a session whose artifacts do not let you check it — never a polite REVISE>
```

**Bad fill.** A report with no file paths, which means the artifacts were never
opened. An empty "attacks that failed" section. Cosmetic findings — ordering,
conciseness, numeric confidence — presented beside an authority violation at the
same weight; note that recommending numeric confidence also pushes against the
panel's own bounds. A verdict of `APPROVE` where no attack section shows a
`runs/` file was read. And the subtle one: a red-team that only attacked the
architecture, producing a competent second critique while the process, the
provenance, and the driver's authority went unchecked.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-89

```text
**Why this exists.** This optional manual attack-record shape supports cognitive
red-team quality. The registered red-team checker reads the actual final RAW
JSON packet and emits concrete findings/evidence or explicitly none; it does
not require a file named `redteam.md` or a manual `APPROVE` enum.
An attack names what was actually checked, the observed result and its
consequence. Failed attacks are reported too, so a reader distinguishes tested
claims from untested ones; no check may be fabricated from a filled template.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-90

```text
The current target is the final producer packet. Check actual checker inputs
before claiming independence; manual file ordering alone does not prove it.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-91

````text
```text
# Red-Team — <case slug> (verdict: <APPROVE | REVISE | INSUFFICIENT-EVIDENCE>)

<actual observed provenance, not a mandated provider-family roster;
Reads: the actual packet and supplied evidence references>

## Attack <letter> — <what I tried to falsify>: <PASSED | FAILED | PARTIAL>

What I checked: <the files opened, by path. Not "I reviewed the artifacts">
What I found: <the observation, quoted or cited>
What it means: <not proven | false | holds — and these are different>
Severity: <HIGH | MEDIUM | LOW> — <only for FAILED and PARTIAL>
Named remedy: <the specific thing that would close it. A finding with no remedy
is harder to disposition and easier to wave away>

## Attacks That Failed, Reported

<the ones where the session held up. Omitting these makes the report look
thorough and makes it useless as evidence that anything was tested>

## Process, Authority, And Provenance

<the attacks that are not about architecture at all: did the isolation hold, do
the run records match the roster claims, did any disposition decide a technical
question without an advisor's evidence, is any human turn unsourced, do the
falsification timestamps precede the critique they claim to>

## Verdict

<APPROVE | REVISE | INSUFFICIENT-EVIDENCE>
<one paragraph: which findings drive it. INSUFFICIENT-EVIDENCE is a real verdict
for a session whose artifacts do not let you check it — never a polite REVISE>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-92

```text
**Bad fill.** A report with no file paths, which means the artifacts were never
opened. An empty "attacks that failed" section. Cosmetic findings — ordering,
conciseness, numeric confidence — presented beside an authority violation at the
same weight; note that recommending numeric confidence also pushes against the
panel's own bounds. A verdict of `APPROVE` where no attack section shows a
`runs/` file was read. And the subtle one: a red-team that only attacked the
architecture, producing a competent second critique while the process, the
provenance, and the driver's authority went unchecked.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#18-reviewer-assessment-reviewmd

````text
## 18. Reviewer Assessment — `review.md`

**Why this exists.** The registered reviewer and red-team challenge the producer's
final synthesis packet through the reviewed pattern. This optional manual
assessment broadens process/evidence questions without adding a separate
post-explanation reviewer step, file or completion gate.

A manual directory recovery exercise may be useful when that manual harness
is actually used. It is not the registered Workflow's completion criterion.
Independence must come from the executed seat/input/confinement evidence,
not from having two filenames or asserting neither read the other.

```text
# Review — <case slug> (verdict: <PASS | REVISE | INSUFFICIENT-EVIDENCE>)

<provenance header — Reads: the full evidence directory. Explicitly NOT
redteam.md, and state that>

## Obligation Check, Per Phase

| Phase | Obligation | Met | Evidence |
|---|---|---|---|
| 1 Intake | verbatim words frozen before interpretation | <yes/no/partial> | intake.md |
| ... | | | |

<one row per phase that ran. A "partial" needs a sentence naming exactly what is
missing — "partial" with no specifics is the most common way a review says
nothing at length>

## Recovery Test

<the real test, performed rather than asserted: read session.md, then intake.md,
then the newest human/ turn, and state what you would do next. If you could not
tell, that is the finding, and it outranks everything else in this file>

## Findings

### REV-<id> (<HIGH | MEDIUM | LOW>) — <one line>

What is wrong: <the defect>
Where: <path, and line or section>
Why it matters: <what it costs the session or a successor — not "best practice">
What would close it: <concrete>

## What I Checked And Found Sound

<the same discipline the red-team owes: name what held, so the verdict is
readable as evidence rather than as a mood>

## Verdict

<PASS | REVISE | INSUFFICIENT-EVIDENCE> — <which findings drive it>
```

**Bad fill.** A review that duplicates the red-team's job — attacking the
architecture, hunting for fabrication — and never checks whether the phases met
their obligations, which leaves the one thing only the reviewer was looking for
unchecked. An obligation table filled entirely with "yes" and no evidence
column. A recovery test that says "recovery appears possible" without having
been run: the whole value of that section is that someone actually tried. And
findings phrased as preferences ("this section would read better first") at the
same severity as a missing artifact.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-93

```text
**Why this exists.** The registered reviewer and red-team challenge the producer's
final synthesis packet through the reviewed pattern. This optional manual
assessment broadens process/evidence questions without adding a separate
post-explanation reviewer step, file or completion gate.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-94

```text
A manual directory recovery exercise may be useful when that manual harness
is actually used. It is not the registered Workflow's completion criterion.
Independence must come from the executed seat/input/confinement evidence,
not from having two filenames or asserting neither read the other.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-95

````text
```text
# Review — <case slug> (verdict: <PASS | REVISE | INSUFFICIENT-EVIDENCE>)

<provenance header — Reads: the full evidence directory. Explicitly NOT
redteam.md, and state that>

## Obligation Check, Per Phase

| Phase | Obligation | Met | Evidence |
|---|---|---|---|
| 1 Intake | verbatim words frozen before interpretation | <yes/no/partial> | intake.md |
| ... | | | |

<one row per phase that ran. A "partial" needs a sentence naming exactly what is
missing — "partial" with no specifics is the most common way a review says
nothing at length>

## Recovery Test

<the real test, performed rather than asserted: read session.md, then intake.md,
then the newest human/ turn, and state what you would do next. If you could not
tell, that is the finding, and it outranks everything else in this file>

## Findings

### REV-<id> (<HIGH | MEDIUM | LOW>) — <one line>

What is wrong: <the defect>
Where: <path, and line or section>
Why it matters: <what it costs the session or a successor — not "best practice">
What would close it: <concrete>

## What I Checked And Found Sound

<the same discipline the red-team owes: name what held, so the verdict is
readable as evidence rather than as a mood>

## Verdict

<PASS | REVISE | INSUFFICIENT-EVIDENCE> — <which findings drive it>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-96

```text
**Bad fill.** A review that duplicates the red-team's job — attacking the
architecture, hunting for fabrication — and never checks whether the phases met
their obligations, which leaves the one thing only the reviewer was looking for
unchecked. An obligation table filled entirely with "yes" and no evidence
column. A recovery test that says "recovery appears possible" without having
been run: the whole value of that section is that someone actually tried. And
findings phrased as preferences ("this section would read better first") at the
same severity as a missing artifact.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#19-rubric-assessment-rubricmd

````text
## 19. Rubric Assessment — `rubric.md`

Optional manual evaluation, not a registered graph step, schema or completion
gate. Actual owner feedback must remain attributable; do not manufacture it.

**Why this exists.** The person's own judgment of the session is evidence, and it
must be captured before any evaluator can anchor them. The file's ordering
enforces that.

```text
# Rubric Assessment — <case slug>

## Part 1 — The Person's Own Assessment

Recorded: <timestamp>
Recorded before Reviewer/Red-Team saw it: <yes — and how that was ensured>

What was useful: <their words>
What was premature: <their words>
What was shallow: <their words>
What felt over-mechanized: <their words>
What they would have wanted instead: <their words>

## Part 2 — Evaluator Assessment

Evaluator: <role/executor — and the explicit statement that this is NOT the
session driver>
Recorded: <timestamp — must be after Part 1>

<the rubric dimensions, each with evidence>

## Part 3 — Reviewer And Red-Team

<recorded last, after both Part 1 and Part 2 exist. This part is a pointer, not
a copy: the reviewer's own output lives in review.md and the red-team's in
redteam.md, each with its own provenance and verdict. Summarize here which
dimensions each one bears on, and cite the file>
```

**Bad fill.** Part 1 written by anyone other than the person. Part 1 timestamped
after Part 2. An evaluator who is also the session driver — that is
self-assessment wearing an evaluation label, and the
[rubric](architecture-advisory-evaluation-rubric.md) treats it as an automatic
failure of the whole assessment, not a procedural nit.

---
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-97

```text
Optional manual evaluation, not a registered graph step, schema or completion
gate. Actual owner feedback must remain attributable; do not manufacture it.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-98

```text
**Why this exists.** The person's own judgment of the session is evidence, and it
must be captured before any evaluator can anchor them. The file's ordering
enforces that.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-99

````text
```text
# Rubric Assessment — <case slug>

## Part 1 — The Person's Own Assessment

Recorded: <timestamp>
Recorded before Reviewer/Red-Team saw it: <yes — and how that was ensured>

What was useful: <their words>
What was premature: <their words>
What was shallow: <their words>
What felt over-mechanized: <their words>
What they would have wanted instead: <their words>

## Part 2 — Evaluator Assessment

Evaluator: <role/executor — and the explicit statement that this is NOT the
session driver>
Recorded: <timestamp — must be after Part 1>

<the rubric dimensions, each with evidence>

## Part 3 — Reviewer And Red-Team

<recorded last, after both Part 1 and Part 2 exist. This part is a pointer, not
a copy: the reviewer's own output lives in review.md and the red-team's in
redteam.md, each with its own provenance and verdict. Summarize here which
dimensions each one bears on, and cite the file>
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-100

```text
**Bad fill.** Part 1 written by anyone other than the person. Part 1 timestamped
after Part 2. An evaluator who is also the session driver — that is
self-assessment wearing an evaluation label, and the
[rubric](architecture-advisory-evaluation-rubric.md) treats it as an automatic
failure of the whole assessment, not a procedural nit.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#assembling-a-session-directory

````text
## Assembling A Session Directory

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

```text
<EVIDENCE_DIR>/
  session.md
  intake.md
  interpretation.md
  scout-report.md
  decision-request.md
  human/1-person.md
  dialogue/1-impact.md
  dialogue/1-response.md
  proposals/system-shaper.md
  proposals/alternative-shaper.md
  proposals/constraint-advocate.md
  proposals/specialist-<topic>.md
  critiques/architecture-critic.md
  synthesis.md
  explanation.md
  redteam.md
  review.md
  dispositions.md
  rubric.md
  prompts/<role>.md
  runs/<ordinal>-<role>.json
```

This is an optional manual trace layout, not the coordinator companion's fixed
PERSISTENT STATE tree: that companion is cognitive-only. Registered status,
storage, human gates and continuation belong to Workflow.

For a manual harness, a fresh reader being able to reconstruct the next action
is useful continuity evidence. For registered execution, completion follows the
declared Workflow and its close gate; neither directory completeness nor a
manual recovery exercise substitutes for it. Completion is not approval of the
advice or permission to implement.
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-101

```text
**Optional manual-harness example only; not registered Workflow storage or completion instructions.**
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-102

````text
```text
<EVIDENCE_DIR>/
  session.md
  intake.md
  interpretation.md
  scout-report.md
  decision-request.md
  human/1-person.md
  dialogue/1-impact.md
  dialogue/1-response.md
  proposals/system-shaper.md
  proposals/alternative-shaper.md
  proposals/constraint-advocate.md
  proposals/specialist-<topic>.md
  critiques/architecture-critic.md
  synthesis.md
  explanation.md
  redteam.md
  review.md
  dispositions.md
  rubric.md
  prompts/<role>.md
  runs/<ordinal>-<role>.json
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-103

```text
This is an optional manual trace layout, not the coordinator companion's fixed
PERSISTENT STATE tree: that companion is cognitive-only. Registered status,
storage, human gates and continuation belong to Workflow.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-104

```text
For a manual harness, a fresh reader being able to reconstruct the next action
is useful continuity evidence. For registered execution, completion follows the
declared Workflow and its close gate; neither directory completeness nor a
manual recovery exercise substitutes for it. Completion is not approval of the
advice or permission to implement.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#architecture-advisory-evaluation-rubric

````text
# Architecture Advisory Evaluation Rubric

```txt
Document type: Guide / runbook
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-1

````text
```txt
Document type: Guide / runbook
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#current-boundary

```text
## Current Boundary

The registered `fgos-architecture-panel` skill consumes this document for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`). It starts only the registered architecture-advisory definitions and leaves routing to config/bind and execution/human gates to Workflow (`core/skills/fgos-architecture-panel/SKILL.md:17-24`). Provider/model strings in worked examples are dated examples, not a current roster or permission to dispatch.

The complete classified input, including the historical operational sections, is [preserved verbatim](../history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md#literal-snapshot). The former engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md`’s historical CoordinationSession section.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-3

```text
The registered `fgos-architecture-panel` skill consumes this document for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`). It starts only the registered architecture-advisory definitions and leaves routing to config/bind and execution/human gates to Workflow (`core/skills/fgos-architecture-panel/SKILL.md:17-24`). Provider/model strings in worked examples are dated examples, not a current roster or permission to dispatch.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-4

```text
The complete classified input, including the historical operational sections, is [preserved verbatim](../history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md#literal-snapshot). The former engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md`’s historical CoordinationSession section.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#what-this-rubric-is

```text
## What This Rubric Is

Twelve questions about one advisory session, answered with evidence.

It is deliberately qualitative. There is no score, no weighting, and no total,
because a number would let a session pass by being adequate everywhere while
failing at the only thing that mattered. It would also collide directly with the
panel's own bounds, which forbid tallying and weighted scoring — a panel that
refuses to reduce advisor disagreement to a count cannot coherently reduce its
own quality to one.

This is an optional cognitive evaluation method, not a registered Workflow
schema, mandatory post-close step or completion/approval gate. Manual filenames,
phase numbers and driver vocabulary below are examples. Current report mapping
is framing; three blind shaping reports; reviewed critique; final RAW JSON
synthesis packet with dispositions; explanation; owner missing-expertise close.
No separate Decision Request, rubric.md or directory-recovery step is scheduled.

Each dimension gets one of four verdicts:

- **demonstrated** — the artifacts show it happened, with a citation.
- **partially demonstrated** — it happened in part; name precisely what is
  missing.
- **not demonstrated** — no evidence it happened. Note that this is different
  from "it was done badly", and both are worth recording distinctly.
- **structurally invalid** — the session's own structure makes this dimension
  unanswerable. One session-invalidating condition (dimension 12) sits here.

Every verdict cites an artifact path. A verdict with no citation is an opinion
about a session that was supposed to be judged on evidence, which is the same
failure the rubric is testing for.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-5

```text
Twelve questions about one advisory session, answered with evidence.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-6

```text
It is deliberately qualitative. There is no score, no weighting, and no total,
because a number would let a session pass by being adequate everywhere while
failing at the only thing that mattered. It would also collide directly with the
panel's own bounds, which forbid tallying and weighted scoring — a panel that
refuses to reduce advisor disagreement to a count cannot coherently reduce its
own quality to one.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-7

```text
This is an optional cognitive evaluation method, not a registered Workflow
schema, mandatory post-close step or completion/approval gate. Manual filenames,
phase numbers and driver vocabulary below are examples. Current report mapping
is framing; three blind shaping reports; reviewed critique; final RAW JSON
synthesis packet with dispositions; explanation; owner missing-expertise close.
No separate Decision Request, rubric.md or directory-recovery step is scheduled.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-8

```text
Each dimension gets one of four verdicts:
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-9

```text
- **demonstrated** — the artifacts show it happened, with a citation.
- **partially demonstrated** — it happened in part; name precisely what is
  missing.
- **not demonstrated** — no evidence it happened. Note that this is different
  from "it was done badly", and both are worth recording distinctly.
- **structurally invalid** — the session's own structure makes this dimension
  unanswerable. One session-invalidating condition (dimension 12) sits here.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-10

```text
Every verdict cites an artifact path. A verdict with no citation is an opinion
about a session that was supposed to be judged on evidence, which is the same
failure the rubric is testing for.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#who-evaluates-and-in-what-order

```text
## Who Evaluates, And In What Order

For a separately chosen manual evaluation, the following order avoids anchoring; it is not the registered Workflow order:

1. **The person's own assessment comes first**, before any evaluator, Reviewer,
   or Red-Team output exists or is shown to them. What they found useful,
   premature, shallow, or over-mechanized is the single highest-authority input
   here, and it is worthless if anchored.
2. **The evaluator runs second**, and **the evaluator is never the session
   driver.** A driver assessing its own session is self-assessment with an
   evaluation label on it.
3. **Manual evaluator/reviewer feedback follows the person's assessment.**
   Registered critique and final-packet reviewer/red-team checks instead run
   where the actual Workflow declares them, before explanation and human close.

An optional `rubric.md` export can follow the
[manual templates](architecture-advisory-artifact-templates.md); it does not
replace real Unit reports or add a human gate.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-11

```text
For a separately chosen manual evaluation, the following order avoids anchoring; it is not the registered Workflow order:
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-12

```text
1. **The person's own assessment comes first**, before any evaluator, Reviewer,
   or Red-Team output exists or is shown to them. What they found useful,
   premature, shallow, or over-mechanized is the single highest-authority input
   here, and it is worthless if anchored.
2. **The evaluator runs second**, and **the evaluator is never the session
   driver.** A driver assessing its own session is self-assessment with an
   evaluation label on it.
3. **Manual evaluator/reviewer feedback follows the person's assessment.**
   Registered critique and final-packet reviewer/red-team checks instead run
   where the actual Workflow declares them, before explanation and human close.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-13

```text
An optional `rubric.md` export can follow the
[manual templates](architecture-advisory-artifact-templates.md); it does not
replace real Unit reports or add a human gate.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#a-note-on-what-failure-looks-like

```text
## A Note On What Failure Looks Like

The failure mode this whole track exists to prevent is a session that is
impressive and useless: correct process, complete artifacts, well-written prose,
and a person who understood their problem no better afterwards. Several
dimensions below therefore ask specifically about the *false pass* — the shape a
dimension takes when a capable panel satisfies its letter and misses its point.
Read those closely. They are where sessions actually fail.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-14

```text
The failure mode this whole track exists to prevent is a session that is
impressive and useless: correct process, complete artifacts, well-written prose,
and a person who understood their problem no better afterwards. Several
dimensions below therefore ask specifically about the *false pass* — the shape a
dimension takes when a capable panel satisfies its letter and misses its point.
Read those closely. They are where sessions actually fail.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#1-understanding-improved-beyond-the-initial-wording

```text
## 1. Understanding Improved Beyond The Initial Wording

**What it is really asking.** Did the panel end up working on a better-formed
problem than the one it was handed? Not a rephrased one — a better-formed one.

**Where to look.** The original verbatim request against the registered framing
report and the actual context passed into blind shaping. Optional manual
intake/interpretation/scout exports are additional evidence, not required files.

**Strong.** The axis of the question moved for a stated reason. "One pipeline or
two" became "an unowned shared contract" because the investigator counted the
commit coupling and found duplication was low. The person can see why the
question changed and would agree it is now the right question.

**Weak.** The shaping frame merely replaces the input sentence with architecture
vocabulary, or changes it without evidence. That is preference, not reframing.

**False pass.** Elaborate restatement. A page of framing that adds structure,
headings, and terminology to the original wording without adding a single fact.
It reads like understanding and contains none. The test: point at the observation
that made the frame move. If there isn't one, this is a false pass.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-15

```text
**What it is really asking.** Did the panel end up working on a better-formed
problem than the one it was handed? Not a rephrased one — a better-formed one.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-16

```text
**Where to look.** The original verbatim request against the registered framing
report and the actual context passed into blind shaping. Optional manual
intake/interpretation/scout exports are additional evidence, not required files.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-17

```text
**Strong.** The axis of the question moved for a stated reason. "One pipeline or
two" became "an unowned shared contract" because the investigator counted the
commit coupling and found duplication was low. The person can see why the
question changed and would agree it is now the right question.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-18

```text
**Weak.** The shaping frame merely replaces the input sentence with architecture
vocabulary, or changes it without evidence. That is preference, not reframing.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-19

```text
**False pass.** Elaborate restatement. A page of framing that adds structure,
headings, and terminology to the original wording without adding a single fact.
It reads like understanding and contains none. The test: point at the observation
that made the frame move. If there isn't one, this is a false pass.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#2-questions-were-necessary-consolidated-and-well-explained

```text
## 2. Questions Were Necessary, Consolidated, And Well Explained

**What it is really asking.** Was the person's attention treated as expensive?

**Where to look.** The request, framing report, recorded user-exclusive gaps
and the actual human close answer. Optional manual Decision Requests are not
additional registered gates.

**Strong.** Repository-answerable gaps were investigated; nonblocking
user-exclusive gaps remain named defaults. Necessary unsafe-to-infer owner
obligations were made explicit. The registered close asks its declared batched
missing-expertise question; it does not silently become a mid-graph survey.

**Weak.** Multiple contacts. A question answerable from the repository. A "why it
matters" that says "to better understand your requirements". No default, so the
panel is idle until the person responds.

**False pass.** One well-formatted Decision Request containing a question that
did not need asking. Consolidation is necessary but not sufficient — a single
tidy packet of ceremonial questions passes the letter of this dimension and fails
it entirely. Check each question against the recommendation: if the panel would
recommend the same thing under every plausible answer, the question was
decoration.

**Also strong.** Investigating without unnecessary contacts. The required
registered close answer still occurs; avoiding ceremonial questions does not
authorize skipping the missing-expertise gate, even when its array is empty.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-20

```text
**What it is really asking.** Was the person's attention treated as expensive?
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-21

```text
**Where to look.** The request, framing report, recorded user-exclusive gaps
and the actual human close answer. Optional manual Decision Requests are not
additional registered gates.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-22

```text
**Strong.** Repository-answerable gaps were investigated; nonblocking
user-exclusive gaps remain named defaults. Necessary unsafe-to-infer owner
obligations were made explicit. The registered close asks its declared batched
missing-expertise question; it does not silently become a mid-graph survey.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-23

```text
**Weak.** Multiple contacts. A question answerable from the repository. A "why it
matters" that says "to better understand your requirements". No default, so the
panel is idle until the person responds.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-24

```text
**False pass.** One well-formatted Decision Request containing a question that
did not need asking. Consolidation is necessary but not sufficient — a single
tidy packet of ceremonial questions passes the letter of this dimension and fails
it entirely. Check each question against the recommendation: if the panel would
recommend the same thing under every plausible answer, the question was
decoration.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-25

```text
**Also strong.** Investigating without unnecessary contacts. The required
registered close answer still occurs; avoiding ceremonial questions does not
authorize skipping the missing-expertise gate, even when its array is empty.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#3-alternatives-were-materially-different-and-credible

```text
## 3. Alternatives Were Materially Different And Credible

**What it is really asking.** Did the person get a real option space, or a
front-runner with escorts?

**Where to look.** The three registered shaping reports, side by side, including
credible smaller/no-build alternatives. Manual proposals/ filenames are optional.

**Strong.** The candidates differ in solution *class*, not in mechanics — build
versus buy versus delete versus duplicate versus do nothing. Each is one a
competent engineer could argue for. The no-build path has a rate, a consequence,
and an observable trigger. At least one candidate is materially smaller than the
obvious answer.

**Weak.** Two proposals that produce the same first three months of work.
Cosmetic variation. A no-build path that is one sentence.

**False pass — the important one.** The designated loser. An alternative with
five stated drawbacks and one vague benefit, which nobody could believe its own
author endorsed. This is the most damaging thing that happens in an advisory
panel and it is invisible in the final packet, which will honestly report that
alternatives were considered. Test it directly: read each alternative and ask
whether its author appears to believe it. Then check the proposal's opening line
— any alternative written *relative to* another proposal ("as an alternative to
X") was not independently produced, whatever the roster claims.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-26

```text
**What it is really asking.** Did the person get a real option space, or a
front-runner with escorts?
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-27

```text
**Where to look.** The three registered shaping reports, side by side, including
credible smaller/no-build alternatives. Manual proposals/ filenames are optional.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-28

```text
**Strong.** The candidates differ in solution *class*, not in mechanics — build
versus buy versus delete versus duplicate versus do nothing. Each is one a
competent engineer could argue for. The no-build path has a rate, a consequence,
and an observable trigger. At least one candidate is materially smaller than the
obvious answer.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-29

```text
**Weak.** Two proposals that produce the same first three months of work.
Cosmetic variation. A no-build path that is one sentence.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-30

```text
**False pass — the important one.** The designated loser. An alternative with
five stated drawbacks and one vague benefit, which nobody could believe its own
author endorsed. This is the most damaging thing that happens in an advisory
panel and it is invisible in the final packet, which will honestly report that
alternatives were considered. Test it directly: read each alternative and ask
whether its author appears to believe it. Then check the proposal's opening line
— any alternative written *relative to* another proposal ("as an alternative to
X") was not independently produced, whatever the roster claims.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#4-evidence-contradicted-as-well-as-supported-early-hypotheses

```text
## 4. Evidence Contradicted As Well As Supported Early Hypotheses

**What it is really asking.** Did anyone go looking for the panel being wrong,
early, when it was still cheap?

**Where to look.** The framing report's tested hypotheses, disconfirming
observations and their downstream effect; no separate scout-report.md is required.

**Strong.** The investigator wrote the hypothesis down before looking, found
something that undercut it, and the frame or the candidate set changed as a
result. The disconfirmation is specific and counted.

**Weak.** Every finding supports the framing the investigator was handed. A
codebase is large enough to confirm anything, so unanimous support is evidence of
method failure, not of a correct hypothesis.

**False pass.** A "risks and counter-evidence" section that lists generic
concerns rather than observations. Contradiction has to be about *this* system
and it has to be something the panel would rather not have found.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-31

```text
**What it is really asking.** Did anyone go looking for the panel being wrong,
early, when it was still cheap?
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-32

```text
**Where to look.** The framing report's tested hypotheses, disconfirming
observations and their downstream effect; no separate scout-report.md is required.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-33

```text
**Strong.** The investigator wrote the hypothesis down before looking, found
something that undercut it, and the frame or the candidate set changed as a
result. The disconfirmation is specific and counted.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-34

```text
**Weak.** Every finding supports the framing the investigator was handed. A
codebase is large enough to confirm anything, so unanimous support is evidence of
method failure, not of a correct hypothesis.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-35

```text
**False pass.** A "risks and counter-evidence" section that lists generic
concerns rather than observations. Contradiction has to be about *this* system
and it has to be something the panel would rather not have found.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#5-advisors-could-change-their-minds-and-explain-why

```text
## 5. Advisors Could Change Their Minds And Explain Why

**What it is really asking.** Was the debate capable of moving anyone? A panel
where every advisor's final position equals its first is not deliberating; it is
publishing in parallel.

**Where to look.** Actual reviewed critique and synthesis evidence, including
conceded attacks and any changed claim. There is no automatic re-shaping loop
or mandatory append-only v2 proposal file in the registered linear graph.

**Strong.** At least one advisor visibly revised, with the reason and the
triggering evidence recorded, and the superseded position still readable. A
critic that reports an attack it made and lost. A shaper that concedes a specific
claim while holding its overall position — which is more honest than wholesale
capitulation.

**Weak.** No revisions anywhere. Or revision by replacement, where v1 was
overwritten and the change is undetectable.

**False pass.** Polite accommodation — a shaper adding "the critic raises a good
point" without changing anything. Agreeing is not the same as being moved. The
test is whether a claim, a recommendation, or a criterion actually differs.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-36

```text
**What it is really asking.** Was the debate capable of moving anyone? A panel
where every advisor's final position equals its first is not deliberating; it is
publishing in parallel.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-37

```text
**Where to look.** Actual reviewed critique and synthesis evidence, including
conceded attacks and any changed claim. There is no automatic re-shaping loop
or mandatory append-only v2 proposal file in the registered linear graph.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-38

```text
**Strong.** At least one advisor visibly revised, with the reason and the
triggering evidence recorded, and the superseded position still readable. A
critic that reports an attack it made and lost. A shaper that concedes a specific
claim while holding its overall position — which is more honest than wholesale
capitulation.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-39

```text
**Weak.** No revisions anywhere. Or revision by replacement, where v1 was
overwritten and the change is undetectable.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-40

```text
**False pass.** Polite accommodation — a shaper adding "the critic raises a good
point" without changing anything. Agreeing is not the same as being moved. The
test is whether a claim, a recommendation, or a criterion actually differs.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#6-dissent-survived-synthesis

```text
## 6. Dissent Survived Synthesis

**What it is really asking.** Did the tidy final document preserve the untidy
truth?

**Where to look.** Shaping and critique positions traced into the final RAW JSON
packet, including its attributed dissent and dispositions.

**Strong.** An unrefuted disagreement appears in the packet body — not a footnote
— attributed by role, with what would settle it, and an explicit statement that
it was not refuted. The packet carries the corresponding unresolved disposition; a manual `dispositions.md` export is optional.

**Weak.** "The panel is aligned" over a live disagreement. Dissent demoted to
"minor considerations". Anonymous dissent the person cannot weigh.

**False pass — check for this specifically.** Dissent laundering: an `unresolved`
objection dispositioned as `mitigated` so the packet reads clean. The tell is a
`mitigated` entry whose residual-risk line is empty or whose mitigation was
authored by the driver rather than an advisor. This conversion is forbidden by
the disposition doctrine precisely because it passes casual inspection.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-41

```text
**What it is really asking.** Did the tidy final document preserve the untidy
truth?
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-42

```text
**Where to look.** Shaping and critique positions traced into the final RAW JSON
packet, including its attributed dissent and dispositions.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-43

```text
**Strong.** An unrefuted disagreement appears in the packet body — not a footnote
— attributed by role, with what would settle it, and an explicit statement that
it was not refuted. The packet carries the corresponding unresolved disposition; a manual `dispositions.md` export is optional.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-44

```text
**Weak.** "The panel is aligned" over a live disagreement. Dissent demoted to
"minor considerations". Anonymous dissent the person cannot weigh.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-45

```text
**False pass — check for this specifically.** Dissent laundering: an `unresolved`
objection dispositioned as `mitigated` so the packet reads clean. The tell is a
`mitigated` entry whose residual-risk line is empty or whose mitigation was
authored by the driver rather than an advisor. This conversion is forbidden by
the disposition doctrine precisely because it passes casual inspection.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#7-the-recommendation-was-decisive-but-properly-calibrated

```text
## 7. The Recommendation Was Decisive But Properly Calibrated

**What it is really asking.** Did the panel commit, and was it honest about how
sure it was? These are both required, and they trade against each other, which is
why they are one dimension.

**Where to look.** The final RAW JSON packet's recommendation and evidence. Per-claim confidence is optional quality guidance, not a required registered field.

**Strong.** One recommendation. Confidence stated per claim, so the diagnosis,
the cost estimate, and the prediction about people carry different weights. What
the recommendation costs is named. Where evidence genuinely cannot separate two
candidates, the packet says so decisively and names the one observation that
would separate them — that is decisive, not evasive.

**Weak.** A balanced menu of three options with symmetric pros and cons, which is
the panel charging the person for work it did not do. Or, at the other end,
uniform high confidence across claims of wildly different quality.

**False pass — the subtle one.** A confident recommendation resting on an
untested inference that is disclosed somewhere late in the document. The packet
is decisive, calibrated-looking, and quietly built on a guess. Trace the
recommendation back to a specific observation; if the chain passes through an
unverified claim, the calibration is cosmetic.

**Second false pass.** A merged recommendation — a fourth architecture assembled
from the proposals, that no advisor proposed, no critic attacked, and no shaper
stated falsification criteria for. It reads as decisive synthesis and is actually
untested authorship.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-46

```text
**What it is really asking.** Did the panel commit, and was it honest about how
sure it was? These are both required, and they trade against each other, which is
why they are one dimension.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-47

```text
**Where to look.** The final RAW JSON packet's recommendation and evidence. Per-claim confidence is optional quality guidance, not a required registered field.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-48

```text
**Strong.** One recommendation. Confidence stated per claim, so the diagnosis,
the cost estimate, and the prediction about people carry different weights. What
the recommendation costs is named. Where evidence genuinely cannot separate two
candidates, the packet says so decisively and names the one observation that
would separate them — that is decisive, not evasive.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-49

```text
**Weak.** A balanced menu of three options with symmetric pros and cons, which is
the panel charging the person for work it did not do. Or, at the other end,
uniform high confidence across claims of wildly different quality.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-50

```text
**False pass — the subtle one.** A confident recommendation resting on an
untested inference that is disclosed somewhere late in the document. The packet
is decisive, calibrated-looking, and quietly built on a guess. Trace the
recommendation back to a specific observation; if the chain passes through an
unverified claim, the calibration is cosmetic.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-51

```text
**Second false pass.** A merged recommendation — a fourth architecture assembled
from the proposals, that no advisor proposed, no critic attacked, and no shaper
stated falsification criteria for. It reads as decisive synthesis and is actually
untested authorship.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#8-the-explanation-enabled-the-person-to-own-the-decision

```text
## 8. The Explanation Enabled The Person To Own The Decision

**What it is really asking.** Can they now defend this choice to someone else,
without the panel in the room?

**Where to look.** The registered explanation report against the settled packet,
plus actual owner feedback when available. Optional rubric.md is not required,
and the expertise close answer is not necessarily evidence of understanding.

**Strong.** The explanation uses their vocabulary and altitude, leads with
consequences rather than architecture, names the first reversible step, names the
conditions under which they should reverse it, and explicitly identifies the
judgment that remains theirs. The person's own assessment reflects understanding
rather than agreement.

**Weak.** Architecture vocabulary the person never used. No reversal conditions.
No statement of what remains their call — which lets a person drift from deciding
into complying, the failure this dimension exists to catch.

**False pass.** The person says "that sounds right". Agreement is not ownership.
Look for evidence they can reconstruct the reasoning: did they push back, ask a
second-order question, or apply the logic to something the panel did not cover?

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-52

```text
**What it is really asking.** Can they now defend this choice to someone else,
without the panel in the room?
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-53

```text
**Where to look.** The registered explanation report against the settled packet,
plus actual owner feedback when available. Optional rubric.md is not required,
and the expertise close answer is not necessarily evidence of understanding.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-54

```text
**Strong.** The explanation uses their vocabulary and altitude, leads with
consequences rather than architecture, names the first reversible step, names the
conditions under which they should reverse it, and explicitly identifies the
judgment that remains theirs. The person's own assessment reflects understanding
rather than agreement.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-55

```text
**Weak.** Architecture vocabulary the person never used. No reversal conditions.
No statement of what remains their call — which lets a person drift from deciding
into complying, the failure this dimension exists to catch.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-56

```text
**False pass.** The person says "that sounds right". Agreement is not ownership.
Look for evidence they can reconstruct the reasoning: did they push back, ask a
second-order question, or apply the logic to something the panel did not cover?

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#9-a-fresh-session-can-resume-through-the-registered-workflow

```text
## 9. A Fresh Session Can Resume Through The Registered Workflow

Evaluate whether evidence and unresolved decisions remain available through Workflow-owned records and the registered skill boundary. Do not score a session.md ledger, hand-run graph or coordinator reading raw run-state as if those were the registered runtime. The actor does not resume the Workflow itself; Workflow resume and human gates are the owning doors. Evidence: core/skills/fgos-architecture-panel/SKILL.md:17-37; core/workflows/architecture-advisory.yaml:78-84.

Evidence must preserve pending decisions, attributed findings and reversibility; losing a local terminal is not completion or approval.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-57

```text
Evaluate whether evidence and unresolved decisions remain available through Workflow-owned records and the registered skill boundary. Do not score a session.md ledger, hand-run graph or coordinator reading raw run-state as if those were the registered runtime. The actor does not resume the Workflow itself; Workflow resume and human gates are the owning doors. Evidence: core/skills/fgos-architecture-panel/SKILL.md:17-37; core/workflows/architecture-advisory.yaml:78-84.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-58

```text
Evidence must preserve pending decisions, attributed findings and reversibility; losing a local terminal is not completion or approval.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#10-independence-is-material-not-a-decorative-model-roster

```text
## 10. Independence Is Material, Not A Decorative Model Roster

Evaluate whether the fixed shaping seats offer materially different system, alternative and constraint lenses and whether independent final-packet checks preserve dissent. Actor/model selection is governed by configuration and bind(), not a hand-written roster or manual run record. Evidence: core/workflows/architecture-advisory.yaml:18-64; core/skills/fgos-architecture-panel/SKILL.md:17-24.

Model/provider diversity alone is not proof of cognitive independence; report its demonstrated effect and limits without inventing live routing evidence.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-59

```text
Evaluate whether the fixed shaping seats offer materially different system, alternative and constraint lenses and whether independent final-packet checks preserve dissent. Actor/model selection is governed by configuration and bind(), not a hand-written roster or manual run record. Evidence: core/workflows/architecture-advisory.yaml:18-64; core/skills/fgos-architecture-panel/SKILL.md:17-24.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-60

```text
Model/provider diversity alone is not proof of cognitive independence; report its demonstrated effect and limits without inventing live routing evidence.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#11-every-shaper-stated-falsification-criteria-before-critics-saw-the-proposal

```text
## 11. Every Shaper Stated Falsification Criteria Before Critics Saw The Proposal

Optional quality dimension: the current shaping template does not require a
falsification-criteria field or a pre-critique timestamp. Assess only actual
recorded criteria; absence is not automatically Workflow failure.

**What it is really asking.** Did proposals expose observable conditions that
would refute them? This improves criticism but does not create a new runtime
precondition, field or gate.

**Where to look.** Actual shaping reports and cited observations. A manual
timestamp claim must be evidenced, not inferred from a template filename.

**Strong.** Criteria present in the v1 proposal body, not appended. Every
proposal's run completed before the critic's run started. Criteria name
conditions that could actually occur in this system and that would genuinely
change the shaper's position.

**Weak.** Criteria missing from one proposal. Criteria added in a v2 after
critique, presented as if they had preceded it — the timestamps make this
detectable and it should be reported as an integrity finding, not a formatting
one.

**False pass.** Falsification theatre: "this would be wrong if the requirements
were completely different", or "if the team disagrees". A criterion that cannot
occur, or whose occurrence nobody could observe, is not a falsification
criterion. Test each one by asking what specific observation would trigger it.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-61

```text
Optional quality dimension: the current shaping template does not require a
falsification-criteria field or a pre-critique timestamp. Assess only actual
recorded criteria; absence is not automatically Workflow failure.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-62

```text
**What it is really asking.** Did proposals expose observable conditions that
would refute them? This improves criticism but does not create a new runtime
precondition, field or gate.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-63

```text
**Where to look.** Actual shaping reports and cited observations. A manual
timestamp claim must be evidenced, not inferred from a template filename.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-64

```text
**Strong.** Criteria present in the v1 proposal body, not appended. Every
proposal's run completed before the critic's run started. Criteria name
conditions that could actually occur in this system and that would genuinely
change the shaper's position.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-65

```text
**Weak.** Criteria missing from one proposal. Criteria added in a v2 after
critique, presented as if they had preceded it — the timestamps make this
detectable and it should be reported as an integrity finding, not a formatting
one.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-66

```text
**False pass.** Falsification theatre: "this would be wrong if the requirements
were completely different", or "if the team disagrees". A criterion that cannot
occur, or whose occurrence nobody could observe, is not a falsification
criterion. Test each one by asking what specific observation would trigger it.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver

```text
## 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver

Optional manual assessment discipline. The registered Workflow has no required
rubric.md/evaluator step; missing that optional exercise does not invalidate
registered completion. If an assessment is performed, preserve real authorship
and acquisition order, and do not invent the person's words.

**What it is really asking.** Is the evidence about the session's usefulness
uncontaminated?

**Where to look.** Actual feedback and independent evaluator records, when collected; manual rubric.md parts are one optional format.

**Strong.** Part 1 is in the person's own words, timestamped before Part 2
exists, with a recorded account of how they were kept from seeing evaluator
output first. Part 2's author is identifiably not the session driver.

**Weak.** Part 1 paraphrased rather than quoted. The order recorded but not
enforceable from the timestamps.

**Structurally invalid — and this invalidates the whole rubric, not just this
row.** The evaluator is the session driver, or Part 1 was collected after the
person saw evaluator output, or Part 1 was authored by anyone other than the
person. In any of these cases the assessment is a session grading itself, and the
other eleven verdicts cannot be trusted regardless of how they read. Record the
condition, mark the rubric invalid, and re-run the assessment properly. This is
not a procedural nit; it is the difference between evidence and self-report.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-67

```text
Optional manual assessment discipline. The registered Workflow has no required
rubric.md/evaluator step; missing that optional exercise does not invalidate
registered completion. If an assessment is performed, preserve real authorship
and acquisition order, and do not invent the person's words.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-68

```text
**What it is really asking.** Is the evidence about the session's usefulness
uncontaminated?
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-69

```text
**Where to look.** Actual feedback and independent evaluator records, when collected; manual rubric.md parts are one optional format.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-70

```text
**Strong.** Part 1 is in the person's own words, timestamped before Part 2
exists, with a recorded account of how they were kept from seeing evaluator
output first. Part 2's author is identifiably not the session driver.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-71

```text
**Weak.** Part 1 paraphrased rather than quoted. The order recorded but not
enforceable from the timestamps.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-72

```text
**Structurally invalid — and this invalidates the whole rubric, not just this
row.** The evaluator is the session driver, or Part 1 was collected after the
person saw evaluator output, or Part 1 was authored by anyone other than the
person. In any of these cases the assessment is a session grading itself, and the
other eleven verdicts cannot be trusted regardless of how they read. Record the
condition, mark the rubric invalid, and re-run the assessment properly. This is
not a procedural nit; it is the difference between evidence and self-report.

---
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#overall-session-verdict

```text
## Overall Session Verdict

After the twelve dimensions, one verdict:

These are manual quality verdicts only, not runtime outcome enums, a substitute
for the declared human close, approval of advice, or permission to implement.

- **APPROVE** — the session advised well. No dimension is *not demonstrated*
  where it materially mattered, no structural invalidity, and the person's own
  assessment supports it. Dimension 8 and the person's Part 1 carry the most
  weight here: a session can be procedurally excellent and still not have helped,
  and if the person says it did not help, it did not help.
- **REVISE** — real advisory value, with named defects that a further round could
  fix. Name the dimensions and the specific artifact.
- **INSUFFICIENT-EVIDENCE** — the artifacts do not permit a judgment. This is a
  legitimate verdict and it must not be used as a polite `REVISE`. Its most
  common causes are dimension 9 (unresumable) and dimension 10 (unevidenced
  bindings).
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-73

```text
After the twelve dimensions, one verdict:
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-74

```text
These are manual quality verdicts only, not runtime outcome enums, a substitute
for the declared human close, approval of advice, or permission to implement.
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-75

```text
- **APPROVE** — the session advised well. No dimension is *not demonstrated*
  where it materially mattered, no structural invalidity, and the person's own
  assessment supports it. Dimension 8 and the person's Part 1 carry the most
  weight here: a session can be procedurally excellent and still not have helped,
  and if the person says it did not help, it did not help.
- **REVISE** — real advisory value, with named defects that a further round could
  fix. Name the dimensions and the specific artifact.
- **INSUFFICIENT-EVIDENCE** — the artifacts do not permit a judgment. This is a
  legitimate verdict and it must not be used as a polite `REVISE`. Its most
  common causes are dimension 9 (unresumable) and dimension 10 (unevidenced
  bindings).
```

### docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-76

```text
- **Length or polish.** A short session that reached a good decision beats a long
  one that reached the same decision more impressively.
- **Whether the person took the recommendation.** They hold the authority. A
  session where they decided against the panel, for reasons the panel helped them
  articulate, is a success.
- **Whether the panel agreed with itself.** Preserved disagreement is a feature.
- **Volume of alternatives.** Three real candidates beat six with three escorts.
- **Protocol conformance.** This manual quality rubric is not a runtime
  conformance gate. The architecture-advisory Workflow and skill already ship
  (`core/workflows/architecture-advisory.yaml`, `core/skills/fgos-architecture-panel/SKILL.md`).
  Compare advice quality on the same case without treating this rubric as a
  required score the registered runtime must pass; conformance alone is not quality.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#dispatch-control-plane-redesign

````text
# Dispatch Control Plane Redesign

```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: Nothing; current dispatch architecture is ../architecture/dispatch-control-plane.md
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/dispatch-control-plane-redesign.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

Reading boundary: sections 1 and 4 record dated 2026-08-26 findings, not present defects. Sections 8–9, 11 and 13 retain explicitly unimplemented design targets; current implementations and limits are stated locally elsewhere. Section 14 records the dated narrow candidate, including a removed sentinel adapter, and section 17 records its historical task sets. Neither is current execution proof. Read src/runner/execution/bind.mjs and current dispatch modules for live behavior; no proposed schema or historical count becomes a current contract.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-1

````text
```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: Nothing; current dispatch architecture is ../architecture/dispatch-control-plane.md
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/dispatch-control-plane-redesign.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-3

```text
Reading boundary: sections 1 and 4 record dated 2026-08-26 findings, not present defects. Sections 8–9, 11 and 13 retain explicitly unimplemented design targets; current implementations and limits are stated locally elsewhere. Section 14 records the dated narrow candidate, including a removed sentinel adapter, and section 17 records its historical task sets. Neither is current execution proof. Read src/runner/execution/bind.mjs and current dispatch modules for live behavior; no proposed schema or historical count becomes a current contract.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#1-problem-statement

```text
## 1. Problem Statement

fgOS dispatch already has the important pieces of a real multi-agent control plane, but the pieces are not yet explicit enough at the same layer.

The current system has:

- a runner config that maps capabilities/purposes to concrete executors;
- executor declarations with kind, carries, provider/model policy, invocation shape, and optional adapter;
- a `decide` command that chooses whether a target should run native/in-process or out-of-process (this command is the concrete result of D0026's 4 done phases, with phase 5 extending native detection to agy deliberately deferred per `docs/specs/runner.md`'s "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào" section);
- an `execute` path that resolves an executor, spawns a process, captures output, and returns a JSON result;
- prompt contracts for work items and ad-hoc dispatches;
- legacy stdout tokens such as `[DONE]` and `[BLOCKED]`;
- an `unsignaled` fallback that compares git state before and after execution;
- an existing Herdr executor entry and Herdr-related product work around pane visibility.

The problem is that these concepts are spread across config, resolver, mechanism, transport, prompt text, and documentation. That creates five practical gaps.

1. The decision surface is not canonical. `execute --for` and `decide --for` do not use the same resolver path, so a capability `prefer` can be honored by execution while the decision command reports unavailable.
2. Governance asks the wrong question in one important place. A cross-provider gate that checks only the command name misses cases where the command is local-looking but environment/model settings route the content elsewhere.
3. Protocol is mixed with transport. Stdin/stdout is treated as the protocol boundary, while it is only one possible delivery mechanism.
4. Result truth is unclear. A structured result, a legacy token, and a git-state inference have different trust levels, but current output does not model that distinction as a first-class contract.
5. Terminal visibility is valuable, but it must not turn the terminal runtime into the semantic authority for task state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-4

```text
fgOS dispatch already has the important pieces of a real multi-agent control plane, but the pieces are not yet explicit enough at the same layer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-5

```text
The current system has:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-6

```text
- a runner config that maps capabilities/purposes to concrete executors;
- executor declarations with kind, carries, provider/model policy, invocation shape, and optional adapter;
- a `decide` command that chooses whether a target should run native/in-process or out-of-process (this command is the concrete result of D0026's 4 done phases, with phase 5 extending native detection to agy deliberately deferred per `docs/specs/runner.md`'s "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào" section);
- an `execute` path that resolves an executor, spawns a process, captures output, and returns a JSON result;
- prompt contracts for work items and ad-hoc dispatches;
- legacy stdout tokens such as `[DONE]` and `[BLOCKED]`;
- an `unsignaled` fallback that compares git state before and after execution;
- an existing Herdr executor entry and Herdr-related product work around pane visibility.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-7

```text
The problem is that these concepts are spread across config, resolver, mechanism, transport, prompt text, and documentation. That creates five practical gaps.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-8

```text
1. The decision surface is not canonical. `execute --for` and `decide --for` do not use the same resolver path, so a capability `prefer` can be honored by execution while the decision command reports unavailable.
2. Governance asks the wrong question in one important place. A cross-provider gate that checks only the command name misses cases where the command is local-looking but environment/model settings route the content elsewhere.
3. Protocol is mixed with transport. Stdin/stdout is treated as the protocol boundary, while it is only one possible delivery mechanism.
4. Result truth is unclear. A structured result, a legacy token, and a git-state inference have different trust levels, but current output does not model that distinction as a first-class contract.
5. Terminal visibility is valuable, but it must not turn the terminal runtime into the semantic authority for task state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#2-goals

```text
## 2. Goals

1. Make dispatch a single explicit decision object.
2. Keep the Native-First Dispatch Doctrine as the source of dispatch mechanism selection.
3. Separate "what to run", "who runs it", "how it is delivered", and "how result truth is proven".
4. Support cross-provider execution without hidden egress.
5. Support Herdr pane visibility soon without requiring the full protocol migration first.
6. Keep worker result handling robust when third-party CLI agents do not obey a structured schema.
7. Keep large data, source diffs, reports, and datasets out of messages; pass references instead.
8. Defer full AgentMessage/mailbox/artifact-store implementation until there is a concrete reader/consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-9

```text
1. Make dispatch a single explicit decision object.
2. Keep the Native-First Dispatch Doctrine as the source of dispatch mechanism selection.
3. Separate "what to run", "who runs it", "how it is delivered", and "how result truth is proven".
4. Support cross-provider execution without hidden egress.
5. Support Herdr pane visibility soon without requiring the full protocol migration first.
6. Keep worker result handling robust when third-party CLI agents do not obey a structured schema.
7. Keep large data, source diffs, reports, and datasets out of messages; pass references instead.
8. Defer full AgentMessage/mailbox/artifact-store implementation until there is a concrete reader/consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#3-non-goals

```text
## 3. Non-Goals

1. Do not make Herdr the source of truth for task state.
2. Do not require every third-party CLI worker to emit valid structured JSON from day one.
3. Do not implement a broad message bus only because it is architecturally attractive.
4. Do not create a second content-class enum beside `carries`.
5. Do not re-open the settled distinction between lifecycle work and ephemeral ad-hoc dispatch.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-10

```text
1. Do not make Herdr the source of truth for task state.
2. Do not require every third-party CLI worker to emit valid structured JSON from day one.
3. Do not implement a broad message bus only because it is architecturally attractive.
4. Do not create a second content-class enum beside `carries`.
5. Do not re-open the settled distinction between lifecycle work and ephemeral ad-hoc dispatch.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#4-current-findings

```text
## 4. Current Findings
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#41-config-already-has-the-right-raw-material

```text
### 4.1 Config Already Has The Right Raw Material

The runner config already distinguishes these axes:

- executor kind: agent or tool;
- content carried: `user-text` or `repo-content`;
- invocation mechanism: `cli`, `task`, `mcp`, or `api`;
- adapter: default `cli-spawn`, with a registry hook already present;
- provider/model policy and rigor override;
- capability `prefer` mapping from an abstract purpose to a concrete executor.

This means the redesign should reuse the existing vocabulary rather than create parallel fields.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-11

```text
The runner config already distinguishes these axes:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-12

```text
- executor kind: agent or tool;
- content carried: `user-text` or `repo-content`;
- invocation mechanism: `cli`, `task`, `mcp`, or `api`;
- adapter: default `cli-spawn`, with a registry hook already present;
- provider/model policy and rigor override;
- capability `prefer` mapping from an abstract purpose to a concrete executor.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-13

```text
This means the redesign should reuse the existing vocabulary rather than create parallel fields.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#42-decide---for-and-execute---for-drift

````text
### 4.2 `decide --for` And `execute --for` Drift

The execution path resolves purposes through the richer resolver that understands capability `prefer`. The decision path has a narrower branch that can resolve only by scanning executors that declare `for`.

The visible failure is:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

returning unavailable even though the config declares that the `fgos-coding-implement` capability prefers `agy`.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-14

```text
The execution path resolves purposes through the richer resolver that understands capability `prefer`. The decision path has a narrower branch that can resolve only by scanning executors that declare `for`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-15

```text
The visible failure is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-16

````text
```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-17

```text
returning unavailable even though the config declares that the `fgos-coding-implement` capability prefers `agy`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#43-governance-can-miss-hidden-egress

```text
### 4.3 Governance Can Miss Hidden Egress

The current cross-provider gate is command-shaped. It treats a non-Claude command as suspicious unless `allowCrossProvider` is true.

That misses the inverse case: an executor can run command `claude` while environment and model settings route the real request through another provider endpoint. The `glm` executor shape is the motivating example: the command can look like Claude while the effective target is OpenRouter and a GLM model.

Governance must inspect effective egress, not just argv[0].
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-18

```text
The current cross-provider gate is command-shaped. It treats a non-Claude command as suspicious unless `allowCrossProvider` is true.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-19

```text
That misses the inverse case: an executor can run command `claude` while environment and model settings route the real request through another provider endpoint. The `glm` executor shape is the motivating example: the command can look like Claude while the effective target is OpenRouter and a GLM model.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-20

```text
Governance must inspect effective egress, not just argv[0].
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#44-cli-only-dispatch-is-too-narrow-but-the-adapter-axis-already-exists

````text
### 4.4 CLI-Only Dispatch Is Too Narrow, But The Adapter Axis Already Exists

The resolver currently insists on a `via:"cli"` invocation for production dispatch. That blocks true `api` or `mcp` execution paths.

However, the transport layer already selects an adapter independently:

```txt
executor.adapter ?? DEFAULT_ADAPTER
```

Therefore a near-term Herdr integration does not need a new protocol layer. An executor can remain `via:"cli"` for resolver compatibility while using `adapter:"herdr-spawn"` to launch the worker in a visible Herdr pane.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-21

```text
The resolver currently insists on a `via:"cli"` invocation for production dispatch. That blocks true `api` or `mcp` execution paths.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-22

```text
However, the transport layer already selects an adapter independently:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-23

````text
```txt
executor.adapter ?? DEFAULT_ADAPTER
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-24

```text
Therefore a near-term Herdr integration does not need a new protocol layer. An executor can remain `via:"cli"` for resolver compatibility while using `adapter:"herdr-spawn"` to launch the worker in a visible Herdr pane.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#45-unsignaled-is-a-real-fallback-not-a-mistake

```text
### 4.5 `unsignaled` Is A Real Fallback, Not A Mistake

CLI agents are third-party workers controlled by prompt, not by hard schema enforcement. A worker may exit successfully without emitting a structured result or even a legacy status token.

The existing `unsignaled` outcome captures this reality by returning `headBefore` and `headAfter`. It should not be deleted until a replacement reader exists and provider compliance data proves it is safe.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-25

```text
CLI agents are third-party workers controlled by prompt, not by hard schema enforcement. A worker may exit successfully without emitting a structured result or even a legacy status token.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-26

```text
The existing `unsignaled` outcome captures this reality by returning `headBefore` and `headAfter`. It should not be deleted until a replacement reader exists and provider compliance data proves it is safe.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#46-herdr-visibility-does-not-require-mailbox-yet

````text
### 4.6 Herdr Visibility Does Not Require Mailbox Yet

The near-term Herdr use case is:

```txt
agent A asks fgOS to activate agent B
fgOS launches B in a Herdr pane
Herdr owns the terminal/runtime surface
fgOS still owns dispatch result interpretation and task state
```

In this shape, A and B do not need a direct communication channel. B returns through the same worker-output path as any CLI dispatch: terminal transcript is captured by the Herdr adapter and handed back to fgOS. fgOS then applies the existing result ladder. Herdr provides visibility and process control, not semantic routing.

Therefore mailbox and AgentMessage are still design targets, not prerequisites for the current Herdr adapter.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-27

```text
The near-term Herdr use case is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-28

````text
```txt
agent A asks fgOS to activate agent B
fgOS launches B in a Herdr pane
Herdr owns the terminal/runtime surface
fgOS still owns dispatch result interpretation and task state
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-29

```text
In this shape, A and B do not need a direct communication channel. B returns through the same worker-output path as any CLI dispatch: terminal transcript is captured by the Herdr adapter and handed back to fgOS. fgOS then applies the existing result ladder. Herdr provides visibility and process control, not semantic routing.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-30

```text
Therefore mailbox and AgentMessage are still design targets, not prerequisites for the current Herdr adapter.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#5-vocabulary

```text
## 5. Vocabulary
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles

```text
### 5.1 Dispatch Roles

- `launcher` - starts a work item or dispatch target and may step away.
- `driver` - stays attached and continues coordinating after activation.
- `orchestrator` - T0 composition layer that manages N units of work and stays attached.
- `work` - lifecycle-bearing fgOS unit with state, events, claim/return, and merge semantics.
- `child work` - a normal work item related to a parent; not a separate dispatch category.
- `capability` - an abstract behavior promise such as `fgos-coding-implement`.
- `executor` - a concrete configured implementation, for example `claude`, `gemini`, `gitnexus` or `herdr`; names are configuration-local, not fixed runtime capabilities.
- `ad-hoc task` / `exec packet` - an ephemeral runtime-composed unit outside the work ledger.

The old `rootTask`/`subTask` vocabulary is not part of the current dispatch model. A "subtask" is either child work with lifecycle or an ephemeral ad-hoc dispatch target. Note that the runner spec's (`docs/specs/runner.md`) historical `capacity` concept maps to `capability` for abstract behavior promises and to `executor` for concrete execution units per ADR 0034.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-31

```text
- `launcher` - starts a work item or dispatch target and may step away.
- `driver` - stays attached and continues coordinating after activation.
- `orchestrator` - T0 composition layer that manages N units of work and stays attached.
- `work` - lifecycle-bearing fgOS unit with state, events, claim/return, and merge semantics.
- `child work` - a normal work item related to a parent; not a separate dispatch category.
- `capability` - an abstract behavior promise such as `fgos-coding-implement`.
- `executor` - a concrete configured implementation, for example `claude`, `gemini`, `gitnexus` or `herdr`; names are configuration-local, not fixed runtime capabilities.
- `ad-hoc task` / `exec packet` - an ephemeral runtime-composed unit outside the work ledger.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-32

```text
The old `rootTask`/`subTask` vocabulary is not part of the current dispatch model. A "subtask" is either child work with lifecycle or an ephemeral ad-hoc dispatch target. Note that the runner spec's (`docs/specs/runner.md`) historical `capacity` concept maps to `capability` for abstract behavior promises and to `executor` for concrete execution units per ADR 0034.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#52-design-target-rename

````text
### 5.2 Design-Target Rename

If the protocol migration is allowed to break compatibility, the clean name for the old `exec packet` concept is:

```txt
DispatchAssignment
```

`exec packet` describes how something is sent. `DispatchAssignment` describes what it means: a bounded assignment handed to another agent.

During the narrow slice, do not rename the existing docs or prompt contract. Use `DispatchAssignment` only in the design target until the protocol migration has a real implementation consumer.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-33

```text
If the protocol migration is allowed to break compatibility, the clean name for the old `exec packet` concept is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-34

````text
```txt
DispatchAssignment
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-35

```text
`exec packet` describes how something is sent. `DispatchAssignment` describes what it means: a bounded assignment handed to another agent.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-36

```text
During the narrow slice, do not rename the existing docs or prompt contract. Use `DispatchAssignment` only in the design target until the protocol migration has a real implementation consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#6-dispatchplan

```text
## 6. DispatchPlan

`DispatchPlan` is the canonical answer to "what should happen with this dispatch request?"

It is not a new decision beside the Native-First Dispatch Doctrine. Its `mechanism` is the named result of that doctrine applied to a concrete selector, executor, and runtime condition.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-37

```text
`DispatchPlan` is the canonical answer to "what should happen with this dispatch request?"
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-38

```text
It is not a new decision beside the Native-First Dispatch Doctrine. Its `mechanism` is the named result of that doctrine applied to a concrete selector, executor, and runtime condition.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#61-shape

```text
### 6.1 Shape

Current compiled fields (`src/runner/dispatch/plan.mjs:444-461`) are
`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,
`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,
`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.
Governance uses its actual provider/egress shape; there is no top-level
`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.

Values and reason codes depend on the resolved request/configuration. Inspect
the actual returned plan rather than treating an illustrative schema or an
old executor selection as a observed result.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-39

```text
Current compiled fields (`src/runner/dispatch/plan.mjs:444-461`) are
`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,
`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,
`bindingSource`, `tier`, `model`, `providerModel`, `provenance`, and `policy`.
Governance uses its actual provider/egress shape; there is no top-level
`target`, `handback` or `execution` wrapper and no `egress.allowed` flag.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-40

```text
Values and reason codes depend on the resolved request/configuration. Inspect
the actual returned plan rather than treating an illustrative schema or an
old executor selection as a observed result.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector

```text
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-41

```text
The selector is caller input, not the mechanism result.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-42

```text
Allowed selector types:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-43

```text
- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-44

```text
Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-45

```text
Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism

```text
### 6.3 Mechanism

Allowed mechanisms:

- `unavailable` - no configured or permitted dispatch target.
- `in-process` - use the current live agent/session facility.
- `out-of-process` - execute through an external executor/adapter.

For in-process plans, native capability fields are top-level `agentType` or
`mcpTool` when supplied (`plan.mjs:453-454`), not a `handback` object.
The caller must actually possess the returned live facility; the decision
does not invoke that facility itself.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-46

```text
Allowed mechanisms:

- `unavailable` - no configured or permitted dispatch target.
- `in-process` - use the current live agent/session facility.
- `out-of-process` - execute through an external executor/adapter.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-47

```text
For in-process plans, native capability fields are top-level `agentType` or
`mcpTool` when supplied (`plan.mjs:453-454`), not a `handback` object.
The caller must actually possess the returned live facility; the decision
does not invoke that facility itself.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#7-governance-and-egress

```text
## 7. Governance And Egress

Governance answers whether content may leave the current trusted execution boundary.

Use the existing `carries` vocabulary:

- `user-text` - user prompt or ordinary instruction content.
- `repo-content` - repository content, diffs, file paths, worktree state, or source-derived material.

There is no `secrets` content value. Secrets are never valid dispatch payload.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-48

```text
Governance answers whether content may leave the current trusted execution boundary.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-49

```text
Use the existing `carries` vocabulary:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-50

```text
- `user-text` - user prompt or ordinary instruction content.
- `repo-content` - repository content, diffs, file paths, worktree state, or source-derived material.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-51

```text
There is no `secrets` content value. Secrets are never valid dispatch payload.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#71-effective-egress

````text
### 7.1 Effective Egress

The gate must classify egress from the full resolved executor shape:

- declared provider label;
- resolved model/provider policy;
- invocation command;
- invocation environment;
- base URL or endpoint variables;
- adapter;
- `allowCrossProvider`;
- `carries`.

The audit event must record at least:

```json
{
  "provider": "glm",
  "command": "claude",
  "effectiveEgressTarget": "openrouter:z-ai/glm-5.2",
  "carries": ["repo-content"]
}
```

The important rule: command is evidence, not the whole answer.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-52

```text
The gate must classify egress from the full resolved executor shape:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-53

```text
- declared provider label;
- resolved model/provider policy;
- invocation command;
- invocation environment;
- base URL or endpoint variables;
- adapter;
- `allowCrossProvider`;
- `carries`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-54

```text
The audit event must record at least:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-55

````text
```json
{
  "provider": "glm",
  "command": "claude",
  "effectiveEgressTarget": "openrouter:z-ai/glm-5.2",
  "carries": ["repo-content"]
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-56

```text
The important rule: command is evidence, not the whole answer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan

````text
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```

The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-57

```text
Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-58

````text
```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-59

```text
This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-60

```text
Canonical specificity order:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-61

````text
```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-62

```text
Different fields resolve differently:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-65

```text
The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow

```text
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-66

```text
Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-68

```text
| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-69

```text
The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#8-dispatchassignment

```text
## 8. DispatchAssignment

`DispatchAssignment` is the design-target replacement for the current six-field ad-hoc task / exec packet.

It is for runtime-composed work that has no lifecycle row of its own. It does not get claimed, reserved, capped, merged, or moved through work-item state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-70

```text
`DispatchAssignment` is the design-target replacement for the current six-field ad-hoc task / exec packet.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-71

```text
It is for runtime-composed work that has no lifecycle row of its own. It does not get claimed, reserved, capped, merged, or moved through work-item state.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#81-design-target-shape

````text
### 8.1 Design-Target Shape

```json
{
  "assignmentId": "asgn_example_001",
  "origin": {
    "type": "adhoc",
    "scope": "tsk-123",
    "sequence": 1
  },
  "objective": "Research dispatch protocol migration risks.",
  "inputs": [
    {
      "ref": "repo://forgentX/src/runner/dispatch",
      "purpose": "Read current dispatch implementation",
      "required": true
    }
  ],
  "scope": {
    "read": ["src/runner/dispatch", "docs/history"],
    "write": [],
    "forbidden": [".env", "secrets"]
  },
  "constraints": [
    "Do not modify code",
    "Return findings with evidence"
  ],
  "deliverable": {
    "type": "research_findings",
    "shape": "ordered findings with severity and file references"
  },
  "returnContract": {
    "allowedMessageTypes": ["RESULT", "BLOCKER"],
    "fallbackSignals": ["[DONE]", "[BLOCKED]"]
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-72

````text
```json
{
  "assignmentId": "asgn_example_001",
  "origin": {
    "type": "adhoc",
    "scope": "tsk-123",
    "sequence": 1
  },
  "objective": "Research dispatch protocol migration risks.",
  "inputs": [
    {
      "ref": "repo://forgentX/src/runner/dispatch",
      "purpose": "Read current dispatch implementation",
      "required": true
    }
  ],
  "scope": {
    "read": ["src/runner/dispatch", "docs/history"],
    "write": [],
    "forbidden": [".env", "secrets"]
  },
  "constraints": [
    "Do not modify code",
    "Return findings with evidence"
  ],
  "deliverable": {
    "type": "research_findings",
    "shape": "ordered findings with severity and file references"
  },
  "returnContract": {
    "allowedMessageTypes": ["RESULT", "BLOCKER"],
    "fallbackSignals": ["[DONE]", "[BLOCKED]"]
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping

```text
### 8.2 Compatibility Mapping

If compatibility is required, the existing six fields map directly:

| Current field | Design-target field |
|---|---|
| `id` | `assignmentId` or `origin.scope + origin.sequence` |
| `goal` | `objective` |
| `inputs` | `inputs` |
| `boundary` | `scope` |
| `expected shape` | `deliverable.shape` |
| `return contract` | `returnContract` |

The current `<scope>#p<n>` id remains valid for old prompt contracts. In the breaking design, typed ids are clearer:

- `tsk_...` or existing `tsk-*` - lifecycle work;
- `asgn_*` - dispatch assignment;
- `msg_*` - protocol message;
- `run_*` - one execution run;
- `trace_*` - distributed trace.

Current implementation note: Work retains lifecycle ids. Assignment and Run
already have actual durable writers: `assignment.mjs:124-144` creates
`asgn_*`, and `assignment-runner.mjs:783` creates `run_*`.
The proposed DispatchAssignment envelope and `msg_*`/`trace_*` namespaces here
are not thereby implemented; they remain separate design targets.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-73

```text
If compatibility is required, the existing six fields map directly:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-74

```text
| Current field | Design-target field |
|---|---|
| `id` | `assignmentId` or `origin.scope + origin.sequence` |
| `goal` | `objective` |
| `inputs` | `inputs` |
| `boundary` | `scope` |
| `expected shape` | `deliverable.shape` |
| `return contract` | `returnContract` |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-75

```text
The current `<scope>#p<n>` id remains valid for old prompt contracts. In the breaking design, typed ids are clearer:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76

```text
- `tsk_...` or existing `tsk-*` - lifecycle work;
- `asgn_*` - dispatch assignment;
- `msg_*` - protocol message;
- `run_*` - one execution run;
- `trace_*` - distributed trace.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-77

```text
Current implementation note: Work retains lifecycle ids. Assignment and Run
already have actual durable writers: `assignment.mjs:124-144` creates
`asgn_*`, and `assignment-runner.mjs:783` creates `run_*`.
The proposed DispatchAssignment envelope and `msg_*`/`trace_*` namespaces here
are not thereby implemented; they remain separate design targets.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#9-agentmessage

````text
## 9. AgentMessage

`AgentMessage` is a protocol envelope. It is not a work item, not a prompt, and not an artifact.

```txt
AgentMessage = identity + routing + correlation + delivery + governance + payload refs
Artifact = heavy data or work product
State store = authoritative task/work truth
Transport = how the envelope moves
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-78

```text
`AgentMessage` is a protocol envelope. It is not a work item, not a prompt, and not an artifact.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-79

````text
```txt
AgentMessage = identity + routing + correlation + delivery + governance + payload refs
Artifact = heavy data or work product
State store = authoritative task/work truth
Transport = how the envelope moves
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#91-design-target-envelope

````text
### 9.1 Design-Target Envelope

```json
{
  "schema": "agent-message",
  "schemaVersion": "1.0",
  "messageId": "msg_example_001",
  "messageType": "ASSIGN",
  "from": {
    "agentId": "claude.architect",
    "runId": "run_example_001"
  },
  "to": {
    "selector": {
      "type": "capability",
      "value": "code-implementation"
    },
    "agentId": null
  },
  "correlation": {
    "traceId": "trace_example_001",
    "parentWorkId": "tsk-123",
    "assignmentId": "asgn_example_001",
    "replyTo": null
  },
  "delivery": {
    "priority": "normal",
    "mode": "next_safe_point",
    "ackRequired": false,
    "idempotencyKey": "tsk-123:code-implementation:p1"
  },
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "effectiveTarget": "codex"
    }
  },
  "payload": {
    "kind": "dispatch-assignment",
    "assignmentId": "asgn_example_001"
  },
  "artifacts": {
    "inputs": [],
    "outputsExpected": []
  },
  "observability": {
    "traceId": "trace_example_001",
    "spanId": "span_001",
    "parentSpanId": null
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-80

````text
```json
{
  "schema": "agent-message",
  "schemaVersion": "1.0",
  "messageId": "msg_example_001",
  "messageType": "ASSIGN",
  "from": {
    "agentId": "claude.architect",
    "runId": "run_example_001"
  },
  "to": {
    "selector": {
      "type": "capability",
      "value": "code-implementation"
    },
    "agentId": null
  },
  "correlation": {
    "traceId": "trace_example_001",
    "parentWorkId": "tsk-123",
    "assignmentId": "asgn_example_001",
    "replyTo": null
  },
  "delivery": {
    "priority": "normal",
    "mode": "next_safe_point",
    "ackRequired": false,
    "idempotencyKey": "tsk-123:code-implementation:p1"
  },
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "effectiveTarget": "codex"
    }
  },
  "payload": {
    "kind": "dispatch-assignment",
    "assignmentId": "asgn_example_001"
  },
  "artifacts": {
    "inputs": [],
    "outputsExpected": []
  },
  "observability": {
    "traceId": "trace_example_001",
    "spanId": "span_001",
    "parentSpanId": null
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#92-message-type-discipline

```text
### 9.2 Message Type Discipline

Do not implement every imaginable type before a consumer exists.

The minimal useful set for a real migration is:

- `ASSIGN` - hand a `DispatchAssignment` to an agent.
- `RESULT` - report a completed assignment or work dispatch result.
- `BLOCKER` - report that execution cannot continue without a decision/artifact.
- `ERROR` - report infrastructure or protocol failure.

These are reserved but deferred until a named consumer exists:

- `ACK`
- `PROGRESS`
- `QUESTION`
- `ANSWER`
- `REVIEW_REQUEST`
- `REVIEW_RESULT`
- `CANCEL`

This keeps the protocol expandable without committing implementation surface to unused workflow states.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-81

```text
Do not implement every imaginable type before a consumer exists.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-82

```text
The minimal useful set for a real migration is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-83

```text
- `ASSIGN` - hand a `DispatchAssignment` to an agent.
- `RESULT` - report a completed assignment or work dispatch result.
- `BLOCKER` - report that execution cannot continue without a decision/artifact.
- `ERROR` - report infrastructure or protocol failure.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-84

```text
These are reserved but deferred until a named consumer exists:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-85

```text
- `ACK`
- `PROGRESS`
- `QUESTION`
- `ANSWER`
- `REVIEW_REQUEST`
- `REVIEW_RESULT`
- `CANCEL`
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-86

```text
This keeps the protocol expandable without committing implementation surface to unused workflow states.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder

````text
## 10. Structured Result And Confidence Ladder

Structured `RESULT` is the target, but structured-only is not a correct V1 for prompt-controlled CLI agents.

Every dispatch result should eventually classify its confidence:

```txt
structured RESULT or BLOCKER  -> confidence: reported
stdout [DONE]/[BLOCKED]       -> confidence: legacy-signal
git/artifact delta inference  -> confidence: inferred
```

The result object should preserve evidence:

```json
{
  "status": "SUCCESS",
  "confidence": "legacy-signal",
  "evidence": {
    "legacySignal": "DONE",
    "headBefore": "abc123",
    "headAfter": "def456",
    "exitCode": 0,
    "structuredMessage": null
  }
}
```

Do not add confidence telemetry as a write-only field. A migration must include a reader, such as:

- dispatch compliance stats;
- an attestation warning/gate;
- provider compliance report;
- CI health check for provider result quality.

Until that reader exists, keep the current fallback behavior and avoid pretending the telemetry migration has started.

Current Assignment RunResult confidence/evidence hardening exists. A label
alone still is not lifecycle authority: validate the run's actual evidence
through attribution, result contracts and settlement.

For Team Dispatch V1, the concrete post-merge rule is:

```txt
No driver may advance Work from an Assignment result unless the RunResult
confidence was computed from evidence produced during that run.
```

Dirty-before/after attribution, structured result validation and required
read-only report artifacts are implemented checks, not a future Step 04/05
dependency. Current owners include `evidence-attribution.mjs`,
`agent-result-claim-contract.mjs`, `run-result.mjs` and `settlement.mjs`.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-87

```text
Structured `RESULT` is the target, but structured-only is not a correct V1 for prompt-controlled CLI agents.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-88

```text
Every dispatch result should eventually classify its confidence:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-89

````text
```txt
structured RESULT or BLOCKER  -> confidence: reported
stdout [DONE]/[BLOCKED]       -> confidence: legacy-signal
git/artifact delta inference  -> confidence: inferred
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-90

```text
The result object should preserve evidence:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-91

````text
```json
{
  "status": "SUCCESS",
  "confidence": "legacy-signal",
  "evidence": {
    "legacySignal": "DONE",
    "headBefore": "abc123",
    "headAfter": "def456",
    "exitCode": 0,
    "structuredMessage": null
  }
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-92

```text
Do not add confidence telemetry as a write-only field. A migration must include a reader, such as:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-93

```text
- dispatch compliance stats;
- an attestation warning/gate;
- provider compliance report;
- CI health check for provider result quality.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94

```text
Until that reader exists, keep the current fallback behavior and avoid pretending the telemetry migration has started.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-95

```text
Current Assignment RunResult confidence/evidence hardening exists. A label
alone still is not lifecycle authority: validate the run's actual evidence
through attribution, result contracts and settlement.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-96

```text
For Team Dispatch V1, the concrete post-merge rule is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97

````text
```txt
No driver may advance Work from an Assignment result unless the RunResult
confidence was computed from evidence produced during that run.
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-98

```text
Dirty-before/after attribution, structured result validation and required
read-only report artifacts are implemented checks, not a future Step 04/05
dependency. Current owners include `evidence-attribution.mjs`,
`agent-result-claim-contract.mjs`, `run-result.mjs` and `settlement.mjs`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#11-artifact-store

````text
## 11. Artifact Store

Messages should carry control and references, not heavy content.

The design target is:

```txt
Message carries: intent, metadata, routing, constraints, artifact refs
Artifact store carries: diffs, reports, logs, datasets, screenshots, generated files
State store carries: authoritative lifecycle state
```

Artifact references must be stable enough for later readers:

```json
{
  "ref": "artifact://dispatch/run_456/test-report.json",
  "type": "test_report",
  "name": "tests",
  "sha256": "..."
}
```

For code work, a git commit is an artifact reference:

```json
{
  "ref": "git://forgentX/commit/abc123",
  "type": "git_commit",
  "name": "implementation"
}
```

The artifact store is deferred in the narrow slice because no structured result reader is being shipped yet.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-99

```text
Messages should carry control and references, not heavy content.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-100

````text
The design target is:

```txt
Message carries: intent, metadata, routing, constraints, artifact refs
Artifact store carries: diffs, reports, logs, datasets, screenshots, generated files
State store carries: authoritative lifecycle state
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-101

```text
Artifact references must be stable enough for later readers:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-102

````text
```json
{
  "ref": "artifact://dispatch/run_456/test-report.json",
  "type": "test_report",
  "name": "tests",
  "sha256": "..."
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-103

```text
For code work, a git commit is an artifact reference:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-104

````text
```json
{
  "ref": "git://forgentX/commit/abc123",
  "type": "git_commit",
  "name": "implementation"
}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-105

```text
The artifact store is deferred in the narrow slice because no structured result reader is being shipped yet.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#12-transport

```text
## 12. Transport

Transport is how messages and work activation move. It is not the protocol.

Supported or planned transport families:

- CLI subprocess spawn;
- CLI spawn through a visible Herdr pane;
- stdout/NDJSON frames;
- filesystem mailbox;
- MCP call;
- HTTP/API call.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-106

```text
Transport is how messages and work activation move. It is not the protocol.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-107

```text
Supported or planned transport families:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-108

```text
- CLI subprocess spawn;
- CLI spawn through a visible Herdr pane;
- stdout/NDJSON frames;
- filesystem mailbox;
- MCP call;
- HTTP/API call.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121-herdr-runtime-role

```text
### 12.1 Herdr Runtime Role

Herdr is runtime/orchestration/visibility:

- open or reuse a pane;
- start an agent process;
- show live output to the human;
- preserve terminal/session context;
- provide attention/liveness signals.

Herdr is not the authority for:

- whether a work item is done;
- whether a blocker is resolved;
- whether a review passed;
- whether artifacts are accepted.

Those facts come from runner state, structured agent events, artifact refs, and verification.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-109

```text
Herdr is runtime/orchestration/visibility:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-110

```text
- open or reuse a pane;
- start an agent process;
- show live output to the human;
- preserve terminal/session context;
- provide attention/liveness signals.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-111

```text
Herdr is not the authority for:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-112

```text
- whether a work item is done;
- whether a blocker is resolved;
- whether a review passed;
- whether artifacts are accepted.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113

```text
Those facts come from runner state, structured agent events, artifact refs, and verification.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace

```text
### 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace

Herdr's Rust implementation (`herdr-dashboard/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings` (`packages/herdr-fgos-common/rust/src/settings.rs`) and
`HerdrOrchestratorToggles` (`herdr-dashboard/src/main.rs`) govern the
`herdrOrchestrator` configuration namespace. These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§5.1: the T0 composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114

```text
Herdr's Rust implementation (`herdr-dashboard/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings` (`packages/herdr-fgos-common/rust/src/settings.rs`) and
`HerdrOrchestratorToggles` (`herdr-dashboard/src/main.rs`) govern the
`herdrOrchestrator` configuration namespace. These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§5.1: the T0 composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter

```text
### 12.2 Near-Term Herdr Adapter

Current `herdr-spawn` keeps CLI-shaped invocation but requires configured
`interactiveMode`; non-interactive dispatch is rejected
(`transport.mjs:913-921`). It starts a fresh interactive agent pane through
`herdr agent start`; the prompt is delivered through a disk artifact rather
than typed as a multiline shell command.

Completion is a worker-written `outbox/result-<round>.json`, not pane status,
stdout sentinels, `[DONE]` or a screenshot. A failed dispatch's pane stays open
by default and its error identifies the pane; a separately configured sweep
may close failed-round panes, not provider-limit pauses
(`transport.mjs:748-814`).

The old non-interactive temporary-script/sentinel/echo-strip/timeout-kill
recipe is removed and must not be used as current instructions. Result files
still require their own contract/evidence validation; terminal visibility
does not decide Work lifecycle.

AgentMessage/mailbox transport remains an unimplemented design target.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115

```text
Current `herdr-spawn` keeps CLI-shaped invocation but requires configured
`interactiveMode`; non-interactive dispatch is rejected
(`transport.mjs:913-921`). It starts a fresh interactive agent pane through
`herdr agent start`; the prompt is delivered through a disk artifact rather
than typed as a multiline shell command.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116

```text
Completion is a worker-written `outbox/result-<round>.json`, not pane status,
stdout sentinels, `[DONE]` or a screenshot. A failed dispatch's pane stays open
by default and its error identifies the pane; a separately configured sweep
may close failed-round panes, not provider-limit pauses
(`transport.mjs:748-814`).
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117

```text
The old non-interactive temporary-script/sentinel/echo-strip/timeout-kill
recipe is removed and must not be used as current instructions. Result files
still require their own contract/evidence validation; terminal visibility
does not decide Work lifecycle.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118

```text
AgentMessage/mailbox transport remains an unimplemented design target.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#13-full-design-target

````text
## 13. Full Design Target

The full target architecture is:

```txt
Caller
  -> DispatchPlan
  -> governance check
  -> transport adapter
  -> worker runtime
  -> structured result or fallback signal
  -> artifact refs
  -> runner-owned state update
```

Logical layers:

```txt
Semantic layer:
  DispatchPlan, DispatchAssignment, RESULT/BLOCKER, governance

Message layer:
  AgentMessage envelope, correlation, delivery, idempotency

Artifact layer:
  git refs, local artifacts, reports, datasets, logs

Execution layer:
  cli-spawn, herdr-spawn, mailbox, MCP, API

State layer:
  fgOS event log and derived state; runner remains the writer
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119

```text
The full target architecture is:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-120

````text
```txt
Caller
  -> DispatchPlan
  -> governance check
  -> transport adapter
  -> worker runtime
  -> structured result or fallback signal
  -> artifact refs
  -> runner-owned state update
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121

````text
Logical layers:

```txt
Semantic layer:
  DispatchPlan, DispatchAssignment, RESULT/BLOCKER, governance

Message layer:
  AgentMessage envelope, correlation, delivery, idempotency

Artifact layer:
  git refs, local artifacts, reports, datasets, logs

Execution layer:
  cli-spawn, herdr-spawn, mailbox, MCP, API

State layer:
  fgOS event log and derived state; runner remains the writer
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#14-narrow-implementation-status

````text
## 14. Narrow Implementation Status

Dated status of the original narrow candidate, not the current adapter contract or a fresh verification run. Its sentinel/observer behavior was later removed; current behavior is section 12.2. Counts and branch findings below are historical claims, not truth-pass test evidence.

Reviewed candidate branch:

```txt
fgw/tsk-5x7
```

Review outcome:

- no remaining P1/P2 findings in the committed diff;
- ready to merge by `main...HEAD` review scope;
- unrelated dirty worktree state remains outside the committed-diff scope;
- full AgentMessage, mailbox, artifact store, and structured confidence telemetry remain deferred.
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122

```text
Dated status of the original narrow candidate, not the current adapter contract or a fresh verification run. Its sentinel/observer behavior was later removed; current behavior is section 12.2. Counts and branch findings below are historical claims, not truth-pass test evidence.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-123

```text
Reviewed candidate branch:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-124

````text
```txt
fgw/tsk-5x7
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-125

```text
Review outcome:

- no remaining P1/P2 findings in the committed diff;
- ready to merge by `main...HEAD` review scope;
- unrelated dirty worktree state remains outside the committed-diff scope;
- full AgentMessage, mailbox, artifact store, and structured confidence telemetry remain deferred.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#141-item-0---fix-decide---for-and-add-minimal-dispatchplan

````text
### 14.1 Item 0 - Fix `decide --for` And Add Minimal DispatchPlan

Status: implemented in the reviewed candidate.

Implemented behavior:

- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.

Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-126

```text
Status: implemented in the reviewed candidate.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-127

```text
Implemented behavior:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-128

```text
- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-129

````text
Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-130

````text
Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```
````

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#142-item-1---governance-egress

```text
### 14.2 Item 1 - Governance Egress

Status: implemented in the reviewed candidate.

Implemented behavior:

- command-only cross-provider judgment is replaced with effective egress judgment;
- `carries` remains the content-class vocabulary;
- egress classification records provider family, target, content class, command, and adapter context through the resolved executor path;
- a Claude-looking command with `ANTHROPIC_BASE_URL` routed to OpenRouter is cross-provider egress and fails closed unless explicitly allowed;
- malformed or deceptive endpoint overrides fail closed;
- same-provider Claude resolves as same-provider governance;
- non-Claude executors must explicitly allow cross-provider egress when carrying repo content.

Proof:

- an executor that routes to another provider through env/model is not allowed merely because its command is `claude`;
- governance tests cover allowed and blocked cross-provider cases.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-131

```text
Status: implemented in the reviewed candidate.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-132

```text
Implemented behavior:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-133

```text
- command-only cross-provider judgment is replaced with effective egress judgment;
- `carries` remains the content-class vocabulary;
- egress classification records provider family, target, content class, command, and adapter context through the resolved executor path;
- a Claude-looking command with `ANTHROPIC_BASE_URL` routed to OpenRouter is cross-provider egress and fails closed unless explicitly allowed;
- malformed or deceptive endpoint overrides fail closed;
- same-provider Claude resolves as same-provider governance;
- non-Claude executors must explicitly allow cross-provider egress when carrying repo content.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-134

```text
Proof:

- an executor that routes to another provider through env/model is not allowed merely because its command is `claude`;
- governance tests cover allowed and blocked cross-provider cases.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#143-item-2---herdr-spawn-adapter

```text
### 14.3 Item 2 - `herdr-spawn` Adapter

Status: implemented in the reviewed candidate.

Implemented behavior:

- a configured executor with `adapter:"herdr-spawn"` routes through the Herdr adapter;
- `invocation.via:"cli"` remains the resolver-compatible invocation type;
- every dispatch creates a fresh pane;
- pane output is captured and normalized before the existing result parser sees it;
- worker completion is detected by the runner-owned sentinel after real command exit, not by `[DONE]`/`[BLOCKED]`;
- prompts that mention `[DONE]` as instructional prose do not trigger false success;
- workers that emit no semantic token still resolve through the existing `unsignaled`/git-state fallback path;
- timeouts close the Herdr pane and do not wait on observer descendants that keep pipes open;
- observer failures surface as transport failures.

Proof:

- a configured executor with `adapter:"herdr-spawn"` routes through the adapter;
- Herdr starts a fresh pane and runs the intended command;
- Herdr does not write or decide fgOS task state;
- result handling still accepts structured output if present, then `[DONE]`/`[BLOCKED]`, then git-state inference.

Review verification:

- `node --test test/runner/herdr-spawn-adapter.test.mjs` - 20/20 pass.
- `node --test test/runner/egress-governance.test.mjs` - 6/6 pass.
- `node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs` - 401/401 pass.
- `git diff --check main...HEAD` - clean.
- Live timeout probes reject around 104-112ms instead of the earlier 1000-10000ms delayed failure shape.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-135

```text
Status: implemented in the reviewed candidate.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-136

```text
Implemented behavior:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-137

```text
- a configured executor with `adapter:"herdr-spawn"` routes through the Herdr adapter;
- `invocation.via:"cli"` remains the resolver-compatible invocation type;
- every dispatch creates a fresh pane;
- pane output is captured and normalized before the existing result parser sees it;
- worker completion is detected by the runner-owned sentinel after real command exit, not by `[DONE]`/`[BLOCKED]`;
- prompts that mention `[DONE]` as instructional prose do not trigger false success;
- workers that emit no semantic token still resolve through the existing `unsignaled`/git-state fallback path;
- timeouts close the Herdr pane and do not wait on observer descendants that keep pipes open;
- observer failures surface as transport failures.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-138

```text
Proof:

- a configured executor with `adapter:"herdr-spawn"` routes through the adapter;
- Herdr starts a fresh pane and runs the intended command;
- Herdr does not write or decide fgOS task state;
- result handling still accepts structured output if present, then `[DONE]`/`[BLOCKED]`, then git-state inference.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-139

```text
Review verification:

- `node --test test/runner/herdr-spawn-adapter.test.mjs` - 20/20 pass.
- `node --test test/runner/egress-governance.test.mjs` - 6/6 pass.
- `node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs` - 401/401 pass.
- `git diff --check main...HEAD` - clean.
- Live timeout probes reject around 104-112ms instead of the earlier 1000-10000ms delayed failure shape.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#15-deferred-until-a-consumer-exists

```text
## 15. Deferred Until A Consumer Exists

These remain part of the architecture target but are not part of the narrow slice:

- full AgentMessage envelope implementation;
- DispatchAssignment rename/migration from exec packet/ad-hoc task;
- artifact store V1;
- mailbox;
- protocol registry beyond the existing adapter registry;
- structured RESULT migration with confidence telemetry;
- ACK/PROGRESS/QUESTION/ANSWER/REVIEW/CANCEL message types.

Entry criteria to pull one of these forward:

- a production reader needs the data;
- Herdr/CLI usage shows fallback result quality is insufficient;
- multiple agents need async QUESTION/BLOCKER/ANSWER flow;
- artifact references are needed to avoid passing large data through conversation;
- provider compliance telemetry has a concrete dashboard/gate/report consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-140

```text
These remain part of the architecture target but are not part of the narrow slice:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-141

```text
- full AgentMessage envelope implementation;
- DispatchAssignment rename/migration from exec packet/ad-hoc task;
- artifact store V1;
- mailbox;
- protocol registry beyond the existing adapter registry;
- structured RESULT migration with confidence telemetry;
- ACK/PROGRESS/QUESTION/ANSWER/REVIEW/CANCEL message types.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-142

```text
Entry criteria to pull one of these forward:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-143

```text
- a production reader needs the data;
- Herdr/CLI usage shows fallback result quality is insufficient;
- multiple agents need async QUESTION/BLOCKER/ANSWER flow;
- artifact references are needed to avoid passing large data through conversation;
- provider compliance telemetry has a concrete dashboard/gate/report consumer.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#16-implementation-pointers

```text
## 16. Implementation Pointers

Current dispatch files:

- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/result-ladder.mjs` — legacy result-signal normalization; the removed dispatch-confidence report is not a current consumer.
- `src/runner/dispatch.mjs`

The former `src/report/dispatch-confidence.mjs` reader and its CLI command
were removed. Do not use them as implementation pointers or proof that the
deferred telemetry reader is current.

Current prompt/protocol references:

- `core/skills/_shared/executor-dispatch-fallback.md`
- `core/skills/_shared/coding-worker-contract.md`
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`

Current focused tests for the narrow slice:

- `test/runner/dispatch.test.mjs`
- `test/runner/egress-governance.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`

Decision/history anchors:

- `docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename;
- `docs/history/two-layer-dispatch/`;
- `docs/history/dispatch-concept-boundary/`;
- `docs/history/task-dispatch-unification/`.
- `docs/history/tsk-5x7/`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-144

```text
Current dispatch files:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-145

```text
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/result-ladder.mjs` — legacy result-signal normalization; the removed dispatch-confidence report is not a current consumer.
- `src/runner/dispatch.mjs`
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-146

```text
The former `src/report/dispatch-confidence.mjs` reader and its CLI command
were removed. Do not use them as implementation pointers or proof that the
deferred telemetry reader is current.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-147

```text
Current prompt/protocol references:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-148

```text
- `core/skills/_shared/executor-dispatch-fallback.md`
- `core/skills/_shared/coding-worker-contract.md`
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-149

```text
Current focused tests for the narrow slice:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-150

```text
- `test/runner/dispatch.test.mjs`
- `test/runner/egress-governance.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-151

```text
Decision/history anchors:
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-152

```text
- `docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename;
- `docs/history/two-layer-dispatch/`;
- `docs/history/dispatch-concept-boundary/`;
- `docs/history/task-dispatch-unification/`.
- `docs/history/tsk-5x7/`.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#17-task-sets-that-implemented-this-plan-2026-08-25-2026-08-26

```text
## 17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)

Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-153

```text
Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#171-tsk-5x7-dispatch-semantic-control-plane-herdr-ready-orchestration-root

```text
### 17.1 `tsk-5x7` — Dispatch semantic control plane + Herdr-ready orchestration (root)

Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):

- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.

The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-154

```text
Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-155

```text
- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-156

```text
The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#172-follow-on-task-sets-2026-08-26-each-pulling-one-15-deferred-item-forward-or-fixing-a-redesign-regression

```text
### 17.2 Follow-on task sets (2026-08-26), each pulling one §15 "deferred" item forward or fixing a redesign regression

| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |

Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-157

```text
| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-158

```text
Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#173-implementation-pointers-per-task-set

```text
### 17.3 Implementation Pointers Per Task Set

Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.

| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |

The preceding task table records files added/removed in its dated window,
not today's existence. `result-ladder.mjs` remains current; the former
dispatch-confidence reader and live-renderer files are removed and are not
current pointers. Use section 16's current list.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-159

```text
Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-160

```text
| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-161

```text
The preceding task table records files added/removed in its dated window,
not today's existence. `result-ladder.mjs` remains current; the former
dispatch-confidence reader and live-renderer files are removed and are not
current pointers. Use section 16's current list.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#18-broader-orchestration-vocabulary

```text
## 18. Broader Orchestration Vocabulary

This document defines the dispatch-control-plane slice: how one selected
target resolves to an executor, mechanism, governance decision, adapter, and
result signal.

For the broader orchestration map around this slice, including the distinction
between mission, work, workflow, assignment, dispatch, runtime, evidence, and
visibility, see the canonical [Vocabulary Map](../vocabulary/README.md).
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-162

```text
This document defines the dispatch-control-plane slice: how one selected
target resolves to an executor, mechanism, governance decision, adapter, and
result signal.
```

### docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-163

```text
For the broader orchestration map around this slice, including the distinction
between mission, work, workflow, assignment, dispatch, runtime, evidence, and
visibility, see the canonical [Vocabulary Map](../vocabulary/README.md).
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#team-communication-protocol-v1

````text
# Team Communication Protocol V1

```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-1

````text
```txt
Document type: Proposal
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-2

```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/team-communication-protocol-v1.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose

````text
## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal retains communication doctrine for Work-attached coding activity.
The early standalone prototype was retired; current standalone execution uses
Unit/CollaborationPattern or Workflow. A predeclared Workflow is not required
for every bounded Unit request, but validated contracts and governance remain.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> recorded workflowStep
    -> legal step operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-3

```text
Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-4

```text
This proposal retains communication doctrine for Work-attached coding activity.
The early standalone prototype was retired; current standalone execution uses
Unit/CollaborationPattern or Workflow. A predeclared Workflow is not required
for every bounded Unit request, but validated contracts and governance remain.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-5

```text
The protocol defines how roles communicate while `Work` remains the lifecycle
authority:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-6

````text
```txt
Work position
  -> recorded workflowStep
    -> legal step operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-7

```text
The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries

````text
## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is reserved/deferred vocabulary, not a current team-envelope runtime.
workflowStep records Work's position.
Step operations are declared semantic actions, not a second Stage Protocol engine.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-8

````text
```txt
Work is lifecycle authority.
Mission is reserved/deferred vocabulary, not a current team-envelope runtime.
workflowStep records Work's position.
Step operations are declared semantic actions, not a second Stage Protocol engine.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-9

```text
Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-10

```text
Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles

```text
## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not Workflow step owner. A step owner may dispatch an Assignment to
another role while Work remains at the same `workflowStep`.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-11

```text
The coding domain starts with the roles already declared in the role graph:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-12

```text
| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-13

```text
Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-14

```text
Role is not Workflow step owner. A step owner may dispatch an Assignment to
another role while Work remains at the same `workflowStep`.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes

```text
## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Bounded contribution; caller continues at the same Workflow step. | `work.call-summary` records the call; holder is untouched. | The role-call record alone is not RunResult proof; executed Assignments require their normal evidence. |
| `async` | Role handoff governed by the current role graph. | `work.handoff` records holder change and checkpoint; it does not itself invent a status transition. | Actual handoff/answer context plus any independently required execution evidence. |

`src/state/store.mjs:1497-1562` chooses the event from the matched edge's mode,
not a caller override. Sync call summaries do not consume the async callstack.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-15

```text
The role graph's `mode` field has protocol meaning:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16

```text
| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Bounded contribution; caller continues at the same Workflow step. | `work.call-summary` records the call; holder is untouched. | The role-call record alone is not RunResult proof; executed Assignments require their normal evidence. |
| `async` | Role handoff governed by the current role graph. | `work.handoff` records holder change and checkpoint; it does not itself invent a status transition. | Actual handoff/answer context plus any independently required execution evidence. |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-17

```text
`src/state/store.mjs:1497-1562` chooses the event from the matched edge's mode,
not a caller override. Sync call summaries do not consume the async callstack.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-18

```text
`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection

```text
## 5. Workflow Step Operation Selection

`src/workflow/steps.mjs:70-85` provides
`operationsForStep(wf, stepId, { defaultRole })`; the domain wrapper
`src/state/domain-registry.mjs:254-257` also accepts
`operationsForStep(domain, step, kind)`. Both are current APIs; do not call the
domain wrapper historical merely because the Workflow helper has another signature.

Selection rules:

1. Prefer the primary operation when the current step's owner work is still
   the next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the step without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-19

```text
`src/workflow/steps.mjs:70-85` provides
`operationsForStep(wf, stepId, { defaultRole })`; the domain wrapper
`src/state/domain-registry.mjs:254-257` also accepts
`operationsForStep(domain, step, kind)`. Both are current APIs; do not call the
domain wrapper historical merely because the Workflow helper has another signature.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-20

```text
Selection rules:

1. Prefer the primary operation when the current step's owner work is still
   the next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the step without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-21

```text
Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract

````text
## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write structured JSON to the effective claim path supplied in the prompt.
- Read-only: also write the required companion agent-report.md beside the claim.
- Mutating: a human-readable report is optional; required external evidence remains.
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-22

```text
Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-23

```text
Required prompt fields:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-24

````text
```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write structured JSON to the effective claim path supplied in the prompt.
- Read-only: also write the required companion agent-report.md beside the claim.
- Mutating: a human-readable report is optional; required external evidence remains.
```
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-25

```text
The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-26

```text
The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-27

```text
`agent-result.json` is the worker's structured claim. It is not proof by
itself.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28

```text
Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-29

````text
```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30

```text
Allowed status values:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-31

```text
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32

```text
Required fields by status:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33

```text
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34

```text
`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35

```text
For this proposed extension, the legality obligation remains:
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36

```text
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#9-handoff-versus-assignment

```text
## 9. Handoff Versus Assignment

Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.

Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.

`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#10-coding-domain-workflow-step-operations

```text
## 10. Coding-Domain Workflow Step Operations
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#101-discovery

```text
### 10.1 Discovery

Discovery is machine-alone.

Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.

Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#102-exploring

```text
### 10.2 Exploring

Exploring is the human-adjacent decision-locking stage.

Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.

Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning

```text
### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The current coding Workflow already declares `shape-plan` and reviewer
`validate-plan`; adopting a future Step 05 is not a prerequisite for that
operation (`domains/coding/workflows/feature.yaml:64-100`).

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51

```text
The current coding Workflow already declares `shape-plan` and reviewer
`validate-plan`; adopting a future Step 05 is not a prerequisite for that
operation (`domains/coding/workflows/feature.yaml:64-100`).
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#104-executing

```text
### 10.4 Executing

Executing has the richest team protocol:

- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.

The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness

````text
## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for current Unit/Workflow execution.
````

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59

```text
The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for current Unit/Workflow execution.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#12-standalone-read-only-coordination

```text
## 12. Standalone Read-Only Coordination

The former session-engine runtime path is historical. Current standalone execution uses Unit/CollaborationPattern, not that protocol profile. The manual operating harness in section 11 remains current by owner decision.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-60

```text
The former session-engine runtime path is historical. Current standalone execution uses Unit/CollaborationPattern, not that protocol profile. The manual operating harness in section 11 remains current by owner decision.
```

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#13-acceptance-criteria-for-v1-protocol

```text
## 13. Acceptance Criteria For V1 Protocol

The protocol is ready for driver adoption when:

- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
```
