#!/usr/bin/env python3
"""Conservative phase-07 migration inventory, not the phase-08 one-door gate.

Enumerate all spawn expressions, Git wrappers/callers, and Git shell/skill
lines. Keeping unrelated spawn candidates makes unresolved data flow visible.
Usage: python3 scripts/git-p07-census.py --report <convention report path>
"""
import argparse
import collections
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
ROOTS = ['src', 'bin', 'packages', 'apps', 'scripts', '.githooks', 'core/skills',
         '.agents/skills', 'plugins/fgOS/skills', '.claude/skills', 'test', '.github']
SPAWN = re.compile(r'\b(?:execFileSync|execFile|spawnSync|spawn|execSync|exec|runBorrowed|run_borrowed|Command::new|execFileFn|spawnFn)\s*\(')
WRAPPER = re.compile(r'\b(?:git|gitAt|gitQuiet|rawGit|runGit|execGit|gitSync|gitRead|mainGit|borrowedGit|gitCommand|checkout_call|checkout_call_borrowed|checkout_bytes|checkout_text|stage_paths|runWorktreeAdd|runMainCheckoutGit|checkpointMainFgos|createBranchRef|withMergeEphemeralWorktree|mergeRunnerItem|ensureBranchPushed|resyncClaimWorktree|refreshUnstartedBranch)\s*\(')
GIT = re.compile(r'\bgit\b|pre-commit|hooksPath|Command::new|run_borrowed')


def family(p):
    if p.startswith('test/') or '/tests/' in p or '/fixtures/' in p or p.startswith('.github/'):
        return 'sandbox/test', 'fixture owner', 'sandbox candidate; confirm repository provenance'
    if p.startswith(('core/skills/', '.agents/skills/', 'plugins/fgOS/skills/', '.claude/skills/')):
        return 'skills', 'lead', 'source instruction or generated mirror; migrate source then render'
    if p.startswith('packages/git/rust/src/'):
        return 'Git driver', 'Git component', 'private driver/typed port; allowed owner, inspect raw spawn boundary'
    if p.startswith('packages/holder-lock/rust/src/borrow_vectors'):
        return 'production sandbox probe', 'holder listings', 'named exemption: own temp_dir repository, verify below'
    if p.startswith('packages/holder-lock/') or p.startswith(('src/holder-lock/', 'src/setup/holder-lock')):
        return 'holder listings', 'holder listings', 'parameterize listings; run_borrowed is lower-layer transport'
    if p.startswith('packages/') or p.startswith('apps/'):
        return 'Rust/outer readers', 'Rust readers', 'Inspect; non-Git spawn candidates require triage'
    if p.startswith('.githooks/') or p.startswith('src/setup/'):
        return 'setup/hooks', 'setup', 'RepositoryConfig or hook read context / Inspect'
    if p.startswith('src/state/events-') or p == 'src/runner/main-fgos-checkpoint.mjs':
        return 'temporary Work events', 'Work event adapter', 'ScopedCommit / Checkpoint; retained until WORK cutover'
    if p.startswith(('src/runner/execution/commit-unit-work', 'src/runner/execution/unit-sync', 'src/runner/execution/partial-writes', 'src/runner/execution/run.')):
        return 'Unit commit/sync', 'Unit core', 'ScopedCommit / Sync / Inspect; custody retained'
    if p.startswith(('src/runner/merge.', 'src/runner/promote-engine.', 'src/runner/github-adapter.')):
        return 'Land/merge/promote', 'Land cluster', 'Land / Sync / Refs / Worktree; event calls use Work adapter'
    if p.startswith(('src/runner/worktree.', 'src/runner/session.', 'src/runner/loop.', 'src/runner/claim-port.', 'src/runner/repo-locks.')):
        return 'worktree/session/loop/claim', 'Worktree cluster', 'Worktree / Refs / Remote / SafeRestore'
    if p.startswith('src/verbs/merge/') or p == 'bin/fgos.mjs':
        return 'verbs/merge and CLI', 'merge verbs', 'typed Git ports; shared CLI edited serially'
    if p.startswith('src/workflow/'):
        return 'Workflow', 'Workflow', 'delete integrate; Inspect and typed ports in callers'
    if p.startswith('scripts/'):
        return 'outer scripts', 'outer scripts', 'typed ports or named sandbox setup; non-Git candidates retained'
    return 'Node readers', 'readers', 'Inspect; unresolved non-Git spawn candidates retained'


