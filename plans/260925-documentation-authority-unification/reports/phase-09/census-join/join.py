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

def rust_tests(source):
    """Attribute and function lines are explicit; horizontal whitespace never eats a blank line."""
    tests = []
    pattern = r'(?m)^[ \t]*#\[(?:tokio::)?test(?:\([^\n]*\))?\][ \t]*\n(?:[ \t]*#\[[^\n]*\][ \t]*\n)*[ \t]*(?:async[ \t]+)?fn[ \t]+(\w+)[ \t]*\('
    for match in re.finditer(pattern, source):
        end = re.search(r'(?m)^}', source[match.end():])
        tests.append(dict(title=match[1], start=source.count('\n',0,match.start())+1,
                          functionLine=source.count('\n',0,match.end())+1,
                          end=source.count('\n',0,match.end()+end.end())+1 if end else source.count('\n',0,match.end())+1,
                          ignored='#[ignore' in match[0]))
    return tests


def rust_custody(source, line):
    tests = rust_tests(source)
    direct = [t for t in tests if t['start']<=line<=t['end'] and not t['ignored']]
    if direct: return direct, []
    functions = []
    for match in re.finditer(r'(?m)^(?:pub(?:\([^\n]*\))?[ \t]+)?(?:async[ \t]+)?fn[ \t]+(\w+)\b',source):
        end = re.search(r'(?m)^}',source[match.end():])
        if end:
            functions.append(dict(name=match[1],start=source.count('\n',0,match.start())+1,
                                  end=source.count('\n',0,match.end()+end.end())+1,
                                  body=source[match.end():match.end()+end.end()]))
    pending = [f['name'] for f in functions if f['start']<=line<=f['end']]
    selected, seen = [], set()
    while pending:
        name = pending.pop()
        if name in seen: continue
        seen.add(name)
        for f in functions:
            if f['name']==name or not re.search(r'\b'+re.escape(name)+r'\s*\(',f['body']): continue
            selected += [t for t in tests if t['title']==f['name'] and not t['ignored']]
            pending.append(f['name'])
    return list({t['title']:t for t in selected}.values()), sorted(seen)


def rust_proof(file, source, test):
    assert not test['ignored'], 'An ignored subprocess is not its owning proof'
    return dict(file=file,testTitle=test['title'],line=test['start'],functionLine=test['functionLine'],
                locator=file+':'+test['title'],sourceSha256=sha(source))


def js_custody(info, line):
    enclosing = [t for t in info['tests'] if t['start'] <= line <= t['end']]
    if enclosing:
        return [min(enclosing,key=lambda t:t['end']-t['start'])], [], 'Fixture expression is lexically inside this test callback in its own file.'
    functions = [f for f in info['functions'] if f['start'] <= line <= f['end']]
    pending = [min(functions,key=lambda f:f['end']-f['start'])['name']] if functions else []
    selected, seen = [], set()
    while pending:
        name = pending.pop()
        if name in seen: continue
        seen.add(name)
        for call in info['calls']:
            if call['name'] != name: continue
            selected += [t for t in info['tests'] if t['start'] <= call['start'] <= t['end']]
            pending += [f['name'] for f in info['functions'] if f['start'] <= call['start'] <= f['end'] and f['name'] != name]
    return selected, sorted(seen), ('Same-file fixture helper joins explicit call sites in these tests; static custody only.' if selected else
                                   'No same-file test caller proved: helper declaration or shared fixture needs an explicit owning caller; no joined custody claimed.')


