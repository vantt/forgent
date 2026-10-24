#!/usr/bin/env python3
"""Find orphan Doer pins and patch-id-equal plan-ancestry twins, read-only.

Pure commit-valued JSON fields are pin candidates; log prose and 64-hex content
hashes are not. Emit exact leaf replacement proposals; never edit historical
records automatically. A matching title narrows candidates, not the proof.
"""
import collections
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sp = importlib.util.spec_from_file_location('g9_sweep', HERE / 'sweep.py')
sweep = importlib.util.module_from_spec(sp)
sp.loader.exec_module(sweep)
TOKEN = re.compile(r'"([A-Za-z_][A-Za-z0-9_-]{0,63})"\s*:\s*"([0-9a-f]{7,40})"')
PIN_KEY = re.compile(r'commit|pin|head', re.I)


def main():
    pin = sweep.git('rev-parse', 'HEAD').decode().strip()
    roots = [sweep.REPORTS, sweep.ROOT / 'plans/260925-documentation-authority-unification/ledger']
    occurrences = collections.defaultdict(list)
    for root in roots:
        for p in sorted(root.rglob('*')):
            if not p.is_file() or p.suffix not in ('.json', '.jsonl') or HERE in p.parents:
                continue
            for n, line in enumerate(p.open(), 1):
                for m in TOKEN.finditer(line):
                    if not PIN_KEY.search(m.group(1)):
                        continue
                    occurrences[m.group(2)].append({'path': sweep.REL(p), 'line': n, 'key': m.group(1)})
    ancestry = set(sweep.git('rev-list', pin).decode().splitlines())
    plan = collections.defaultdict(list)
    for line in sweep.git('log', '--format=%H%x09%s', pin).decode().splitlines():
        commit, subject = line.split('\t', 1)
        plan[subject].append(commit)
    commands = []
    cache = {}

    def patch_id(commit):
        if commit in cache:
            return cache[commit]
        # no-ext-diff/no-textconv makes the proof independent of configured tools.
        diff = subprocess.run(['git', '--no-optional-locks', 'show', '--format=commit %H',
                               '--no-ext-diff', '--no-textconv', '--binary', commit],
                              cwd=sweep.ROOT, capture_output=True)
        proc = subprocess.run(['git', '--no-optional-locks', 'patch-id', '--stable'],
                              input=diff.stdout, cwd=sweep.ROOT, capture_output=True)
        commands.extend([{'argv': ['git', 'show', '--format=commit %H', '--no-ext-diff', '--no-textconv', '--binary', commit],
                          'exit': diff.returncode, 'stdoutSha256': sweep.sha(diff.stdout)},
                         {'argv': ['git', 'patch-id', '--stable'], 'stdinCommit': commit,
                          'exit': proc.returncode, 'stdout': proc.stdout.decode()}])
        values = proc.stdout.decode().split()
        cache[commit] = values[0] if len(values) == 2 and not diff.returncode and not proc.returncode else None
        return cache[commit]

    maps, unresolved, unavailable, ancestor_count = [], [], [], 0
    for token, sites in sorted(occurrences.items()):
        cp = subprocess.run(['git', '--no-optional-locks', 'rev-parse', '--verify', token + '^{commit}'],
                            cwd=sweep.ROOT, capture_output=True)
        if cp.returncode:
            unavailable.append({'token': token, 'sites': sites, 'reason': 'not a locally resolvable commit'})
            continue
        commit = cp.stdout.decode().strip()
        if commit in ancestry:
            ancestor_count += 1
            continue
        subject = sweep.git('show', '-s', '--format=%s', commit).decode().strip()
        oldid = patch_id(commit)
        matches = []
        tested = []
        for candidate in plan.get(subject, []):
            value = patch_id(candidate)
            tested.append({'commit': candidate, 'patchId': value})
            if oldid and value == oldid:
                matches.append(candidate)
        row = {'oldToken': token, 'oldCommit': commit, 'subject': subject, 'oldPatchId': oldid,
               'occurrences': sites, 'candidates': tested, 'equalPlanCommits': matches}
        if len(matches) == 1:
            row.update(newCommit=matches[0], newPatchId=oldid, patchIdsEqual=True)
            maps.append(row)
        else:
            row['reason'] = 'no uniquely patch-id-equal ancestor found; do not repin'
            unresolved.append(row)
    result = {'sourceCommit': pin, 'method': 'stable git patch-id, exact equality; plan-ancestry candidate search by title; no title-only equivalence',
              'scannedPureCommitTokens': len(occurrences), 'alreadyAncestralTokens': ancestor_count,
              'mappings': maps, 'unresolved': unresolved, 'unavailable': unavailable,
              'commands': commands, 'scope': 'Pin-valued JSON fields under reports/ and ledger/ only. Historical prose is not rewritten.'}
    (HERE / 'sha-map.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'mappings': len(maps), 'occurrences': sum(len(r['occurrences']) for r in maps),
                      'unresolved': len(unresolved), 'unavailable': len(unavailable)}, indent=2))


if __name__ == '__main__':
    main()
