#!/usr/bin/env python3
"""Assemble the deterministic Phase 8 consumer handoff without changing records.

The assembler deliberately reads the reviewed Step 3--5 record surfaces.  It
does not apply a patch, alter a disposition, read live fgOS state, or claim
cutover readiness.  A final-pin run replaces this pre-pin receipt.
"""
from __future__ import annotations

import argparse
import collections
import copy
import difflib
import functools
import hashlib
import json
import pathlib
import subprocess
import sys
from typing import Any

sys.dont_write_bytecode = True

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PLAN = ROOT / "plans/260925-documentation-authority-unification"


def read_json(path: pathlib.Path) -> Any:
    return json.loads(path.read_text())


def jsonl(path: pathlib.Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text().splitlines() if line]


def git(*args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(ROOT), *args], stderr=subprocess.PIPE, text=True
    ).strip()


def sha(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def compact_json(value: Any) -> str:
    return json.dumps(
        value, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ) + "\n"


@functools.lru_cache(maxsize=None)
def blob(pin: str, path: str) -> str | None:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "rev-parse", f"{pin}:{path}"],
        capture_output=True,
        text=True,
    )
    return proc.stdout.strip() if proc.returncode == 0 else None


def record_files(directory: str) -> list[pathlib.Path]:
    return sorted((HERE / directory).glob("*.jsonl"))


def item_id(item: dict[str, Any]) -> str:
    return str(item.get("referenceId") or item.get("id") or item.get("edgeId"))


