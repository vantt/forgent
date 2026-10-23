#!/usr/bin/env python3
"""Read-only, pin-bounded archive design. Writes records only into --output-dir.
Run with python3 -B. No Git mutations. Deliberately conservative lexical joins
reuse the L12-134 filename/body scan approach; no arbitrary reachability claim.
"""
import argparse, collections, hashlib, json, pathlib, re, subprocess

P = 'plans/260925-documentation-authority-unification/'
A = P + 'reports/phase-09/archive/'
CODE = {'.mjs', '.js', '.cjs', '.py', '.sh', '.bash', '.ts', '.tsx', '.rs'}
NAME = re.compile(r'(?<![A-Za-z0-9_.-])[A-Za-z0-9_.-]+\.(?:jsonl?|md|log|gz|mjs|py|txt)(?:\.json)?')
EXEC = re.compile(r'\b(?:import |from \S+ import |const |let |function |def |assert |JSON\.(?:parse|stringify)|fs\.|readFile|read_text\(|read_bytes\(|json\.load|subprocess\.|readdir|\.glob\(|\.rglob\(|open\()|(?:^|\n)\s*(?:env |node |python[23]? |bash |sh |git |npm )')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--output-dir', required=True)
    opts = ap.parse_args()
    root = pathlib.Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
    out = pathlib.Path(opts.output_dir).resolve()
    if out != root / A.rstrip('/') and not str(out).startswith('/tmp/fgos-work/archive/'):
        raise SystemExit('Output must be scoped archive directory or /tmp/fgos-work/archive/')
    out.mkdir(parents=True, exist_ok=True)
    def emit(name, data):
        dest = out / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=root)
    pin = git('rev-parse', 'HEAD').decode().strip()
    all_entries = {}
    for row in git('ls-tree', '-rlz', pin).split(b'\0'):
        if not row: continue
        meta, pb = row.split(b'\t', 1)
        mode, typ, oid, size = meta.split()
        path = pb.decode()
        if typ == b'blob' and mode != b'120000' and not path.startswith('.fgos/'):
            all_entries[path] = dict(path=path, blobId=oid.decode(), size=int(size), mode=mode.decode())
    files = {p: r for p, r in all_entries.items() if p.startswith(P) and not p.startswith(A)}
    prune_path = P + 'reports/phase-08/step-08-tree-prune-manifest.json'
    prune = json.loads((root / prune_path).read_text())
    # Retained check roots. Their entire literal/dependency closure is retained;
    # glob/directory inputs are explicitly seeded below (not inferred from a basename).
    protected = set()
    reasons = collections.defaultdict(set)
    def keep(path, why):
        if path in files:
            protected.add(path); reasons[path].add(why)
    for p, r in files.items():
        if r['size'] < 1000000: keep(p, 'small record/source, subject to explicit standalone replay retirement')
        if p.startswith(P + 'ledger/') or p.startswith(P + 'pilot/'):
            keep(p, 'current ledger/pilot ownership and review-proof input')
        if '/reports/phase-09/' in p: keep(p, 'current pre-flip record retained conservatively')
        if '/phase-02-doc-inventory.parts/' in p:
            keep(p, 'constructed/directory Phase 02 inventory input of retained verifier')
        if p in (P + 'reports/identity-registry.json', P + 'reports/phase-02-identity-registry.json'):
            keep(p, 'production inventory/retirement readers and owning tests')
    restored = {r['path'] for r in prune['directoryReaderCorrection']['restoredFiles']}
    for p in restored: keep(p, 'six restored owning source-witness inputs; no regression to historical-only custody')
    # Current corpus tests and frozen reproduction entrypoints retain their original bytes.
    roots = [
        P + 'reports/phase-06/step9-liveness-scan.mjs',
        P + 'reports/phase-06/step10-sync287-reproduce.py',
        P + 'reports/phase-06/step10-round4-rationale-rebuild.mjs',
        P + 'reports/phase-06/step10-round3-rationale-rebuild.mjs',
        P + 'reports/phase-06/step10-round5-reproduction.json',
        P + 'reports/phase-06/step10-sync4d-reproduction.json',
        P + 'reports/phase-06/working-identity-registry.json',
    ]
    for p in roots: keep(p, 'retained rationale/liveness owning proof and full entrypoint dependencies')
    for p in files:
        if re.search(r'/review-request-step10-.*-(345f15d95|287a22d33)\.json$', p):
            keep(p, 'round3/4 rationale directory-filter input')
        if re.search(r'/review-step10-.*-345f15d95\.md$', p):
            keep(p, 'round3/4 rationale directory-filter verdict input')
    byname = collections.defaultdict(list)
    for p in files: byname[pathlib.PurePosixPath(p).name].append(p)
    sources = {}
    edges = collections.defaultdict(set)
    bodies_count = 0
    enumerators = []
    # Only store bounded evidence: one locator per source,target (with raw scriptRef
    # joins separately preserved below). False positives retain bytes, never remove.
    witnesses = {}
    def body(path, field, text):
        nonlocal bodies_count
        bodies_count += 1
        for line_no, line in enumerate(text.splitlines(), 1):
            names = set(NAME.findall(line))
            for name in names:
                for target in byname.get(name, []):
                    if target == path: continue
                    edges[path].add(target)
                    witnesses.setdefault((path, target), {'field': field, 'line': line_no, 'text': line[:800]})
            if re.search(r'glob\(|rglob\(|readdir|listdir|iterdir|walk\(|\.filter\(|startsWith\(|endsWith\(', line):
                enumerators.append({'readerPath': path, 'field': field, 'line': line_no, 'text': line[:800]})
    def walk(path, obj, field=''):
        if isinstance(obj, dict):
            for k, v in obj.items(): walk(path, v, field + '/' + str(k).replace('~','~0').replace('/','~1'))
        elif isinstance(obj, list):
            if field.rsplit('/', 1)[-1].lower() in ('command','argv','cmd','args') and all(isinstance(v,str) for v in obj):
                body(path, field + '#argv', ' '.join(obj))
            for i, v in enumerate(obj): walk(path, v, field + '/' + str(i))
        elif isinstance(obj, str) and EXEC.search(obj): body(path, field, obj)
    # Source bytes are read from the pinned tree's matching working bytes, without
    # opening .fgos, symlinks, ignored files, installation metadata or secrets.
    scanned_bytes = 0
    import sys
    scanned_files = 0
    for p, r in all_entries.items():
        if p.startswith(A): continue
        suffix = pathlib.PurePosixPath(p).suffix
        in_plan = p in files
        if not in_plan and suffix not in CODE: continue
        data = (root / p).read_bytes()
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == r['blobId'], p
        scanned_bytes += len(data)
        scanned_files += 1
        if scanned_files % 250 == 0:
            print(json.dumps({'files': scanned_files, 'bytes': scanned_bytes, 'path': p, 'joins': len(witnesses)}), file=sys.stderr, flush=True)
        if in_plan: r['sha256'] = hashlib.sha256(data).hexdigest()
        text = data.decode('utf8', errors='replace')
        if suffix in CODE:
            sources[p] = text; body(p, '', text)
        elif suffix == '.json':
            try: walk(p, json.loads(text))
            except ValueError: body(p, 'raw', text)
        elif suffix == '.jsonl':
            for n, line in enumerate(text.splitlines(), 1):
                try: walk(p, json.loads(line), 'line:' + str(n))
                except ValueError:
                    if EXEC.search(line): body(p, 'line:' + str(n), line)
        elif suffix == '.md':
            start = None; block = []
            for n, line in enumerate(text.splitlines(), 1):
                if line.startswith(('```', '~~~')):
                    if start is None: start = n + 1; block = []
                    else: body(p, 'fence@' + str(start), '\n'.join(block)); start = None
                elif start is not None: block.append(line)
                elif EXEC.search(line): body(p, 'inline@' + str(n), line)
            if start is not None: body(p, 'fence@' + str(start), '\n'.join(block))
        elif EXEC.search(text): body(p, 'raw', text)
    # The retained reproduction test executes only these embedded programs.
    # Join their actual read expressions, not the historical exception-data arrays
    # in checks.mjs and not unexecuted author scripts. This preserves both audit
    # baselines (a first rehearsal exposed their absence; see attempts/initial).
    embedded_roots = []
    for filename, key in [('step10-round5-reproduction.json', 'scripts'), ('step10-sync4d-reproduction.json', 'readOnlyScripts')]:
        path = P + 'reports/phase-06/' + filename
        scripts = json.loads((root / path).read_text())[key]
        for name in ['ownership.mjs', 'audit-ownership.mjs', 'checks.mjs', 'step10-sync287-lib.mjs', 'lib.mjs']:
            if name not in scripts: continue
            text = scripts[name]
            embedded_roots.append({'path': path, 'field': key + '/' + name, 'sha256': hashlib.sha256(text.encode()).hexdigest()})
            for line in text.splitlines():
                if not re.search(r'\bread\(|readFileSync\(|readdirSync\(', line): continue
                for basename in set(NAME.findall(line)):
                    for target in byname.get(basename, []):
                        keep(target, 'retained embedded read: ' + path + '#' + key + '/' + name)
    # Product code and tests are always live roots. Also keep the full inputs of
    # specifically retained plan entrypoints. Other plan replay programs that
    # touch moving inputs are retirement proposals, never silently weakened checks.
    # A registry/manifest is data, not an executable graph root. In particular,
    # checks.mjs's million-byte historical exception array is bookkeeping, not
    # a million bytes of runtime read expressions. The retained test extracts
    # only ownership/audit-ownership/checks; their reads are the seeded registry,
    # ledger/pilot directories, start-checks, allowed-paths, reader-links baseline,
    # switchboard and constitution. Remaining embedded recipes are historical.
    live = set(p for p in sources if not p.startswith(P)) | {p for p in roots if p in sources}
    changed = True
    while changed:
        changed = False
        for src in sorted(live):
            for dst in edges.get(src, []):
                if dst not in protected:
                    keep(dst, 'retained reader closure: ' + src); changed = True
                if dst in sources and dst not in live:
                    live.add(dst); changed = True
    # Join the old scriptRefs conservatively for non-plan reader roots. Fixture
    # strings are intentionally over-retained, rather than mistaken for new scope.
    for row in prune['inventory']:
        for ref in row.get('scriptRefs', []):
            if isinstance(ref, str) and ref.startswith(('scripts/', 'test/', 'src/')):
                keep(row['path'], 'prior scriptRefs retained product/test boundary: ' + ref)
    moving = set(files) - protected
    # Retire standalone replay entrypoints (all bytes archived), transitively
    # including their importing/calling plan entrypoints. Retained current proof
    # roots must never be retired. Small records with embedded recipes stay as
    # historical evidence; their execution context is repointed in the reader index.
    # Enumeration-only replay scripts can construct every input name. Do not
    # certify them by an empty literal result: archive their entrypoint too.
    enumerating_programs = {r['readerPath'] for r in enumerators if r['readerPath'] in sources}
    historical_programs = set()
    import posixpath
    for row in prune['inventory']:
        for ref in row.get('scriptRefs', []):
            if isinstance(ref, dict):
                rp = posixpath.normpath((pathlib.PurePosixPath(prune_path).parent / ref['readerPath'].split('#', 1)[0]).as_posix())
                if rp in sources: historical_programs.add(rp)
    retired = (enumerating_programs | historical_programs) & set(files) - live
    while True:
        new = {s for s in sources if s.startswith(P) and s not in live and (edges.get(s, set()) & (moving | retired))} - retired
        if not new: break
        retired |= new
    moving |= retired
    protected -= retired
    # Full partition, no deletion of a retained test or product module.
    assert moving.isdisjoint(protected) and moving | protected == set(files)
    assert not retired & live
    historical = []
    script_refs = []
    for row in prune['inventory']:
        for ref in row.get('scriptRefs', []):
            if isinstance(ref, dict):
                rp = ref['readerPath'].split('#',1)[0]
                resolved = (pathlib.PurePosixPath(prune_path).parent / rp).as_posix()
                import posixpath
                resolved = posixpath.normpath(resolved)
                historical.append({'targetPath': row['path'], 'readerPath': resolved, 'locator': ref,
                    'disposition': 'historical replay repointed to exact archive execution context; absent target recovered by recorded blob',
                    'owningProof': 'historical replay in locator, not a current owning test',
                    'targetBlobId': row['gitBlob'], 'targetSha256': row['sha256'], 'targetSize': row['bytes']})
            if isinstance(ref, dict):
                reader_path = resolved
            else:
                reader_path = re.split(r'[:#]', ref, maxsplit=1)[0]
            disposition = 'retain' if row['path'] in protected else ('archive' if row['path'] in moving else 'already-pruned')
            script_refs.append({'targetPath': row['path'], 'ref': ref, 'readerPath': reader_path,
                'targetDisposition': disposition,
                'readerDisposition': 'retain-reader-and-input' if disposition == 'retain' else ('archive-entrypoint' if reader_path in moving else 'repoint-historical-execution-context'),
                'owningProof': reader_path,
                'proof': 'retained unchanged source/test and its inputs' if row['path'] in protected else 'reader closure / historical replay retirement proposal; see reader index'})
    # Proposed deletions are represented as exact whole-file specs. They are NOT
    # applied to the producer checkout, only in the disposable rehearsal clone.
    patch_specs = []
    for p in sorted(retired):
        row = files[p]
        patch_specs.append({'path': p, 'operation': 'archive-standalone-replay', 'beforeSha256': row['sha256'],
            'beforeBlobId': row['blobId'], 'expectedAfter': 'absent', 'archiveCommit': pin,
            'condition': 'after final-pin pre-flip proofs/reviews freeze; not a current gate waiver',
            'owningProof': p + ' (migration-only replay entrypoint, conserved at archive commit); retained product and test roots are excluded',
            'reasonTargets': sorted(edges[p] & (moving | retired))})
    record_readers = []
    for src, targets in sorted(edges.items()):
        hits = targets & moving
        if not hits: continue
        if src in moving: action = 'archive-with-inputs'
        elif src in sources: action = 'UNRESOLVED-live-source'
        else: action = 'historical-record-replay-context'
        record_readers.append({'readerPath': src, 'action': action,
            'targets': [{'path': p, **witnesses[(src,p)]} for p in sorted(hits)],
            'owningProof': src if src in sources else 'embedded historical recipe; no automatic execution from a retained live root',
            'archiveCommit': pin})
    unresolved = [r for r in record_readers if r['action'] == 'UNRESOLVED-live-source']
    manifest = {'contract': 'documentation-record-archive.v1', 'status': 'candidate-local-design-not-cutover-approval',
        'inputCommit': pin, 'archiveRef': 'refs/heads/archive/260925-records', 'archiveCommit': pin,
        'archiveRefPolicy': 'create-only at approved F; refuse a different existing target; publish only with cutover owner approval',
        'pathBase': 'repository-relative', 'thresholdBytes': 1000000,
        'recovery': {'bytes': 'git cat-file blob <blobId>', 'verify': 'size and sha256 must equal manifest; also verify archiveCommit:path -> blobId',
            'alreadyPruned': 'prior-prune-recovery.json carries original blobs not present in archiveCommit tree; ancestors keep them reachable'},
        'counts': {'planFiles': len(files), 'planBytes': sum(r['size'] for r in files.values()),
            'archiveFiles': len(moving), 'archiveBytes': sum(files[p]['size'] for p in moving),
            'retainFiles': len(protected), 'retainBytes': sum(files[p]['size'] for p in protected),
            'standaloneReplayRetirements': len(retired), 'unresolvedLiveSources': len(unresolved)},
        'records': [{**files[p], 'archiveCommit': pin} for p in sorted(moving)],
        'retained': [{**files[p], 'reasons': sorted(reasons[p])} for p in sorted(protected)],
        'sixRestoredInputs': sorted(restored),
        'limitations': ['Static and pin-bounded; all directory/enumeration residues require final-pin review, not arbitrary-program reachability proof.',
            'Retirement is a proposed cutover disposition, not independent acceptance or permission to disable current pre-flip gates.',
            'Current product inventory corpus is retained, so the ~0.2 GB aspirational tip is not claimed.']}
    emit('manifest.json', manifest)
    emit('reader-patches/standalone-retirement-specs.json', {'inputCommit':pin,'specs':patch_specs})
    emit('reader-patches/historical-replay-specs.json', {'inputCommit':pin,'historicalReaderFiles':len(set(r['readerPath'] for r in historical)),
        'readerTargetJoins':len(historical),'specification':'Repoint execution to archiveCommit checkout; recover absent inputs only by original manifest blob, size and digest. Do not alter frozen embedded script text or treat archive replay as current-code proof.', 'joins':historical})
    emit('reader-patches/prior-script-refs.json', {'inputCommit':pin,'joins':script_refs})
    emit('reader-patches/reader-index.json', {'inputCommit':pin,'readers':record_readers,'unresolved':unresolved})
    grouped_enumerators = {}
    for e in enumerators:
        key = (e['readerPath'], e['text'])
        group = grouped_enumerators.setdefault(key, {'readerPath':e['readerPath'], 'text':e['text'], 'firstLocator':{'field':e['field'],'line':e['line']}, 'occurrences':0})
        group['occurrences'] += 1
    emit('reader-patches/enumeration-review.json', {'inputCommit':pin,'status':'review-required-not-completeness-proof',
        'candidateOccurrences':len(enumerators), 'entries':list(grouped_enumerators.values()), 'retainedDirectorySets':['pilot/**','ledger/**','reports/phase-02-doc-inventory.parts/**','reports/phase-06/review-request-step10-.*-(345f15d95|287a22d33).json','reports/phase-06/review-step10-.*-345f15d95.md']})
    emit('prior-prune-recovery.json', {'inputCommit':pin,'records':[{'path':r['path'],'blobId':r['gitBlob'],'sha256':r['sha256'],'size':r['bytes'], 'sourceManifest':prune_path} for r in prune['inventory'] if r['action']=='remove']})
    emit('scan-receipt.json', {'inputCommit':pin,'planFilesScanned':len(files),'sourceFilesScanned':len(sources),'bytesScanned':scanned_bytes,
        'codeLikeBodiesScanned':bodies_count,'sourceTargetJoins':sum(map(len,edges.values())), 'enumerationCandidates':len(enumerators),
        'historicalJoins':len(historical),'priorScriptRefJoins':len(script_refs),'retainedProofRoots':sorted(live),
        'retainedEmbeddedReadRoots':embedded_roots,
        'unresolvedLiveSources':len(unresolved),'impactAnalysis':'degraded/unqueried: brief prohibits fgOS CLI; direct source/history scan only'})
    print(json.dumps(manifest['counts']))

if __name__ == '__main__':
    main()
