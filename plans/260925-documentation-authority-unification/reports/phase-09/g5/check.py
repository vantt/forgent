#!/usr/bin/env python3
"""Check legacy retention, and the survival of the reading-map entry-union spans in docs/reading-map.md.

Usage: python3 -B check.py [--pin <commit>] (default: working tree).
Exit 0 means byte checks and negative controls passed, NOT owner acceptance.
Restatements are exact, named proposals under L13-10, never fuzzy matches.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(subprocess.check_output(
    ['git', 'rev-parse', '--show-toplevel'], text=True).strip())
GATES = 'plans/260925-documentation-authority-unification/reports/phase-08/step-08-preflip-gates.json'
SURVIVOR = 'docs/reading-map.md'
LEGACY_MAP = 'docs/specs/reading-map.md'

# Reviewed §3 proposal, frozen independently of the bytes being checked. All
# seven banner lines map to this whole block, NOT to seven invented translations.
BANNER = '''The target structure is being introduced incrementally. When both legacy and
target docs exist, **do not infer authority from path, newer date, richer prose,
or more confident wording**. Follow the explicit current-source mapping in the
platform/area portal and surface any conflict. A target document marked partial
or candidate does not outrank a declared legacy/current source merely because it
lives under `docs/platform/**`.

The operative transitional authority switchboard is
[transitional-switchboard.md](transitional-switchboard.md).
The verified Phase 00 snapshot is
[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).
It records the explicit current route for every known area and root Markdown
surface; the switchboard operationalizes that route.

The full-horizon design is
[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).
The proposed near-term authority migration is
[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase
00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence
does not authorize migration or cutover.'''

WORKFLOW = '- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStep`/`getDomain` (`src/state/domain-registry.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn) **Truth correction:** src/state/domain-registry.mjs:193,240; core/skills/fgos-routing/SKILL.md:124-136.'

# (recorded line, recorded digest) prevents a changed legacy receipt from silently
# inheriting a restatement. No holder-lock restatement has been proposed.
RESTATEMENTS = {
    (3, '94cdd23d21d400397d6bfd59042d1945b1451f0a70a28b22568d7c16c42ab7cb'): ('banner-entry-route', BANNER),
    (4, 'fb5311c374cfee920fe9c6028df70e5bae62361e5ab85d9512a35a4abaaa513b'): ('banner-switchboard-current-source', BANNER),
    (5, '36e46e9cf9e5c6b6b0be3ee282c20dcac71cdba9732e8ea407d1661d234db85a'): ('banner-no-inferred-authority', BANNER),
    (6, '16368141d63993234fad11e62e3e033f553e89c6b261947da4ed91ca74ae1095'): ('banner-metadata-and-snapshot', BANNER),
    (7, 'daf7bc246d780bdbd8723fd344d5b764928e4755caf6862efe1e3408a3a48fe1'): ('banner-snapshot-link', BANNER),
    (8, '9b75147a99731ae433b63f9d34a29f376184b662b40d78cea174d1d3437ee240'): ('banner-no-promotion-and-historical-counts', BANNER),
    (9, '6a6e9f58c9717087e1ad44290d2e2e6004c6ed750c11d2c1308e63b41a64c710'): ('banner-no-migration-authorization', BANNER),
    (34, '96a8f31e5bea9d070112c399c76d29510c6329ed47cdfc34c005ab621bc5c533'): ('workflow-truth-correction', WORKFLOW),
}


def receipts(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'retentionReceipts':
                yield from v
            else:
                yield from receipts(v)
    elif isinstance(o, list):
        for x in o:
            yield from receipts(x)


def read(path, pin):
    if pin:
        result = subprocess.run(['git', 'show', f'{pin}:{path}'],
                                cwd=ROOT, capture_output=True)
        return result.stdout if result.returncode == 0 else None
    try:
        return (ROOT / path).read_bytes()
    except FileNotFoundError:
        return None


def location(content, text):
    """Return a whole-line/block match without newline or Unicode normalization."""
    if content is None:
        return None
    lines, wanted = content.split(b'\n'), text.encode('utf-8').split(b'\n')
    for i in range(len(lines) - len(wanted) + 1):
        if lines[i:i + len(wanted)] == wanted:
            return i + 1
    return None


def check(records, files):
    rows, acceptance = [], []
    for r in records:
        for s in r['spans']:
            if hashlib.sha256(s['text'].encode('utf-8')).hexdigest() != s['sha256']:
                raise ValueError(f"Invalid receipt digest: {r['file']}:{s['line']}")
            row = {'file': r['file'], 'recordedLine': s['line'],
                   'foundLine': location(files[r['file']], s['text']),
                   'sha256': s['sha256'], 'legacyText': s['text']}
            # The G5 survival clause covers only the reading-map entry-union spans
            # (L11-25 banner and the compounding->knowledge lines). Other receipts,
            # such as the holder-lock header, are proved at their own file above.
            if r['file'] != LEGACY_MAP:
                row['surviving'] = {'file': r['file'], 'status': 'not-applicable', 'line': None,
                                    'reason': 'retention is proved at its own file; the surviving-map clause covers reading-map spans only'}
                rows.append(row)
                continue
            line = location(files[SURVIVOR], s['text'])
            surviving = {'file': SURVIVOR, 'status': 'missing', 'line': None}
            if line is not None:
                surviving.update(status='verbatim', line=line, endLine=line, text=s['text'])
            else:
                proposal = RESTATEMENTS.get((s['line'], s['sha256'])) if r['file'] == LEGACY_MAP else None
                if proposal:
                    name, text = proposal
                    line = location(files[SURVIVOR], text)
                    surviving['restatement'] = name
                    if line is not None:
                        surviving.update(status='restated', line=line,
                                         endLine=line + text.count('\n'), text=text)
                        acceptance.append({
                            'file': r['file'], 'recordedLine': s['line'],
                            'sha256': s['sha256'], 'legacyText': s['text'],
                            'restatement': name, 'survivingFile': SURVIVOR,
                            'survivingLine': line, 'survivingEndLine': surviving['endLine'],
                            'proposedText': text, 'status': 'pending-owner-acceptance'})
            row['surviving'] = surviving
            rows.append(row)
    legacy_missing = [r for r in rows if r['foundLine'] is None]
    surviving_missing = [r for r in rows if r['surviving']['status'] == 'missing']
    return {'ok': bool(rows) and not legacy_missing and not surviving_missing,
            'legacyOk': bool(rows) and not legacy_missing,
            'survivingOk': bool(rows) and not surviving_missing,
            'spans': len(rows), 'missing': legacy_missing,
            'survivingMissing': surviving_missing, 'rows': rows,
            'ownerAcceptance': acceptance,
            'ownerAcceptanceStatus': 'pending' if acceptance else 'not-requested',
            'gateApproved': False}


def negative_controls(records, files, baseline):
    """Exercise the real check; inspect the targeted row, not a pre-existing red."""
    controls = []
    for i, row in enumerate(baseline['rows']):
        survivor = row['surviving']
        cases = [('legacy-byte-changed', row['file'], row['legacyText'])]
        if survivor['status'] not in ('missing', 'not-applicable'):
            cases += [(survivor['status'] + '-byte-changed', SURVIVOR, survivor['text']),
                      ('surviving-span-removed', SURVIVOR, survivor['text'])]
        for name, path, text in cases:
            original = text.encode('utf-8')
            # Change exactly one ASCII byte, or remove every occurrence. No disk writes.
            replacement = bytes([original[0] ^ 1]) + original[1:] if name != 'surviving-span-removed' else b''
            mutated = dict(files)
            mutated[path] = files[path].replace(original, replacement) if files[path] is not None else None
            exercised = mutated[path] != files[path]
            result = check(records, mutated)
            target = result['rows'][i]
            rejected = target['foundLine'] is None if name.startswith('legacy-') else target['surviving']['status'] == 'missing'
            controls.append({'control': name, 'file': row['file'],
                             'recordedLine': row['recordedLine'], 'exercised': exercised,
                             'targetRejected': rejected, 'ok': exercised and not result['ok'] and rejected})
    for path in files:
        mutated = dict(files)
        mutated[path] = None
        result = check(records, mutated)
        applicable = sum(1 for r in baseline['rows'] if r['surviving']['status'] != 'not-applicable')
        rejected = (len(result['survivingMissing']) == applicable if path == SURVIVOR
                    else all(r['foundLine'] is None for r in result['rows'] if r['file'] == path))
        exercised = files[path] is not None
        controls.append({'control': 'file-missing', 'file': path, 'exercised': exercised,
                         'targetRejected': rejected, 'ok': exercised and not result['ok'] and rejected})
    return controls


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pin')
    a = ap.parse_args()
    pin = subprocess.check_output(
        ['git', 'rev-parse', '--verify', f'{a.pin or "HEAD"}^{{commit}}'],
        cwd=ROOT, text=True).strip()
    source_pin = pin if a.pin else None
    # Pin the receipt register as well as BOTH legacy files and the surviving map.
    gate_bytes = read(GATES, source_pin)
    if gate_bytes is None:
        raise ValueError('Retention receipt register is missing')
    records = list(receipts(json.loads(gate_bytes)))
    files = {path: read(path, source_pin) for path in dict.fromkeys(
        [r['file'] for r in records] + [SURVIVOR])}
    result = check(records, files)
    result['negativeControls'] = negative_controls(records, files, result)
    result['negativeControlsOk'] = all(c['ok'] for c in result['negativeControls'])
    result['ok'] &= result['negativeControlsOk']
    result['pin'] = pin if a.pin else 'working-tree@' + pin
    result['checkerSha256'] = hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(json.dumps({'ok': False, 'error': str(error)}))
        sys.exit(1)
