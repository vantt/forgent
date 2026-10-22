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
    # The adopted alias table is empty before cutover. Test the paths which
    # actually become aliases, excluding the three explicitly retained roots.
    retained = {'docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'}
    return {r['oldPath'] for r in read_json(HERE / 'step-05-cutover-move-set.json')['paths'] if r['oldPath'] not in retained}


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
    """Replay immutable v1 decisions, then the explicit v2 and integration overlays.

    This is the only final assembly door. Classification is a reviewed input,
    not recomputed from v1's incomplete export on each replay.
    """
    resolution = read_json(HERE / 'step-07-park-resolution-applied.json')
    if resolution['effectiveSourceCommit'] != pin:
        raise ValueError('effective resolution is not bound to this pin')
    for rec in resolution['recordCatalog']:
        if sha((HERE / rec['path']).read_text()) != rec['sha256']:
            raise ValueError(f"record digest changed: {rec['path']}")
    for binding in resolution['sourceBindingCatalog'] + resolution['reevaluationSourceBindings']:
        actual = (ROOT / binding['file']).read_text()
        pinned = subprocess.check_output(['git', '-C', str(ROOT), 'show', pin + ':' + binding['file']]).decode()
        if sha(actual) != binding['sourceSha256AtPin'] or actual != pinned:
            raise ValueError(f"source binding changed: {binding['file']}")
    integration = read_json(HERE / 'step-07-integration-inputs.json')
    proof = read_json(HERE / integration['proof'])
    if integration['sourceCommit'] != pin or proof['sourceCommit'] != pin or sha((HERE / integration['proof']).read_text()) != integration['proofSha256']:
        raise ValueError('post-move evidence is not pinned or digest-bound')
    if proof['inputs']['exportSha256'] != sha((HERE / 'step-07-state-path-export-v2.json').read_text()) or proof['inputs']['moveSetSha256'] != sha((HERE / 'step-05-cutover-move-set.json').read_text()):
        raise ValueError('candidate-tree inputs changed after proof')
    export_proof = read_json(HERE / 'step-07-export-v2-proof.json')
    if export_proof['sourceCommit'] != pin or export_proof['exportSha256'] != proof['inputs']['exportSha256']:
        raise ValueError('v2 proof/export is not pinned')
    for path, digest in export_proof['sourcePins'].items():
        if sha((ROOT / path).read_text()) != digest:
            raise ValueError(f'export proof source changed: {path}')
    if {r['rowId'] for r in integration['reevaluations']} != {r['rowId'] for r in proof['overturns']}:
        raise ValueError('integration drops a post-move overturn')
    updates = {r['rowId']: r for r in resolution['reevaluations']}
    updates.update({r['rowId']: r for r in integration['reevaluations']})
    by_id = {r['rowId']: r for r in rows}
    if len(resolution['rows']) != 2311 or len({r[0] for r in resolution['rows']}) != 2311:
        raise ValueError('park conservation failed')
    counts = collections.defaultdict(collections.Counter)
    for old in resolution['rows']:
        row = by_id[old[0]]
        if (row['referenceId'], row['recordLine'], row['file'], row['recordDisposition']) != (old[4], old[2], resolution['fileCatalog'][old[3]], 'parked'):
            raise ValueError(f'owning member join changed: {old[0]}')
        update = updates.get(old[0])
        disposition = update['newDisposition'] if update else old[7]
        blocker = update['remainingBlocker'] if update else resolution['blockerCatalog'][old[10]]['blocker'] if old[10] is not None else None
        row.update(effectiveDisposition=disposition,
                   dispositionClass={'preserve': 'preserved-history/fixture', 'patch': 'prepared-for-cutover', 'parked': 'individually parked'}[disposition],
                   patchSpecId='r26:' + row['file'] if disposition == 'patch' else None,
                   parkFamilyId=old[5], blocker=blocker if disposition == 'parked' else None)
        if disposition == 'patch' and old[5] == 'r26:docs/contracts/fgos-gateway-api-v1.yaml':
            row['target'] = 'docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml'
        if disposition == 'patch' and old[4] == 'reference-000209':
            row['target'] = 'docs/platform/herdr-web-dashboard/spec.md#business-rules'
        counts[old[5]][disposition] += 1
    effective = copy.deepcopy(resolution)
    effective['families'] = [{**f, 'byDisposition': dict(sorted(counts[f['familyId']].items())), 'flips': f['memberCount'] - counts[f['familyId']]['parked']} for f in resolution['families']]
    effective['flips'] = sum(f['flips'] for f in effective['families'])
    expected = copy.deepcopy(resolution.get('exportV2Families', resolution['effectiveFamilies']))
    family_ids = {r[0] for r in resolution['rows']}
    for change in integration['reevaluations']:
        row = by_id[change['rowId']]
        if change['rowId'] not in family_ids:
            if row['dispositionClass'] != 'preserved-history/fixture':
                raise ValueError('non-family preserve input changed')
            disposition = change['newDisposition']
            if disposition not in {'patch', 'parked'}:
                raise ValueError('integration overturn must patch or name a park')
            row.update(effectiveDisposition=disposition,
                       dispositionClass='prepared-for-cutover' if disposition == 'patch' else 'individually parked',
                       patchSpecId='r26:' + row['file'] if disposition == 'patch' else None,
                       parkFamilyId=change.get('parkFamilyId') if disposition == 'parked' else row['parkFamilyId'],
                       blocker=change['remainingBlocker'] if disposition == 'parked' else None)
        else:
            family = next(f for f in expected if f['familyId'] == change['familyId'])
            family['byDisposition']['preserve'] -= 1
            disposition = change['newDisposition']
            family['byDisposition'][disposition] = family['byDisposition'].get(disposition, 0) + 1
    if effective['families'] != expected or effective['flips'] != resolution['effectiveFlips']:
        raise ValueError('effective family counts disagree with member join')
    effective['integrationReevaluations'] = integration['reevaluations']
    effective['parkOwners'] = integration['parkOwners']
    parked = {r['rowId'] for r in rows if r['dispositionClass'] == 'individually parked'}
    if parked != {r['rowId'] for r in effective['parkOwners']}:
        raise ValueError('park owner coverage disagrees with matrix')
    # Keep the historical v1 catalogs/rows and v2 reevaluations byte-equivalent
    # as values. The explicit final overlay supersedes only effective fields.
    resolution.setdefault('exportV2Families', resolution['effectiveFamilies'])
    resolution.update(effectiveFamilies=effective['families'], effectiveFlips=effective['flips'],
                      integrationAuthority=integration['authority'], integrationOverlay='step-07-integration-inputs.json',
                      integrationReevaluations=integration['reevaluations'],
                      effectiveParkOwners=integration['parkOwners'])
    (HERE / 'step-07-park-resolution-applied.json').write_text(compact_json(resolution))
    return effective


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
    integration = read_json(HERE / 'step-07-integration-inputs.json')
    for composed in integration['composedPaths']:
        path = composed['path']
        before = (ROOT / path).read_text()
        pinned = subprocess.check_output(['git', '-C', str(ROOT), 'show', pin + ':' + path]).decode()
        if before != pinned or sha(before) != composed['sourceSha256']:
            raise ValueError(f'composed patch source changed: {path}')
        after = before
        for replacement in composed['replacements']:
            old, new = replacement['old'], replacement['new']
            if after.count(old) != replacement['expectedOccurrences']:
                raise ValueError(f'ambiguous composed replacement: {path}: {old}')
            after = after.replace(old, new)
        delta = list(difflib.ndiff(before.splitlines(True), after.splitlines(True)))
        if ''.join(difflib.restore(delta, 1)) != before or ''.join(difflib.restore(delta, 2)) != after:
            raise ValueError('composed forward/inverse roundtrip failed')
        superseded = [s['id'] for s in specs if s['path'] == path]
        specs = [s for s in specs if s['path'] != path]
        specs.append({'id': 'composed:' + path, 'path': path, 'sourceCommit': pin,
                      'sourceBlob': blob(pin, path), 'beforeSha256': sha(before),
                      'expectedAfterSha256': sha(after), 'diff': ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/' + path, tofile='b/' + path)),
                      'rollbackDiff': ''.join(difflib.unified_diff(after.splitlines(True), before.splitlines(True), fromfile='a/' + path, tofile='b/' + path)),
                      'roundtrip': True, 'composedOnce': True, 'rowIds': composed['rowIds'],
                      'supersedesSupplementalActions': superseded,
                      'composedRecordRefs': composed.get('composedRecordRefs', []),
                      'evidence': 'step-07-integration-inputs.json; step-07-post-move-proof.json; ' + integration['authority'],
                      'remainingBlocker': 'Independent composed-file and co-cut owning-test replay before Phase 9 application; no test executed in this records turn.'})
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
    add('L12-96-state-export', 'state-export', 'delivered', 'Lead state-export owner / consumer proof owners', None, 'step-07-state-path-export-v2.json; step-07-export-v2-proof.json; step-07-park-resolution-applied.json#reevaluations')
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
    aliases = alias_paths()
    rows, alias_violations, unmatched = build_matrix(pin, aliases, families)
    alias_check = {'basis': 'effective move-set oldPaths, not empty adopted alias-table.json', 'aliasPathCount': len(aliases), 'writerRows': 0, 'writerRowsByClass': {}}
    writer_counts = collections.Counter()
    for path in record_files('step-05-records'):
        for record in jsonl(path):
            for field in ('references', 'dynamicTraces', 'authorAddedReferences'):
                for item in record.get(field, []):
                    if item.get('aliasWriteCheck', {}).get('isWriter') or item.get('writeDestination'):
                        writer_counts[disposition_class('step-05', item)] += 1
    alias_check.update(writerRows=sum(writer_counts.values()), writerRowsByClass=dict(sorted(writer_counts.items())))
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
        "integrationResolutionOverlay": 'step-07-integration-inputs.json' if final else None,
        "aliasWriterCheck": alias_check,
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
                if len(supplementary) == 1 and supplementary[0].get('composedOnce'):
                    composed = supplementary[0]
                    spec['supersededForwardDiffRefs'] = spec['forwardDiffRefs']
                    spec['supersededRollbackDiffRefs'] = spec['rollbackDiffRefs']
                    spec['forwardDiffRefs'] = [{'record': 'step-07-final-prepared-specs.json', 'id': composed['id'], 'sha256': sha(composed['diff'])}]
                    spec['rollbackDiffRefs'] = [{'record': 'step-07-final-prepared-specs.json', 'id': composed['id'], 'sha256': sha(composed['rollbackDiff'])}]
                    spec.update(composedOnce=True, expectedAfterSha256=composed['expectedAfterSha256'])
                    spec['blockers'] = ['independent-composed-file-review-and-owning-co-cut-replay']
                else:
                    spec['blockers'].append('supplemental-path-patch-must-compose-with-earlier-file-hunks')
            if spec['path'] == 'docs/enduser-docs-index.json':
                spec['generatedAction'] = read_json(HERE / 'step-07-integration-inputs.json')['generatedAction']
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
        "parkOwners": resolution['parkOwners'] if final else [],
        "aliasWriterCheck": alias_check,
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
                f"- alias writer violations: {len(alias_violations)}; checked {alias_check['writerRows']} writer rows against {alias_check['aliasPathCount']} effective old paths (not the empty adopted alias table)",
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
            report.extend(['', f"Applied flips: **{resolution['flips']}**. Every member, including unchanged parks, has its old/new disposition, original physical record locator, evidence and named remaining blocker/owner in `step-07-park-resolution-applied.json`. Preservation proves the member operand, not full-file generation/parity. Three generated-index families are evaluated separately; complete v2 export closes data gaps, while successor scan/carriage and consumer co-cuts remain explicit. Original v1 rows and v2 reevaluations remain historical inputs; the L12-121 integration overlay is last-write. New parks outside those original families remain individually listed, not added to the conserved 2,311-member denominator.", '', '## Export v2 and post-move preservation', '',
                           'The Lead export is consumed read-only and never rerun. Its 214 reevaluations promoted 195 preserves and left 19 non-export parks. The existing decision-index generator proves parity only for the state-wins union with the retained committed index, not export-only reconstruction. The export records fgosDir but not the producing codeRoot commit; no missing provenance is invented.',
                           '',
                           f"L12-121 rechecks all **9,650** input preserves on a physical scratch copy through the existing enumerateDocEntries/buildEnduserIndex. **{sum(r['newDisposition'] == 'patch' for r in resolution['integrationReevaluations'])}** become patch and **{sum(r['newDisposition'] == 'parked' for r in resolution['integrationReevaluations'])}** become individually parked. The original 39 overturns remain; each further row is enumerated with source-confirmed premise evidence, exact successor or named blocker/owner. No role whitelist remains. All row IDs, reason/source/operand digests and candidate checks are in `step-07-post-move-proof.json`; exact composed inputs are in `step-07-integration-inputs.json`. The two legacy duplicates disappear, their surviving aliases remain, and four generated members are `patch via existing generator`.",
                           '',
                           'The enduser test L162/L167 lookup/assertion and L385/L386 frontmatter read are composed ONCE over the source pin, together with the REAL_DEMO_DOC_PATH fixture constant as an atomic co-cut. Forward and rollback diffs, source blob and expectedAfterSha256 are in `step-07-final-prepared-specs.json`; patch-order supersedes the earlier same-file hunk instead of applying both. Owning tests and independent composed-file acceptance remain owed.',
                           '',
                           f"All {len(resolution['parkOwners'])} effective parks have member-specific owners and actions in readiness, including new non-family parks. This overrides the historical v1 catch-all catalog, including its 161 parks. The architecture manifests share the existing architecture-map blocker/owner; the seven AGENTS root pointers belong to the A34 cutover packet (L12-121 supersedes L12-60 only for those seven). Two external locator parks remain separately joined outside the 46,404-row census and are not silently counted.",
                           '', '## Effective park-family owners', '', '| Family | Park count | Owners |', '|---|---:|---|'])
            for family_id in sorted({r['familyId'] for r in resolution['parkOwners']}):
                owners = [r for r in resolution['parkOwners'] if r['familyId'] == family_id]
                report.append(f"| {family_id} | {len(owners)} | {'; '.join(sorted({r['owner'] for r in owners}))} |")
            report.extend(['', '## Current obligations and owners', ''])
            for item in special:
                report.append(f"- **{item['id']}** — {item['status']}; owner: {item['owner']}. {item.get('blocker') or 'No outstanding prerequisite in this receipt.'} Evidence: `{item['evidence']}`.")
            report.extend(['', '## Evidence and limits', '', '- Changed-candidate union is recomputed at the pin: every A47/incoming/imported and Phase 8-edited platform path has a file digest and dual-extractor binding receipt. Missing Session Identity is the explicit Identity section 7a retirement carry; it is not silently dropped.', '- `step-07-final-binding-check.json` verifies complete content/ancestry and neighbours, including the doctor-list edits e8e340887/a59ae8b01. No current target drift or rebind is hidden by ordinal rehashing. Historical priorReview snapshots are explicitly excluded, not rewritten.', '- Exact forward/inverse supplemental patches prepare gateway input/fixture path changes, the network R5 pointer and truthful triage comment, PF references, holder-lock header and both stale citations. Other file hunks still require final composition and independent acceptance. Existing patch-spec source digests are compared with this pin, with drift left as a per-spec blocker.', '- The effective move-set adjustment retains the generated docs/decisions/index.md (L12-96 Q2), enduser manifest and architecture manifest at their fixed paths. It drops the duplicate proposed decisions-index destination and suppresses those retired move proposals; the historical Step 5 move manifest is not silently rewritten. No hand edit of generated output is proposed.\n- The v2 export supplies decision fields, inventory role/destination inputs, work/head pins and untruncated acceptance. Registry parity remains bounded rather than full live-state output certification. One registry currentPath remains absent at the pin, owned by the Knowledge-registry owner; unchanged operands are not existence proof.', '- Plan A and the actual Plan B/convention landed. The draft is Plan C and is not a cutover dependency; the preassembly mislabel is corrected from committed plans and main ancestry, not from a guessed status.', '- Both runs of the final assembler must be byte-identical; `step-07-final-determinism.json` records actual hashes/bytes and verification commands. Pair accounting is performed last; the integration receipt is `step-07-integration-pair-accounting.json`. This turn cannot pre-account its future runner commit; L12-11 requires a subsequent accounting-only Unit.', '- `step-07-final-verification.json` records actual light exits: ratchet, doc-link tests, evidence --before and diff check, both main-drift tiers and unchanged protected files. The census was freshly re-enumerated; every introduced literal/documentation-dynamic site is named, with final semantic joining explicitly blocked. Two common-light files are not run because their fixtures write Git; no filtered run or false green.\n- No fgOS CLI, Git write, workspace .fgos or secrets read, product docs/code/test/skill/baseline mutation, full npm/cargo suite, live lease or post-cutover proof is performed. Impact analysis is degraded/unqueried under that boundary; no code symbol or graph proof is claimed.', ''])
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
    parser.add_argument('--output-dir', default=HERE, type=pathlib.Path)
    args = parser.parse_args()
    print(json.dumps(assemble(args.pin, args.output_dir, args.final), sort_keys=True))


if __name__ == "__main__":
    main()
