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
    opts = ap.parse_args()
    source = pathlib.Path(__file__).resolve().parents[5]
    output = source / A
    scratch = pathlib.Path(opts.scratch).absolute()
    assert str(scratch).startswith('/tmp/fgos-work/')
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
    # Isolate A's unchanged recipe, not ownership/H/B. The owning test stops in
    # ownership at this pin; that must not prevent observing the removal commit.
    def slice_a(text):
        return (text[:text.index('const B=')] + text[text.index('const exceptions='):text.index('const result=')]
            + "\nconst A={historicalOffenders:bad,historicalEqual,newWorkingViolations:wb,accountedPairs,unaccountedPairs,ok:!unaccountedPairs.length&&!wb.length};\n"
            + "fs.writeFileSync(outputDir+'/A.json',JSON.stringify(A));console.log(JSON.stringify({ok:A.ok,unaccountedPairs:A.unaccountedPairs.length,working:A.newWorkingViolations.length}));process.exitCode=A.ok?0:1;\n")
    accounting = []
    stage_addon()
    for filename, key in RECIPES:
        path = P + 'reports/phase-06/' + filename
        original = (clone / path).read_text(); document = json.loads(original)
        script = document[key]['checks.mjs']
        dest = scratch / ('A-' + filename); dest.mkdir()
        (dest / 'checks.mjs').write_text(slice_a(script))
        before = cmd(['node', str(dest / 'checks.mjs'), '--output-dir', str(dest)], check=False)
        prior = json.loads((dest / 'A.json').read_text())
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
        (dest / 'checks.mjs').write_text(slice_a(amended))
        after = cmd(['node', str(dest / 'checks.mjs'), '--output-dir', str(dest)], check=False)
        result = json.loads((dest / 'A.json').read_text())
        assert not result['newWorkingViolations'] and result['ok'] and after.returncode == 0
        accounting.append({'manifest': path, 'embeddedKey': key, 'recipeSha256': hashlib.sha256(script.encode()).hexdigest(),
            'slice': 'Exact A setup and const exceptions..historicalEqual; only A serialization added, H/B/ownership not invoked.',
            'beforeExit': before.returncode, 'beforeUnaccountedPairs': len(pairs),
            'removalCommit': removed, 'removalPairs': len(removal_pairs), 'preexistingPendingPairs': len(previous_pairs),
            'afterExit': after.returncode, 'afterAOk': result['ok'], 'afterUnaccountedPairs': len(result['unaccountedPairs']),
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
        for i in range(1, 4):
            wt = scratch / (name + '-' + str(i)); assert not wt.exists()
            start = time.perf_counter()
            git('worktree', 'add', '--detach', str(wt), oid)
            seconds = time.perf_counter() - start
            assert git('-C', str(wt), 'rev-parse', 'HEAD').decode().strip() == oid
            timings.append({'run': i, 'seconds': seconds, 'exit': 0})
            git('worktree', 'remove', str(wt))
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
        'logicalScratch': str(scratch), 'warmCache': True, 'variants': variants,
        'bundle': {'path': A + 'audit/rehearsal.bundle', 'size': bundle.stat().st_size,
            'sha256': hashlib.sha256(bundle.read_bytes()).hexdigest(), 'prerequisiteCommit': pin, 'verifyExit': 0},
        'gatePrograms': len(gates['programs']), 'reviewedTen': gates['reviewedTen'],
        'temporaryGateFiles': len(gates['temporaryInputs']), 'retainedFilesVerified': len(partition['retained']),
        'tests': tests, 'accounting': [{k: v for k, v in r.items() if k != 'pairRows'} for r in accounting],
        'measuredMainArtifacts': measured_artifacts,
        'postMeasurementNote': 'Receipt and rehearsal outputs are written after measured commits. Their exact delta must be added at F; no final-tree claim.',
        'releaseId': release_manifest['artifactDigest'], 'rustFreshness': 'activated addon only; working-tree Rust freshness not established',
        'noSourceGitWrites': True, 'noProductOrTestSourceChange': True}
    for name, data in [('pair-accounting.json', accounting), ('rehearsal-commands.json', command_log), ('test-results.json', tests)]:
        (output / 'audit' / (name + '.gz')).write_bytes(gzip.compress((json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode(), mtime=0))
    (output / 'rehearsal.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ('tests', 'reviewedTen', 'measuredMainArtifacts')}, ensure_ascii=False), flush=True)

if __name__ == '__main__': main()
