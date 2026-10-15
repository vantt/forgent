# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/schema/surface-contract.schema.json
Part 1/1; entries: **1**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 0/0 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_8d3e88929e90d8bdcb24dd9051eeac45"
    ],
    "Weak-exact": [],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": []
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_8d3e88929e90d8bdcb24dd9051eeac45

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/schema/surface-contract.schema.json#file-block; lines 1–124; ancestry [].
Target: docs/platform/ui-spec/history/schema/surface-contract.schema.json#file-block; ancestry [].
Source digest: 2ce8f77f92bb0cf512f74f5eac133be50a8a0d301b3de13b82e5fbf4d950db7e
Target digest: 2ce8f77f92bb0cf512f74f5eac133be50a8a0d301b3de13b82e5fbf4d950db7e
Shown source SHA256: efd55a056a98451e090b1df3b6edefa8e8392220bc1b74baa23504c8fe27c16e
Shown target SHA256: efd55a056a98451e090b1df3b6edefa8e8392220bc1b74baa23504c8fe27c16e

### Complete proposed decision

```json
{
  "claimId": "claim_8d3e88929e90d8bdcb24dd9051eeac45",
  "sourceUnitDigest": "2ce8f77f92bb0cf512f74f5eac133be50a8a0d301b3de13b82e5fbf4d950db7e",
  "targetOwner": "docs/platform/ui-spec/history/schema/surface-contract.schema.json",
  "targetAnchor": "file-block",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole file-block unit docs/ui-spec/schema/surface-contract.schema.json#file-block (source lines 1-124) is carried at docs/platform/ui-spec/history/schema/surface-contract.schema.json#file-block (candidate lines 1-124). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/schema/surface-contract.schema.json verbatim in docs/platform/ui-spec/history/schema/surface-contract.schema.json. Map kind history is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2ce8f77f92bb0cf512f74f5eac133be50a8a0d301b3de13b82e5fbf4d950db7e",
  "targetAncestry": []
}
```

### Full source shown text

