#!/usr/bin/env python3
"""Assemble the deterministic Phase 8 consumer handoff without changing records.

The assembler deliberately reads the reviewed Step 3--5 record surfaces.  It
does not apply a patch, alter a disposition, read live fgOS state, or claim
cutover readiness.  A final-pin run replaces this pre-pin receipt.
"""
from __future__ import annotations

import argparse
import collections
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


def write_json(path: pathlib.Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n")


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
                "members": sorted(members, key=lambda x: (x["file"], x["id"])),
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
    if disposition == "parked":
        return "individually parked"
    if disposition in {"patch", "phase9-row-flip", "render-join"}:
        return "prepared-for-cutover"
    if disposition == "preserve" and admission == "REJECT":
        return "applied-safe"
    if disposition == "preserve":
        return "preserved-history/fixture"
    if stage == "step-04-exclusion" and disposition is None:
        return "applied-safe"
    return None


def source_custody(item: dict[str, Any]) -> Any:
    return (
        item.get("nonDocumentUse")
        or item.get("sourceOwner")
        or item.get("inheritedOwner")
        or item.get("reason")
    )


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
        row = {
            "rowId": rid,
            "stage": stage,
            "record": str(record_path.relative_to(ROOT)),
            "recordLine": record_line,
            "file": file,
            "referenceId": item_id(item),
            "sourceSpans": item.get("sourceSpans") or item.get("slotSourceSpans") or [],
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
            "nonDocumentUseOrCustody": source_custody(item) if item.get("admission") == "REJECT" else None,
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
            payload = {**ref, "sha256": sha(diff), "text": diff}
            if payload not in spec["forwardDiffs"]:
                spec["forwardDiffs"].append(payload)
        rollback = record.get("rollbackDiff")
        if rollback:
            payload = {**ref, "sha256": sha(rollback), "text": rollback}
            if payload not in spec["rollbackDiffs"]:
                spec["rollbackDiffs"].append(payload)

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
                "forwardDiffs": [],
                "rollbackDiffs": [],
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
                            "forwardDiffs": [],
                            "rollbackDiffs": [],
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
        spec["forwardDiffs"].sort(key=lambda x: (x["record"], x["recordLine"]))
        spec["rollbackDiffs"].sort(key=lambda x: (x["record"], x["recordLine"]))
        spec["specKind"] = "text-patch" if spec["forwardDiffs"] else "generator-or-row-action"
        if not spec["forwardDiffs"]:
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


def assemble(pin_arg: str, output_dir: pathlib.Path) -> dict[str, Any]:
    pin = git("rev-parse", f"{pin_arg}^{{commit}}")
    output_dir.mkdir(parents=True, exist_ok=True)
    if output_dir.resolve() != HERE.resolve():
        raise ValueError(f"output dir must be the Phase 8 report directory: {HERE}")
    families, projections = park_families()
    rows, alias_violations, unmatched = build_matrix(pin, alias_paths(), families)
    counts = dict(collections.Counter(row["dispositionClass"] or "unmatched" for row in rows))
    matrix = {
        "version": 1,
        "sourceCommit": pin,
        "generatedBy": "step-07-assemble.py",
        "dryRun": True,
        "counts": {"rows": len(rows), "byDispositionClass": counts},
        "aliasViolations": alias_violations,
        "unmatchedRows": unmatched,
        "rows": rows,
    }
    patch_order = build_patch_order(pin, rows)
    special = special_rows()
    candidates = changed_candidates(pin)
    blockers = collections.Counter(
        row["blocker"] for row in special if row["status"] == "blocked"
    )
    export_families = {
        "gen-doc-registry", "gen-enduser-index", "gen-decision-index",
        "state-registry-export", "state-work-docsref",
        "state-inventory-oldpath", "state-outcome-and-evidence",
    }
    row_readiness = []
    for row in rows:
        row_blockers = []
        if row["dispositionClass"] == "prepared-for-cutover":
            row_blockers.extend(["final-pin", "step-06b-lease-receipts"])
        elif row["dispositionClass"] == "individually parked":
            row_blockers.append("park-resolution-at-final-pin")
        if row.get("parkFamilyId") in export_families:
            row_blockers.append("L12-96-state-export")
        if row["file"] == "AGENTS.md" and row["dispositionClass"] == "prepared-for-cutover":
            row_blockers.append("Plan-B-phase-06-landing")
        if row["referenceId"] == "dynamic-023895":
            row_blockers.append("P7-DOC-GAP-05")
        row_readiness.append(
            {
                "rowId": row["rowId"],
                "currentStatus": "blocked" if row_blockers else "ready",
                "blockers": sorted(set(row_blockers)),
            }
        )
    readiness = {
        "version": 1,
        "sourceCommit": pin,
        "dryRun": True,
        "readyForCutover": False,
        "rowCounts": matrix["counts"],
        "blockerCounts": dict(sorted(blockers.items())),
        "matrixViolations": {
            "writerDestinationAliases": len(alias_violations),
            "unmatchedRows": len(unmatched),
        },
        "changedCandidateUnion": candidates,
        "rowReadiness": row_readiness,
        "specialObligations": special,
        "parkProjection": projections,
        "parkProjectionMemberCount": sum(row["memberCount"] for row in projections),
        "noReadinessClaim": True,
    }
    write_json(output_dir / "step-07-consumer-cutover-matrix.json", matrix)
    write_json(output_dir / "step-07-patch-order.json", patch_order)
    write_json(output_dir / "step-07-readiness.json", readiness)
    rerun = f"python3 -B {HERE.relative_to(ROOT) / 'step-07-assemble.py'} --pin <final-commit> --output-dir {HERE.relative_to(ROOT)}"
    report = [
        "# Step 7 preassembly dry run",
        "",
        f"Pinned source commit: `{pin}`.",
        "",
        "This is a deterministic pre-pin assembly. It changes no disposition and makes no readiness claim.",
        "",
        "## Counts",
        "",
    ]
    for key in ("applied-safe", "prepared-for-cutover", "preserved-history/fixture", "individually parked", "unmatched"):
        report.append(f"- `{key}`: {counts.get(key, 0)}")
    report.extend(
        [
            f"- patch specifications: {len(patch_order['patches'])}",
            f"- changed-candidate union: {len(candidates)}",
            f"- park families: {len(projections)}; members: {readiness['parkProjectionMemberCount']}",
            f"- alias writer violations: {len(alias_violations)}",
            f"- rows fitting no class/family: {len(unmatched)}",
            "",
            "## Explicit blockers",
            "",
        ]
    )
    for key, count in sorted(blockers.items()):
        report.append(f"- `{key}`: {count}")
    if unmatched:
        report.extend(["", "Every unmatched row is a stop. See `step-07-consumer-cutover-matrix.json` → `unmatchedRows`."])
    report.extend(["", "## Final-pin rerun", "", f"```sh\n{rerun}\n```", ""])
    (output_dir / "step-07-preassembly-report.md").write_text("\n".join(report))
    return {
        "pin": pin,
        "counts": counts,
        "patches": len(patch_order["patches"]),
        "candidateUnion": len(candidates),
        "unmatched": len(unmatched),
        "aliasViolations": len(alias_violations),
        "parkMembers": readiness["parkProjectionMemberCount"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pin", required=True)
    parser.add_argument("--output-dir", required=True, type=pathlib.Path)
    args = parser.parse_args()
    print(json.dumps(assemble(args.pin, args.output_dir), sort_keys=True))


if __name__ == "__main__":
    main()