def inventory():
    paths = subprocess.check_output(['rg', '--files', '--hidden', *ROOTS], cwd=ROOT, text=True).splitlines()
    sites = []
    for name in sorted(set(paths)):
        if name == 'scripts/git-p07-census.py':
            continue
        p = ROOT / name
        try:
            source = p.read_text()
        except (UnicodeError, OSError):
            continue
        if p.suffix not in {'.mjs', '.js', '.cjs', '.ts', '.tsx', '.rs', '.sh', '.md', '.yml', '.yaml', '.py'} and not name.startswith('.githooks/') and not source.startswith('#!'):
            continue
        for number, line in enumerate(source.splitlines(), 1):
            kinds = []
            if SPAWN.search(line): kinds.append('spawn candidate')
            if WRAPPER.search(line): kinds.append('wrapper/caller')
            if GIT.search(line) and (p.suffix in {'.md', '.sh', '.yml', '.yaml'} or name.startswith('.githooks/')):
                kinds.append('shell/instruction')
            if not kinds: continue
            group, owner, disposition = family(name)
            sites.append(dict(path=name, line=number, family=group, owner=owner,
                              kinds=kinds, disposition=disposition, source=line.strip()))
    return sites


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    report = ROOT / args.report
    if not report.resolve().is_relative_to(ROOT / 'plans/reports'):
        parser.error('report must be under plans/reports')
    sites = inventory()
    digest = hashlib.sha256(json.dumps(sites, sort_keys=True).encode()).hexdigest()
    machine = report.with_suffix('.json')
    machine.write_text(json.dumps(dict(schema='git-p07-census.v1', sourceDigest=digest, sites=sites), indent=2) + '\n')
    lines = ['# Phase 07 Git caller census', '',
             'Reproduce: `python3 scripts/git-p07-census.py --report ' + args.report + '`.', '',
             f'{len(sites)} candidate lines; source digest `{digest}`. Full source snippets and classification: `{machine.name}`.', '',
             'This is a conservative migration checklist, not V-GATE acceptance. All spawn candidates are retained even when the binary is unrelated to Git; wrappers and callers are counted separately. Multiline arguments and variable binaries require manual data-flow review. Empty remaining candidates alone cannot certify the final gate. Generated skill mirrors are listed separately from source. Test/CI locations are sandbox candidates, not automatic exemptions.', '',
             'The production holder-lock probe exemption is grounded in `packages/holder-lock/rust/src/borrow_vectors.rs`: its `temp_dir()` repository is created by the probe, and its Git binary variable is included here. Hook read context remains classified separately from product writers.', '',
             '## Family ownership and order', '',
             '1. Unit core: commit-unit-work.mjs, unit-sync.mjs, execution/run.mjs and partial-writes.mjs; focused execution tests. Shared matcher and definition changes follow serially under the lead.',
             '2. Land cluster: runner/merge.mjs, promote-engine.mjs, github-adapter.mjs. Work event adapter owns state/events-* and main-fgos-checkpoint.mjs; only Land owner edits merge.mjs to call it.',
             '3. Worktree cluster: runner/worktree.mjs, session.mjs, loop.mjs, claim-port.mjs and repo-locks.mjs; merge verbs and bin/fgos.mjs follow once this API settles.',
             '4. Setup owns src/setup/* and .githooks/*; holder listings owns src/holder-lock/*, setup/holder-lock-checks.mjs and Rust holder route (setup hands that one file over). Outer scripts own scripts/* except this census and gate tooling.',
             '5. Readers own remaining src read sites; Workflow owns src/workflow/* (definition.mjs reserved to lead); Rust readers own non-Git packages/apps read sites. Gate owns run-tests/build-distribution and manifest.rs, reserved out of outer/Rust lanes.',
             '6. Lead serializes CHANGELOG, architecture manifest, test ownership, matcher, skill source/renders and final E6 inventory. No simultaneous file ownership; a conflicting file is handed over, never edited concurrently.', '',
             '**One release:** all sub-lanes integrate into git/p07-switch only. No phase-07 subset reaches main; phase 08 must pass its unchanged proof gates and the owner-scheduled stop-everything landing.', '',
             '**Work temporary duty:** legacy tracked events, shards and merge=union stay. Work-side adapter uses ScopedCommit/Checkpoint for declared event checkpoint/compaction paths, and declared Land candidates for the sweep; post-CAS changes use a separate declared ScopedCommit/Checkpoint operation, never raw re-stage. Truncation guard remains Work policy outside Git locks. WORK removes the adapter and all legacy duties at Event Store cutover.', '',
             '## Checklist', '']
    groups = collections.defaultdict(lambda: collections.defaultdict(list))
    for s in sites: groups[s['family']][s['path']].append(s)
    for group, files in sorted(groups.items()):
        lines += [f'### {group}', '', '| File | Candidate lines | Owner / disposition |', '|---|---|---|']
        for name, entries in sorted(files.items()):
            nums = ', '.join(str(s['line']) for s in entries)
            lines.append(f"| [ ] `{name}` | {nums} | {entries[0]['owner']}: {entries[0]['disposition']} |")
        lines.append('')
    lines += ['Status: DONE_WITH_CONCERNS', 'Summary: Reproducible conservative caller checklist with explicit ownership; final static data-flow probes and runtime spy remain phase-07 gate work.', 'Concerns/Blockers: Candidate lines require classification; this inventory does not claim zero product writers.', 'Context refs:', '- (none)', '']
    report.write_text('\n'.join(lines))
    # Local first-family preservation baseline; legacy labels do not certify
    # that the caller has been retargeted through a native port.
    assertions = []
    for name in ['test/runner/execution/commit-unit-work.test.mjs',
                 'test/git/scoped-commit.test.mjs', 'test/git/sync.test.mjs']:
        for number, line in enumerate((ROOT / name).read_text().splitlines(), 1):
            for match in re.finditer(r'\bassert\.[A-Za-z]+\s*\(', line):
                assertions.append(dict(file=name, line=number, column=match.start() + 1,
                                       label='kept', target='legacy (migration pending)' if '/runner/' in name else 'native port'))
    report.with_suffix('.e6.json').write_text(json.dumps(dict(
        scope='Unit commit/sync inspected assertions only; not final whole-suite E6',
        retargeted=0, retired=0, assertions=assertions), indent=2) + '\n')
    print(json.dumps(dict(report=args.report, machine=str(machine.relative_to(ROOT)), candidates=len(sites), families={g:sum(len(es) for es in fs.values()) for g,fs in groups.items()})))


if __name__ == '__main__':
    main()