def map_line(line, hunks):
    delta = 0
    for start,count,newstart,newcount in hunks:
        if count and start <= line < start+count: return None
        if line >= start+count and (count or line > start): delta += newcount-count
    return line+delta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', type=pathlib.Path, default=HERE)
    ap.add_argument('--pin', default='HEAD', help='Commit whose tracked source blobs are joined')
    ap.add_argument('--rescan', action='store_true')
    args = ap.parse_args()
    assert args.out.resolve() == HERE or str(args.out.resolve()).startswith('/tmp/fgos-work/w2-d4b/')
    args.out.mkdir(parents=True, exist_ok=True)
    pin = git('rev-parse', '--verify', args.pin+'^{commit}').decode().strip()
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
    fresh_files = {r['consumerPath'] for data in fresh.values() for r in [*data['entries'], *data['dynamicConstructions']]}
    for file in sorted(fresh_files - set(sources)):
        sources[file] = git('show', pin+':'+file).decode()
    extra_js = sorted(f for f in fresh_files if f not in locators and f.endswith(('.mjs','.js')) and (f.startswith('test/') or '/tests/' in f))
    if extra_js:
        proc = subprocess.run(cmd,cwd=ROOT,input=json.dumps({'pin':pin,'files':extra_js}),text=True,capture_output=True,check=True)
        locators.update(json.loads(proc.stdout))
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
        mapped_line = map_line(original_line,hunks[file])
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
            selected, row['helperCallChain'], row['custody'] = js_custody(info,line)
            unique = {(t['title'], t['start']): t for t in selected}
            row['owningProofs'] = [dict(file=file, testTitle=t['title'], line=t['start'], locator=file + ':' + t['title']) for t in sorted(unique.values(), key=lambda t:t['start'])]
            if row['owningProofs']: row['status'] = 'joined-owning-test'
        elif expression_bound and role == 'fixture-literal' and file.endswith('.rs'):
            # Rust integration tests have top-level #[test] functions. Never guess across helpers.
            tests = rust_tests(source)
            for test in tests:
                if test['start'] <= line <= test['end']:
                    if test['ignored']:
                        # The ignored child explicitly declares its owning parent, which
                        # executes it via --exact/--ignored in the same source file.
                        owner = re.search(r'#\[ignore = "subprocess of (\w+)"\]',source.splitlines()[test['start']])
                        parent = next((t for t in tests if owner and t['title']==owner[1] and not t['ignored']),None)
                        if not parent: break
                        row['subprocessTest'] = test['title']
                        test = parent
                    row['owningProofs'] = [rust_proof(file,source,test)]
                    row.update(status='joined-owning-test', custody='Fixture expression lies within this Rust test (or its explicitly declared ignored subprocess); the non-ignored parent owns execution.')
                    break
        if row['status'] == 'judgment-required':
            if file not in tracked:
                deletion = git('log','-1','--format=%H','--diff-filter=D',pin,'--',file).decode().strip()
                row['deletingCommit'] = deletion or None
                row['blocker'] = 'Source was deleted by '+(deletion or 'an unbound earlier change')+'; review retirement and successor custody for '+site['id']+'. This is not a shared-helper judgment and no missing source is recreated.'
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
    def named_proof(file, title):
        source = sources.get(file)
        if source is None: source = git('show',pin+':'+file).decode(); sources[file] = source
        if file.endswith('.rs'):
            test, = [t for t in rust_tests(source) if t['title']==title and not t['ignored']]
            return rust_proof(file,source,test)
        if file not in locators:
            run = subprocess.run(cmd,cwd=ROOT,input=json.dumps({'pin':pin,'files':[file]}),text=True,capture_output=True,check=True)
            locators.update(json.loads(run.stdout))
        test, = [t for t in locators[file]['tests'] if t['title']==title]
        return dict(file=file,testTitle=title,line=test['start'],locator=file+':'+title,sourceSha256=sha(source))

    if args.rescan:
        # Reuse the unchanged committed census door, not a new scanner grammar.
        historic = json.loads((OLD / 'step-07-final-verification.json').read_text())['censusRescan']
        fresh_sites, dynamic_sites = [], []
        for klass, data in fresh.items():
            frozen = json.loads((OLD / f'step-02l-census-class{klass}.json').read_text())
            old = {(r['consumerPath'], r['matchedExpression'], r['legacyTarget']) for r in frozen['entries']}
            old_dynamic = {(r['consumerPath'],call[4]) for r in frozen['dynamicConstructions'] for call in r['callSites']}
            for item in data['dynamicConstructions']:
                for call in item['callSites']:
                    if call[6] and (item['consumerPath'],call[4]) not in old_dynamic:
                        dynamic_sites.append(dict(klass=klass,file=item['consumerPath'],line=call[0],expression=call[4],expressionSha256=sha(call[4]),constructionKind=call[5],roleHint=call[7]))
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
                loader = 'packages/yaml-doc/rust/tests/common/mod.rs'
                loader_source = sources[loader]
                loader_match, = list(re.finditer(r'(?m)^pub fn fixture_cases\(',loader_source))
                r.update(status='joined-fixture-contract', owningProofs=[named_proof('packages/yaml-doc/rust/tests/golden_parse.rs','parse_matches_the_golden_cases')], fixtureLoader=dict(file=loader,line=loader_source.count('\n',0,loader_match.start())+1,sourceSha256=sha(loader_source)), custody='Golden parse loop consumes fixture_cases("parse"); common/mod.rs resolves fixtures/parse.v1.json. Path strings are scalar parser inputs, not documentation reads.')
            elif r['file'] == 'packages/config/contracts/fixtures/authoring-source.config.json':
                r['reason'] = 'Authoring snapshot scalar at '+str(r['line'])+' retains '+r['operand']+' as pinned executor-description text; it is compared as configuration data, not opened as documentation. Keep the frozen fixture; review the live runner.yaml description separately.'
                r.update(status='joined-fixture-contract',owningProofs=[named_proof('packages/config/rust/tests/authoring_equivalence.rs','standard_files_plus_the_recorded_differences_read_back_as_the_tuned_config')],custody='source_bytes() reads authoring-source.config.json; the owning equivalence test compares its JSON value with the reconstructed config.')
            elif r['file'].endswith('/route-table-pending.md'):
                r['reason'] = 'Live generated instruction at '+r['file']+':'+str(r['line'])+' cites workflow milestone acceptance in '+r['operand']+'; it is navigation, not fixture data. Recompose the canonical core skill and regenerate this surface with the new workflow holder (L13-4).'
                r['blocker'] = r['reason']
            elif r['file'] == 'core/config-standard/runner.yaml':
                r['reason'] = 'Live standard runner description at line '+str(r['line'])+' cites '+r['operand']+'; the path is human-facing configuration text, not a loader operand. Confirm dated evidence vs current instruction in this particular executor description and co-compose any change with schema/standard parity.'
                r['blocker'] = r['reason']
            elif r['file'] == 'apps/fgos/src/cli_presenter.rs':
                r['reason'] = 'The refusal_json documentation at line '+str(r['line'])+' cites '+r['operand']+' as the current output-envelope contract. Repoint to docs/platform/work-state/contracts/cli-io-contract.md in the presenter co-cut; no runtime file read occurs here.'
                r['blocker'] = r['reason']
            else:
                r['reason'] = 'New literal '+r['operand']+' at '+r['file']+':'+str(r['line'])+' has no exact fixture loader or graded non-document reason bound in this records turn.'
                r['blocker'] = r['reason']
        dump(args.out / 'post-pin-literals.json', dict(sourceCommit=pin, method='Unchanged step-02l-inventory.py build() × frozen class4/5/6; compare complete lexical delta to original step-07 census. Not final pin F or behavioral completeness.', currentNewLiteralSites=len(fresh_sites), deltaCount=len(delta), rows=delta))
        historical_dynamic = {(s[1],s[3],s[4]) for s in historic['newDocumentationDynamicSites']}
        dynamic_delta = [r for r in dynamic_sites if (r['file'],r['expressionSha256'],r['constructionKind']) not in historical_dynamic]
        reviewed = json.loads((HERE.parent/'reviews/w2-g2-dyn-delta.json').read_text())
        review_pin = '3e2d05af89313dbfbf0d26cd0de34f6b660d194b'
        review_hunks = {}
        for file in sorted({s[1] for s in reviewed}):
            diff = git('diff','--no-ext-diff','--no-renames','--unified=0',review_pin,pin,'--',file).decode()
            review_hunks[file] = [(int(a),int(b or 1),int(c),int(d or 1)) for a,b,c,d in re.findall(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@',diff,re.M)]
        # Deliberate per-site judgments of the review's 13 reader hints. These
        # are graded source semantics, never acceptance by role or nearby docs cue.
        reader_reasons = {
            ('bin/fgos.mjs',3869): 'Acquire returns human-readable lease/token output; interpolation formats res.result, tokenHash and tokenPath, and does not dereference a documentation path.',
            ('bin/fgos.mjs',3875): 'The unheld-status branch formats res.state into stdout; it has no file/path operand and reads no document.',
            ('bin/fgos.mjs',3876): 'The held-status branch formats lease age, kernelLock, holderTokenHash and worktree in stdout; the displayed worktree is not a docs reader.',
            ('bin/fgos.mjs',3881): 'Release renders releasedAt and drift.join into a response string after the use case; it does not open the paths printed in the response.',
            ('bin/fgos.mjs',3890): 'Abandon renders res.reason as stdout after abandonDocumentationCutoverLease; the template is a message, not a document read.',
            ('packages/config/rust/src/files.rs',122): 'select_source joins dir with YAML_NAME (config.yaml) for read_beneath; this is a typed config-source read beneath its root, never a documentation-root read.',
            ('packages/config/rust/src/files.rs',124): 'select_source joins dir with JSON_NAME (config.json), then removes the migration tombstone; this second config-source read is not a legacy-doc read.',
            ('packages/config/rust/src/files.rs',128): 'The both-sources refusal renders dir.join(JSON_NAME) with to_string_lossy into its filename field; this occurrence only reports config-legacy-shadowed and performs no read.',
            ('packages/config/rust/src/locks.rs',7): 'GLOBAL_CONFIG is the literal resource name global-config, not a filesystem path. The docs cue is the nearby lock-registry provenance comment.',
            ('packages/config/rust/src/write.rs',108): 'The accounts arm reads dir.join(name) using read_beneath; target() supplies private/accounts.yaml. This config write CAS check reads an accounts source, not a document.',
            ('packages/yaml-doc/rust/src/profile.rs',295): 'resolve(text, style, tag) resolves the scalar type of a parsed YAML key (fallback Resolved::Str); resolve is not filesystem path resolution or file IO.',
            ('src/runner/dispatch/config.mjs',365): 'process.stderr.write formats a portability warning identifying a runner modelPolicies cell in ~/.fgos/config.json; this template reports ignored config, not a documentation read.',
            ('src/setup/tier-ladder-comment.mjs',14): 'ladderCommentLines formats d.name, work, selfCheck and examples into $comment strings; examples are data and no interpolated value is opened as a document.',
        }
        judgment_pin = '3d0169f390e21c67bc3fc69081fd1bc07186599f'
        judged_sources = {file:sha(git('show',judgment_pin+':'+file)) for file in {r['file'] for r in dynamic_delta}}
        source_reasons = {
            'scripts/lib/doc-git-reads.mjs':'This default repoRoot = process.cwd() belongs to resolveCommitSha, which validates a commit/treeish with Inspect.resolveCommit. The default supplies repository identity, not a documentation root; this judgment does not exempt the module\'s separate blob readers.',
            'Cargo.toml':'Cargo patch entries select vendored yaml parser crates. These are package source paths, not documentation roots.',
            'apps/fgos-gateway/Cargo.toml':'The Cargo dependency points to the yaml-doc Rust crate, not to a document or gateway API schema.',
            'bin/fgos.mjs':'The run branch resolves the caller repository/main-checkout root for documentation lease admission and case admission. This expression is repository identity plumbing, not a document path or read.',
            'packages/config/rust/src/error.rs':'The fields schema_path/path carry YAML/schema node-location strings in refusals, not filesystem/document operands.',
            'packages/config/rust/src/files.rs':'The select_source signature declares typed root/dir Path parameters for config.yaml/config.json selection; a type annotation opens no document.',
            'packages/config/rust/src/lint.rs':'YAML format_path and Finding.path render a schema node location from Segment values in memory, not a filesystem path.',
            'packages/config/rust/src/locks.rs':'scope_params accepts filesystem roots for holder-lock registry templates; the parameter type/import is not a docs read.',
            'packages/config/rust/src/snapshot.rs':'open_source/read_sources select .fgos config.yaml/config.json beneath project/global roots; the provenance closure path is a YAML Segment slice. No docs root is supplied by these expressions.',
            'packages/config/rust/src/write.rs':'dir_identity takes root and dir Path parameters for the config write directory identity check, not a documentation operand.',
            'packages/yaml-doc/rust/src/backend.rs':'Doc.root stores/takes an Option<usize> node index while building the parsed YAML tree; it is not a filesystem root.',
            'packages/yaml-doc/rust/src/document.rs':'span_of takes a YAML Segment slice to locate a node in the existing parsed tree, not a document file path.',
            'packages/yaml-doc/rust/src/edit.rs':'check_value/locate operate on YAML Segment slices in the parsed tree; they neither open nor resolve a documentation file.',
            'src/setup/event-store-fixes.mjs':'fixEventStoreMachineId passes the resolved fgOS state root to Identity mint. This is machine-state infrastructure, not a docs reader.',
        }
        joined_review = []
        for r in dynamic_delta:
            source = sources[r['file']]
            matches = [s for s in reviewed if s[1]==r['file'] and s[3]==r['expressionSha256'] and map_line(s[2],review_hunks[s[1]])==r['line']]
            assert len(matches)<=1, r
            r.update(sourceSha256=sha(source),currentContext='\n'.join(source.splitlines()[max(0,r['line']-3):r['line']+2]),
                     exactExpressionBound=r['expression'] in source,owningProofs=[],status='judgment-required',
                     owner='Documentation integration owner / independent census reviewer')
            assert r['exactExpressionBound']
            if matches:
                s, = matches; r['reviewSite'] = s; joined_review.append(s)
            else: s = None
            judgment_source_unchanged = sha(source)==judged_sources[r['file']]
            if s and (s[1],s[2]) in reader_reasons and judgment_source_unchanged:
                reason = reader_reasons[(s[1],s[2])]
                r.update(status='judged-non-document-REJECT',reason=reason,
                         gradeRecord=dict(admission='REJECT',disposition='preserve',nonDocumentUse=True,reason=reason,sourceSha256=sha(source),expressionSha256=r['expressionSha256'],judgmentSourceCommit=judgment_pin))
            elif r['file'] in locators and not locators[r['file']].get('error') and r['klass']==5:
                selected, r['helperCallChain'], r['custody'] = js_custody(locators[r['file']],r['line'])
                unique = {(t['title'],t['start']):t for t in selected}
                r['owningProofs'] = [named_proof(r['file'],t['title']) for t in sorted(unique.values(),key=lambda t:t['start'])]
            elif r['file'].endswith('.rs') and r['klass']==5:
                tests, r['helperCallChain'] = rust_custody(source,r['line'])
                r['owningProofs'] = [rust_proof(r['file'],source,t) for t in sorted(tests,key=lambda t:t['start'])]
                if tests: r['custody'] = 'Exact dynamic construction lies in this non-ignored Rust fixture test or its explicit same-file helper call chain.'
                elif r['file']=='packages/config/rust/tests/common/mod.rs':
                    r['owningProofs'] = [named_proof('packages/config/rust/tests/golden_scope.rs','scope_cases')]
                    r['custody'] = 'golden_scope::scope_cases calls cases -> fixture -> contracts in this shared module; fixture YAML and contract paths are loaded as test data, not as project docs.'
                elif r['file']=='packages/yaml-doc/rust/tests/common/mod.rs':
                    r['owningProofs'] = [named_proof('packages/yaml-doc/rust/tests/golden_parse.rs','parse_matches_the_golden_cases')]
                    r['custody'] = 'parse_matches_the_golden_cases calls fixture_cases -> read_json -> contracts_dir in this shared module; the contracts lookup loads parser test data, not project documentation.'
            elif r['file'].startswith('packages/config/contracts/fixtures/'):
                fixture_proofs = {
                    'no-echo.v1.json':('golden_no_echo.rs','no_refusal_or_display_form_echoes_a_value'),
                    'scope.v1.json':('golden_scope.rs','scope_cases'),
                    'snapshot.v1.json':('golden_snapshot.rs','snapshot_cases'),
                }
                target = fixture_proofs.get(pathlib.Path(r['file']).name)
                if target:
                    r['owningProofs'] = [named_proof('packages/config/rust/tests/'+target[0],target[1])]
                    r['custody'] = 'Golden config test loads this exact fixture via common::fixture/cases; expression is inline fixture JSON/YAML, not a docs read.'
            if r['owningProofs']:
                r['status'] = 'joined-owning-test'
                r['reason'] = r['custody']
            if r['status']=='judgment-required' and judgment_source_unchanged:
                physical_line = source.splitlines()[r['line']-1]
                reason = source_reasons.get(r['file'])
                if re.match(r'^\s*(?:use\s|type\s)',physical_line):
                    reason = 'This Rust use/type declaration binds an identifier or type alias; it is not an executable path construction or documentation read.'
                if r['file']=='test/e2e/documentation-cutover-lease-hooks.test.mjs':
                    reason = {
                        '`worktree: ${holder}`':'This assertion compares a human status output line with the disposable holder fixture path; it neither constructs nor opens a documentation target.',
                        'path: a':'This is a lexical fragment of the comment about corrupt human rendering, not an executable path or file read.',
                    }.get(r['expression'])
                if '/third-party/' in r['file'] and r['file'].endswith('/Cargo.toml') and re.fullmatch(r'path = "(?:src|tools)/[^"\n]+"',r['expression']):
                    reason = 'This vendored Cargo target path names a Rust source/tool entry, not fgOS documentation; it must stay a crate-relative package target.'
                if reason:
                    r.update(status='judged-non-document-REJECT',reason=reason+' Exact site: '+repr(r['expression'])+'.',
                             gradeRecord=dict(admission='REJECT',disposition='preserve',nonDocumentUse=True,reason=reason,sourceSha256=sha(source),expressionSha256=r['expressionSha256'],judgmentSourceCommit=judgment_pin))
            if r['status']=='judgment-required':
                r['reason'] = 'Construction '+repr(r['expression'])+' at '+r['file']+':'+str(r['line'])+' is not enclosed by a proved test and has no reviewed non-document grade. Trace this exact shared-helper/default-root/comment caller before acceptance; documentationCue is not target evidence.'
                r['blocker'] = r['reason']
        missing_review = [s for s in reviewed if s not in joined_review]
        for s in missing_review:
            dynamic_delta.append(dict(reviewSite=s,file=s[1],originalLine=s[2],expressionSha256=s[3],roleHint=s[5],status='judgment-required',owningProofs=[],owner='G9 source-binding reviewer / independent census reviewer',reason='Reviewed construction no longer has an exact mapped occurrence at this pin; rejudge retirement or changed expression, do not drop its custody.',blocker='Bind changed reviewed dynamic site at the requested pin.'))
        dump(args.out/'post-pin-dynamics.json',dict(sourceCommit=pin,reviewSourceCommit=review_pin,reviewedSites=len(reviewed),reviewedSitesBound=len(joined_review),reviewedSitesUnbound=len(missing_review),
             reviewerDeltaSha256=sha((HERE.parent/'reviews/w2-g2-dyn-delta.json').read_bytes()),
             judgmentSourceCommit=judgment_pin,currentNewDynamicSites=len(dynamic_sites),deltaCount=len(dynamic_delta),counts=dict(collections.Counter(r['status'] for r in dynamic_delta)),
             method='Unchanged step-02l-inventory dynamic grammar and step-07 old-expression subtraction, then historical dynamic set subtraction without line-drift identity invention. Every reviewed site retained, mapped at the current pin or explicitly parked. Source judgments are not independent approval.',rows=dynamic_delta))
    print(json.dumps(out['counts'], sort_keys=True))

if __name__ == '__main__': main()