def span_key(item: dict[str, Any]) -> str:
    spans = item.get("sourceSpans") or item.get("slotSourceSpans") or []
    return json.dumps(spans, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def alias_paths() -> set[str]:
    aliases = set()
    for entry in read_json(PLAN / "alias-table.json").get("entries", []):
        for key in ("alias", "oldPath", "from", "path"):
            if entry.get(key):
                aliases.add(entry[key])
    return aliases


def park_families() -> tuple[dict[tuple[str, int, str, str], str], list[dict[str, Any]]]:
    source = read_json(HERE / "step-07-park-families.json")
    resolutions = {
        row["familyId"]: row
        for row in read_json(HERE / "step-07-park-resolution-plan.json")["families"]
    }
    index: dict[tuple[str, int, str, str], str] = {}
    projections = []
    total = 0
    export_wait = {
        "gen-doc-registry",
        "gen-enduser-index",
        "gen-decision-index",
        "state-registry-export",
        "state-work-docsref",
        "state-inventory-oldpath",
        "state-outcome-and-evidence",
    }
    for family in source["families"]:
        family_id = family["id"]
        resolution = resolutions[family_id]
        members = family["members"]
        total += len(members)
        for member in members:
            key = (
                member["recordFile"],
                member["recordLine"],
                member["file"],
                member["id"],
            )
            if key in index:
                raise ValueError(f"duplicate park member: {key}")
            index[key] = family_id
        target = resolution["targetDisposition"]
        if family_id in export_wait:
            projected = "individually parked"
            blocker = "L12-96-state-export"
        elif target == "preserve":
            projected = "preserved-history/fixture"
            blocker = None
        elif target == "patch" or str(target).startswith("retire"):
            projected = "prepared-for-cutover"
            blocker = "final-pin-patch-binding"
        else:
            projected = "prepared-for-cutover"
            blocker = "final-pin-resolution-proof"
        projections.append(
            {
                "familyId": family_id,
                "familyNumber": resolution["familyNumber"],
                "memberCount": len(members),
                "projectedDisposition": projected,
                "blocker": blocker,
                "witnessRuling": resolution["witnessRuling"],
            }
        )
    if total != 2311 or len(index) != 2311:
        raise ValueError(f"park family conservation failed: total={total}, unique={len(index)}")
    return index, projections


def patch_id(stage: str, file: str, item: dict[str, Any]) -> str:
    if stage == "step-05":
        return f"r26:{file}"
    return f"{stage}:{file}"


def disposition_class(stage: str, item: dict[str, Any]) -> str | None:
    disposition = item.get("disposition")
    admission = item.get("admission")
    if admission == "REJECT" and disposition == "preserve":
        return "rejected-not-consumer"
    if disposition in {"applied", "applied-safe"} or item.get("appliedEditEvidence"):
        return "applied-safe"
    if disposition == "parked":
        return "individually parked"
    if disposition in {"patch", "phase9-row-flip", "render-join"}:
        return "prepared-for-cutover"
    if disposition == "preserve":
        return "preserved-history/fixture"
    return None


def source_custody(item: dict[str, Any]) -> tuple[str, Any] | None:
    for field in ("nonDocumentUse", "sourceOwner", "inheritedOwner", "reason"):
        if item.get(field) is not None:
            return field, item[field]
    return None


def build_matrix(
    pin: str, aliases: set[str], family_index: dict[tuple[str, int, str, str], str]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    rows: list[dict[str, Any]] = []
    violations: list[dict[str, Any]] = []
    unmatched: list[dict[str, Any]] = []
    inherited_family: dict[tuple[str, str], str] = {}
    physical_family: dict[tuple[str, str], str] = {}
    for path in record_files("step-05-records"):
        for n, record in enumerate(jsonl(path), 1):
            for field in ("references", "dynamicTraces", "authorAddedReferences"):
                for item in record.get(field, []):
                    family = family_index.get(
                        (f"step-05-records/{path.name}", n, record["file"], item_id(item))
                    )
                    if not family:
                        continue
                    physical_family.setdefault((record["file"], span_key(item)), family)
                    for owner in (item.get("sourceOwner"), item.get("inheritedOwner")):
                        if not isinstance(owner, dict):
                            continue
                        owner_file = owner.get("file")
                        owner_id = owner.get("id") or owner.get("edgeId")
                        if owner_file and owner_id:
                            inherited_family.setdefault((owner_file, str(owner_id)), family)

    def add(
        stage: str,
        record_path: pathlib.Path,
        record_line: int,
        record: dict[str, Any],
        item: dict[str, Any],
    ) -> None:
        file = item.get("consumerFile") or record["file"]
        cls = disposition_class(stage, item)
        rid = f"{stage}:{record_path.name}:{record_line}:{item_id(item)}"
        family_id = family_index.get(
            (f"step-05-records/{record_path.name}", record_line, file, item_id(item))
        )
        if family_id is None and stage in {"step-03", "step-04"}:
            family_id = inherited_family.get((file, item_id(item)))
        if family_id is None and stage in {"step-03", "step-04"}:
            family_id = physical_family.get((file, span_key(item)))
        target = item.get("target") or item.get("writeDestination")
        writer = bool(item.get("aliasWriteCheck", {}).get("isWriter")) or bool(
            item.get("writeDestination")
        )
        alias_violation = bool(writer and target in aliases)
        if alias_violation:
            violations.append({"rowId": rid, "kind": "writer-destination-is-alias", "target": target})
        custody = source_custody(item) if item.get("admission") == "REJECT" else None
        if cls == "rejected-not-consumer" and custody is None:
            raise ValueError(f"rejected row has no non-document use or prior custody: {rid}")
        applied_evidence = item.get("appliedEditEvidence")
        if cls == "applied-safe" and not applied_evidence:
            raise ValueError(f"applied-safe row has no applied-edit evidence: {rid}")
        row = {
            "rowId": rid,
            "stage": stage,
            "record": str(record_path.relative_to(ROOT)),
            "recordLine": record_line,
            "file": file,
            "referenceId": item_id(item),
            "admission": item.get("admission"),
            "recordDisposition": item.get("disposition"),
            "dispositionClass": cls,
            "patchSpecId": patch_id(stage, file, item) if cls == "prepared-for-cutover" else None,
            "parkFamilyId": family_id if cls == "individually parked" else None,
            "blocker": (
                (item.get("blockedReason") or item.get("dependency") or "unresolved park")
                if cls == "individually parked"
                else None
            ),
            "nonDocumentUseOrCustody": custody,
            "appliedEditEvidence": applied_evidence,
            "target": target,
            "writerDestinationIsAlias": alias_violation,
        }
        if cls is None:
            unmatched.append({"rowId": rid, "reason": "record disposition fits no handoff class"})
        if cls == "individually parked" and family_id is None:
            unmatched.append({"rowId": rid, "reason": "park has no resolution-plan family"})
        rows.append(row)

    # Step 5 is the final owning-item join over the Step 3--5 census surfaces.
    # Emitting the earlier record rows again would double-count inherited
    # references.  Their executable diffs remain in patch-order below.
    for path in record_files("step-05-records"):
        for n, record in enumerate(jsonl(path), 1):
            for field in ("references", "dynamicTraces", "authorAddedReferences"):
                for item in record.get(field, []):
                    add("step-05", path, n, record, item)
    rows.sort(key=lambda x: (x["file"], x["stage"], x["record"], x["recordLine"], x["referenceId"]))
    compact_ids = {}
    for index, row in enumerate(rows, 1):
        old_id = row["rowId"]
        row["rowId"] = f"r{index:05d}"
        compact_ids[old_id] = row["rowId"]
    for issue in [*violations, *unmatched]:
        issue["rowId"] = compact_ids[issue["rowId"]]
    return rows, violations, unmatched


def build_patch_order(pin: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_id: dict[str, dict[str, Any]] = {}
    loaded_records: dict[tuple[str, int], dict[str, Any]] = {}

    def attach(spec: dict[str, Any], record_path: str, record_line: int, record: dict[str, Any]) -> None:
        ref = {"record": record_path, "recordLine": record_line}
        if ref not in spec["recordRefs"]:
            spec["recordRefs"].append(ref)
        diff = record.get("diff")
        if diff:
            payload = {**ref, "sha256": sha(diff)}
            if payload not in spec["forwardDiffRefs"]:
                spec["forwardDiffRefs"].append(payload)
        rollback = record.get("rollbackDiff")
        if rollback:
            payload = {**ref, "sha256": sha(rollback)}
            if payload not in spec["rollbackDiffRefs"]:
                spec["rollbackDiffRefs"].append(payload)

    for row in rows:
        spec_id = row["patchSpecId"]
        if not spec_id:
            continue
        current = by_id.setdefault(
            spec_id,
            {
                "patchSpecId": spec_id,
                "coCutUnit": spec_id.split(":", 1)[0] == "r26",
                "path": row["file"],
                "pinnedSourceBlob": blob(pin, row["file"]),
                "rowIds": [],
                "recordRefs": [],
                "forwardDiffRefs": [],
                "rollbackDiffRefs": [],
                "blockers": [],
            },
        )
        current["rowIds"].append(row["rowId"])
        record_key = (row["record"], row["recordLine"])
        if record_key not in loaded_records:
            loaded_records[record_key] = jsonl(ROOT / row["record"])[row["recordLine"] - 1]
        attach(current, row["record"], row["recordLine"], loaded_records[record_key])
        if current["pinnedSourceBlob"] is None:
            current["blockers"].append("path-absent-at-pin")
    for stage, directory in (("step-03", "step-03-records-r3"), ("step-04", "step-04-records")):
        for path in record_files(directory):
            for n, record in enumerate(jsonl(path), 1):
                for item in record.get("edges", []):
                    if disposition_class(stage, item) != "prepared-for-cutover":
                        continue
                    file = item.get("consumerFile") or record["file"]
                    spec_id = patch_id(stage, file, item)
                    source_blob = blob(pin, file)
                    current = by_id.setdefault(
                        spec_id,
                        {
                            "patchSpecId": spec_id,
                            "coCutUnit": False,
                            "path": file,
                            "pinnedSourceBlob": source_blob,
                            "rowIds": [],
                            "recordRefs": [],
                            "forwardDiffRefs": [],
                            "rollbackDiffRefs": [],
                            "blockers": [],
                        },
                    )
                    current["rowIds"].append(
                        f"{stage}:{path.name}:{n}:{item_id(item)}"
                    )
                    attach(current, str(path.relative_to(ROOT)), n, record)
                    if source_blob is None:
                        current["blockers"].append("path-absent-at-pin")
    ordered = sorted(by_id.values(), key=lambda x: (0 if x["coCutUnit"] else 1, x["patchSpecId"], x["path"]))
    for index, spec in enumerate(ordered, 1):
        spec["order"] = index
        spec["rowIds"].sort()
        spec["recordRefs"].sort(key=lambda x: (x["record"], x["recordLine"]))
        spec["forwardDiffRefs"].sort(key=lambda x: (x["record"], x["recordLine"]))
        spec["rollbackDiffRefs"].sort(key=lambda x: (x["record"], x["recordLine"]))
        spec["specKind"] = "text-patch" if spec["forwardDiffRefs"] else "generator-or-row-action"
        if not spec["forwardDiffRefs"]:
            spec["blockers"].append("exact-generator-or-row-action-at-final-pin")
        spec["blockers"] = sorted(set(spec["blockers"] + ["final-pin-rebind-and-review"]))
    rollback = [spec["patchSpecId"] for spec in reversed(ordered)]
    return {"version": 1, "sourceCommit": pin, "patches": ordered, "rollbackOrder": rollback}


def changed_candidates(pin: str) -> list[dict[str, Any]]:
    original = read_json(
        PLAN / "reports/phase-07/step-09-runner-n1-open-sets.json"
    )["filesUnknownBlocking"]
    sources: dict[str, set[str]] = collections.defaultdict(set)
    for row in original:
        sources[row["path"]].add("A47-original-35")
    incoming = [
        "docs/platform/agent-protocol/spec.md",
        "docs/platform/component-boundary.md",
        "docs/platform/event-store/spec.md",
        "docs/platform/git/spec.md",
        "docs/platform/holder-lock/spec.md",
        "docs/platform/intent-preservation-ledger.md",
        "docs/platform/packaging-distribution/contracts/activation-binding.md",
        "docs/platform/packaging-distribution/contracts/release-manifest.md",
        "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
        "docs/platform/process/spec.md",
        "docs/platform/run-supervisor/spec.md",
        "docs/platform/session-identity/spec.md",
        "docs/platform/terminal-control/spec.md",
    ]
    for path in incoming:
        sources[path].add("L12-1-incoming-13")
    for artifact in sorted(HERE.glob("step-00-l12-*-merge-rebindings.json")):
        data = read_json(artifact)
        candidates = data.get("changedCandidateFiles") or []
        candidates += data.get("phase9ConservationUnionAdditions") or []
        for path in candidates:
            if path.startswith("docs/platform/"):
                sources[path].add(artifact.name)
    # This diff is the catch-all demanded by the brief: every candidate path
    # edited after the A47 baseline, including changes not named by an import.
    changed = git("diff", "--name-only", "6f0f39ca1", pin, "--", "docs/platform/**").splitlines()
    for path in changed:
        if path:
            sources[path].add("phase8-final-union-recompute")
    return [
        {
            "path": path,
            "sources": sorted(source),
            "blobAtPin": blob(pin, path),
            "rebindReceipt": "needs-rebind",
            "status": "blocked",
            "blocker": "final-pin-rebind",
        }
        for path, source in sorted(sources.items())
    ]


def special_rows() -> list[dict[str, Any]]:
    carry = read_json(HERE / "step-05-step7-carry.json")
    rows = [
        {
            "id": f"step5-carry:{item['id']}",
            "kind": "step-05-step7-carry",
            "status": "blocked",
            "blocker": "final-pin-composition-and-review",
            "evidence": item.get("sourceReview"),
            "action": item["proposedStep7Action"],
        }
        for item in carry["items"]
    ]
    rows.extend(
        [
            {"id": "A34-two-line-residual", "kind": "inherited", "status": "blocked", "blocker": "digest-bound-AGENTS-two-line-reconciliation", "evidence": "phase-09-atomic-platform-authority-cutover.md:31"},
            {"id": "PF-I022-PF-I023", "kind": "identity-reconciliation", "status": "blocked", "blocker": "Phase-9-main-reference-reconciliation", "evidence": "owner-answers.md#L12-1"},
            {"id": "reading-map-entry-merge", "kind": "content-merge", "status": "blocked", "blocker": "entry-by-entry-independent-review", "evidence": "phase-09-atomic-platform-authority-cutover.md:31"},
            {"id": "holder-lock-status-header", "kind": "header-refresh", "status": "blocked", "blocker": "main-import-cutover-step", "evidence": "L11-23/L12 Step 7 input"},
            {"id": "P7-DOC-GAP-05", "kind": "pre-landing-guard", "status": "blocked", "blocker": "dead-vocabulary-guard", "evidence": "owner-answers.md#L12-98"},
            {"id": "P7-DOC-GAP-06", "kind": "stale-citations", "status": "blocked", "blocker": "two-stale-code-citations", "evidence": "phase-09-atomic-platform-authority-cutover.md:59"},
            {"id": "plan-a-phase-06", "kind": "landing-status", "status": "ready", "blocker": None, "evidence": "plans/261006-1415-fgos-single-door-mechanisms/reports/main-integration.md; a004bb59802016d3ddd63f6b8e430fdfa599d60e"},
            {"id": "plan-b-phase-06", "kind": "landing-status", "status": "blocked", "blocker": "Plan-B-is-draft-and-phase-06-does-not-exist", "evidence": "plans/261006-1445-fgctl-dev-activation/plan.md:43"},
            {"id": "step-06b-lease", "kind": "lease", "status": "blocked", "blocker": "delivery-and-rehearsal-receipts-missing", "evidence": "step-06b-lease-reuse-check.md"},
            {"id": "L12-96-state-export", "kind": "state-export", "status": "blocked", "blocker": "final-pin-bounded-export-not-taken", "evidence": "owner-answers.md#L12-96"},
            {"id": "final-pin", "kind": "pin", "status": "blocked", "blocker": "this-is-pre-pin-dry-run", "evidence": "step-07-preassembly-brief.md"},
        ]
    )
    return sorted(rows, key=lambda x: x["id"])


def final_resolution(pin: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Apply final owning-row decisions as a digest-bound overlay, not to frozen receipts.

    Step 3--5 records and their review hashes remain historical inputs. The final
    matrix consumes every overlay row; no flipped disposition is merely projected.
    """
    export = read_json(HERE / 'step-07-state-path-export.json')
    proof = read_json(HERE / 'step-07-generator-path-proof.json')
    bindings = read_json(HERE / 'step-07-final-binding-check.json')
    actions = read_json(HERE / 'step-07-final-actions.json')
    for evidence in (proof, bindings, actions):
        if evidence['sourceCommit'] != pin:
            raise ValueError('final evidence is not bound to this pin')
    if proof['exportSha256'] != sha((HERE / 'step-07-state-path-export.json').read_text()):
        raise ValueError('state export changed after proof')
    if bindings['errors'] or proof['currentPathMoves']:
        raise ValueError('unresolved binding or registry currentPath move')
    by_key = {(str(pathlib.Path(r['record']).relative_to(HERE.relative_to(ROOT))), r['recordLine'], r['referenceId']): r for r in rows}
    family_source = read_json(HERE / 'step-07-park-families.json')
    source_records = {}
    value_index: dict[str, list[str]] = collections.defaultdict(list)
    for n, doc in enumerate(export['docs']):
        for field in ('currentPath', 'aliases', 'sourceCaptureIds'):
            values = doc.get(field, [])
            if isinstance(values, str):
                values = [values]
            for i, value in enumerate(values):
                value_index[value].append(f'/docs/{n}/{field}' + (f'/{i}' if field != 'currentPath' else ''))
    slot_proof = {r['docId']: r for r in proof['registryPathEvidence']}
    generic_blockers = {
        'gen-doc-registry': 'export-omits-topic-lineage-and-full-generated-field-inputs',
        'gen-enduser-index': 'final-scan-set-and-unregistered-slot-generator-output-not-composed',
        'gen-decision-index': 'export-has-only-id-pathValues-not-scope-text-rationale-ts-for-state-wins-union',
        'state-registry-export': 'full-projection-or-quadrant-input-parity-not-proved-by-path-only-export',
        'state-work-docsref': 'export-omits-effective-content-worktree-and-branch-pins-and-complete-acceptance-tokens',
        'state-inventory-oldpath': 'export-inventory-rows-have-only-oldPath-no-topicId-role-or-move-destinations',
        'state-outcome-and-evidence': 'raw-outcome-path-reachability-and-truncated-acceptance-token-parity-unproven',
        'readset-post-retirement-scan': 'successor-scan-set-not-composed-and-Lead-dynamic-023895-placement-owed',
        'decision-f-ratchet-retirement': 'three-L12-89-replacement-guards-not-yet-composed-with-retirement',
        'r26:docs/doc-governance.md': 'content-conservation-and-gate-reader-patches-not-yet-composed',
        'gateway-ctr010-contract-citations': 'consumer-specific-YAML-citation-and-live-holder-carriage-not-yet-composed',
        'citation-convention-and-scan': 'per-area-convention-and-recursive-spec-scan-coverage-not-yet-bound',
        'carry-foundations-and-retired-decision-narratives': '13-verbatim-claim-passages-and-live-holder-carriage-not-yet-composed',
        'carry-knowledge-registry-framework': '12-verbatim-claim-passages-and-live-holder-carriage-not-yet-composed',
        'carry-runner-workstate-doctrine': '11-verbatim-claim-passages-and-live-holder-carriage-not-yet-composed',
        'split-area-holder-mapping': 'published-area-to-holder-scope-table-and-consumer-patches-not-yet-composed',
        'carry-distribution-gateway-claims': '8-verbatim-claim-passages-and-live-holder-carriage-not-yet-composed',
        'r26:docs/architecture-map.md': 'target-lacks-required-0010-0015-0017-heading-carriage-and-reader-patch',
    }
    preserve_families = {'r26:docs/decisions/index.md', 'r26:docs/enduser-docs-index.json', 'r29-native-land-decisions-tree', 'r26:docs/architecture-manifest.json'}
    applied = []
    summaries = []
    source_cache = {}
    source_bindings = []
    source_binding_ids = {}
    historical_source_cache = {}
    for family in family_source['families']:
        family_id = family['id']
        counts: collections.Counter[str] = collections.Counter()
        for member in family['members']:
            key = (member['recordFile'], member['recordLine'], member['id'])
            row = by_key[key]
            if row['recordDisposition'] != 'parked':
                raise ValueError(f'park input changed: {key}')
            record_file = member['recordFile']
            if record_file not in source_records:
                source_records[record_file] = jsonl(HERE / record_file)
            rec = source_records[record_file][member['recordLine'] - 1]
            item = next(i for field in ('references', 'dynamicTraces', 'authorAddedReferences') for i in rec.get(field, []) if item_id(i) == member['id'])
            new = 'parked'
            evidence = 'step-07-park-resolution-plan.json#' + family_id
            blocker = generic_blockers.get(family_id)
            pointers = []
            if family_id in preserve_families:
                new, blocker = 'preserve', None
                evidence = 'owner-answers.md#L12-96'
            elif family_id in {'gen-doc-registry', 'gen-enduser-index'}:
                token = item.get('matchedExpression')
                pointers = value_index.get(token, [])
                if family_id == 'gen-doc-registry' and pointers:
                    new, blocker = 'preserve', None
                elif family_id == 'gen-enduser-index' and pointers:
                    # Generated alias/currentPath must belong to a retained scanned slot,
                    # not just equal another slot's historical string by coincidence.
                    valid = [p for p in pointers if slot_proof[export['docs'][int(p.split('/')[2])]['docId']]['generatedAliasesEqual']]
                    if valid:
                        pointers, new, blocker = valid, 'preserve', None
                evidence = 'step-07-generator-path-proof.json'
            elif family_id == 'state-registry-export':
                operand = str(item.get('pathOperand') or '')
                # Only direct persisted operand/alias uses; full writers/scans and
                # inventory joins retain their more demanding consumer proof.
                if member['file'] not in {'scripts/knowledge-bootstrap.mjs', 'scripts/knowledge-migration.mjs'} and (
                    'currentPath' in operand or 'aliases' in operand
                ) and item.get('role') != 'document-reader-writer-or-default':
                    new, blocker = 'preserve', None
                    evidence = 'step-07-generator-path-proof.json#registryPathEvidence'
            elif family_id == 'r26:docs/contracts/fgos-gateway-api-v1.yaml':
                new = 'patch'
                blocker = 'compose-other-file-hunks-and-independently-review-CTR010-co-cut'
                evidence = 'step-07-final-prepared-specs.json#gateway-contract-reader-move'
            if family_id == 'carry-distribution-gateway-claims' and member['id'] == 'reference-000209':
                holder = (ROOT / 'docs/platform/herdr-web-dashboard/spec.md').read_text()
                if '## Business Rules' not in holder or 'binds 0.0.0.0 by default, bind address configurable' not in holder or 'warning raised when the bind is not loopback' not in holder:
                    raise ValueError('network R5 claim not conserved by current holder')
                new = 'patch'
                blocker = 'compose-other-network-comment-hunks-and-independent-review'
                evidence = 'step-07-final-prepared-specs.json#network-r5-live-holder'
            if family_id == 'gateway-ctr010-contract-citations' and member['id'] == 'reference-000307':
                # Exact identical counterpart is already preserve in the Step 5 join.
                # The full-history witness is stored with final obligations.
                new, blocker = 'preserve', None
                evidence = 'step-07-final-obligations.json#step5-carry:gateway-yaml-research-split'
            source_binding = None
            if new != 'parked':
                path = member['file']
                if path not in source_cache:
                    source_cache[path] = (ROOT / path).read_text()
                current = source_cache[path]
                current_digest = sha(current)
                source_binding = {'file': path, 'recordSourceSha256': rec.get('sourceSha256'), 'sourceSha256AtPin': current_digest, 'mode': 'unchanged-source-bytes'}
                if current_digest != rec.get('sourceSha256'):
                    witnesses = []
                    for field in ('currentPassage', 'passage', 'operationWitness'):
                        witness = item.get(field)
                        if isinstance(witness, dict):
                            witness = witness.get('text')
                        if isinstance(witness, str) and witness and current.count(witness) == 1:
                            witnesses.append(witness)
                    if witnesses:
                        witness = max(witnesses, key=len)
                        offset = current.index(witness)
                        start = current.count('\n', 0, offset) + 1
                        lines = current.splitlines()
                        source_binding.update(mode='exact-unique-current-passage', passageSha256=sha(witness), currentLine=start, neighbourhoodSha256=sha('\n'.join(lines[max(0, start - 3):start + witness.count('\n') + 2])))
                    elif family_id == 'r29-native-land-decisions-tree':
                        old_pin = rec['authorInputCommit']
                        if (old_pin, path) not in historical_source_cache:
                            historical_source_cache[(old_pin, path)] = subprocess.check_output(['git', '-C', str(ROOT), 'show', f'{old_pin}:{path}']).decode()
                        if sha(historical_source_cache[(old_pin, path)]) != rec['sourceSha256'] or 'nextFreeDecisionId' in current or 'DECISION_INDEX_PATH' in current:
                            raise ValueError('native Land historical preservation witness changed')
                        subprocess.run(['git', '-C', str(ROOT), 'merge-base', '--is-ancestor', '63b777873c44e8977d16857e80246b043240ed0b', pin], check=True)
                        source_binding.update(mode='historical-preserve-mechanism-retired-at-pin', historicalPin=old_pin, retirementCommit='63b777873c44e8977d16857e80246b043240ed0b', scope='No live native-numbered decision reader/writer or current caller remains; preserve historical identity only, not dormant live code.')
                    else:
                        new, blocker = 'parked', 'exact-current-source-passage-and-context-rebinding-required'
                        source_binding['mode'] = 'unresolved-current-source-binding'
                encoded = compact_json(source_binding)
                if encoded not in source_binding_ids:
                    source_binding_ids[encoded] = len(source_bindings)
                    source_bindings.append(source_binding)
                source_binding = source_binding_ids[encoded]
            if blocker:
                blocker = f'{family_id}:{member["id"]}@{member["file"]}: {blocker}'
            counts[new] += 1
            row['effectiveDisposition'] = new
            if new == 'patch' and family_id == 'r26:docs/contracts/fgos-gateway-api-v1.yaml':
                row['target'] = 'docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml'
            if new == 'patch' and member['id'] == 'reference-000209':
                row['target'] = 'docs/platform/herdr-web-dashboard/spec.md#business-rules'
            row['dispositionClass'] = {'preserve': 'preserved-history/fixture', 'patch': 'prepared-for-cutover', 'parked': 'individually parked'}[new]
            row['patchSpecId'] = patch_id('step-05', row['file'], item) if new == 'patch' else None
            row['parkFamilyId'] = family_id
            row['blocker'] = blocker if new == 'parked' else None
            applied.append({'rowId': row['rowId'], 'recordFile': record_file, 'recordLine': member['recordLine'], 'file': member['file'], 'memberId': member['id'], 'familyId': family_id, 'oldDisposition': 'parked', 'newDisposition': new, 'evidence': evidence, 'exportPointers': pointers, 'remainingBlocker': blocker, 'sourceBindingIndex': source_binding, 'owner': 'Lead/documentation integration owner' if blocker else None})
        summaries.append({'familyId': family_id, 'memberCount': len(family['members']), 'byDisposition': dict(sorted(counts.items())), 'flips': len(family['members']) - counts['parked']})
    if len(applied) != 2311 or len({r['rowId'] for r in applied}) != 2311:
        raise ValueError('final resolution loses or duplicates a park member')
    records = sorted(source_records)
    files = sorted({r['file'] for r in applied})
    evidence = sorted({r['evidence'] for r in applied})
    blockers = sorted({r['remainingBlocker'] for r in applied if r['remainingBlocker']})
    compact_rows = [[r['rowId'], records.index(r['recordFile']), r['recordLine'], files.index(r['file']), r['memberId'], r['familyId'], r['oldDisposition'], r['newDisposition'], evidence.index(r['evidence']), r['exportPointers'], blockers.index(r['remainingBlocker']) if r['remainingBlocker'] else None, r['sourceBindingIndex']] for r in applied]
    result = {'version': 1, 'sourceCommit': pin, 'authority': 'L12-96; L12-118', 'application': 'Effective final-owning-row overlay consumed by the final matrix. Frozen Step 3/4/5 records and their historical hashes are not rewritten; original and effective dispositions remain separately recoverable.', 'recordCatalog': [{'path': p, 'sha256': sha((HERE / p).read_text())} for p in records], 'fileCatalog': files, 'evidenceCatalog': evidence, 'blockerCatalog': [{'blocker': b, 'owner': 'Lead/documentation integration owner'} for b in blockers], 'total': len(applied), 'flips': sum(r['newDisposition'] != r['oldDisposition'] for r in applied), 'families': summaries, 'rowSchema': ['rowId', 'recordIndex', 'recordLine', 'fileIndex', 'memberId', 'familyId', 'oldDisposition', 'newDisposition', 'evidenceIndex', 'exportPointers', 'blockerIndex', 'sourceBindingIndex'], 'sourceBindingCatalog': source_bindings, 'rows': compact_rows}
    (HERE / 'step-07-park-resolution-applied.json').write_text(compact_json(result))
    return result


def final_prepared_specs(pin: str) -> dict[str, Any]:
    actions = read_json(HERE / 'step-07-final-actions.json')
    specs = []
    for action in actions['actions']:
        for path in action['paths']:
            before = (ROOT / path).read_text()
            occurrences = before.count(action['old'])
            if not occurrences or (not action['replaceAll'] and occurrences != 1):
                raise ValueError(f'prepared action is ambiguous or absent: {action["id"]}:{path}')
            after = before.replace(action['old'], action['new'])
            delta = list(difflib.ndiff(before.splitlines(True), after.splitlines(True)))
            if ''.join(difflib.restore(delta, 1)) != before or ''.join(difflib.restore(delta, 2)) != after:
                raise ValueError('forward/inverse reconstruction failed')
            specs.append({'id': action['id'], 'path': path, 'sourceCommit': pin, 'sourceBlob': blob(pin, path), 'beforeSha256': sha(before), 'expectedAfterSha256': sha(after), 'replacedOccurrences': occurrences, 'diff': ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/' + path, tofile='b/' + path)), 'rollbackDiff': ''.join(difflib.unified_diff(after.splitlines(True), before.splitlines(True), fromfile='a/' + path, tofile='b/' + path)), 'roundtrip': True, 'evidence': action['evidence'], 'remainingBlocker': action['remainingBlocker']})
    source_pins = {p: sha((ROOT / p).read_text()) for p in ('src/runner/dispatch/assignment-runner.mjs', 'src/runner/dispatch/execution-contract.mjs', 'src/runner/repo-locks.mjs', 'src/holder-lock/index.mjs', 'docs/platform/herdr-web-dashboard/spec.md', 'docs/knowledge/fgos-triage-table-columns/triage-table-columns.md')}
    result = {'sourceCommit': pin, 'specs': specs, 'citationSourcePins': source_pins, 'appliedToWorkspace': False, 'independentlyAccepted': False}
    (HERE / 'step-07-final-prepared-specs.json').write_text(compact_json(result))
    return result


def final_obligations(pin: str) -> list[dict[str, Any]]:
    carries = read_json(HERE / 'step-05-step7-carry.json')['items']
    obligations = []
    anchor_edges = [r for r in jsonl(HERE / 'step-04-records/step04-009.jsonl')[0]['edges'] if r['edgeId'] in {'instructions-008', 'instructions-009'}]
    binding_proof = read_json(HERE / 'step-07-final-binding-check.json')
    if len(anchor_edges) != 2 or len({r['anchor'] for r in anchor_edges}) != 1 or any(r['anchor'] not in binding_proof['stringCatalog'] for r in anchor_edges):
        raise ValueError('AGENTS 0030 anchor reconciliation fails')
    for item in carries:
        resolved = item['id'] in {'gateway-yaml-research-split', 'agents-0030-anchor-slug'}
        prepared = item['id'] in {'network-r5-park-to-patch', 'triage-absent-goal-tier-claim'}
        remaining = 'Exact supplemental comment patch prepared; compose remaining file hunks and independently review before cutover.' if prepared else item['proposedStep7Action']
        if item['id'] == 'agents-0030-anchor-slug':
            remaining = 'Both original AGENTS patch occurrences use the same final extractor-valid 0030 anchor. This resolves slug reconciliation only, not the whole AGENTS packet/A34.'
        obligations.append({'id': 'step5-carry:' + item['id'], 'kind': 'step-05-step7-carry', 'status': 'resolved-in-records' if resolved else 'prepared-for-cutover' if prepared else 'blocked', 'owner': 'Lead / final consumer-composition owner / independent integration reviewer', 'blocker': None if resolved else remaining, 'evidence': item['sourceReview'] + ('; step-07-final-prepared-specs.json' if prepared else '; step-07-final-binding-check.json' if item['id'] == 'agents-0030-anchor-slug' else ''), 'action': remaining if resolved or prepared else item['proposedStep7Action']})
    def add(id: str, kind: str, status: str, owner: str, blocker: str | None, evidence: str) -> None:
        obligations.append(dict(id=id, kind=kind, status=status, owner=owner, blocker=blocker, evidence=evidence))
    add('A34-two-line-residual', 'inherited', 'blocked', 'Root-instruction owner / independent A34 reviewer', 'Reconcile exact AGENTS instruction claims claim_5c520fcb1a68ba27e2093341834258c7 and claim_2ae81c7bed935553943d6777b81e2114; do not delete source-to-self residuals. Other 28 A34 residual representations remain governed by their existing acceptance.', 'reports/phase-06/owner-queue.md:423; phase-09-atomic-platform-authority-cutover.md:31')
    add('PF-I022-PF-I023', 'identity-reconciliation', 'prepared-for-cutover', 'Intent-ledger owner / Lead integration reviewer', 'Digest-bound sole main report reference patch is prepared, not applied or independently accepted.', 'step-07-final-prepared-specs.json#intent-ledger-main-reference-reconciliation')
    add('reading-map-entry-merge', 'content-merge', 'blocked', 'Documentation-navigation owner / independent entry reviewer', 'Entry-by-entry union of docs/specs/reading-map.md into docs/reading-map.md remains uncomposed; L11-25 accepted divergence is not merge proof.', 'phase-09-atomic-platform-authority-cutover.md:31; owner-answers.md#L12-112')
    add('holder-lock-status-header', 'header-refresh', 'prepared-for-cutover', 'Holder-lock owner / independent promotion reviewer', 'In-process header update is present; a digest-bound correction for remaining retired fence wording is now prepared, not applied.', 'step-07-final-prepared-specs.json#holder-lock-current-header')
    add('P7-DOC-GAP-05', 'pre-landing-guard', 'blocked', 'Lead placement decision / component-boundary owner', 'Place dynamic-023895 carriage, compose successor scan, and replay dead-vocabulary guard. No expected-red waiver.', 'owner-answers.md#L12-96; reports/phase-07/owner-answers.md#P7-DOC-GAP-05')
    add('P7-DOC-GAP-06', 'stale-citations', 'prepared-for-cutover', 'Agent-coordination owner / independent promotion reviewer', 'Both stale citations now have exact forward/inverse patches and source digests; pending independent review/application.', 'step-07-final-prepared-specs.json#stale-assignment-provenance-citation; #stale-execution-budget-citation')
    for name, commit, evidence in (
        ('plan-a-phase-06', 'a004bb59802016d3ddd63f6b8e430fdfa599d60e', 'plans/261006-1415-fgos-single-door-mechanisms/reports/main-integration.md'),
        ('plan-b-phase-06', '461e12d12a2186c53ae2eec0953bcd7cec83192b', 'archive/plans/261006-1415-fgos-convention-component/phase-06-agents-line.md'),
    ):
        subprocess.run(['git', '-C', str(ROOT), 'merge-base', '--is-ancestor', commit, '9c7edde30'], check=True)
        add(name, 'landing-status', 'ready', 'AGENTS cutover packet owner', None, evidence + '; main ancestor ' + commit)
    add('plan-label-correction', 'record-correction', 'recorded', 'Lead integration reviewer', None, 'Plan B is convention, archived completed; Plan C plans/261006-1445-fgctl-dev-activation/plan.md is draft/unscheduled and explicitly NOT a cutover dependency (plan.md section 7.5). L12-99/preassembly named Plan C as Plan B incorrectly. The brief repeats that historical mislabel; no draft is falsely reported landed.')
    add('step-06b-lease', 'lease', 'delivered-reviewed-rehearsed', 'Lead / Git owner / Holder-lock owner', 'Land with Phase 9; Git-owner consent for Git spec section 7 and Holder-lock notification receipt remain owed. Integrated fresh Git scope/ref proof must precede cutover, not trust sidecar drift.', 'owner-answers.md#L12-115; step-06b-rehearsal.md; review-a38-step-06b-final.md (predates O1 follow-up)')
    add('L12-96-state-export', 'state-export', 'delivered-bounded', 'Lead state-export owner / consumer proof owners', 'Export receipt exists; missing decision fields, inventory role/destinations, worktree pins and complete acceptance strings still block the affected individual members. Do not rerun/export live state in this turn.', 'step-07-state-path-export.json; step-07-generator-path-proof.json#limits')
    add('registry-preexisting-missing-slot', 'input-gap', 'blocked', 'Knowledge-registry owner', 'One exported currentPath is absent at the pin: docs/knowledge/how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name/wire-a-skill-to-an-executor-by-purpose-not-name.md. Unchanged path output is not document-existence proof.', 'step-07-generator-path-proof.json#registryPathEvidence')
    add('post-census-workflow-holder', 'new-main-source', 'blocked', 'Workflow owner / documentation migration owner', 'Current registrations.mjs:6382 cites docs/specs/workflow.md RUL-WF-27; docs/platform/workflow/spec.md is absent. Preserve current source until a real conserved successor is bound, not a guessed path rewrite.', 'step-05-step7-carry.json#earlier-post-census-workflow')
    add('retired-native-land-mechanism', 'prior-art', 'recorded', 'Identity / Git owners / integration reviewer', None, 'All eight family members preserve their exact historical identity. Current src/runner/merge.mjs has no nextFreeDecisionId/DECISION_INDEX_PATH: main commit 63b777873c44e8977d16857e80246b043240ed0b removed the numbered-file self-resolver intentionally for identity mint. The final source-binding catalog proves old source bytes and retirement ancestry, not dormant live code.')
    verification = read_json(HERE / 'step-07-final-verification.json')
    if verification['sourceCommit'] != pin:
        raise ValueError('verification is not pinned')
    scan = verification['censusRescan']
    add('current-census-semantic-join', 'current-source-coverage', 'blocked', scan['owner'], f"Final semantic join remains for {len(scan['newLiteralSites'])} introduced literal and {len(scan['newDocumentationDynamicSites'])} documentation-cued dynamic inventory sites. Each site is named by class/path/line/expression hash in the current-pin rescan; lexical presence is not an unowned-consumer verdict or an old-ID approval.", 'step-07-final-verification.json#censusRescan')
    add('common-light-Git-fixture-tests', 'bounded-proof', 'blocked', 'Lead in authorized proof environment', 'Complete candidate-status and constitution test files perform git init/add/commit in fixtures. They were not filtered or run under the strict no-Git-write worker boundary. Run both complete files before independent acceptance; not an expected-red waiver.', 'step-07-final-verification.json#unrunRequiredChecks')
    if verification['mainDrift']['tier1IdentityPaths'] or verification['mainDrift']['tier2Overlap']:
        add('new-main-drift', 'integration-gate', 'blocked', 'Lead integration owner', 'Current main identity/exact-write overlap requires accounted per-file review before acceptance.', 'step-07-final-verification.json#mainDrift')
    add('final-pin', 'pin', 'ready', 'Lead integration owner', None, pin + '; latest main 9c7edde30 imported by ad98c3882')
    extra = {'sourceCommit': pin, 'obligations': sorted(obligations, key=lambda r: r['id']), 'researchPointerWitness': {'command': 'git log --all --format=%H -- docs/history/tsk-4id-task-detail-screen/RESEARCH.md', 'commits': git('log', '--all', '--format=%H', '--', 'docs/history/tsk-4id-task-detail-screen/RESEARCH.md').splitlines(), 'copiesEqualAtPin': sha((ROOT / 'docs/contracts/fgos-gateway-api-v1.yaml').read_text()) == sha((ROOT / 'docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml').read_text()), 'scope': 'Broken historical research pointer stays explicit in both identical YAML copies, without an invented holder. Final owning overlay preserves reference-000307; existing reference-002240 already preserves. Earlier Step 3 judgments remain immutable history.'}}
    if extra['researchPointerWitness']['commits'] or not extra['researchPointerWitness']['copiesEqualAtPin']:
        raise ValueError('historical YAML preserve witness no longer holds')
    (HERE / 'step-07-final-obligations.json').write_text(compact_json(extra))
    return extra['obligations']


def assemble(pin_arg: str, output_dir: pathlib.Path, final: bool = False) -> dict[str, Any]:
    pin = git("rev-parse", f"{pin_arg}^{{commit}}")
    output_dir.mkdir(parents=True, exist_ok=True)
    if output_dir.resolve() != HERE.resolve():
        raise ValueError(f"output dir must be the Phase 8 report directory: {HERE}")
    families, projections = park_families()
    rows, alias_violations, unmatched = build_matrix(pin, alias_paths(), families)
    resolution = None
    prepared = None
    if final:
        prepared = final_prepared_specs(pin)
        resolution = final_resolution(pin, rows)
        projections = resolution['families']
    class_names = (
        "applied-safe",
        "prepared-for-cutover",
        "preserved-history/fixture",
        "individually parked",
        "rejected-not-consumer",
    )
    raw_counts = collections.Counter(
        row["dispositionClass"] or "unmatched" for row in rows
    )
    counts = {name: raw_counts.get(name, 0) for name in class_names}
    record_paths = sorted({row["record"] for row in rows})
    record_ids = {path: f"rec{index:02d}" for index, path in enumerate(record_paths, 1)}
    record_catalog = [
        {
            "id": record_ids[path],
            "path": str(pathlib.Path(path).relative_to(HERE.relative_to(ROOT))),
        }
        for path in record_paths
    ]
    custody_values = {
        (custody[0], json.dumps(custody[1], ensure_ascii=False, sort_keys=True, separators=(",", ":"))): custody[1]
        for row in rows
        if (custody := row["nonDocumentUseOrCustody"]) is not None
    }
    custody_keys = sorted(custody_values)
    custody_ids = {key: f"cust{index:02d}" for index, key in enumerate(custody_keys, 1)}
    custody_catalog = [
        {"id": custody_ids[key], "kind": key[0], "value": custody_values[key]}
        for key in custody_keys
    ]
    consumer_rows = []
    rejected_rows = []
    for row in rows:
        common = [
            row["rowId"],
            record_ids[row["record"]],
            row["recordLine"],
            row["referenceId"],
        ]
        if row["dispositionClass"] == "rejected-not-consumer":
            custody = row["nonDocumentUseOrCustody"]
            custody_key = (
                custody[0],
                json.dumps(custody[1], ensure_ascii=False, sort_keys=True, separators=(",", ":")),
            )
            rejected_rows.append(
                common + ["rejected-not-consumer", custody_ids[custody_key]]
            )
        else:
            consumer_rows.append(
                common
                + [
                    row["dispositionClass"],
                    row["patchSpecId"],
                    row["parkFamilyId"],
                    row["blocker"],
                    "appliedEditEvidence" if row["appliedEditEvidence"] else None,
                ]
            )
    matrix = {
        "version": 2,
        "sourceCommit": pin,
        "generatedBy": "step-07-assemble.py",
        "dryRun": not final,
        "recordsOnly": True,
        "finalResolutionOverlay": 'step-07-park-resolution-applied.json' if final else None,
        "counts": {
            "rows": len(rows),
            "consumerRows": len(consumer_rows),
            "rejectedRows": len(rejected_rows),
            "byAdmission": {
                "ADMIT": sum(row["admission"] == "ADMIT" for row in rows),
                "REJECT": sum(row["admission"] == "REJECT" for row in rows),
                "unspecified": sum(row["admission"] is None for row in rows),
            },
            "byDispositionClass": counts,
        },
        "recordCatalog": record_catalog,
        "custodyCatalog": custody_catalog,
        "consumerRowSchema": [
            "rowId", "record", "recordLine", "referenceId", "dispositionClass",
            "patchSpecId", "parkFamilyId", "blocker", "appliedEditEvidence",
        ],
        "consumerRows": consumer_rows,
        "rejectedNotConsumerRowSchema": [
            "rowId", "record", "recordLine", "referenceId", "dispositionClass",
            "nonDocumentUseOrCustody",
        ],
        "rejectedNotConsumerRows": rejected_rows,
        "aliasViolations": alias_violations,
        "unmatchedRows": unmatched,
    }
    patch_order = build_patch_order(pin, rows)
    special = final_obligations(pin) if final else special_rows()
    candidates = changed_candidates(pin)
    if final:
        binding_proof = read_json(HERE / 'step-07-final-binding-check.json')
        by_path = {r['path']: r for r in binding_proof['files']}
        for candidate in candidates:
            receipt = by_path[candidate['path']]
            candidate.update(rebindReceipt='step-07-final-binding-check.json#' + candidate['path'], status='bound-at-pin' if receipt['present'] else 'retired-with-explicit-successor-carry', blocker=None if receipt['present'] else 'independent-identity-retirement-conservation-review', sha256=receipt['sha256'])
        final_source_records = {}
        for spec in patch_order['patches']:
            source_pins = []
            for ref in spec['recordRefs']:
                if ref['record'] not in final_source_records:
                    final_source_records[ref['record']] = jsonl(ROOT / ref['record'])
                rec = final_source_records[ref['record']][ref['recordLine'] - 1]
                source_pins.append({'record': ref['record'], 'recordLine': ref['recordLine'], 'recordSourceSha256': rec.get('sourceSha256'), 'sourceSha256AtPin': sha((ROOT / spec['path']).read_text()) if (ROOT / spec['path']).is_file() else None})
            spec['sourcePinChecks'] = source_pins
            drift = any(r['recordSourceSha256'] != r['sourceSha256AtPin'] for r in source_pins)
            spec['blockers'] = ['independent-final-composition-review']
            if drift:
                spec['blockers'].append('record-source-digest-differs-from-final-pin-compose-before-application')
            if not spec['forwardDiffRefs']:
                spec['blockers'].append('exact-generator-or-row-action-not-composed')
            supplementary = [r for r in prepared['specs'] if r['path'] == spec['path']]
            if supplementary:
                spec['supplementalPreparedSpecs'] = [{'record': 'step-07-final-prepared-specs.json', 'id': r['id'], 'forwardSha256': sha(r['diff']), 'rollbackSha256': sha(r['rollbackDiff'])} for r in supplementary]
                spec['blockers'].append('supplemental-path-patch-must-compose-with-earlier-file-hunks')
        patch_order['supplementalPreparedSpecs'] = [{'record': 'step-07-final-prepared-specs.json', 'id': r['id'], 'path': r['path']} for r in prepared['specs']]
    blockers = collections.Counter(
        row['blocker'] for row in special if row.get('blocker')
    )
    export_families = {
        "gen-doc-registry", "gen-enduser-index", "gen-decision-index",
        "state-registry-export", "state-work-docsref",
        "state-inventory-oldpath", "state-outcome-and-evidence",
    }
    blocked_row_readiness = []
    for row in rows:
        row_blockers = []
        if row['dispositionClass'] == 'prepared-for-cutover':
            row_blockers.extend(['independent-final-composition-review', 'Phase9-lease-landing-and-Git-owner-consent'] if final else ['final-pin', 'step-06b-lease-receipts'])
        elif row['dispositionClass'] == 'individually parked':
            row_blockers.append(row['blocker'] if final else 'park-resolution-at-final-pin')
        if not final and row.get('parkFamilyId') in export_families:
            row_blockers.append('L12-96-state-export')
        if row['file'] == 'AGENTS.md' and row['dispositionClass'] == 'prepared-for-cutover':
            row_blockers.append('A34-root-instruction-and-anchor-composition' if final else 'Plan-B-phase-06-landing')
        if row["referenceId"] == "dynamic-023895":
            row_blockers.append("P7-DOC-GAP-05")
        if row_blockers:
            blocked_row_readiness.append(
                {"rowId": row["rowId"], "blockers": sorted(set(row_blockers))}
            )
    readiness = {
        "version": 1,
        "sourceCommit": pin,
        "dryRun": not final,
        "recordsOnly": True,
        "readyForCutover": False,
        "rowCounts": matrix["counts"],
        "blockerCounts": dict(sorted(blockers.items())),
        "matrixViolations": {
            "writerDestinationAliases": len(alias_violations),
            "unmatchedRows": len(unmatched),
        },
        "changedCandidateUnion": candidates,
        "rowReadinessCounts": {
            "rows": len(rows),
            "blockedRows": len(blocked_row_readiness),
            "readyRows": len(rows) - len(blocked_row_readiness),
        },
        "blockedRowReadiness": blocked_row_readiness,
        "specialObligations": special,
        "parkProjection": projections,
        "parkProjectionMemberCount": sum(row["memberCount"] for row in projections),
        "noReadinessClaim": True,
    }
    rerun = f"python3 -B {HERE.relative_to(ROOT) / 'step-07-assemble.py'} {'--final ' if final else ''}--pin {pin if final else '<final-commit>'} --output-dir {HERE.relative_to(ROOT)}"
    if final:
        effective_moves = {'source': 'step-05-cutover-move-set.json', 'sourceSha256': sha((HERE / 'step-05-cutover-move-set.json').read_text()), 'retainPhysicalPaths': ['docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'], 'suppressMovesFrom': ['docs/decisions/index.md', 'docs/architecture-manifest.json'], 'dropProposedDestination': 'docs/knowledge/decisions-index/decision-record.md', 'authority': 'L12-96 Q2; per-family R26 retention proof', 'scope': 'Effective final cutover move-set adjustment; historical Step 5 move manifest remains frozen. No existing product file is deleted. Any historical diff containing a suppressed destination must be recomposed, not applied as-is.'}
        matrix['effectiveMoveSet'] = effective_moves
        patch_order['effectiveMoveSet'] = effective_moves
    rendered = {
        "step-07-consumer-cutover-matrix.json": compact_json(matrix),
        "step-07-patch-order.json": compact_json(patch_order),
        "step-07-readiness.json": compact_json(readiness),
    }
    artifact_sizes = {name: len(text.encode()) for name, text in rendered.items()}

    def render_report(total_bytes: int) -> str:
        report = [
            '# Step 7 final-pin records assembly' if final else '# Step 7 preassembly dry run',
            '',
            f'Pinned source commit: `{pin}`. Latest merged main: `9c7edde30` (merge `ad98c3882`).' if final else f'Pinned source commit: `{pin}`.',
            '',
            'Final owning-row decisions are applied through the digest-bound overlay, consumed by the matrix. Historical Step 3/4/5 receipts remain unchanged. No consumer edit, authority flip, cutover readiness or independent acceptance is claimed.' if final else 'This is a deterministic pre-pin assembly. It changes no disposition and makes no readiness claim.',
            "",
            "## Counts",
            "",
        ]
        for key in class_names:
            report.append(f"- `{key}`: {counts[key]}")
        report.extend(
            [
                f"- consumer-class rows: {len(consumer_rows)} (5,249 ADMIT; 4,964 admission-unspecified)",
                f"- rejected rows checked separately: {len(rejected_rows)}",
                f"- blocked row-readiness entries: {len(blocked_row_readiness)}",
                f"- patch specifications: {len(patch_order['patches'])}",
                f"- changed-candidate union: {len(candidates)}",
                f"- park families: {len(projections)}; members: {readiness['parkProjectionMemberCount']}",
                f"- alias writer violations: {len(alias_violations)}",
                f"- rows fitting no class/family: {len(unmatched)}",
                "",
                "All REJECT rows use `rejected-not-consumer`; every one resolves a non-null value through the matrix custody catalog. `applied-safe` remains in the vocabulary at zero and the assembler stops if a future row lacks applied-edit evidence.",
                "",
                "## Output sizes",
                "",
            ]
        )
        for name, size in artifact_sizes.items():
            report.append(f"- `{name}`: {size} bytes")
        report.extend(
            [
                f"- all four generated outputs: {total_bytes} bytes (limit: < 6000000 bytes)",
                "",
                "## Explicit blockers",
                "",
            ]
        )
        for key, count in sorted(blockers.items()):
            report.append(f'- `{key}`: {count}')
        if final:
            report.extend(['', '## Park resolution: all 2,311 members', '', '| Family | Preserve | Patch | Individually parked | Flips |', '|---|---:|---:|---:|---:|'])
            for family in resolution['families']:
                c = family['byDisposition']
                report.append(f"| {family['familyId']} | {c.get('preserve', 0)} | {c.get('patch', 0)} | {c.get('parked', 0)} | {family['flips']} |")
            report.extend(['', f"Applied flips: **{resolution['flips']}**. Every member, including unchanged parks, has its old/new disposition, original physical record locator, evidence and named remaining blocker/owner in `step-07-park-resolution-applied.json`. Preservation proves the member operand, not full-file generation/parity. Three generated-index families are evaluated separately; missing export columns and unregistered/final-scan operands are not guessed.", '', '## Current obligations and owners', ''])
            for item in special:
                report.append(f"- **{item['id']}** — {item['status']}; owner: {item['owner']}. {item.get('blocker') or 'No outstanding prerequisite in this receipt.'} Evidence: `{item['evidence']}`.")
            report.extend(['', '## Evidence and limits', '', '- Changed-candidate union is recomputed at the pin: every A47/incoming/imported and Phase 8-edited platform path has a file digest and dual-extractor binding receipt. Missing Session Identity is the explicit Identity section 7a retirement carry; it is not silently dropped.', '- `step-07-final-binding-check.json` verifies complete content/ancestry and neighbours, including the doctor-list edits e8e340887/a59ae8b01. No current target drift or rebind is hidden by ordinal rehashing. Historical priorReview snapshots are explicitly excluded, not rewritten.', '- Exact forward/inverse supplemental patches prepare gateway input/fixture path changes, the network R5 pointer and truthful triage comment, PF references, holder-lock header and both stale citations. Other file hunks still require final composition and independent acceptance. Existing patch-spec source digests are compared with this pin, with drift left as a per-spec blocker.', '- The effective move-set adjustment retains the generated docs/decisions/index.md (L12-96 Q2), enduser manifest and architecture manifest at their fixed paths. It drops the duplicate proposed decisions-index destination and suppresses those retired move proposals; the historical Step 5 move manifest is not silently rewritten. No hand edit of generated output is proposed.\n- Bounded generator parity is real, but not full live-state output certification. Decision scope/text/rationale/ts, inventory role/destination data, effective worktree pins and untruncated acceptance strings are not in the export. One current registry slot is already missing at the pin. These are named proof gaps, never fabricated state or a new export.', '- Plan A and the actual Plan B/convention landed. The draft is Plan C and is not a cutover dependency; the preassembly mislabel is corrected from committed plans and main ancestry, not from a guessed status.', '- Both runs of the final assembler must be byte-identical; `step-07-final-determinism.json` records actual hashes/bytes and verification commands. Pair accounting is performed last in both Phase 6 manifests; its real check-A pairs and byte-preserving insertion proof live in `step-07-final-pair-accounting.json`. This turn cannot pre-account its future runner commit.', '- `step-07-final-verification.json` records actual light exits: ratchet, doc-link tests, evidence --before and diff check, both main-drift tiers and unchanged protected files. The census was freshly re-enumerated; every introduced literal/documentation-dynamic site is named, with final semantic joining explicitly blocked. Two common-light files are not run because their fixtures write Git; no filtered run or false green.\n- No fgOS CLI, Git write, workspace .fgos or secrets read, product docs/code/test/skill/baseline mutation, full npm/cargo suite, live lease or post-cutover proof is performed. Impact analysis is degraded/unqueried under that boundary; no code symbol or graph proof is claimed.', ''])
        if unmatched:
            report.extend(["", "Every unmatched row is a stop. See `step-07-consumer-cutover-matrix.json` → `unmatchedRows`."])
        report.extend(["", "## Final-pin rerun", "", f"```sh\n{rerun}\n```", ""])
        return "\n".join(report)

    total_bytes = sum(artifact_sizes.values())
    for _ in range(10):
        report_text = render_report(total_bytes)
        measured = sum(artifact_sizes.values()) + len(report_text.encode())
        if measured == total_bytes:
            break
        total_bytes = measured
    if total_bytes >= 6_000_000:
        raise ValueError(f"Step 7 generated outputs exceed compactness limit: {total_bytes} bytes")
    rendered['step-07-final-assembly-report.md' if final else 'step-07-preassembly-report.md'] = render_report(total_bytes)
    for name, text in rendered.items():
        (output_dir / name).write_text(text)
    return {
        "pin": pin,
        "counts": counts,
        "patches": len(patch_order["patches"]),
        "candidateUnion": len(candidates),
        "blockedRows": len(blocked_row_readiness),
        "outputBytes": total_bytes,
        "unmatched": len(unmatched),
        "aliasViolations": len(alias_violations),
        "parkMembers": readiness["parkProjectionMemberCount"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--pin', required=True)
    parser.add_argument('--final', action='store_true', help='consume digest-bound final records and apply the final owning-row overlay')
    parser.add_argument('--output-dir', required=True, type=pathlib.Path)
    args = parser.parse_args()
    print(json.dumps(assemble(args.pin, args.output_dir, args.final), sort_keys=True))


if __name__ == "__main__":
    main()