```text
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "ui-spec-surface-contract",
  "title": "UI Spec surface interaction contract",
  "description": "Schema for the fenced YAML contract block embedded in each surface markdown file.",
  "type": "object",
  "additionalProperties": false,
  "minProperties": 1,
  "properties": {
    "system": {
      "type": "string",
      "description": "Optional: system/subsystem name for system event files"
    },
    "interactions": {
      "type": "array",
      "items": { "$ref": "#/$defs/interaction" }
    },
    "emits": {
      "type": "array",
      "items": { "$ref": "#/$defs/emit" }
    },
    "flow": { "$ref": "#/$defs/flow" },
    "rules": {
      "type": "array",
      "items": { "$ref": "#/$defs/ruleMapping" }
    }
  },
  "$defs": {
    "actionId": {
      "type": "string",
      "pattern": "^A-[A-Z0-9]+-[A-Za-z0-9]+$"
    },
    "trigger": {
      "type": "string",
      "enum": [
        "click", "double_click", "contextmenu", "tap", "long_press",
        "drag", "drag_start", "drag_end", "drag_drop", "drop",
        "submit", "change", "input", "blur", "validate",
        "keydown", "hover", "focus",
        "system_event", "event"
      ]
    },
    "action": {
      "type": "string",
      "enum": ["navigate", "open_overlay", "close_overlay", "mutate", "emit_event", "external", "system_event"]
    },
    "interaction": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "id": { "$ref": "#/$defs/actionId" },
        "element": { "type": "string" },
        "region": { "type": "string", "description": "Optional: named region within the surface (e.g. header, sidebar, footer)" },
        "trigger": { "$ref": "#/$defs/trigger" },
        "listens_to": { "type": "string" },
        "guard": { "type": "string" },
        "action": { "$ref": "#/$defs/action" },
        "target": { "type": "string" },
        "event": { "type": "string" },
        "payload": { "type": "object" },
        "effects": { "type": "array", "items": { "type": "string" } }
      },
      "allOf": [
        {
          "comment": "navigate/open_overlay require a target",
          "if": { "properties": { "action": { "enum": ["navigate", "open_overlay"] } }, "required": ["action"] },
          "then": { "required": ["target"] }
        },
        {
          "comment": "a non-listener interaction needs a trigger",
          "if": { "not": { "required": ["listens_to"] } },
          "then": { "required": ["trigger"] }
        }
      ]
    },
    "emit": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "event"],
      "properties": {
        "id": { "$ref": "#/$defs/actionId" },
        "element": { "type": "string" },
        "region": { "type": "string", "description": "Optional: named region within the surface" },
        "trigger": { "$ref": "#/$defs/trigger" },
        "guard": { "type": "string" },
        "event": { "type": "string" },
        "payload": { "type": "object" }
      }
    },
    "flow": {
      "type": "object",
      "additionalProperties": false,
      "required": ["goal", "steps"],
      "properties": {
        "goal": { "type": "string" },
        "preconditions": { "type": "array", "items": { "type": "string" } },
        "steps": { "type": "array", "items": { "$ref": "#/$defs/actionId" } },
        "branches": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["when", "action"],
            "properties": {
              "when": { "type": "string" },
              "action": { "$ref": "#/$defs/actionId" }
            }
          }
        }
      }
    },
    "ruleMapping": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "surfaces"],
      "properties": {
        "id": { "type": "string", "pattern": "^R[0-9]+$" },
        "name": { "type": "string" },
        "surfaces": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

### Full target shown text

```text
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "ui-spec-surface-contract",
  "title": "UI Spec surface interaction contract",
  "description": "Schema for the fenced YAML contract block embedded in each surface markdown file.",
  "type": "object",
  "additionalProperties": false,
  "minProperties": 1,
  "properties": {
    "system": {
      "type": "string",
      "description": "Optional: system/subsystem name for system event files"
    },
    "interactions": {
      "type": "array",
      "items": { "$ref": "#/$defs/interaction" }
    },
    "emits": {
      "type": "array",
      "items": { "$ref": "#/$defs/emit" }
    },
    "flow": { "$ref": "#/$defs/flow" },
    "rules": {
      "type": "array",
      "items": { "$ref": "#/$defs/ruleMapping" }
    }
  },
  "$defs": {
    "actionId": {
      "type": "string",
      "pattern": "^A-[A-Z0-9]+-[A-Za-z0-9]+$"
    },
    "trigger": {
      "type": "string",
      "enum": [
        "click", "double_click", "contextmenu", "tap", "long_press",
        "drag", "drag_start", "drag_end", "drag_drop", "drop",
        "submit", "change", "input", "blur", "validate",
        "keydown", "hover", "focus",
        "system_event", "event"
      ]
    },
    "action": {
      "type": "string",
      "enum": ["navigate", "open_overlay", "close_overlay", "mutate", "emit_event", "external", "system_event"]
    },
    "interaction": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "id": { "$ref": "#/$defs/actionId" },
        "element": { "type": "string" },
        "region": { "type": "string", "description": "Optional: named region within the surface (e.g. header, sidebar, footer)" },
        "trigger": { "$ref": "#/$defs/trigger" },
        "listens_to": { "type": "string" },
        "guard": { "type": "string" },
        "action": { "$ref": "#/$defs/action" },
        "target": { "type": "string" },
        "event": { "type": "string" },
        "payload": { "type": "object" },
        "effects": { "type": "array", "items": { "type": "string" } }
      },
      "allOf": [
        {
          "comment": "navigate/open_overlay require a target",
          "if": { "properties": { "action": { "enum": ["navigate", "open_overlay"] } }, "required": ["action"] },
          "then": { "required": ["target"] }
        },
        {
          "comment": "a non-listener interaction needs a trigger",
          "if": { "not": { "required": ["listens_to"] } },
          "then": { "required": ["trigger"] }
        }
      ]
    },
    "emit": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "event"],
      "properties": {
        "id": { "$ref": "#/$defs/actionId" },
        "element": { "type": "string" },
        "region": { "type": "string", "description": "Optional: named region within the surface" },
        "trigger": { "$ref": "#/$defs/trigger" },
        "guard": { "type": "string" },
        "event": { "type": "string" },
        "payload": { "type": "object" }
      }
    },
    "flow": {
      "type": "object",
      "additionalProperties": false,
      "required": ["goal", "steps"],
      "properties": {
        "goal": { "type": "string" },
        "preconditions": { "type": "array", "items": { "type": "string" } },
        "steps": { "type": "array", "items": { "$ref": "#/$defs/actionId" } },
        "branches": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["when", "action"],
            "properties": {
              "when": { "type": "string" },
              "action": { "$ref": "#/$defs/actionId" }
            }
          }
        }
      }
    },
    "ruleMapping": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "surfaces"],
      "properties": {
        "id": { "type": "string", "pattern": "^R[0-9]+$" },
        "name": { "type": "string" },
        "surfaces": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```
