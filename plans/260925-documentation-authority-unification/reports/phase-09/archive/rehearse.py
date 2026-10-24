#!/usr/bin/env python3
"""Disposable-clone archive rehearsal. Never writes source Git/state.
The physical scratch must be inside archive/.scratch, accessed via /tmp/fgos-work
so real-disk timings and existing frozen external-output guards both apply.
"""
import argparse, gzip, hashlib, json, os, pathlib, re, shutil, statistics, subprocess, time

P = 'plans/260925-documentation-authority-unification/'
A = P + 'reports/phase-09/archive/'
TESTS = [
    'test/scripts/doc-rationale-reproduction.test.mjs',
    'test/scripts/doc-runner-liveness.test.mjs',
    'test/scripts/generate-doc-inventory.test.mjs',
    'test/scripts/verify-phase-02.test.mjs',
    'test/scripts/check-doc-retirement.test.mjs',
    'test/scripts/check-doc-candidate-status.test.mjs',
    'test/scripts/check-evidence-relocation.test.mjs',
    'test/scripts/doc-review-format.test.mjs',
    'test/scripts/doc-restoration-proofs.test.mjs',
    'test/scripts/check-doc-constitution.test.mjs',
    'test/scripts/generate-shipped-path-inventory.test.mjs',
]
RECIPES = [('step10-round5-reproduction.json', 'scripts'), ('step10-sync4d-reproduction.json', 'readOnlyScripts')]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scratch', required=True)
    ap.add_argument('--release-path', required=True)
    ap.add_argument('--rebuild', action='store_true', help='Rebuild the partition at HEAD and verify the finished rehearsal in one invocation')
    opts = ap.parse_args()
    source = pathlib.Path(__file__).resolve().parents[5]
    output = source / A
    scratch = pathlib.Path(opts.scratch).absolute()
    assert str(scratch).startswith('/tmp/fgos-work/')
    if opts.rebuild:
        subprocess.run(['python3', '-B', str(output / 'build-design.py'), '--output-dir', str(output)], cwd=source, check=True)
    assert not scratch.exists() and not scratch.is_symlink(), 'use a fresh scratch name'
    physical = output / '.scratch' / scratch.name
    physical.mkdir(parents=True)
    scratch.parent.mkdir(parents=True, exist_ok=True)
    scratch.symlink_to(physical, target_is_directory=True)
    assert scratch.resolve().is_relative_to(output / '.scratch'), 'physical writes must stay inside scoped scratch'
    clone = scratch / 'repo'
    assert not clone.exists()
    assert shutil.disk_usage(scratch).free > 20 * 1024**3
    release = pathlib.Path(opts.release_path).resolve()
    manifest = json.loads((output / 'manifest.json').read_text())
    pin = manifest['sourceCommit']
    def audit(name):
        return json.loads(gzip.decompress((output / 'audit' / (name.replace('/', '--') + '.gz')).read_bytes()))
    partition = audit('partition.json')
    gates = audit('gate-retention.json')
    moving = {r['path']: r for r in partition['records']}
    command_log = []
    env = os.environ.copy(); env.pop('CLAUDE_CODE_SESSION_ID', None)
    for key, name in [('HOME', 'home'), ('FGOS_STATE_ROOT', 'state'), ('TMPDIR', 'tmp'), ('TMP', 'tmp'), ('TEMP', 'tmp')]:
        dest = scratch / name; dest.mkdir(mode=0o700, exist_ok=True); dest.chmod(0o700)
        env[key] = str(dest)
    # A physical scratch beneath this ESM repository inherits its package type.
    # /tmp fixtures normally have no such parent. Restore that ordinary fixture
    # boundary so an unchanged extensionless CommonJS npm stub remains CommonJS.
    (scratch / 'tmp/package.json').write_text('{"type":"commonjs"}\n')
    env.update(GIT_AUTHOR_NAME='Archive rehearsal fixture', GIT_AUTHOR_EMAIL='archive@example.invalid',
        GIT_COMMITTER_NAME='Archive rehearsal fixture', GIT_COMMITTER_EMAIL='archive@example.invalid')
    def cmd(args, *, cwd=None, data=None, check=True, timeout=600):
        start = time.perf_counter()
        cp = subprocess.run(args, cwd=cwd or clone, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=timeout)
        command_log.append({'argv': args, 'cwd': str(cwd or clone), 'exit': cp.returncode,
            'seconds': time.perf_counter() - start, 'stdoutSha256': hashlib.sha256(cp.stdout).hexdigest(),
            'stderr': cp.stderr.decode(errors='replace')[-1000:]})
        if check and cp.returncode: raise RuntimeError(str(command_log[-1]))
        return cp
    def git(*args, data=None):
        return cmd(['git', '-c', 'core.hooksPath=/dev/null', *args], data=data).stdout
    def stage(path, data, mode='100644'):
        dest = clone / path; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
        oid = git('hash-object', '-w', '--stdin', data=data).decode().strip()
        git('update-index', '--add', '--cacheinfo', mode, oid, path)
    def commit(message, parent):
        tree = git('write-tree').decode().strip()
        return git('commit-tree', tree, '-p', parent, data=(message + '\n').encode()).decode().strip()
    def checkout(oid): git('checkout', '--detach', oid)
    cmd(['git', '-c', 'core.hooksPath=/dev/null', 'clone', '--no-hardlinks', '--no-checkout', str(source), str(clone)], cwd=scratch)
    common = pathlib.Path(git('rev-parse', '--path-format=absolute', '--git-common-dir').decode().strip()).resolve()
    assert common.is_relative_to(scratch.resolve())
    checkout(pin)
    assert not git('status', '--porcelain').strip()
    # Actual release addon/helper fixture, not a production bypass or fake binary.
    release_manifest = json.loads((release / 'manifest.json').read_text())
    fixture_paths = []
    def stage_addon():
        for rel in [release_manifest['components']['nativeAddon']['path'], release_manifest['entries']['fgos']]:
            dest = clone / rel; assert not dest.exists(), rel
            dest.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(release / rel, dest); fixture_paths.append(dest)
        addon = clone / release_manifest['components']['nativeAddon']['path']
        assert hashlib.sha256(addon.read_bytes()).hexdigest() == release_manifest['components']['nativeAddon']['digest']
        dest = clone / 'native-addon.json'; assert not dest.exists()
        dest.write_text(json.dumps(release_manifest) + '\n'); fixture_paths.append(dest)
    def unstage_addon():
        for path in fixture_paths: path.unlink()
        fixture_paths.clear()
    tests = []
    link_checks = []
    def run_tests(phase):
        stage_addon()
        for file in TESTS:
            argv = ['env', '-u', 'CLAUDE_CODE_SESSION_ID', 'FGOS_HOST_BIN=' + str(release / 'bin/fgos'), 'node', '--test', file]
            try:
                cp = cmd(argv, check=False, timeout=360)
                data = cp.stdout + cp.stderr; code = cp.returncode
            except subprocess.TimeoutExpired as e:
                data = (e.stdout or b'') + (e.stderr or b'') + b'\nTIMEOUT 360s\n'; code = 124
            name = phase + '-' + pathlib.Path(file).name + '.log.gz'
            (output / 'audit' / name).write_bytes(gzip.compress(data, mtime=0))
            text = data.decode(errors='replace')
            tests.append({'phase': phase, 'file': file, 'exit': code, 'log': A + 'audit/' + name,
                'sha256': hashlib.sha256(data).hexdigest(),
                'summary': [s for s in text.splitlines() if re.match(r'^(?:ℹ|#) (?:tests|pass|fail|skipped|cancelled) ', s)],
                'failedTitles': [s for s in text.splitlines() if s.startswith(('not ok ', '✖ '))]})
            print(json.dumps(tests[-1], ensure_ascii=False), flush=True)
        # Full unchanged candidate-status and retirement CLIs are attempted.
        # Saved inventory shards are absent at this pin; record that limitation,
        # then exercise retirement's actual link evaluator with real metadata.
        for name in ['check-doc-candidate-status', 'check-doc-retirement']:
            cp = cmd(['node', 'scripts/' + name + '.mjs', '--json'], check=False, timeout=600)
            log = phase + '-' + name + '.json.gz'
            (output / 'audit' / log).write_bytes(gzip.compress(cp.stdout + cp.stderr, mtime=0))
            document = json.loads(cp.stdout) if cp.stdout.startswith(b'{') else None
            link_checks.append({'phase': phase, 'check': name, 'exit': cp.returncode, 'log': A + 'audit/' + log,
                'sha256': hashlib.sha256(cp.stdout + cp.stderr).hexdigest(), 'result': document,
                'error': cp.stderr.decode(errors='replace') if document is None else None})
        evaluator = r"""
import fs from 'node:fs';
import {checkCandidateMetadata, DEFAULT_SWITCHBOARD_PATH} from './scripts/check-doc-candidate-status.mjs';
import {trackedPlatformDocs, DEFAULT_CONSTITUTION_PATH} from './scripts/check-doc-constitution.mjs';
import {evaluateRetirement} from './scripts/check-doc-retirement.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')), root=process.cwd(), constitution=read(DEFAULT_CONSTITUTION_PATH);
const candidateStatus=checkCandidateMetadata({files:trackedPlatformDocs(root), readFile:p=>fs.readFileSync(p,'utf8'), switchboard:read(DEFAULT_SWITCHBOARD_PATH),constitution,repoRoot:root});
// Only links-resolve is asserted; unrelated inventory measures below are fixture
// inputs, NOT a substitute inventory, cutover pass, or baseline modification.
const inputs={candidateStatus,conservation:{open:[],invariant:[]},inventory:{},aliasTable:{entries:[]},aliasFindings:[],previousRegistries:[],ratchetResult:null,cutoverRows:{total:0,byReason:{}},usageDrift:[],promotion:{}};
console.log(JSON.stringify({scope:'production links-resolve evaluator only; unrelated inventory fixture inputs', findings:candidateStatus.findings.filter(f=>['unresolved-link','unresolved-related'].includes(f.type)),results:evaluateRetirement(inputs,constitution).filter(r=>r.id==='links-resolve')}));
"""
        cp = cmd(['node', '--input-type=module', '-e', evaluator])
        result = json.loads(cp.stdout)
        link_checks.append({'phase': phase, 'check': 'retirement-links-resolve', 'exit': cp.returncode, 'result': result})
        unstage_addon()
    run_tests('baseline')
    # Archive is an augmented full source snapshot. Newly generated audit objects
    # are reachable there too; the main-side manifest only carries descriptors.
    for asset in manifest['auditAssets']:
        data = (source / asset['path']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == asset['sha256']
        stage(asset['path'], data)
    archive = commit('docs(archive): preserve full source snapshot and audit custody', pin)
    git('update-ref', manifest['archiveRef'], archive, '0' * 40)
    # Prove sourceCommit:path and archiveCommit:path agree for every moving blob.
    for row in partition['records']:
        data = (clone / row['path']).read_bytes()
        assert len(data) == row['size'] and hashlib.sha256(data).hexdigest() == row['sha256']
    # No individual product/test/script path is removed. This is a tip-only plan
    # disposition; all historical inputs stay reachable through archive ancestry.
    for path in moving: (clone / path).unlink()
    git('update-index', '--force-remove', '--stdin', data=('\n'.join(moving) + '\n').encode())
    old_artifacts = [s for s in git('ls-files', '--', A).decode().splitlines() if s not in manifest['mainSidePaths']]
    for path in old_artifacts:
        dest = clone / path
        if dest.exists(): dest.unlink()
    git('update-index', '--force-remove', '--stdin', data=('\n'.join(old_artifacts) + '\n').encode())
    measured_artifacts = []
    for path in manifest['mainSidePaths']:
        original = source / path
        if not original.exists(): continue
        data = original.read_bytes()
        if path == A + 'manifest.json':
            header = {**manifest, 'archiveCommit': archive}
            data = (json.dumps(header, ensure_ascii=False, indent=2) + '\n').encode()
        stage(path, data)
        measured_artifacts.append({'path': path, 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    removed = commit('docs(archive): rehearse reader-justified tip removal', pin)
    checkout(removed)
    assert not git('status', '--porcelain').strip()
    # Run the ENTIRE unchanged checks.mjs, including B/H/I, independently of
    # the owning test's earlier ownership stage. No A-only slice hides new H.
    def read_checks(dest, filename):
        return json.loads((dest / filename.replace('-reproduction.json', '-checks.json')).read_text())
    accounting = []
    stage_addon()
    for filename, key in RECIPES:
        path = P + 'reports/phase-06/' + filename
        original = (clone / path).read_text(); document = json.loads(original)
        script = document[key]['checks.mjs']
        dest = scratch / ('A-' + filename); dest.mkdir()
        (dest / 'checks.mjs').write_text(script)
        before = cmd(['node', str(dest / 'checks.mjs'), '--output-dir', str(dest)], check=False)
        before_checks = read_checks(dest, filename)
        (output / 'audit' / ('before-' + filename + '.gz')).write_bytes(gzip.compress(json.dumps(before_checks).encode(), mtime=0))
        prior = before_checks['A']
        pairs = prior['unaccountedPairs']
        removal_pairs = [p for p in pairs if p['commit'] == removed]
        previous_pairs = [p for p in pairs if p['commit'] != removed]
        # Fixture-only exact accounting: never expand allowed paths, edit B pins,
        # remove checks, or call preexisting pending pairs approved in the source.
        new_rows = [{**r, 'authority': 'L12-129 / w2-d5b removal rehearsal ONLY'} for r in removal_pairs]
        new_rows += [{**r, 'authority': 'fixture-only simulation of pending Lead accounting; NOT source approval'} for r in previous_pairs]
        start = script.index('const exceptions=') + len('const exceptions=')
        end = script.index(';\nconst commits=', start)
        exceptions = json.loads(script[start:end])
        amended = script[:start] + json.dumps(exceptions + new_rows, ensure_ascii=False, separators=(',', ':')) + script[end:]
        assert amended[:start] == script[:start] and amended[amended.index(';\nconst commits=', start):] == script[end:]
        # This is the actual manifest-only change the Lead must make after the
        # removal commit exists. This worker writes it only in this fixture.
        assert original.count(json.dumps(script, ensure_ascii=False)) == 1
        replacement = original.replace(json.dumps(script, ensure_ascii=False), json.dumps(amended, ensure_ascii=False), 1)
        (clone / path).write_text(replacement)
        (dest / 'checks.mjs').write_text(amended)
        after = cmd(['node', str(dest / 'checks.mjs'), '--output-dir', str(dest)], check=False)
        after_checks = read_checks(dest, filename)
        (output / 'audit' / ('after-' + filename + '.gz')).write_bytes(gzip.compress(json.dumps(after_checks).encode(), mtime=0))
        result = after_checks['A']
        assert not result['newWorkingViolations'] and result['ok']
        baseline_h = next(r['result']['findings'] for r in link_checks if r['phase'] == 'baseline' and r['check'] == 'check-doc-candidate-status')
        assert after_checks['H']['findings'] == baseline_h, 'new H finding after removal'
        assert after_checks['B']['ok'], 'frozen tooling pin changed'
        accounting.append({'manifest': path, 'embeddedKey': key, 'recipeSha256': hashlib.sha256(script.encode()).hexdigest(),
            'recipeScope': 'Entire unchanged checks.mjs; only exact exception-array rows appended in clone',
            'afterBOk': after_checks['B']['ok'], 'afterHFindings': len(after_checks['H']['findings']),
            'afterHNewFindings': 0, 'afterIOk': after_checks['I']['equalToHEAD'] and after_checks['I']['frozenBaselineUnchanged'],
            'afterRecipeExit': after.returncode,
            'beforeExit': before.returncode, 'beforeUnaccountedPairs': len(pairs),
            'removalCommit': removed, 'removalPairs': len(removal_pairs), 'preexistingPendingPairs': len(previous_pairs),
            'afterExit': 0 if result['ok'] else 1, 'afterAOk': result['ok'], 'afterUnaccountedPairs': len(result['unaccountedPairs']),
            'afterWorkingViolations': len(result['newWorkingViolations']),
            'pairRows': new_rows, 'noBPinOrAllowlistChange': True})
    unstage_addon()
    for filename, key in RECIPES:
        path = P + 'reports/phase-06/' + filename
        stage(path, (clone / path).read_bytes())
    candidate = commit('docs(archive): account exact rehearsal removal pairs', removed)
    checkout(candidate)
    assert not git('status', '--porcelain').strip()
    for row in partition['retained']:
        if any(row['path'].endswith('/' + n) for n, _ in RECIPES): continue
        assert hashlib.sha256((clone / row['path']).read_bytes()).hexdigest() == row['sha256']
    run_tests('reduced')
    # Measure post-F and pre-freeze variants. The latter restores every current
    # gate program and its conservative transitive inputs, including the ten
    # reviewed programs. Thus no partial/unmet gate is silently retired now.
    for path in gates['temporaryInputs']:
        data = (source / path).read_bytes()
        stage(path, data, next(r['mode'] for r in partition['records'] if r['path'] == path))
    with_gates = commit('docs(archive): retain gates and inputs until final pin acceptance', candidate)
    checkout(with_gates)
    filesystem = cmd(['stat', '-f', '-c', '%T %t %s %b %a', str(scratch)], cwd=scratch).stdout.decode().strip()
    findmnt = cmd(['findmnt', '-T', str(scratch.resolve()), '-no', 'SOURCE,FSTYPE,TARGET'], cwd=scratch).stdout.decode().strip()
    assert not filesystem.startswith(('tmpfs ', 'ramfs ')), 'real disk required'
    variants = []
    for name, oid in [('after-final-pin-without-gates', candidate), ('before-final-pin-with-gates', with_gates)]:
        sizes = []
        for row in git('ls-tree', '-rl', oid).decode().splitlines():
            meta, path = row.split('\t', 1); size = meta.split()[3]
            if size != '-': sizes.append((path, int(size)))
        timings = []
        # Cache eviction is not permitted in this worker. The brief explicitly
        # accepts the first add in a fresh clone as the cold-run fallback.
        cold_clone = scratch / (name + '-fresh-clone')
        cmd(['git', '-c', 'core.hooksPath=/dev/null', 'clone', '--no-hardlinks', '--no-checkout', str(clone), str(cold_clone)], cwd=scratch)
        for i in range(1, 4):
            wt = scratch / (name + '-' + str(i)); assert not wt.exists()
            start = time.perf_counter()
            cp = cmd(['git', '-c', 'core.hooksPath=/dev/null', 'worktree', 'add', '--detach', str(wt), oid], cwd=cold_clone)
            seconds = time.perf_counter() - start
            assert git('-C', str(wt), 'rev-parse', 'HEAD').decode().strip() == oid
            timings.append({'run': i, 'seconds': seconds, 'exit': cp.returncode,
                'cache': 'cold fallback: first worktree add in fresh no-hardlinks/no-checkout clone' if i == 1 else 'warm',
                'timingRepo': str(cold_clone)})
            cmd(['git', '-c', 'core.hooksPath=/dev/null', 'worktree', 'remove', str(wt)], cwd=cold_clone)
        shutil.rmtree(cold_clone)
        variants.append({'variant': name, 'commit': oid, 'files': len(sizes), 'tipBytes': sum(n for p, n in sizes),
            'planFiles': sum(p.startswith(P) for p, n in sizes), 'planBytes': sum(n for p, n in sizes if p.startswith(P)),
            'archiveTipBytes': sum(n for p, n in sizes if p.startswith(A)), 'runs': timings,
            'medianSeconds': statistics.median(r['seconds'] for r in timings)})
    # Preserve just the new objects/trees/refs as a thin, local evidence bundle;
    # source history is a declared prerequisite, never copied into the tip.
    git('update-ref', 'refs/heads/rehearsal/archive-reduced', candidate, '0' * 40)
    git('update-ref', 'refs/heads/rehearsal/archive-with-gates', with_gates, '0' * 40)
    bundle = output / 'audit/rehearsal.bundle'
    git('bundle', 'create', str(bundle), manifest['archiveRef'], 'refs/heads/rehearsal/archive-reduced',
        'refs/heads/rehearsal/archive-with-gates', '^' + pin)
    git('bundle', 'verify', str(bundle))
    result = {'sourceCommit': pin, 'archiveRef': manifest['archiveRef'], 'archiveCommit': archive,
        'removalCommit': removed, 'accountedCandidate': candidate, 'preFreezeCandidate': with_gates,
        'filesystemStat': filesystem, 'findmnt': findmnt, 'physicalScratch': str(scratch.resolve()),
        'logicalScratch': str(scratch), 'warmCache': False,
        'coldMethod': 'drop_caches not writable/permitted; first add in a fresh --no-hardlinks --no-checkout clone per variant (brief-authorized fallback, not physical cache eviction)', 'variants': variants,
        'bundle': {'path': A + 'audit/rehearsal.bundle', 'size': bundle.stat().st_size,
            'sha256': hashlib.sha256(bundle.read_bytes()).hexdigest(), 'prerequisiteCommit': pin, 'verifyExit': 0},
        'gatePrograms': len(gates['programs']), 'reviewedTen': gates['reviewedTen'],
        'temporaryGateFiles': len(gates['temporaryInputs']), 'retainedFilesVerified': len(partition['retained']),
        'tests': tests, 'linkChecks': link_checks, 'accounting': [{k: v for k, v in r.items() if k != 'pairRows'} for r in accounting],
        'measuredMainArtifacts': measured_artifacts,
        'postMeasurementNote': 'Receipt and rehearsal outputs are written after measured commits. Their exact delta must be added at F; no final-tree claim.',
        'releaseId': release_manifest['artifactDigest'], 'rustFreshness': 'activated addon only; working-tree Rust freshness not established',
        'noSourceGitWrites': True, 'noProductOrTestSourceChange': True}
    for name, data in [('pair-accounting.json', accounting), ('rehearsal-commands.json', command_log), ('test-results.json', tests)]:
        (output / 'audit' / (name + '.gz')).write_bytes(gzip.compress((json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode(), mtime=0))
    (output / 'rehearsal.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ('tests', 'linkChecks', 'reviewedTen', 'measuredMainArtifacts')}, ensure_ascii=False), flush=True)
    if opts.rebuild:
        subprocess.run(['python3', '-B', str(output / 'verify-design.py')], cwd=source, check=True)
    shutil.rmtree(physical)
    scratch.unlink()
    physical.parent.rmdir()

if __name__ == '__main__': main()
