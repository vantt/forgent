#!/usr/bin/env python3
"""Records-only G2 join. Reads tracked blobs; never executes the tests it names."""
import sys
sys.dont_write_bytecode = True
import argparse, collections, hashlib, importlib.util, json, pathlib, re, subprocess
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OLD = HERE.parent.parent / 'phase-08'

def sha(raw):
    return hashlib.sha256(raw if isinstance(raw, bytes) else raw.encode()).hexdigest()

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2) + '\n')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', type=pathlib.Path, default=HERE)
    ap.add_argument('--rescan', action='store_true')
    args = ap.parse_args()
    assert args.out.resolve() == HERE or str(args.out.resolve()).startswith('/tmp/fgos-work/w1-d4/')
    args.out.mkdir(parents=True, exist_ok=True)
    pin = git('rev-parse', 'HEAD').decode().strip()
    register = json.loads((OLD / 'step-08-preflip-gates.json').read_text())
    inventory_pin = json.loads((OLD / 'step-08-post-census-join.json').read_text())['inventorySourceCommit']
    sites = register['nonBehavioralCensusSites']
    assert len(sites) == len({s['id'] for s in sites}) == 1126
    grades = {}
    for n, line in enumerate((OLD / 'step-08-post-census-records.jsonl').read_text().splitlines(), 1):
        rec = json.loads(line)
        for item in rec['references']:
            grades[item['referenceId']] = (n, rec, item)
    files = sorted({s['site'][1] for s in sites})
    tracked = set(git('ls-tree', '-r', '--name-only', pin).decode().splitlines())
    sources = {f: git('show', pin + ':' + f).decode() if f in tracked else '' for f in files}
    js = sorted(f for f in files if f in tracked and f.endswith(('.mjs', '.js')) and (f.startswith('test/') or '/tests/' in f))
    cmd = ['node', '--expose-internals', str(HERE / 'test-locators.mjs')]
    proc = subprocess.run(cmd, cwd=ROOT, input=json.dumps({'pin': pin, 'files': js}), text=True, capture_output=True, check=True)
    locators = json.loads(proc.stdout)
    oldargv = sys.argv[:]
    sys.argv = [str(OLD / 'step-02l-inventory.py'), '--input-commit', pin]
    spec = importlib.util.spec_from_file_location('d4_census', OLD / 'step-02l-inventory.py')
    inv = importlib.util.module_from_spec(spec); spec.loader.exec_module(inv)
    fresh = inv.build()
    sys.argv = oldargv
    expressions = collections.defaultdict(list)
    for data in fresh.values():
        for item in data['entries']:
            expressions[(item['consumerPath'], sha(item['matchedExpression']), 'newLiteralSites')].append(item['physicalSpans'][0]['line'])
        for item in data['dynamicConstructions']:
            for call in item['callSites']:
                expressions[(item['consumerPath'], sha(call[4]), 'newDocumentationDynamicSites')].append(call[0])
    # Stable occurrence custody across line drift: unchanged Git diff lines map
    # the old physical slot; changed hunks require a unique exact expression.
    hunks = {}
    for file in files:
        diff = git('diff','--no-ext-diff','--no-renames','--unified=0',inventory_pin,pin,'--',file).decode()
        hunks[file] = [(int(a),int(b or 1),int(c),int(d or 1)) for a,b,c,d in re.findall(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@',diff,re.M)]
    rows = []
    for site in sites:
        _, file, line, expression_digest, operand, role = site['site']
        source = sources[file]
        rebound_lines = sorted(set(expressions.get((file, expression_digest, site['inventory']), [])))
        original_line = line
        delta, changed = 0, False
        for start,count,newstart,newcount in hunks[file]:
            if count and start <= original_line < start+count: changed = True
            if original_line >= start+count and (count or original_line > start): delta += newcount-count
        mapped_line = None if changed else original_line+delta
        if mapped_line in rebound_lines: line = mapped_line
        elif len(rebound_lines) == 1: line = rebound_lines[0]
        else: line = None
        expression_bound = line is not None
        # Keep the old locator for unresolved rows; never claim it is current.
        line = line if line is not None else original_line
        row = dict(id=site['id'], inventory=site['inventory'], inventoryIndex=site['index'], file=file,
                   originalLine=original_line, mappedUnchangedLine=mapped_line, expressionLinesAtPin=rebound_lines, exactExpressionBound=expression_bound, inventoryExpressionSha256=expression_digest, inventoryOperand=operand,
                   roleHint=role, sourceSha256=sha(source) if file in tracked else None, sourcePresent=file in tracked, owningProofs=[], status='judgment-required')
        if site.get('gradeRecord'):
            n, rec, item = grades[site['gradeRecord']]
            passage = item['currentPassage']
            span = '\n'.join(s['text'] for s in item['sourceSpans'])
            passage_ok = sha(passage) == item['currentPassageSha256'] and passage in source
            span_ok = span in source
            row.update(gradeRecord=dict(path=str((OLD / 'step-08-post-census-records.jsonl').relative_to(ROOT)), line=n,
                         memberId=item['referenceId'], recordSourceSha256=rec['sourceSha256'],
                         admission=item['admission'], reason=item['reason'], nonDocumentUse=item['nonDocumentUse'], sourceSpans=item['sourceSpans']),
                       exactPassagePresent=passage_ok, exactSpanPresent=span_ok,
                       gradePassageSha256=sha(passage), sourceChanged=sha(source) != rec['sourceSha256'])
            assert item['admission'] == 'REJECT' and item['disposition'] == 'preserve' and item['nonDocumentUse']
            if passage_ok and span_ok:
                row.update(status='confirmed-grade-record-REJECT', custody='Exact current passage and span still bind the recorded explicit non-document/caller-root reason; no role-based acceptance or runtime parity claim.')
            else:
                row['blocker'] = 'Current source no longer contains the complete graded passage/span. Rejudge REJECT custody at this pin; do not carry the old grade over drift.'
        elif expression_bound and role == 'fixture-literal' and file in locators and not locators[file].get('error'):
            info = locators[file]
            enclosing = [t for t in info['tests'] if t['start'] <= line <= t['end']]
            if enclosing:
                selected = [min(enclosing, key=lambda t: t['end'] - t['start'])]
                row['custody'] = 'Fixture expression is lexically inside this test callback in its own file.'
            else:
                selected = []
                functions = [f for f in info['functions'] if f['start'] <= line <= f['end']]
                pending = [min(functions, key=lambda f: f['end'] - f['start'])['name']] if functions else []
                seen = set()
                while pending:
                    name = pending.pop()
                    if name in seen: continue
                    seen.add(name)
                    for call in info['calls']:
                        if call['name'] != name: continue
                        selected += [t for t in info['tests'] if t['start'] <= call['start'] <= t['end']]
                        pending += [f['name'] for f in info['functions'] if f['start'] <= call['start'] <= f['end'] and f['name'] != name]
                row['helperCallChain'] = sorted(seen)
                row['custody'] = 'Same-file fixture helper joins explicit call sites in these tests; static custody only.'
            unique = {(t['title'], t['start']): t for t in selected}
            row['owningProofs'] = [dict(file=file, testTitle=t['title'], line=t['start'], locator=file + ':' + t['title']) for t in sorted(unique.values(), key=lambda t:t['start'])]
            if row['owningProofs']: row['status'] = 'joined-owning-test'
        elif expression_bound and role == 'fixture-literal' and file.endswith('.rs'):
            # Rust integration tests have top-level #[test] functions. Never guess across helpers.
            starts = list(re.finditer(r'(?m)^\s*#\[(?:tokio::)?test(?:\([^\n]*\))?\]\s*(?:#\[[^\n]*\]\s*)*(?:async\s+)?fn\s+(\w+)\s*\(', source))
            for match in starts:
                start = source.count('\n', 0, match.start()) + 1
                # Top-level closing brace, not the next #[test] (helpers can intervene).
                endmatch = re.search(r'(?m)^}', source[match.end():])
                end = source.count('\n', 0, match.end() + endmatch.end()) + 1 if endmatch else start
                if start <= line <= end:
                    row['owningProofs'] = [dict(file=file, testTitle=match[1], line=start, locator=file + ':' + match[1])]
                    row.update(status='joined-owning-test', custody='Fixture expression lies within this Rust #[test] function, not a repository documentation read.')
                    break
        if row['status'] == 'judgment-required':
            row.setdefault('blocker', 'Shared fixture/config/helper, non-test text, or unmatched test boundary: requires source/owning-caller judgment; roleHint is not acceptance.')
            row['currentContext'] = '\n'.join(source.splitlines()[max(0,line-3):line+2])
            row['contextLocatorIsBound'] = expression_bound
            row['owner'] = 'Documentation integration owner / independent census reviewer'
        row['currentLine'] = line if expression_bound else None
        if site.get('gradeRecord') and row.get('exactSpanPresent'):
            text = grades[site['gradeRecord']][2]['sourceSpans'][0]['text']
            matches = [n for n,l in enumerate(source.splitlines(),1) if l == text]
            row['currentSpanLines'] = matches
        rows.append(row)
    assert sum('gradeRecord' in r for r in rows) == 314
    residue = [r for r in rows if r['status'] == 'judgment-required']
    out = dict(sourceCommit=pin, inventorySourceCommit=inventory_pin, registerSha256=sha((OLD / 'step-08-preflip-gates.json').read_bytes()),
               counts=dict(sites=len(rows), files=len(files), statuses=dict(collections.Counter(r['status'] for r in rows))),
               independentApproval=False, finalPinCoverage=False,
               method='Join stable register identities; current tracked blob digests; exact grade passages, or lexical same-file test/fixture-helper custody. No tests executed and no generic fixture or role exemption.', rows=rows)
    dump(args.out / 'join.json', out)
    dump(args.out / 'residue.json', dict(sourceCommit=pin, count=len(residue), rows=residue))
    if args.rescan:
        # Reuse the unchanged committed census door, not a new scanner grammar.
        historic = json.loads((OLD / 'step-07-final-verification.json').read_text())['censusRescan']
        fresh_sites = []
        for klass, data in fresh.items():
            frozen = json.loads((OLD / f'step-02l-census-class{klass}.json').read_text())
            old = {(r['consumerPath'], r['matchedExpression'], r['legacyTarget']) for r in frozen['entries']}
            for item in data['entries']:
                if (item['consumerPath'], item['matchedExpression'], item['legacyTarget']) not in old:
                    fresh_sites.append(dict(klass=klass, file=item['consumerPath'], line=item['physicalSpans'][0]['line'], expressionSha256=sha(item['matchedExpression']), operand=item['legacyTarget'], roleHint=item['roleHint']))
        historical = {(s[1],s[3],s[4]) for s in historic['newLiteralSites']}
        delta = [r for r in fresh_sites if (r['file'],r['expressionSha256'],r['operand']) not in historical]
        for r in delta:
            r['status'] = 'judgment-required'
            r['owner'] = 'Documentation integration owner / final-pin census reviewer'
            r['sourceSha256'] = sha(git('show',pin+':'+r['file']))
            if r['file'] == 'packages/yaml-doc/contracts/fixtures/parse.v1.json':
                r.update(status='joined-fixture-contract', owningProofs=[dict(file='packages/yaml-doc/rust/tests/golden_parse.rs', testTitle='parse_matches_the_golden_cases', line=185, locator='packages/yaml-doc/rust/tests/golden_parse.rs:parse_matches_the_golden_cases', sourceSha256=sha(git('show',pin+':packages/yaml-doc/rust/tests/golden_parse.rs')))], fixtureLoader=dict(file='packages/yaml-doc/rust/tests/common/mod.rs', line=28, sourceSha256=sha(git('show',pin+':packages/yaml-doc/rust/tests/common/mod.rs'))), custody='Golden parse loop consumes fixture_cases("parse"); common/mod.rs resolves fixtures/parse.v1.json. Path strings are scalar parser inputs, not documentation reads.')
        dump(args.out / 'post-pin-literals.json', dict(sourceCommit=pin, method='Unchanged step-02l-inventory.py build() × frozen class4/5/6; compare complete lexical delta to original step-07 census. Not final pin F or behavioral completeness.', currentNewLiteralSites=len(fresh_sites), deltaCount=len(delta), rows=delta))
    print(json.dumps(out['counts'], sort_keys=True))

if __name__ == '__main__': main()
