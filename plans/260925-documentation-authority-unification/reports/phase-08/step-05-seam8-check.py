"""Report-only seam-8 extension: reuse existing proofs, conserve census and owner joins.
No product/gate change. Existing Step 5 suites still run independently. R27's
non-docs Markdown category is added only to this extension's in-memory rules.
"""
import sys
sys.dont_write_bytecode = True
import pathlib, json, hashlib, importlib.util, collections, subprocess, functools, copy, argparse, re, difflib
P = pathlib.Path(__file__).resolve().parent
ROOT = P.parents[3]
SEAM = 'runtime-defaults-dynamic'
def module(name):
    spec = importlib.util.spec_from_file_location(name, P / (name + '.py'))
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj
r21 = module('step-05-seam5-root-rules')
n = r21.n
b = n.b
admission = b.a
sha = b.sha
def physical(text):
    return text[:-1].split('\n') if text.endswith('\n') else text.split('\n')
def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line]
def items(record):
    return record['references'] + record['dynamicTraces'] + record.get('authorAddedReferences', [])
def ident(item):
    return item.get('referenceId', item.get('id'))
@functools.lru_cache(None)
def source(pin, file):
    return b.body(pin, file)
@functools.lru_cache(None)
def source_mode(pin, file):
    return subprocess.check_output(['git', 'ls-tree', pin, '--', file], cwd=ROOT, text=True).split()[0]
def prior_item(join, record):
    candidates = record.get('edges', record.get('slots', [])) + record.get('references', []) + record.get('dynamicTraces', []) + record.get('authorAddedReferences', [])
    found = [e for e in candidates if e.get('referenceId', e.get('id', e.get('edgeId'))) == join['edgeId'] and (not join.get('slotKey') or e.get('slotKey') == join['slotKey'])]
    assert len(found) == 1, 'join must name one exact original operation'
    return record, found[0]
@functools.lru_cache(None)
def lineage(oldpin, newpin, file):
    old = physical(source(oldpin, file)); new = physical(source(newpin, file))
    mapping = {}; replacements = []
    for tag, a1, a2, z1, z2 in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        if tag == 'equal':
            for i in range(a1, a2): mapping[i + 1] = z1 + i - a1 + 1
        elif tag == 'replace': replacements.append((a1, a2, z1, z2))
    return old, new, mapping, replacements
@functools.lru_cache(None)
def source_diff(oldpin, newpin, file):
    return subprocess.check_output(['git', 'diff', oldpin, newpin, '--', file], cwd=ROOT, text=True)
def manifest_read():
    pointer = json.loads((P / 'step-05-seam8-proposed-move-read-units.json').read_text())
    assert pointer['manifest'] == 'step-05-proposed-move-read-units.json' and 'units' not in pointer
    return json.loads((P / pointer['manifest']).read_text())
def load():
    return [record for path in sorted((P / 'step-05-records').glob('runtime-*.jsonl')) for record in rows(path)]
