#!/usr/bin/env python3
"""Apply the candidate archive plan only to an existing --no-hardlinks scratch clone.
No writes outside /tmp/fgos-work/archive and this scoped artifact directory.
Uses Git plumbing in the disposable clone (never git add/commit, never source refs).
"""
import argparse, hashlib, json, os, pathlib, re, shutil, statistics, subprocess, time

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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--clone', required=True)
    ap.add_argument('--release-path', required=True)
    opts = ap.parse_args()
    source = pathlib.Path(__file__).resolve().parents[5]
    output = source / A
    clone = pathlib.Path(opts.clone).resolve()
    scratch = clone.parent
    assert clone.is_relative_to(pathlib.Path('/tmp/fgos-work/archive')) and clone != source
    assert (clone / '.git').is_dir() and not (clone / '.git').is_symlink()
    release = pathlib.Path(opts.release_path).resolve()
    manifest = json.loads((output / 'manifest.json').read_text())
    pin = manifest['inputCommit']
    command_log = []
    def cmd(args, *, input=None, env=None, timeout=240):
        started = time.perf_counter()
        cp = subprocess.run(args, cwd=clone, input=input, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            env=env, timeout=timeout)
        command_log.append({'argv':args,'cwd':str(clone),'exit':cp.returncode,'seconds':time.perf_counter()-started,
            'stdoutSha256':hashlib.sha256(cp.stdout).hexdigest(),'stderr':cp.stderr.decode(errors='replace')[-4000:]})
        (scratch / 'commands.json').write_text(json.dumps(command_log, indent=2)+'\n')
        if cp.returncode: raise RuntimeError(str(command_log[-1]))
        return cp.stdout
    def git(*args, **kw):
        return cmd(['git','-c','core.hooksPath=/dev/null',*args], **kw)
    common = pathlib.Path(git('rev-parse','--path-format=absolute','--git-common-dir').decode().strip()).resolve()
    assert common.is_relative_to(scratch), 'Git writes must not escape the disposable clone'
    assert git('rev-parse','HEAD').decode().strip() == pin, 'new clean source clone required'
    assert not git('status','--porcelain','--untracked-files=all').strip(), 'clone must initially be clean'
    disk = shutil.disk_usage(scratch)
    assert disk.free > 2 * 1024**3, 'need room for a reduced worktree and isolated tests'
    env = os.environ.copy()
    env.pop('CLAUDE_CODE_SESSION_ID', None)
    for key, name in [('HOME','home'),('FGOS_STATE_ROOT','state'),('TMPDIR','tmp'),('TMP','tmp'),('TEMP','tmp')]:
        dest = scratch / name
        dest.mkdir(mode=0o700, exist_ok=True); dest.chmod(0o700)
        env[key] = str(dest)
    fixture_paths = []
    def stage_addon():
        release_manifest = json.loads((release / 'manifest.json').read_text())
        for rel in [release_manifest['components']['nativeAddon']['path'], release_manifest['entries']['fgos']]:
            dest = clone / rel
            assert not dest.exists(), 'fixture must not overwrite source bytes: '+rel
            dest.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(release / rel, dest)
            fixture_paths.append(dest)
        addon = clone / release_manifest['components']['nativeAddon']['path']
        assert hashlib.sha256(addon.read_bytes()).hexdigest() == release_manifest['components']['nativeAddon']['digest']
        dest = clone / 'native-addon.json'
        assert not dest.exists()
        dest.write_text(json.dumps(release_manifest)+'\n'); fixture_paths.append(dest)
        return release_manifest['artifactDigest']
    release_id = stage_addon()
    tests = []
    logs = output / 'test-logs'; logs.mkdir(exist_ok=True)
    def run_tests(phase):
        for file in TESTS:
            argv = ['env','-u','CLAUDE_CODE_SESSION_ID','FGOS_HOST_BIN='+str(release/'bin/fgos'),'node','--test',file]
            start = time.perf_counter()
            try:
                cp = subprocess.run(argv,cwd=clone,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=360)
                data = cp.stdout; exit_code = cp.returncode
            except subprocess.TimeoutExpired as e:
                data = (e.stdout or b'') + b'\nTIMEOUT 360 seconds\n'; exit_code = 124
            text = data.decode(errors='replace')
            name = phase+'-'+pathlib.Path(file).name+'.log'
            (logs/name).write_bytes(data)
            result = {'phase':phase,'file':file,'argv':argv,'exit':exit_code,'seconds':time.perf_counter()-start,
                'log':A+'test-logs/'+name,'sha256':hashlib.sha256(data).hexdigest(),
                'summary':[line for line in text.splitlines() if re.match(r'^(?:ℹ|#) (?:tests|pass|fail|skipped|cancelled) ',line)]}
            tests.append(result)
            (output/'test-results.json').write_text(json.dumps(tests,ensure_ascii=False,indent=2)+'\n')
            print(json.dumps(result,ensure_ascii=False),flush=True)
    run_tests('baseline')
    for p in fixture_paths: p.unlink()
    git('update-ref',manifest['archiveRef'],pin,'0'*40)
    assert git('rev-parse',manifest['archiveRef']).decode().strip() == pin
    # Verify all current archival bytes and each proposed retirement before any deletion.
    for row in manifest['records']:
        path = clone / row['path']; data = path.read_bytes()
        assert len(data) == row['size'] and hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
        assert git('rev-parse',pin+':'+row['path']).decode().strip() == row['blobId']
    retired_specs = json.loads((output/'reader-patches/standalone-retirement-specs.json').read_text())['specs']
    moving = {r['path']:r for r in manifest['records']}
    for spec in retired_specs:
        assert spec['path'] in moving and moving[spec['path']]['sha256'] == spec['beforeSha256']
    # Apply exact removal specs through the clone's index; every source byte remains at archiveRef.
    for row in manifest['records']: (clone/row['path']).unlink()
    git('update-index','--force-remove','--stdin',input=('\n'.join(moving)+'\n').encode())
    # Include all design artifacts currently authored, except baseline test logs
    # (evidence is never smuggled into the candidate measured tree as code).
    added = []
    for original in sorted(output.rglob('*')):
        if not original.is_file() or original.is_symlink(): continue
        if original.parent.name == 'test-logs' or original.name == 'test-results.json': continue
        rel = original.relative_to(source).as_posix()
        dest = clone / rel; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(original,dest)
        oid = git('hash-object','-w','--stdin',input=original.read_bytes()).decode().strip()
        git('update-index','--add','--cacheinfo','100644',oid,rel)
        added.append(rel)
    # Main-side historical reader repoint specification is installed as data;
    # immutable Markdown/JSON recipe bodies and frozen B pins are never rewritten.
    assert (clone/A/'reader-patches/historical-replay-specs.json').is_file()
    tree = git('write-tree').decode().strip()
    identity = {**env,'GIT_AUTHOR_NAME':'Archive rehearsal fixture','GIT_AUTHOR_EMAIL':'archive@example.invalid',
        'GIT_COMMITTER_NAME':'Archive rehearsal fixture','GIT_COMMITTER_EMAIL':'archive@example.invalid'}
    candidate = git('commit-tree',tree,'-p',pin,input=b'docs(archive): rehearse conservative record retention\n',env=identity).decode().strip()
    git('update-ref','refs/heads/rehearsal/archive-reduced',candidate,'0'*40)
    git('checkout','--detach',candidate)
    # All retained inputs, all test files, and all product code remain byte-identical.
    for row in manifest['retained']:
        assert hashlib.sha256((clone/row['path']).read_bytes()).hexdigest() == row['sha256'], row['path']
    changed = git('diff','--name-only',pin,candidate).decode().splitlines()
    assert set(changed) == set(moving) | set(added)
    assert not any(p.startswith(('test/','scripts/','src/','packages/')) for p in changed)
    sizes = []
    for row in git('ls-tree','-rl',candidate).decode().splitlines():
        meta,p = row.split('\t',1); size = meta.split()[3]
        if size != '-': sizes.append((p,int(size)))
    timings = []
    for i in range(1,4):
        wt = scratch / ('timed-worktree-'+str(i))
        assert not wt.exists()
        start = time.perf_counter(); git('worktree','add','--detach',str(wt),candidate,timeout=300)
        elapsed = time.perf_counter()-start
        timings.append({'run':i,'seconds':elapsed,'path':str(wt),'exit':0,'commit':candidate})
        assert git('-C',str(wt),'rev-parse','HEAD').decode().strip() == candidate
        git('worktree','remove',str(wt))
    timing = {'inputCommit':pin,'archiveRef':manifest['archiveRef'],'archiveCommit':pin,'candidateCommit':candidate,
        'candidateParent':pin,'candidateLogicalFiles':len(sizes),'candidateLogicalBytes':sum(n for p,n in sizes),
        'candidatePlanFiles':sum(p.startswith(P) for p,n in sizes),'candidatePlanBytes':sum(n for p,n in sizes if p.startswith(P)),
        'runs':timings,'medianSeconds':statistics.median(r['seconds'] for r in timings),
        'filesystem':'/tmp tmpfs; local warm-cache rehearsal, NOT production SSD/F acceptance',
        'includedArtifactPaths':added,'excludedEvidencePaths':['test-logs/**','test-results.json','rehearsal.json (written after measurement)'],
        'retainedBytesVerified':len(manifest['retained']),'retirementSpecsApplied':len(retired_specs),
        'noProductOrTestSourceChanges':True,'releaseId':release_id,
        'rustFreshness':'activated native addon only; checkout Rust freshness not certified'}
    (output/'rehearsal.json').write_text(json.dumps(timing,indent=2)+'\n')
    fixture_paths.clear(); stage_addon()
    run_tests('reduced')
    for p in fixture_paths: p.unlink()
    shutil.copy2(scratch/'commands.json',output/'rehearsal-commands.json')
    print(json.dumps(timing,ensure_ascii=False),flush=True)

if __name__ == '__main__':
    main()
