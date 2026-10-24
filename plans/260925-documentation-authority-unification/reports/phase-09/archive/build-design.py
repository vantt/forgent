#!/usr/bin/env python3
"""Read-only, pin-bounded archive design. Writes records only into --output-dir.
Run with python3 -B. No Git mutations. Deliberately conservative lexical joins
reuse the L12-134 filename/body scan approach; no arbitrary reachability claim.
"""
import argparse, collections, gzip, hashlib, json, pathlib, re, subprocess

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
    if out != root / A.rstrip('/') and not str(out).startswith('/tmp/fgos-work/'):
        raise SystemExit('Output must be scoped archive directory or external scratch')
    out.mkdir(parents=True, exist_ok=True)
    emitted_assets = []
    def emit(name, data):
        dest = out / 'audit' / (name.replace('/', '--') + '.gz')
        emitted_assets.append(dest)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(gzip.compress((json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode(), mtime=0))
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
    navigation = set()
    reasons = collections.defaultdict(set)
    def keep(path, why):
        if path in files:
            protected.add(path); reasons[path].add(why)
    for p, r in files.items():
        rel = p[len(P):]
        if rel == 'plan.md' or re.fullmatch(r'phase-\d\d-[^/]+\.md', rel):
            navigation.add(p)
            keep(p, 'plan navigation: ' + P + 'plan.md (phase table / entry contract)')
        if pathlib.PurePosixPath(p).name in ('owner-answers.md', 'preflip-gate-status.json', 'preflip-execution-plan.md', 'progress.md') or p.endswith('-brief.md'):
            navigation.add(p)
            keep(p, 'plan navigation: ' + P + 'reports/phase-09/preflip-execution-plan.md sections 1-4 (decisions / boundary / briefs / status)')
        if p.endswith('.json') and p.startswith((P + 'ledger/decisions/', P + 'pilot/decisions/')):
            keep(p, 'retained ownership.mjs and audit-ownership.mjs enumerate JSON inputs in these exact decision directories')
        if p.endswith('.json') and p.startswith((P + 'pilot/first-round/', P + 'pilot/second-round/')):
            keep(p, 'test/scripts/check-doc-constitution.test.mjs: the usage amendment rests on dispositions that the committed decision shards use; lines 668-675 enumerate JSON in both historical pilot rounds')
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
    for p in roots: keep(p, 'test/scripts/doc-rationale-reproduction.test.mjs or doc-runner-liveness.test.mjs: retained owning proof entrypoint/input')
    product_inputs = {
        'alias-table.json': 'scripts/doc-alias-resolver.mjs DEFAULT_ALIAS_TABLE_PATH: current alias lookup input; test/scripts/doc-alias-resolver.test.mjs',
        'claim-and-disposition-vocabulary.json': 'scripts/check-doc-constitution.mjs DEFAULT_VOCABULARY_PATH, verify-phase-02.mjs PHASE02_VOCAB and check-doc-inventory-gates.mjs: live classification vocabulary',
        'shipped-path-conventions-inventory.json': 'scripts/verify-phase-01.mjs reads committed inventory; generate-doc-inventory.mjs reads pinned inventory blob; retain current input, not just historical object',
        'dropped-claims-register.json': 'scripts/check-doc-inventory-gates.mjs DEFAULT_DROPPED_CLAIMS_REGISTER_PATH: current claim-disposition gate input',
    }
    # Exact read contracts replace the old outside-plan basename fan-out. A
    # run-dir receipt.json or a test's fixture output is not a read of our file.
    product_inputs.update({
        'minimum-constitution.json': 'scripts/check-doc-constitution.mjs DEFAULT_CONSTITUTION_PATH; check-doc-retirement.mjs gatherInputs',
        'transitional-switchboard.json': 'scripts/check-doc-candidate-status.mjs DEFAULT_SWITCHBOARD_PATH; runCli',
        'claim-ledger.schema.json': 'scripts/check-doc-constitution.mjs DEFAULT_SCHEMA_PATH; runCli',
        'reports/doc-inventory.json': 'scripts/check-doc-inventory-gates.mjs DEFAULT_INVENTORY_PATH / loadInventory (default from generate-doc-inventory.mjs:30)',
        'ledger/conflict-resolutions.json': 'scripts/check-doc-retirement.mjs DEFAULT_CONFLICT_RESOLUTIONS_PATH / gatherInputs',
        'ledger/retiring-roots.json': 'scripts/check-doc-retirement.mjs DEFAULT_RETIRING_ROOTS_PATH / gatherInputs',
        'reports/phase-08/step-06-evidence-consumer-table.json': 'scripts/check-evidence-relocation.mjs DEFAULT_CONSUMER_TABLE_PATH / runCli',
        'shipped-path-conventions-inventory.md': 'scripts/verify-phase-01.mjs:308 committedMd read (current fixed-end verifier input)',
    })
    for name, why in product_inputs.items(): keep(P + name, why)
    keep(P + 'reports/phase-08/step-08-preflip-gates.json', P + 'reports/phase-09/preflip-execution-plan.md:3 gate register (G0-G11)')
    # Enumerate EVERY tracked outside-plan file, including docs and other plans.
    # Store raw grep-equivalent lines as well as normalized targets. No basename
    # joins: exact paths, relative Markdown links, directories and globs only.
    import posixpath
    external_refs = []
    navigation_refs = []
    raw_external = []
    target_pattern = re.compile(re.escape(P) + r'[A-Za-z0-9_./*{}?,-]*')
    link_pattern = re.compile(r'\[[^\]]*\]\(\s*<?([^\s)>]+)')
    for p in all_entries:
        if p.startswith(A): continue
        if p.startswith(P) and p not in navigation: continue
        text = (root / p).read_bytes().decode('utf8', errors='replace')
        if '\0' in text: continue
        outside = not p.startswith(P)
        for number, line in enumerate(text.splitlines(), 1):
            if outside and P.rstrip('/') in line:
                raw_external.append({'readerPath': p, 'line': number, 'text': line})
            targets = set()
            if outside:
                for match in target_pattern.finditer(line):
                    literal = match.group().rstrip('.,')
                    # Brace alternatives are explicit paths, not basename guesses.
                    choices = [literal]
                    brace = re.search(r'\{([^{}]+)\}', literal)
                    if brace:
                        choices = [literal[:brace.start()] + x + literal[brace.end():] for x in brace[1].split(',')]
                    for candidate in choices:
                        if candidate in files: targets.add(candidate)
                        elif '*' in candidate:
                            import fnmatch
                            targets.update(x for x in files if fnmatch.fnmatchcase(x, candidate))
            for match in link_pattern.finditer(line):
                value = match[1].split('#')[0].split('?')[0]
                if re.match(r'^[a-z][a-z0-9+.-]*:', value, re.I): continue
                candidate = posixpath.normpath(posixpath.join(posixpath.dirname(p), value))
                if candidate in files: targets.add(candidate)
                # Directory references name a container, not every descendant.
                # Its exact reader sets are seeded separately above.
            for target in sorted(targets):
                row = {'readerPath': p, 'line': number, 'targetPath': target, 'text': line}
                (external_refs if outside else navigation_refs).append(row)
                keep(target, ('outside-plan path/link: ' if outside else 'plan navigation link: ') + p + ':' + str(number))
    external_audit = {'inputCommit': pin, 'scan': 'all tracked non-symlink files outside the plan, excluding .fgos; full-path lines plus normalized exact/glob/directory and relative Markdown targets', 'rawLines': raw_external, 'references': external_refs, 'navigationReferences': navigation_refs}
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
            # A retained program's output/provenance names are not input reads.
            # Directory/indirect read tuples are still scanned conservatively.
            if re.match(r'\s*(?:write|fs\.writeFileSync)\(', line): continue
            if re.search(r'\bevidence\s*:', line) and not re.search(r'\bread\(|readFile|read_text|read_bytes', line): continue
            names = set(NAME.findall(line))
            for name in names:
                for target in byname.get(name, []):
                    if target == path: continue
                    # Outside-plan reads are seeded from exact input contracts
                    # and full-path/link enumeration above, never name matches.
                    if not path.startswith(P): continue
                    # A quoted basename resolves beside a plan program, not to
                    # every unrelated same-name record elsewhere in the plan.
                    if len(byname[name]) > 1 and not (
                        posixpath.dirname(target) == posixpath.dirname(path)
                        or target[len(P):] in line or target in line): continue
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
                    witness = witnesses[(src, dst)]
                    keep(dst, 'retained plan reader: ' + src + '#' + witness['field'] + ':' + str(witness['line']) + ' ' + witness['text']); changed = True
                if dst in sources and dst not in live:
                    live.add(dst); changed = True
    # A42: retain DIRECT links from the existing kept rulings/navigation roots.
    # Infer ruling roots from their declared document type, never a filename list.
    # Do not promote targets to roots or overwrite the rejected fixed-point report.
    ruling = set()
    for path in sorted(protected):
        if not path.endswith('.md'): continue
        with (root / path).open() as stream:
            header = stream.read(12000)
        kind = re.search(r'^Document type:\s*([^\n]+)', header, re.M)
        if kind and re.match(r'(?:Specification|Policy|Governance|Contract|Decision)\b', kind[1], re.I):
            ruling.add(path)
    link_edges = {}
    closure_reasons = collections.defaultdict(set)
    closure_refs = []
    reached = set()
    pending = [(p, label) for label, roots_set in [('ruling', ruling), ('navigation', navigation)] for p in sorted(roots_set)]
    while pending:
        path, label = pending.pop()
        reached.add(path)
        if path not in link_edges:
            links = []
            text = (root / path).read_bytes().decode('utf8', errors='replace')
            if '\0' not in text:
                for number, line in enumerate(text.splitlines(), 1):
                    for match in link_pattern.finditer(line):
                        value = match[1].split('#')[0].split('?')[0]
                        if not value or re.match(r'^[a-z][a-z0-9+.-]*:', value, re.I): continue
                        target = posixpath.normpath(posixpath.join(posixpath.dirname(path), value))
                        if target in files:
                            links.append({'readerPath': path, 'line': number, 'targetPath': target})
            link_edges[path] = links
        for row in link_edges[path]:
            target = row['targetPath']
            reason = ('ruling link: ' if label == 'ruling' else 'navigation direct link: ') + path + ':' + str(row['line'])
            closure_reasons[target].add(reason)
            closure_refs.append({**row, 'rootKind': label})
            reached.add(target)
    added = reached - protected
    closure_bytes = sum(files[p]['size'] for p in added)
    closure = {'inputCommit': pin, 'status': 'blocked-budget-exceeded' if closure_bytes > 50000000 else 'within-budget',
        'policy': 'A42: one hop of relative Markdown links from already-kept declared Specification/Policy/Governance/Contract/Decision documents and navigation roots. Targets are not traversed.',
        'budgetBytes': 50000000, 'rulingRoots': sorted(ruling), 'navigationRoots': sorted(navigation),
        'beforeRetainedPaths': sorted(protected),
        'before': {'retainFiles': len(protected), 'retainBytes': sum(files[p]['size'] for p in protected)},
        'proposedAfter': {'retainFiles': len(protected | reached), 'retainBytes': sum(files[p]['size'] for p in protected | reached)},
        'addedFiles': len(added), 'addedBytes': closure_bytes,
        'added': [{**files[p], 'reasons': sorted(closure_reasons[p])} for p in sorted(added)],
        'references': closure_refs}
    rejected = (root / A / 'link-closure.json').read_bytes()
    closure['rejectedTransitiveClosure'] = {'path': A + 'link-closure.json',
        'sha256': hashlib.sha256(rejected).hexdigest(), 'status': 'historical-budget-stop-not-current-policy'}
    emit('direct-links.json', closure)
    if closure_bytes > closure['budgetBytes']:
        print(json.dumps({k: v for k, v in closure.items() if k not in ('added', 'references', 'rulingRoots', 'navigationRoots', 'beforeRetainedPaths')}), flush=True)
        raise SystemExit('Direct links exceed 50 MB: stopped without replacing manifest or retaining proposed files; see audit/direct-links.json.gz')
    for path in reached:
        for reason in closure_reasons[path]: keep(path, reason)
    emit('external-references.json', external_audit)
    # Join the old scriptRefs conservatively for non-plan reader roots. Fixture
    # strings are intentionally over-retained, rather than mistaken for new scope.
    for row in prune['inventory']:
        for ref in row.get('scriptRefs', []):
            if isinstance(ref, str) and ref.startswith(('scripts/', 'test/', 'src/')):
                # Old scriptRefs include fixture writes and malformed patterns.
                # Preserve their custody below, but only a current exact reader
                # or navigation link can justify tip retention.
                pass
    moving = set(files) - protected
    # Retire standalone replay entrypoints (all bytes archived), transitively
    # including their importing/calling plan entrypoints. Retained current proof
    # roots must never be retired. Other records, small or large, go to the
    # archive unless a retained reader or explicit navigation reason needs them.
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
    gate_programs = {p for p in sources if p.startswith(P + 'reports/phase-09/')}
    original_ten = {P + 'reports/phase-09/' + p for p in [
        'carries/replay-focused-proofs.py', 'carries/verify-carries.mjs',
        'census-join/join.py', 'census-join/test-locators.mjs',
        'composition/compose.py', 'composition/finalize.py', 'composition/replay-scans.mjs',
        'preserve-premise/physical-move.mjs', 'preserve-premise/proof.py', 'preserve-premise/verify.py']}
    assert original_ten <= gate_programs
    retired = ((set(sources) & moving) | ((enumerating_programs | historical_programs) & set(files) - live)) - protected
    while True:
        new = {s for s in sources if s.startswith(P) and s not in live and (edges.get(s, set()) & (moving | retired))} - retired - protected
        if not new: break
        retired |= new
    moving |= retired
    protected -= retired
    remaining_links = []
    for path in sorted(protected):
        text = (root / path).read_bytes().decode('utf8', errors='replace')
        if '\0' in text: continue
        for number, line in enumerate(text.splitlines(), 1):
            for match in link_pattern.finditer(line):
                value = match[1].split('#')[0].split('?')[0]
                if not value or re.match(r'^[a-z][a-z0-9+.-]*:', value, re.I): continue
                target = posixpath.normpath(posixpath.join(posixpath.dirname(path), value))
                if target in moving:
                    remaining_links.append({'readerPath': path, 'line': number, 'targetPath': target})
    emit('retained-archive-links.json', {'inputCommit': pin,
        'method': 'Source-relative Markdown link occurrences in all kept files; only existing archived plan targets',
        'readerFiles': len({r['readerPath'] for r in remaining_links}), 'links': len(remaining_links),
        'targetFiles': len({r['targetPath'] for r in remaining_links}), 'references': remaining_links})
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
            if reader_path.startswith(('test/', 'scripts/', 'src/')) and disposition != 'retain':
                # Validate the historical constructed-filename claim literally.
                template = re.search(r'constructed filename: ([^)]+)', ref) if isinstance(ref, str) else None
                if not template:
                    locator = re.search(r':([0-9]+)', ref)
                    assert locator, (row['path'], ref)
                    number = int(locator[1])
                    source_line = (root / reader_path).read_text().splitlines()[number - 1]
                    assert 'path.join(scratch,' in source_line and 'readFileSync' in source_line and pathlib.PurePosixPath(row['path']).name in source_line
                    script_refs.append({'targetPath':row['path'],'ref':ref,'readerPath':reader_path,
                        'targetDisposition':disposition,'readerDisposition':'fixture-scratch-output-not-tip-read',
                        'owningProof':None,'line':number,'text':source_line,
                        'proof':'Unchanged owning test reads its freshly generated scratch output, not the committed plan record'})
                    continue
                pattern = '[0-9]+'.join(re.escape(part) for part in re.split(r'\$\{[^}]+\}', template[1]))
                assert not re.fullmatch(pattern, row['path']), (row['path'], ref)
                script_refs.append({'targetPath': row['path'], 'ref': ref, 'readerPath': reader_path,
                    'targetDisposition': disposition, 'readerDisposition': 'fixture-pattern-does-not-match-target',
                    'owningProof': None, 'proof': 'Historical scriptRef rejected: fixture constructed filename does not match this path; unchanged product fixture behaviour, no tip read retired.', 'template': template[1]})
                continue
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
            'owningProof': None,
            'behaviourDisposition': 'behaviour retired with the plan',
            'behaviour': 'This standalone migration replay is no longer a maintained current-tip command; generic product behaviour and its owning tests are unchanged.',
            'schedule': 'retire-at-final-pin' if p in gate_programs else 'retire-with-plan-after-acceptance',
            'wasInReviewedTen': p in original_ten,
            'reasonTargets': sorted(edges[p] & (moving | retired))})
    record_readers = []
    for src, targets in sorted(edges.items()):
        hits = targets & moving
        if not hits: continue
        if src in moving: action = 'archive-with-inputs'
        elif src in live: action = 'UNRESOLVED-live-source'
        elif src in sources: action = 'linked-historical-source-archive-execution-context'
        else: action = 'historical-record-replay-context'
        record_readers.append({'readerPath': src, 'action': action,
            'targets': [{'path': p, **witnesses[(src,p)]} for p in sorted(hits)],
            'owningProof': None if src in moving else (src if src in sources else 'embedded historical recipe; no automatic execution from a retained live root'),
            'behaviourDisposition': 'behaviour retired with the plan' if src in moving else 'historical execution context repointed',
            'archiveCommit': pin})
    unresolved = [r for r in record_readers if r['action'] == 'UNRESOLVED-live-source']
    temporary = set(gate_programs)
    while True:
        grown = temporary | {dst for src in temporary for dst in edges.get(src, []) if dst in files}
        if grown == temporary: break
        temporary = grown
    temporary -= protected
    gate_retention = {'programs': sorted(gate_programs), 'reviewedTen': sorted(original_ten),
        'temporaryInputs': sorted(temporary),
        'schedule': 'Keep programs and their full conservative dependency closure until final-pin proofs and independent reviews freeze; only then retire. Not a gate waiver.'}
    emit('gate-retention.json', gate_retention)
    manifest = {'contract': 'documentation-record-archive.v2', 'status': 'candidate-local-design-not-cutover-approval',
        'inputCommit': pin, 'archiveRef': 'refs/heads/archive/260925-records', 'archiveCommit': pin,
        'archiveRefPolicy': 'create-only at approved F; archive snapshot includes source tree and generated audit assets; refuse a different existing target; publish only with cutover owner approval',
        'pathBase': 'repository-relative', 'retentionPolicy': 'No size threshold: retained reader closure or explicit plan-navigation reason only',
        'recovery': {'bytes': 'git cat-file blob <blobId>', 'verify': 'size and sha256 must equal manifest; also verify archiveCommit:path -> blobId',
            'alreadyPruned': 'prior-prune-recovery.json carries original blobs not present in archiveCommit tree; ancestors keep them reachable'},
        'counts': {'planFiles': len(files), 'planBytes': sum(r['size'] for r in files.values()),
            'archiveFiles': len(moving), 'archiveBytes': sum(files[p]['size'] for p in moving),
            'retainFiles': len(protected), 'retainBytes': sum(files[p]['size'] for p in protected),
            'standaloneReplayRetirements': len(retired), 'unresolvedLiveSources': len(unresolved),
            'gateProgramsRetireAtFinalPin': len(gate_programs), 'reviewedTen': len(original_ten),
            'temporaryGateFiles': len(temporary), 'temporaryGateBytes': sum(files[p]['size'] for p in temporary)},
        'records': [{**files[p], 'archiveCommit': pin} for p in sorted(moving)],
        'retained': [{**files[p], 'reasons': sorted(reasons[p])} for p in sorted(protected)],
        'sixRestoredInputs': sorted(restored),
        'limitations': ['Static and pin-bounded; all directory/enumeration residues require final-pin review, not arbitrary-program reachability proof.',
            'Retirement is a proposed cutover disposition, not independent acceptance or permission to disable current pre-flip gates.',
            'Current product inventory corpus is retained, so the ~0.2 GB aspirational tip is not claimed.']}
    previous = json.loads(gzip.decompress(git('show', '7f1eb147f:' + A + 'audit/partition.json.gz')))
    false_rows = [r for r in previous['retained'] if r['path'] not in {
        P + 'reports/identity-registry.json', P + 'reports/phase-02-identity-registry.json'} and any(
        s.startswith('retained reader closure: ') and s.split(': ', 1)[1] in {
            'packages/run-supervisor/rust/src/adopt.rs', 'test/verbs/dispatch-recovery.test.mjs',
            'docs/architect/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/case-brief.mjs',
            'docs/history/submit-add-field-parity-goaltier-editable/verify.sh',
            'scripts/check-legacy-docs-ratchet.mjs', 'test/scripts/generate-doc-inventory.test.mjs',
            'scripts/propose-doc-decisions.mjs'}
        or 'constructed filename:' in s for s in r['reasons'])]
    assert len(false_rows) == 22 and sum(r['size'] for r in false_rows) == 23297481
    corrections = []
    for row in false_rows:
        path = row['path']
        assert path in moving or any(s.startswith(('plan navigation link:', 'outside-plan path/link:', 'ruling link:', 'navigation direct link:')) for s in reasons[path])
        corrections.append({'path': path, 'previousSize': row['size'], 'previousFalseReasons': row['reasons'],
            'disposition': 'archive' if path in moving else 'retain-required-link',
            'currentReasons': sorted(reasons[path]) if path in protected else [],
            'note': 'Basename-only reader removed; exact navigation or direct ruling link takes precedence under the brief' if path in protected else 'No current tip input: unrelated basename / fixture output / comment / help / mismatching template'})
    prior_moving = {r['path'] for r in previous['records']}
    emit('retained-set-corrections.json', {'inputCommit':pin,'reviewedRows':22,'reviewedBytes':23297481,
        'rows':corrections,'formerlyArchivedOutsideReferences':[r for r in external_refs if r['targetPath'] in prior_moving]})
    emit('partition.json', manifest)
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
        'candidateOccurrences':len(enumerators), 'entries':list(grouped_enumerators.values()), 'retainedDirectorySets':['pilot/decisions/*.json','pilot/first-round/*.json','pilot/second-round/*.json','ledger/decisions/*.json','reports/phase-02-doc-inventory.parts/**','reports/phase-06/review-request-step10-.*-(345f15d95|287a22d33).json','reports/phase-06/review-step10-.*-345f15d95.md']})
    emit('prior-prune-recovery.json', {'inputCommit':pin,'records':[{'path':r['path'],'blobId':r['gitBlob'],'sha256':r['sha256'],'size':r['bytes'], 'sourceManifest':prune_path} for r in prune['inventory'] if r['action']=='remove']})
    emit('scan-receipt.json', {'externalReferenceJoins':len(external_refs),'navigationReferenceJoins':len(navigation_refs),'outsidePlanBasenameJoins':0,'inputCommit':pin,'planFilesScanned':len(files),'sourceFilesScanned':len(sources),'bytesScanned':scanned_bytes,
        'codeLikeBodiesScanned':bodies_count,'sourceTargetJoins':sum(map(len,edges.values())), 'enumerationCandidates':len(enumerators),
        'historicalJoins':len(historical),'priorScriptRefJoins':len(script_refs),'retainedProofRoots':sorted(live),
        'retainedEmbeddedReadRoots':embedded_roots,
        'unresolvedLiveSources':len(unresolved),'impactAnalysis':'degraded/unqueried: brief prohibits fgOS CLI; direct source/history scan only'})
    # Only object descriptors remain in the main-side manifest. Full partition,
    # retained reasons and scan audits belong on the archive snapshot, not main.
    assets = []
    for path in sorted(emitted_assets):
        data = path.read_bytes()
        assets.append({'path': A + 'audit/' + path.name,
            'blobId': hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest(),
            'sha256': hashlib.sha256(data).hexdigest(), 'size': len(data), 'encoding': 'gzip+utf8-json'})
    header = {k: v for k, v in manifest.items() if k not in ('records', 'retained')}
    header['sourceCommit'] = pin
    header['archiveCommit'] = None
    header['archiveCommitNote'] = 'Rehearsal records the augmented archive snapshot commit. At F install that approved id here before main landing.'
    header['auditAssets'] = assets
    header['inventoryAsset'] = A + 'audit/partition.json.gz'
    header['mainSidePaths'] = [A + name for name in ('manifest.json', 'design.md', 'receipt.md', 'receipt.json', 'rehearsal.json', 'verification.json', 'reader-patches/README.md')]
    (out / 'manifest.json').write_text(json.dumps(header, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest['counts']))

if __name__ == '__main__':
    main()