def check(records=None, check_indexes=True, unit_manifest=None):
    records = load() if records is None else records
    pop = {x['file']: x for x in rows(P / 'step-05-population-files.jsonl') if x['seam'] == SEAM}
    refs = {x['id']: x for x in rows(P / 'step-05-population-references.jsonl') if x['seam'] == SEAM}
    dyn = {x['id']: x for x in rows(P / 'step-05-population-dynamic.jsonl') if x['seam'] == SEAM}
    inventory_pins = {name: json.loads((P / name).read_text())['inputCommit'] for name in {name for x in dyn.values() for name in x['inventories']}}
    failures = []
    checks = collections.Counter()
    def test(rule, where, fn):
        checks[rule] += 1
        try:
            assert fn()
        except Exception as exc:
            failures.append({'rule': rule, 'where': where, 'error': str(exc) or 'condition false'})
    test('s8-coverage', 'all primary file/locator memberships', lambda: len(records) == len(pop) == len({r['file'] for r in records}) and {r['file'] for r in records} == set(pop))
    ref_ids = []
    dyn_ids = []
    new_items = []
    semantic_records = []
    owner_snapshots = {}
    def owner_snapshot(path):
        # Existing owner reports are immutable inputs to this assignment.
        # One byte snapshot/fingerprint per file also binds parsing and hashing
        # to the same view. Each check invocation reads fresh snapshots.
        if path not in owner_snapshots:
            raw = (ROOT / path).read_bytes()
            owner_snapshots[path] = (sha(raw), [json.loads(line) for line in raw.decode().splitlines() if line])
        return owner_snapshots[path]
    counts = collections.Counter()
    for record in records:
        f = record['file']
        if record.get('externalPopulation'):
            counts['external'] += 1
            test('s8-external', f, lambda record=record: not record['wholeFileRead'] and record['sourceSha256'] is None and record['parked'] and record['externalPopulation']['readPerformed'] is False and record['externalPopulation']['dependency'])
            continue
        pin = record['authorInputCommit']
        text = source(pin, f)
        def pins(record=record, text=text):
            ev = record['wholeFileReadEvidence']
            return record['wholeFileRead'] and record['sourceSha256'] == sha(text) == ev['sha256'] and ev['bytes'] == len(text.encode()) and ev['lines'] == len(physical(text)) and record['sourceMode'] == source_mode(record['authorInputCommit'], record['file'])
        test('s8-pins', f, pins)
        if record.get('retiredSource'):
            retired = record['retiredSource']
            test('s8-retired-source', f, lambda retired=retired: not subprocess.check_output(['git', 'ls-tree', retired['authorHEAD'], '--', f], cwd=ROOT) and retired['diff'] == subprocess.check_output(['git', 'diff', pin, retired['authorHEAD'], '--', f], cwd=ROOT, text=True))
        for proof in record.get('mandatoryCarryProofs', []) + record.get('readerProofs', []):
            def owning_proof(proof=proof):
                text = source(proof['inputCommit'], proof['file']); ls = physical(text)
                assert sha(text) == proof['sourceSha256'] and source_mode(proof['inputCommit'], proof['file']) == proof['mode']
                for e in proof['testDeclarations'] + proof['assertions'] + proof['constructionWitnesses']: assert ls[e['line']-1] == e['text']
                return True
            test('s8-owning-proof-pin', proof['file'], owning_proof)
        coupled = {'src/state/store.mjs': ['test/cli/fgos-approve-6.test.mjs', 'test/state/state-cutover.test.mjs', 'test/skills/fgos-coding-knowledge.test.mjs'], 'src/runner/merge.mjs': ['test/runner/merge-quoted-paths.test.mjs'], 'src/runner/paths.mjs': ['test/intake/plan.test.mjs', 'test/intake/discovery.test.mjs', 'test/runner/loop.test.mjs']}
        if f in coupled: test('s8-mandatory-coupling', f, lambda: set(coupled[f]) <= set(record['coCutPaths']))
        if record.get('documentReaderFamilies'):
            def reader_family(record=record):
                index = {ident(e): e for e in items(record)}
                for family in record['documentReaderFamilies']:
                    assert family['sourceSha256'] == record['sourceSha256'] and family['inputCommit'] == pin
                    assert family['text'] == '\n'.join(physical(text)[family['startLine']-1:family['endLine']])
                    for eid in family['ids']:
                        e = index[eid]
                        assert e['admission'] == 'ADMIT' and e.get('pathOperand')
                        if family['kind'] == 'state-backed-item-context': assert e['disposition'] == 'parked' and e['dependency'] == family['dependency']
                        else: assert e['disposition'] == 'preserve'
                return True
            test('s8-document-reader-family', f, reader_family)
        for loc in record.get('priorRecordRefs', []):
            test('s8-owner-integrity', f + ':' + loc['recordFile'], lambda loc=loc: owner_snapshot(loc['recordFile'])[0] == loc['recordSha256'])
        def owner_binding(join):
            fingerprint, previous = owner_snapshot(join['recordFile'])
            pr, pe = prior_item(join, previous[join['recordLine'] - 1])
            return fingerprint == join['recordSha256'] and pr['authorInputCommit'] == join['inputCommit'] and pe['disposition'] == join['disposition'] and pr.get('sourceSha256', pr.get('digest')) == join['sourceSha256']
        for joined in record.get('censusJoins', []):
            x = joined['original']
            kind = joined['kind']
            original = (refs if kind == 'reference' else dyn).get(x['id'])
            test('s8-census-join', f + ':' + x['id'], lambda joined=joined, x=x, original=original: x == original and x['file'] == f and owner_binding(joined['ownerJoin']))
            (ref_ids if kind == 'reference' else dyn_ids).append(x['id'])
            counts['censusJoins'] += 1
        rule = record.get('mechanicalClosure', {}).get('ruleId')
        if rule:
            counts['mechanical' if rule == b.RULE else 'neutral'] += 1
            def closure(record=record, rule=rule):
                assert not record['diff'] and not record['rollbackDiff'] and not record['parked']
                if rule == b.RULE:
                    assert not record['references']
                    for e in record['dynamicTraces']:
                        original = dyn[e['id']]
                        proof = b.decide(record['authorInputCommit'], f, original)
                        assert proof['status'] == 'mechanical-reject' and e['mechanicalRejection'] == proof and e['admission'] == 'REJECT' and e['disposition'] == 'preserve'
                    assert record['mechanicalClosure']['proof'] == b.context(record['authorInputCommit'], f)
                else:
                    context = (n if rule == n.RULE else r21).context(record['authorInputCommit'], f)
                    old = n.literal_hazards('\n'.join(e['expression'] for e in record['references']) + '\n' + '\n'.join(e['callSite'][4] for e in record['dynamicTraces']))
                    assert not old and not any(context[k] for k in ['literalHazards', 'constantHazards', 'constructedHazards'])
                    assert record['mechanicalClosure']['proof'] == context
                    assert record['mechanicalClosure']['moveSetSha256'] == sha((P / 'step-05-cutover-move-set.json').read_bytes())
                    assert all(e['disposition'] == 'preserve' and not e.get('admission') for e in items(record))
                return True
            test('s8-neutral-proof', f, closure)
        else:
            counts['judgment'] += 1
            test('s8-record-boundary', f, lambda record=record: record['review']['status'] == 'pending' and record['diff'] is None and record['rollbackDiff'] is None and record['expectedAfterSha256'] == record['sourceSha256'])
        for e in record['references']:
            eid = ident(e)
            ref_ids.append(eid)
            original = refs.get(eid)
            test('s8-reference-identity', f + ':' + eid, lambda e=e, original=original: bool(original) and original['file'] == f and ((e.get('originalSourceSpans') == original['sourceSpans'] and e.get('inventoryOrigins') == original['origins']) if not rule else all(e[k] == original[k] for k in original)))
        for e in record['dynamicTraces']:
            dyn_ids.append(e['id'])
            original = dyn.get(e['id'])
            test('s8-tuple-identity', f + ':' + e['id'], lambda e=e, original=original: bool(original) and original['file'] == f and ((e.get('originalTuple') == original['callSite'] and e.get('inventoryOrigins') == original['inventories']) if 'originalTuple' in e else all(e[k] == original[k] for k in original)))
        if rule:
            continue
        for e in items(record):
            where = f + ':' + ident(e)
            epin = e.get('historicalOnly', {}).get('inputCommit', pin)
            etext = source(epin, f)
            if e.get('historicalOnly'):
                h = e['historicalOnly']
                def history(h=h, epin=epin, etext=etext):
                    ls, _, mapping, _ = lineage(epin, pin, f)
                    old = h['removedOccurrence']
                    return h['sourceSha256'] == sha(etext) and ls[old['line'] - 1] == old['text'] and sha(old['text']) == old['sha256'] and old['line'] not in mapping and h['diff'] == source_diff(epin, pin, f) and e['admission'] == 'REJECT' and e['disposition'] == 'preserve'
                test('s8-occurrence-ancestry', where, history)
            spans = [e['operationWitness']] if 'originalTuple' in e else e.get('sourceSpans', [])
            def spancheck(spans=spans, etext=etext, e=e):
                ls = physical(etext)
                for s in spans:
                    assert ls[s['line'] - 1][s['columnStart'] - 1:s['columnEndExclusive'] - 1] == s['text']
                if 'originalTuple' in e:
                    ps = e['currentPassage']
                    assert ps['text'] == '\n'.join(ls[ps['startLine'] - 1:ps['endLine']])
                return True
            test('s8-source-spans', where, spancheck)
            if not e.get('historicalOnly'):
                def ancestry(e=e):
                    if 'originalTuple' in e:
                        op = inventory_pins[e['inventoryOrigins'][0]]
                        first = e['originalTuple'][4].split('\n')[0]
                        original = [{'line': e['originalTuple'][0], 'columnStart': e['originalTuple'][1], 'text': first}]
                    else:
                        op = e.get('sourceCoordinatePin', pin)
                        original = e.get('originalSourceSpans', e.get('sourceSpans', []))
                    old, new, mapping, replacements = lineage(op, pin, f)
                    for given, actual in zip(original, spans):
                        line = given['line']; token = given['text']; col = given['columnStart']
                        assert old[line-1][col-1:col-1+len(token)] == token, 'origin coordinate must name the original token'
                        mapped = mapping.get(line)
                        if mapped:
                            assert actual['line'] == mapped and actual['columnStart'] == col
                        else:
                            candidates = []
                            for a1, a2, z1, z2 in replacements:
                                if a1 <= line-1 < a2:
                                    for j in range(z1, z2):
                                        if token in new[j]: candidates.append((difflib.SequenceMatcher(None, old[line-1], new[j], autojunk=False).ratio(), j+1, new[j].index(token)+1))
                            candidates.sort(reverse=True)
                            assert candidates and (len(candidates) == 1 or candidates[0][0] > candidates[1][0]), 'changed occurrence needs one best match inside its replacement hunk'
                            assert (actual['line'], actual['columnStart']) == (candidates[0][1], candidates[0][2])
                    return True
                test('s8-current-ancestry', where, ancestry)
            if e.get('ownerJoin'):
                test('s8-owner-outcome', where, lambda e=e: owner_binding(e['ownerJoin']) and e['disposition'] == e['ownerJoin']['disposition'])
                continue
            new_items.append((record, e))
            test('s8-unapplied-boundary', where, lambda e=e: e['disposition'] in ['preserve', 'parked'])
            expr = e.get('matchedExpression', (e.get('originalTuple') or [None]*5)[4]) or ''
            if not e.get('historicalOnly') and e['admission'] == 'REJECT' and re.search(r'(?:AGENTS|README|SKILL)\.md|(?:core|domains|\.claude|\.agents)/[^\s]*\.md', expr):
                nline = e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line')
                src = physical(source(pin, f))[nline-1]
                if not src.lstrip().startswith(('//', '/*', '*', '#')):
                    test('s8-r27-non-docs-read', where, lambda e=e: e['nonDocumentUse'] == 'non-census-document-read')
            if e.get('disposition') == 'parked':
                test('s8-park', where, lambda e=e: e['admission'] == 'ADMIT' and bool(e['blockedReason']) and bool(e['dependency']) and e['timing'] == 'phase9' and bool(e.get('stateExportDependency')))
            test('s8-proof-honesty', where, lambda e=e: bool(e['proofCommand']) and bool(e['parityObligation']) and e['receiptId'] in record['receiptIds'])
            if e['admission'] == 'REJECT':
                test('s8-rejection', where, lambda e=e: e['disposition'] == 'preserve' and bool(e['nonDocumentUse']) and bool(e['reason']) and not e.get('pathOperand'))
        # Shared R7/R12/R16/R8 checks apply without treating immutable old owners
        # as new source slots. R27 category extends vocabulary, not admission.
        current = copy.deepcopy(record)
        current['references'] = [e for e in record['references'] if not e.get('historicalOnly') and not e.get('ownerJoin')]
        current['dynamicTraces'] = [e for e in record['dynamicTraces'] if not e.get('historicalOnly') and not e.get('ownerJoin')]
        current['authorAddedReferences'] = [e for e in record.get('authorAddedReferences', []) if not e.get('historicalOnly') and not e.get('ownerJoin')]
        admission.CATEGORIES.add('non-census-document-read')
        semantic_records.append(current)
    shared = admission.check(semantic_records)
    failures.extend(shared['failures'])
    checks.update(shared['checks'])
    test('s8-coverage', 'every original reference exactly once, own or exact prior join', lambda: len(ref_ids) == len(set(ref_ids)) == len(refs) and set(ref_ids) == set(refs))
    test('s8-coverage', 'every original tuple exactly once, own or exact prior join', lambda: len(dyn_ids) == len(set(dyn_ids)) == len(dyn) and set(dyn_ids) == set(dyn))
    # L12-87: the legacy tree family has one policy; state-backed paths
    # cannot regress into the R5 caller-argument rejection category.
    merge_record = next((r for r in records if r['file'] == 'src/runner/merge.mjs'), None)
    if merge_record:
        mi = {ident(e): e for e in items(merge_record)}
        unit = merge_record['legacyWriterUnit']
        expected_legacy = ['reference-003747', 'reference-003754', 'reference-003762', 'dynamic-012990', 'author-seam8-native-legacy-target-reader', 'author-seam8-native-legacy-source-reader', 'author-seam8-native-legacy-decision-writer', 'author-seam8-native-legacy-index-writer']
        for eid in expected_legacy:
            test('s8-r29-one-tree', 'src/runner/merge.mjs:' + eid, lambda eid=eid: mi[eid]['admission'] == 'ADMIT' and mi[eid]['disposition'] == 'parked' and mi[eid]['dependency'] == unit['dependency'] == 'Phase 9 decision for the legacy decisions-tree writer/reader (native Land)' and 'test/runner/merge-quoted-paths.test.mjs' in mi[eid]['coCutPaths'])
        test('s8-r29-reader-owners', 'native Land scans', lambda: unit['readerIds'] == ['reference-003747','author-seam8-native-legacy-target-reader','author-seam8-native-legacy-source-reader'] and all(mi[x]['sourceSpans'][0]['line'] == line for x,line in [('author-seam8-native-legacy-target-reader',1091),('author-seam8-native-legacy-source-reader',1092)]))
    for r in records:
        for e in items(r):
            dep = e.get('stateExportDependency') or ''
            if dep.startswith('Authorized persisted ') or dep.startswith('Authorized registry docs '):
                test('s8-r30-state-path', r['file'] + ':' + ident(e), lambda e=e: e['admission'] == 'ADMIT' and e['disposition'] == 'parked' and e.get('nonDocumentUse') is None and e.get('pathOperand') and e['dependency'] == e['stateExportDependency'])
    if check_indexes:
        manifest = unit_manifest if unit_manifest is not None else manifest_read()
        base = json.loads((P / 'step-05-proposed-move-read-units.json').read_text())
        unitmap = {u['path']: u for u in manifest['units']}
        byfile = {r['file']: r for r in records}
        ownmap = {(r['file'], ident(e)): (r, e) for r in records for e in items(r)}
        test('s8-r26-population', 'all existing path decisions retained', lambda: set(unitmap) == {u['path'] for u in base['units']} and manifest['unitCount'] == len(unitmap) and len(manifest['units']) == len(unitmap))
        for original in base['units']:
            if original['path'] not in unitmap: continue
            u = unitmap[original['path']]
            test('s8-r26-base', u['path'], lambda original=original, u=u: u['readers'] == original['readers'] and u['coChanges'] == original['coChanges'] and u['decisionDependency'] == original['decisionDependency'] and u['proposalEvidence'] == original['proposalEvidence'] and u['proposedTarget'] == original['proposedTarget'])
        # Output coverage is discovered from the fixed producer calls/return
        # statements, independently of the new slot and manifest markers.
        expected_outputs = [
            ('docs/decisions/index.md', "return { path: path.relative(repoRoot, indexPath).split(path.sep).join('/'), changed: false };"),
            ('docs/decisions/index.md', 'return { path: indexRelPath, changed };'),
            ('docs/enduser-docs-index.json', 'return { path: manifestRelPath, count, entries };'),
        ]
        runtime_bin = byfile['bin/fgos.mjs']
        for path, statement in expected_outputs:
            def output_coverage(path=path, statement=statement):
                source_lines = physical(source(runtime_bin['authorInputCommit'], 'bin/fgos.mjs'))
                matches = [i for i, text in enumerate(source_lines, 1) if statement in text]
                assert len(matches) == 1
                line = matches[0]
                outputs = [e for e in items(runtime_bin) if e.get('role') == 'document-path-output-slot' and any(s['line'] == line for s in (e.get('sourceSpans') or []))]
                assert len(outputs) == 1
                e = outputs[0]
                return e.get('proposedMoveUnit') == path and e['disposition'] == 'parked' and any(x['file'] == 'bin/fgos.mjs' and x['id'] == ident(e) and x['inputCommit'] == runtime_bin['authorInputCommit'] for x in unitmap[path]['readers'])
            test('s8-r28-output-coverage', 'bin/fgos.mjs:' + path + ':' + statement, output_coverage)
        for entry in manifest['addedThisTurn']:
            where = entry['file'] + ':' + entry['id']
            def unit_binding(entry=entry):
                r, e = ownmap[entry['file'], entry['id']]
                u = unitmap[entry['path']]
                assert entry['inputCommit'] == r['authorInputCommit'] and entry['sourceSha256'] == r['sourceSha256']
                assert physical(source(r['authorInputCommit'], r['file']))[entry['line'] - 1] == entry['sourceLine']
                if entry['kind'] == 'output':
                    assert entry in [dict(path=u['path'], kind='output', **x) for x in u['readers']]
                    assert e['proposedMoveUnit'] == u['path'] and e['resolvedOutputPath'] == u['path'] and e['disposition'] == 'parked' and e['dependency'] == u['decisionDependency']
                    c = e['constructionOwner']
                    gen = source(c['inputCommit'], c['file'])
                    assert sha(gen) == c['sourceSha256']
                    normalized = re.sub(r"['\"]\s*,\s*['\"]", '/', gen)
                    assert u['path'] in normalized, 'output needs an actual fixed generator path, not a caller echo'
                    assert 'return {' in entry['sourceLine'] and 'path:' in entry['sourceLine']
                else:
                    assert entry in [dict(path=u['path'], kind='coChange', **x) for x in u['coChanges']]
                    assert u['path'] in entry['sourceLine'] and u['path'] in e.get('proposedMoveCoChanges', [])
                return True
            test('s8-r26-slot', where, unit_binding)
        # Discover every exact proposed path occurrence independently of markers.
        for r in records:
            if r.get('externalPopulation') or r.get('mechanicalClosure') or r.get('retiredSource'): continue
            if r.get('censusJoins') and not items(r): continue
            for line, textline in enumerate(physical(source(r['authorInputCommit'], r['file'])), 1):
                for path, u in unitmap.items():
                    for match in re.finditer(re.escape(path) + r'(?![A-Za-z0-9_./-])', textline):
                        test('s8-r28-cochanges', r['file'] + ':' + str(line) + ':' + path, lambda r=r, line=line, u=u: any(e['file'] == r['file'] and e['line'] == line and e['inputCommit'] == r['authorInputCommit'] for e in u['coChanges']))
        receipts = {x['id']: x for x in json.loads((P / 'step-05-seam8-parity-receipts.json').read_text())['receipts']}
        for record in records:
            if record.get('mechanicalClosure') or record.get('externalPopulation'): continue
            def receipt(record=record):
                rc = receipts[record['receiptIds'][0]]
                assert rc['inputCommit'] == record['authorInputCommit'] and rc['review']['status'] == 'pending' and 'pending' in rc['readiness']
                assert rc['currentInputs'][0]['sha256'] == record['sourceSha256']
                assert not rc['comparison']['currentOutputSet'] and not rc['comparison']['candidateOutputSet'] and rc['comparison']['normalization'].startswith('none')
                assert all(p['status'] in ['not-run', 'missing'] and p['exit'] is None and p['logPath'] is None for p in rc['proofs'])
                return True
            test('s8-receipt', record['file'], receipt)
    return {'kind': 'Seam 8 report-only mechanical extension; semantic review remains pending', 'files': len(records), 'literalReferences': len(ref_ids), 'dynamicTuples': len(dyn_ids), 'classes': dict(counts), 'checks': dict(checks), 'failureCount': len(failures), 'failures': failures, 'headDrift': [], 'newJudgmentItems': len(new_items)}

def probes():
    baseline_records = load()
    baseline = check(baseline_records)
    assert baseline['failureCount'] == 0, baseline['failures']
    manifest = manifest_read()
    results = []
    def pick(rs, predicate):
        return next((r, e) for r in rs for e in items(r) if predicate(r, e))
    def run(name, rule, mutate, indexes=False):
        rs = copy.deepcopy(baseline_records); units = copy.deepcopy(manifest)
        mutate(rs, units)
        out = check(rs, check_indexes=indexes, unit_manifest=units)
        caught = [x for x in out['failures'] if x['rule'] == rule]
        results.append({'name': name, 'owningRule': rule, 'rejected': bool(caught), 'caught': caught[:2]})
    run('Dropping a primary file cannot shrink the queue', 's8-coverage', lambda rs, u: rs.pop())
    run('Dropping an exact prior census join loses its original identity', 's8-coverage', lambda rs, u: next(r for r in rs if r.get('censusJoins'))['censusJoins'].pop())
    run('Changing an original tuple cannot create a fresh census', 's8-tuple-identity', lambda rs, u: pick(rs, lambda r,e: 'originalTuple' in e)[1]['originalTuple'].__setitem__(4, 'invented'))
    run('Changing an original reference span is rejected', 's8-reference-identity', lambda rs,u: pick(rs, lambda r,e: e.get('originalSourceSpans') and 'referenceId' in e)[1]['originalSourceSpans'][0].__setitem__('text', 'invented'))
    run('Whole-file digest is bound to its own pin', 's8-pins', lambda rs,u: next(r for r in rs if r.get('wholeFileRead')).__setitem__('sourceSha256', '0'*64))
    run('Source mode is checked at the source pin', 's8-pins', lambda rs,u: next(r for r in rs if r.get('wholeFileRead')).__setitem__('sourceMode', '100755'))
    run('A false read declaration is rejected', 's8-pins', lambda rs,u: next(r for r in rs if r.get('wholeFileRead')).__setitem__('wholeFileRead', False))
    run('A prior owner join cannot change its record digest', 's8-census-join', lambda rs,u: next(r for r in rs if r.get('censusJoins'))['censusJoins'][0]['ownerJoin'].__setitem__('recordSha256', '0'*64))
    run('A prior owner join cannot silently change disposition', 's8-owner-outcome', lambda rs,u: pick(rs, lambda r,e: bool(e.get('ownerJoin')))[1].__setitem__('disposition', 'parked'))
    run('A current passage must be actual pinned text', 's8-source-spans', lambda rs,u: pick(rs, lambda r,e: 'currentPassage' in e and not r.get('mechanicalClosure'))[1]['currentPassage'].__setitem__('text', 'invented passage'))
    def wrong_occurrence(rs,u):
        r = next(r for r in rs if r['file'] == 'src/runner/operation-choice.mjs')
        e = next(e for e in r['dynamicTraces'] if e['id'] == 'dynamic-013139')
        token = e['originalTuple'][4]; ls = physical(source(r['authorInputCommit'], r['file']))
        other = next(i for i,t in enumerate(ls,1) if token in t and i != e['currentLine'])
        col = ls[other-1].index(token)+1; e['currentLine'] = other
        e['operationWitness'] = {'line': other,'columnStart':col,'columnEndExclusive':col+len(token),'text':token}
        start=max(1,other-4); end=min(len(ls),other+4)
        e['currentPassage']={'startLine':start,'endLine':end,'text':'\n'.join(ls[start-1:end])}
        e['pathOperandWitness']=dict(e['operationWitness'])
    run('Repeated equal text in another operation is not the original occurrence', 's8-current-ancestry', wrong_occurrence)
    run('Removed occurrence history needs its exact original line hash', 's8-occurrence-ancestry', lambda rs,u: pick(rs, lambda r,e: bool(e.get('historicalOnly')))[1]['historicalOnly']['removedOccurrence'].__setitem__('sha256','0'*64))
    run('Historical full diffs must match the immutable Git inputs', 's8-occurrence-ancestry', lambda rs,u: pick(rs, lambda r,e: bool(e.get('historicalOnly')))[1]['historicalOnly'].__setitem__('diff','invented diff'))
    run('Neutral closure cannot invent semantic admissions', 's8-neutral-proof', lambda rs,u: next(r for r in rs if r.get('mechanicalClosure',{}).get('ruleId') == n.RULE)['dynamicTraces'][0].__setitem__('admission', 'ADMIT'))
    run('R19 mechanical proof cannot be replaced by an unverified verdict', 's8-neutral-proof', lambda rs,u: next(r for r in rs if r.get('mechanicalClosure',{}).get('ruleId') == b.RULE)['dynamicTraces'][0]['mechanicalRejection'].__setitem__('contextSha256','0'*64))
    run('R20 context must equal the recomputed complete-file proof', 's8-neutral-proof', lambda rs,u: next(r for r in rs if r.get('mechanicalClosure',{}).get('ruleId') == n.RULE)['mechanicalClosure']['proof'].__setitem__('literalHazards',[{'text':'docs/specs/hidden.md'}]))
    run('External population may not claim a live read', 's8-external', lambda rs,u: next(r for r in rs if r.get('externalPopulation'))['externalPopulation'].__setitem__('readPerformed',True))
    run('The shared CONTEXT/plan reader cannot be disguised as scalar plumbing', 's8-document-reader-family', lambda rs,u: pick(rs, lambda r,e: r['file']=='src/runner/paths.mjs' and e.get('id')=='dynamic-013182')[1].update(admission='REJECT', disposition='preserve', nonDocumentUse='scalar-pass-through', pathOperand=None))
    run('A plain context byte digest remains a real document reader', 's8-document-reader-family', lambda rs,u: pick(rs, lambda r,e: r['file']=='src/workflow/ref-digests.mjs' and e.get('id')=='dynamic-016502')[1].update(admission='REJECT', nonDocumentUse='scalar-pass-through', pathOperand=None))
    run('A parked operation retains its own missing input', 's8-park', lambda rs,u: pick(rs, lambda r,e: e.get('disposition')=='parked' and not e.get('ownerJoin'))[1].__setitem__('stateExportDependency',None))
    def copy_blocker(rs,u):
        chosen=[(r,e) for r in rs for e in items(r) if e.get('disposition')=='parked' and not e.get('ownerJoin') and not e.get('historicalOnly')]
        a,b = next((a,b) for a in chosen for b in chosen if a[0]['file']==b[0]['file'] and a[1].get('currentLine',a[1].get('sourceSpans',[{}])[0].get('line')) != b[1].get('currentLine',b[1].get('sourceSpans',[{}])[0].get('line')))
        b[1]['blockedReason']=a[1]['blockedReason']
    run('Templated blocker copies do not close distinct operations', 'b-real-blocker', copy_blocker)
    run('A non-docs Markdown read is not root-only', 's8-r27-non-docs-read', lambda rs,u: pick(rs, lambda r,e: r['file']=='src/install/coexist.mjs' and e.get('id')=='dynamic-009604')[1].__setitem__('nonDocumentUse','root-only'))
    run('Unknown operand categories cannot hide untraced calls', 'd-own-operand', lambda rs,u: pick(rs, lambda r,e: 'originalTuple' in e and e.get('admission')=='REJECT' and not e.get('historicalOnly') and not r.get('mechanicalClosure') and not e.get('ownerJoin'))[1].__setitem__('nonDocumentUse','unknown'))
    run('A new active source patch cannot hide in a records-only closure', 's8-unapplied-boundary', lambda rs,u: pick(rs, lambda r,e: not r.get('mechanicalClosure') and not e.get('ownerJoin') and not e.get('historicalOnly'))[1].__setitem__('disposition','patch'))
    run('A source diff cannot hide behind preserve metadata', 's8-record-boundary', lambda rs,u: next(r for r in rs if not r.get('mechanicalClosure') and not r.get('externalPopulation')).__setitem__('diff','invented hunk'))
    run('Quoted-path fixture stays coupled to the legacy decision scans', 's8-mandatory-coupling', lambda rs,u: next(r for r in rs if r['file']=='src/runner/merge.mjs')['coCutPaths'].remove('test/runner/merge-quoted-paths.test.mjs'))
    run('State plan fallback keeps the approve fixture co-cut', 's8-mandatory-coupling', lambda rs,u: next(r for r in rs if r['file']=='src/state/store.mjs')['coCutPaths'].remove('test/cli/fgos-approve-6.test.mjs'))
    run('Owning fixture assertions are pinned, not copied as invented proof', 's8-owning-proof-pin', lambda rs,u: next(r for r in rs if r.get('mandatoryCarryProofs'))['mandatoryCarryProofs'][0]['assertions'][0].__setitem__('text','invented assertion'))
    def drop_output(rs,u):
        r=next(r for r in rs if r['file']=='bin/fgos.mjs')
        doomed=next(e for e in r['authorAddedReferences'] if e.get('role')=='document-path-output-slot')
        target=ident(doomed); r['authorAddedReferences'].remove(doomed)
        for unit in u['units']:unit['readers']=[x for x in unit['readers'] if x['id']!=target]
        u['addedThisTurn']=[x for x in u['addedThisTurn'] if x['id']!=target]
    run('Clearing an output slot and its unit still fails independent discovery', 's8-r28-output-coverage', drop_output, True)
    run('A result field must keep the exact proposed path, not its basename', 's8-r26-slot', lambda rs,u: pick(rs,lambda r,e: e.get('role')=='document-path-output-slot')[1].__setitem__('resolvedOutputPath','index.md'), True)
    def caller_echo(rs,u):
        r,e=pick(rs,lambda r,e:e.get('role')=='document-path-output-slot')
        e['constructionOwner']={'file':'src/util/yaml.mjs','inputCommit':r['authorInputCommit'],'sourceSha256':sha(source(r['authorInputCommit'],'src/util/yaml.mjs')),'id':'caller-value'}
    run('Caller-only values cannot borrow a fixed generator output proof', 's8-r26-slot', caller_echo, True)
    def lose_cochange(rs,u):
        x=next(x for x in u['addedThisTurn'] if x['kind']=='coChange'); path=x['path']
        for unit in u['units']:
            if unit['path']==path:unit['coChanges']=[e for e in unit['coChanges'] if not(e['file']==x['file'] and e['line']==x['line'] and e['inputCommit']==x['inputCommit'])]
        u['addedThisTurn']=[e for e in u['addedThisTurn'] if not(e['kind']=='coChange' and e['path']==path and e['file']==x['file'] and e['line']==x['line'])]
    run('Comments and fixed metadata remain individually enumerated co-changes', 's8-r28-cochanges', lose_cochange, True)
    run('Old R26 units cannot disappear from the additive supplement', 's8-r26-population', lambda rs,u:u['units'].pop(), True)
    run('R29 cannot split a native Land reader from its writers', 's8-r29-one-tree', lambda rs,u: pick(rs,lambda r,e:ident(e)=='reference-003747')[1].update(disposition='preserve'))
    run('R29 live reader cannot reuse a removed census identity', 's8-r29-reader-owners', lambda rs,u: next(r for r in rs if r['file']=='src/runner/merge.mjs')['legacyWriterUnit']['readerIds'].__setitem__(1,'reference-003770'))
    run('R30 registry probe cannot be scalar pass-through', 's8-r30-state-path', lambda rs,u: pick(rs,lambda r,e:ident(e)=='dynamic-015349')[1].update(admission='REJECT',disposition='preserve',nonDocumentUse='scalar-pass-through',pathOperand=None))
    return {'baselineFailures':0,'passed':sum(x['rejected'] for x in results),'total':len(results),'probes':results,'failures':[x for x in results if not x['rejected']]}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--probes', action='store_true')
    parser.add_argument('--run-existing', choices=['step-05-check.py', 'step-05-probes.py', 'step-05-seam4-probes.py', 'step-05-seam5-probes.py', 'step-05-seam5-batch2-probes.py', 'step-05-seam5-batch3-probes.py', 'step-05-seam5-batch4-probes.py', 'step-05-seam5-batch5-probes.py', 'step-05-seam5-batch6-probes.py', 'step-05-seam5-batch7-probes.py', 'step-05-proposed-move-probes.py'])
    args = parser.parse_args()
    if args.run_existing:
        import runpy, os
        destination = pathlib.Path(args.output).absolute()
        assert destination.is_relative_to(pathlib.Path('/tmp/fgos-work')), 'Existing checks must output only to scratch'
        destination.parent.mkdir(parents=True, exist_ok=True)
        old_write = pathlib.Path.write_text
        redirected = []
        def scratch_write(path, data, *a, **kw):
            if path.is_relative_to(P):
                target = destination.parent / path.name
                redirected.append({'requested': str(path), 'actual': str(target)})
                return old_write(target, data, *a, **kw)
            assert path.absolute().is_relative_to(pathlib.Path('/tmp/fgos-work')), 'Out-of-scope checker output: ' + str(path)
            return old_write(path, data, *a, **kw)
        pathlib.Path.write_text = scratch_write
        os.environ.pop('CLAUDE_CODE_SESSION_ID', None)
        os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
        os.environ['TMPDIR'] = '/tmp/fgos-work'
        sys.argv = [str(P / args.run_existing)] + (['--output', str(destination)] if args.run_existing == 'step-05-check.py' else [])
        try:
            runpy.run_path(str(P / args.run_existing), run_name='__main__')
        finally:
            old_write(destination.parent / (args.run_existing + '.redirects.json'), json.dumps(redirected, indent=2) + '\n')
        sys.exit(0)
    result = probes() if args.probes else check()
    pathlib.Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'failures'}))
    sys.exit(bool(result.get('failureCount', result.get('failures'))))
