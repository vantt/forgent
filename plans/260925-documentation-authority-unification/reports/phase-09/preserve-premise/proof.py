#!/usr/bin/env python3
"""G6 records proof: final Step 3/4 identities, physical moves, source-bound premises.

Reuse: L12-121 physical simulator/pure generators (physical-move.mjs), final
assembler's Step 4 slot hash, Step 3 normalized references and source witnesses.
Missing premise evidence becomes an owned judgment/park, never an exemption.
"""
import sys
sys.dont_write_bytecode = True
import argparse, collections, difflib, hashlib, json, pathlib, posixpath, re, subprocess, tempfile
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OLD = HERE.parent.parent / 'phase-08'


def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n')


def bind_spans(source, spans):
    """Only exact text at its line or one unambiguous current line. No fuzzy rebind."""
    lines = source.splitlines()
    result = []
    for span in spans:
        text, original = span.get('text', ''), span['line']
        if text and original <= len(lines) and text in lines[original - 1]:
            result.append(original)
        else:
            hits = [n for n, line in enumerate(lines, 1) if text and text in line]
            if len(hits) != 1:
                return None
            result.append(hits[0])
    return result or None


def unit_at(source, lines):
    text = source.splitlines()
    start, end = min(lines) - 1, max(lines)
    # A table row is one unit, never the entire table. Bound prose to the
    # adjacent paragraph and stop at sibling list items (no distant done/date cue).
    if text[start].lstrip().startswith('|'): return '\n'.join(text[start:end])
    while start > max(0,min(lines)-25) and text[start-1].strip() and not re.match(r'^(?:#{1,6} |[-*] |\d+\. |\|)', text[start]):
        if re.match(r'^#{1,6} |^\|',text[start-1]): break
        start -= 1
    while end < min(len(text),max(lines)+25) and text[end].strip() and not re.match(r'^(?:#{1,6} |[-*] |\d+\. |\|)', text[end]): end += 1
    return '\n'.join(text[start:end])


def normalize_operand(path, bound_text, consumer=''):
    """Normalize locators/imports; expand only an unambiguous bound path token."""
    def clean(value):
        value = value.split('#')[0].lstrip('@').rstrip('.,:')
        if '<' not in value: value = value.rstrip('>')
        return re.sub(r':\d+(?:-\d+)?$', '', value).rstrip('/')
    path = clean(path)
    tokens = re.findall(r'@?(?:[\w.<>*?{}+-]+/)+[\w./<>*?{}@+:#-]+', bound_text)
    # Reject prose prefixes (repo/docs, <repo>/docs) as repo-relative tokens.
    # Explicit relative Markdown destinations, however, resolve at the consumer.
    longer = set()
    for token in tokens:
        token = clean(token)
        if not token.startswith(('docs/','./','../',path.split('/')[0]+'/')): continue
        if path in token and token != path:
            if token.startswith(('./','../')):
                if not consumer: continue
                token = posixpath.normpath(posixpath.join(posixpath.dirname(consumer),token))
            longer.add(token)
    return next(iter(longer)) if len(longer) == 1 else path


def after_presence(path, before, wildcard, unsafe, present):
    # Physical simulation copies docs/ only; other tracked operands are untouched.
    if wildcard or unsafe: return None
    return present(path) if path.startswith('docs/') else before


def file_evidence(source, file):
    """L13-10: a real introductory marker AND the approved location are required."""
    header = re.split(r'(?m)^#{2,6} ', source, maxsplit=1)[0]
    if file.startswith(('docs/distillery/sources/', 'docs/distillery/reports/')):
        front = re.match(r'\A---\n(.*?)\n---(?:\n|$)', source, re.S)
        if front and re.search(r'(?m)^type: git-repo\s*$', front[1]):
            url = re.search(r'(?m)^url: https?://[^\n]+', front[1])
            local = re.search(r'(?m)^local: upstreams/[^\n]+', front[1])
            if url and local:
                return dict(kind='file-external-repository-header', text='type: git-repo\n'+url[0]+'\n'+local[0])
        # Reports have prose rather than source frontmatter. Only introductory
        # Source/clone declarations count, never an incidental body example.
        marker = re.search(r'(?im)^(?:Source(?: snapshot| root)?:[^\n]*(?:\n`[^\n]+)?|Source: local clone[^\n]*)', header)
        if marker and re.search(r'(?:^|/)upstreams/[\w-]+|`upstreams/[\w-]+', marker[0]):
            return dict(kind='file-external-repository-header', text=marker[0])
        marker = re.search(r'Mechanical inventory pass over .*?for the distillery source `docs/distillery/sources/[^`]+`\.', header, re.S)
        if marker:
            return dict(kind='file-external-repository-header', text=marker[0])
    if file.startswith(('archive/plans/', 'plans/reports/')):
        date = re.search(r'(?<!\d)(?:20\d{2}-\d{2}-\d{2}|2\d(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01]))(?!\d)', file)
        title = re.search(r'(?m)^#{1,6} [^\n]+', source)
        if date and title:
            return dict(kind='file-dated-report-location', text=title[0], location=file, dateMarker=date[0])
    return None


def historical_evidence(source, lines, reason, unit, span, file=''):
    """Content + bound positions + reason, not a role/path whitelist."""
    line = min(lines)
    prefix = '\n'.join(source.splitlines()[:line])
    current = source.splitlines()[line-1]
    # A file-level Purpose label cannot swallow the live wrapper above its
    # explicit snapshot boundary. Navigation remains navigation even in carriage.
    snapshot = re.search(r'(?im)^#{1,6} Literal Snapshot\b', source)
    before_snapshot = snapshot is not None and line <= source.count('\n', 0, snapshot.start()) + 1
    prior = source.splitlines()[:line-1]
    previous = next((text for text in reversed(prior) if text.strip()), '')
    if re.search(r'(?i)Canonical architecture moved to:', current + '\n' + previous):
        return None
    if 'inside literal carriage' in reason.lower() and not before_snapshot:
        declaration = reason.split('declaration:',1)[-1].strip().split(' Non-executable successor note:')[0].rstrip('.')
        declaration = declaration.split(' Carriage declaration:')[-1].strip().rstrip('.')
        if declaration and declaration in prefix:
            return {'kind':'literal-carriage-declaration', 'text':declaration}
        for match in re.finditer(r'(?im)^#{1,6} (?:Literal Snapshot|.*source carriage|Retained .*source (?:detail|material)|Full source retained)[^\n]*', prefix):
            return {'kind':'literal-carriage-section', 'text':match[0]}
        match = re.search(r'(?im)^(?:Purpose: Preserve .*|Added in candidate: .*retained verbatim.*|.*retained verbatim.*(?:non.authority history|not navigation).*)$', prefix)
        if match: return {'kind':'explicit-carriage-framing', 'text':match[0]}
    # Exact source/evidence table-cell custody, not a blanket history-file rule.
    if current.lstrip().startswith('|') and re.search(r'(?i)(?:source|evidence|provenance|ledger|audit)',reason):
        prior = source.splitlines()[:line-1]
        header = None
        for n in range(len(prior)-1,0,-1):
            if not prior[n].strip(): break
            if re.match(r'^\s*\|[\s:|\-]+\|\s*$',prior[n]):
                header = prior[n-1]; break
        cells = list(re.finditer(r'(?<=\|)([^|]*)(?=\|)',current))
        headers = header.split('|')[1:-1] if header else []
        col = span.get('columnStart',1)-1
        text = span.get('text','')
        if not current[col:col+len(text)] == text:
            occurrences = [m.start() for m in re.finditer(re.escape(text),current)] if text else []
            col = occurrences[0] if len(occurrences)==1 else -1
        for i,cell in enumerate(cells):
            if cell.start() <= col < cell.end() and i < len(headers) and re.search(r'(?i)^(?:source(?:[ /-].*)?|evidence|input(?:s)?|original[^|]*)$',headers[i].strip()):
                return {'kind':'original-source-evidence-table-cell','header':header,'column':i+1,'text':cell[0]}
    if re.search(r'(?i)(?:provenance|lineage|source.locator|original Source)', reason):
        if re.search(r'(?i)^\s*(?:[-*]\s+)?(?:\*\*)?(?:Source|Provenance|Promoted from|Preserved from|Original source|Canonical source|Supersedes)\b', current):
            return {'kind':'source-provenance-label', 'text':current}
    headings = []
    for match in re.finditer(r'(?m)^(#{1,6}) (.*)$',prefix):
        level = len(match[1]); headings = [h for h in headings if h[0] < level] + [(level,match[0])]
    history = [h for _,h in headings if re.search(r'(?i)Document history|Change log|Changelog|Lịch sử|Completed|Done / Declined',h)]
    if history and re.search(r'(?i)(?:histor|dated|completed|capture|original|audited)', reason):
        return {'kind':'source-history-section', 'text':history[-1]}
    if re.search(r'(?i)(?:completed|done|dated|audit|capture|history|source identity)', reason):
        marker = re.search(r'(?i)(?:—\s*(?:\*\*)?done\b|\btsk-[a-z0-9]+\b|\b20\d{2}-\d\d-\d\d\b|\bcommit\s+[a-f0-9]{7,40}\b|Phase 0\d|\b(?:đã fix|đã xác minh|đã đóng|completed|retired in|captured output)\b)', unit)
        # A nearby task id alone cannot historicize a current pointer. Require a
        # completed marker, date, explicit dated-record header or source inventory.
        completed = re.search(r'(?i)(?:—\s*(?:\*\*)?done\b|đã fix|đã xác minh|đã đóng|completed|retired in|captured output)', unit)
        dated_header = re.search(r'(?im)^#{1,6} .*20\d{2}[-/]\d\d[-/]\d\d|^(?:Date|Recorded|Captured|Extraction|Cursor|Source):', prefix)
        if marker and (completed or dated_header): return {'kind':'completed-or-dated-source-unit', 'text':marker[0]}
        if re.search(r'\b[0-9a-f]{7,40}\b',unit) and re.search(r'(?i)(?:clean|verified|green|fixed|passed|complete)',unit) and re.search(r'(?i)(?:dated|archive|completed)',reason):
            return {'kind':'commit-bound-completed-proof-row','text':unit}
    if 'Whole-source architecture carriage' in reason and re.search(r'(?m)^Writer type: Agent carriage',source[:7000]) and re.search(r'(?m)^Purpose: Preserve the complete',source[:7000]):
        return {'kind':'explicit-whole-source-carriage-header','text':'Writer type: Agent carriage; Purpose: Preserve the complete'}
    if re.search(r'(?i)(?:upstream source coordinates|external.project|literal example|illustrative|adversarial)', reason):
        # Bind the path's column before limiting evidence to its sentence/cell.
        # Keep the abbreviation e.g. intact: its final dot is not a sentence end.
        text = span.get('text','')
        col = span.get('columnStart',1)-1
        if not text or current[col:col+len(text)] != text:
            occurrences = [m.start() for m in re.finditer(re.escape(text),current)] if text else []
            col = occurrences[0] if len(occurrences)==1 else -1
        if col < 0: return file_evidence(source, file)
        start, end = 0, len(current)
        for boundary in re.finditer(r'(?i)\||(?<!e\.g)\. |; |—', current):
            if boundary.end() <= col: start = boundary.end()
            elif boundary.start() > col:
                end = boundary.start(); break
        marker = re.search(r'(?i)(?:e\.g\.|for example|ví dụ|example project|upstream source|external project)', current[start:end])
        placeholder = re.search(r'<[\w-]+>', text)
        if placeholder and (re.search(r'(?i)illustrative', reason) or marker):
            return {'kind':'explicit-path-placeholder', 'text':text, 'placeholder':placeholder[0]}
        if marker:
            return {'kind':'explicit-external-or-example-framing', 'text':marker[0]}
    return file_evidence(source, file)


def premise(source_present, bound, stable_targets, evidence, wrapper, source_survives=True):
    if not source_present: return 'park-source-absent'
    if not bound: return 'park-current-passage-unbound'
    if not source_survives: return 'park-source-removed-by-cutover'
    if wrapper: return 'judgment-preserve-with-dated-note'
    if evidence: return 'preserve-source-confirmed-history'
    if stable_targets: return 'preserve-operand-reachability-unchanged'
    return 'park-unconfirmed-preserve-premise'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', type=pathlib.Path, default=HERE)
    ap.add_argument('--pin', default='HEAD', help='Commit whose tracked source blobs are proved')
    args = ap.parse_args()
    assert args.out.resolve() == HERE or any(str(args.out.resolve()).startswith(p) for p in ['/tmp/fgos-work/'])
    args.out.mkdir(parents=True, exist_ok=True)
    pin = git('rev-parse','--verify',args.pin+'^{commit}').decode().strip()
    matrix = json.loads((OLD/'step-07-consumer-cutover-matrix.json').read_text())
    catalog = {r['id']:r for r in matrix['recordCatalog'] if r['path'].startswith(('step-03-records/','step-04-records/'))}
    # Empty/zero-edge final batches have no row/catalog entry. Verify the full
    # 130+33 batch directories separately; do not invent 27 catalog memberships.
    batch_counts = {s:len(list((OLD/(s+'-records')).glob('*.jsonl'))) for s in ['step-03','step-04']}
    assert batch_counts == {'step-03':130,'step-04':33}
    zero_edge_batches = []
    for stage in ['step-03','step-04']:
        for path in sorted((OLD/(stage+'-records')).glob('*.jsonl')):
            if str(path.relative_to(OLD)) not in {r['path'] for r in catalog.values()}:
                raw = path.read_bytes()
                entries = [json.loads(l) for l in raw.decode().splitlines()]
                assert all(not r.get('edges') for r in entries), path
                zero_edge_batches.append(dict(path=str(path.relative_to(ROOT)),records=len(entries),sha256=sha(raw),edges=0))
    assert len(zero_edge_batches) == 27
    records = {}
    for id, rec in catalog.items():
        raw = (OLD/rec['path']).read_bytes()
        assert sha(raw) == rec['sha256'], rec['path']
        records[id] = [json.loads(line) for line in raw.decode().splitlines()]
    census = {i['edgeId']:i for i in json.loads((OLD/'step-02j-census-maps-portals-prose.json').read_text())['entries']}
    tracked = {line.split('\t')[1]:line.split()[0] for line in git('ls-tree','-r',pin).decode().splitlines()}
    source_cache = {}
    def source_of(file):
        assert not file.startswith(('.fgos/','.bee/')) and '..' not in pathlib.PurePosixPath(file).parts
        if file not in source_cache:
            source_cache[file] = git('show',pin+':'+file).decode() if tracked.get(file) in ('100644','100755') else None
        return source_cache[file]
    base = pathlib.Path('/tmp/fgos-work/w8-g6-fix');base.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='preserve-',dir=base) as name:
        scratch = pathlib.Path(name)
        run = subprocess.run(['node',str(HERE/'physical-move.mjs'),pin,name],cwd=ROOT,capture_output=True,text=True,check=True)
        physical = json.loads(run.stdout)
        candidate = scratch/'candidate'
        move_map = {r['from']:r['targets'] for r in physical['physicalMoves']}
        moving = set(move_map) | set(physical['additionalStep6Removals'])
        def present(file):
            target = candidate/file
            return target.is_file() or target.is_dir() and any(p.is_file() for p in target.rglob('*'))
        rows, retired, seen_members = [], [], set()
        for row in matrix['consumerRows']:
            if row[1] not in catalog or row[4] != 'preserved-history/fixture': continue
            rec = records[row[1]][row[2]-1]
            stage = catalog[row[1]]['path'][:7]
            def item_id(item):
                if stage == 'step-04': return str(item.get('edgeId') or 'slot')+'@'+sha(item['slotKey'])[:20]
                return str(item.get('referenceId') or item.get('id') or item.get('edgeId'))
            items = [i for i in rec['edges'] if item_id(i) == row[3]]
            assert len(items) == 1, row[0]
            item = items[0]
            basic = dict(rowId=row[0],stage=stage,file=rec['file'],memberId=row[3],
                         record=str((OLD/catalog[row[1]]['path']).relative_to(ROOT)),recordLine=row[2],
                         itemSha256=sha(json.dumps(item,sort_keys=True,ensure_ascii=False,separators=(',',':'))))
            if item.get('retiresWithTree'):
                retired.append(dict(**basic,reason=item['reason'],result='excluded-retire-with-tree',sourceRemoved=not present(rec['file'])))
                continue
            assert item['disposition'] == 'preserve'
            seen_members.add((catalog[row[1]]['path'],row[2],row[3]))
            source = source_of(rec['file'])
            reason = item['reason']; token = item.get('matchedExpression','')
            spans = item.get('sourceSpans',item.get('slotSourceSpans',[]))
            bound = bind_spans(source,spans) if source is not None else None
            unit = unit_at(source,bound) if bound else ''
            added = item.get('authorAddedEdge')
            normalized = (added.get('normalizedReference') if isinstance(added,dict) else None) or census.get(item.get('edgeId'),{}).get('normalizedReference') or item.get('legacyPath')
            targets = []
            if normalized: targets.append(normalized)
            targets += [f['path'] for f in item.get('targetFacts',[])]
            if not targets:
                targets += re.findall(r'docs/[\w./<>*?{}@+-]+',token)
                for dest in re.findall(r'\]\(([^) ]+)',token):
                    if not re.match(r'(?:\w+:|#)',dest): targets.append(posixpath.normpath(posixpath.join(posixpath.dirname(rec['file']),dest)))
            bound_text = '\n'.join(source.splitlines()[n-1] for n in bound) if bound else ''
            paths = sorted({normalize_operand(p,bound_text,rec['file']) for p in targets if p and not p.startswith(('http:','https:'))})
            reach = []
            for p in paths:
                unsafe = '..' in pathlib.PurePosixPath(p).parts or pathlib.PurePosixPath(p).is_absolute()
                wildcard = bool(re.search(r'[<>*?{}]',p))
                before = bool(tracked.get(p)) or any(t.startswith(p.rstrip('/')+'/') for t in tracked)
                after = after_presence(p,before,wildcard,unsafe,present)
                reach.append(dict(path=p,beforePresent=before,afterPresent=after,wildcard=wildcard,unsafeLiteral=unsafe,
                                  removedByMoveOrStep6=p in moving,successors=[dict(path=t,present=present(t),sha256=sha((candidate/t).read_bytes()) if (candidate/t).is_file() else None) for t in move_map.get(p,[])]))
            stable = bool(reach) and all(r['beforePresent'] and r['afterPresent'] and not r['wildcard'] for r in reach)
            current_line = min(bound) if bound else None
            current_text = source.splitlines()[current_line-1] if current_line else ''
            snapshot = re.search(r'(?im)^#{1,6} Literal Snapshot\b', source or '')
            inside_snapshot = bool(snapshot and current_line and current_line > source.count('\n',0,snapshot.start())+1)
            wrapper = bool(bound and not inside_snapshot and 'docs/specs/runner.md' in current_text and
                           ('Superseded by:' in current_text or ('CoordinationSession' in current_text and re.search(r'(?i)retir|history|historical',current_text))))
            evidence = historical_evidence(source,bound,reason,unit,spans[0],rec['file']) if bound else None
            if bound and 'frozen rename copy at 4ee0e3a3c' in reason:
                origin = git('show','4ee0e3a3c:'+rec['file']).decode()
                if source == origin:
                    evidence = dict(kind='frozen-source-snapshot-byte-equality',origin='4ee0e3a3c',sha256=sha(origin),text=current_text)
            source_survives = present(rec['file']) if rec['file'].startswith('docs/') else source is not None
            result = premise(source is not None,bool(bound),stable,evidence,wrapper,source_survives)
            check = dict(**basic,token=token,operandSha256=sha(token),statedReason=reason,statedReasonSha256=sha(reason),
                         recordSourceSha256=rec.get('digest'),sourceSha256=sha(source) if source is not None else None,
                         sourceChanged=source is None or sha(source)!=rec.get('digest'),sourceSpans=spans,currentLines=bound,
                         currentUnit=unit,currentUnitSha256=sha(unit),normalizedOperands=reach,
                         sourcePresentAfterCutover=source_survives,
                         sourceSuccessors=[dict(path=p,present=present(p),sha256=sha((candidate/p).read_bytes()) if (candidate/p).is_file() else None) for p in move_map.get(rec['file'],[])],
                         evidence=evidence,result=result,proposedDisposition='preserve' if result.startswith('preserve-') else 'owned-park',
                         owner='Documentation consumer-composition owner / Lead',independentApproval=False)
            if result == 'judgment-preserve-with-dated-note':
                successor = 'docs/platform/runner/decisions/h-aabefc85f0c9.md' if 'CoordinationSession' in current_text else 'docs/platform/runner/spec.md'
                assert present(successor)
                check.update(proposedDisposition='preserve-with-dated-note',decisionOwner='Lead',
                             successor=dict(path=successor,sha256=sha((candidate/successor).read_bytes()),presentAfterCutover=True),
                             proposedDatedNote='2026-10-23 cutover note (effective only after the authority flip): The legacy runner citation above is a historical coordinate, not a post-cutover link. Prepared successor: '+successor+'.',
                             alternatives=['preserve-with-dated-note','repoint'],
                             recommendationReason='L12-26(8)/L12-35(3) explicitly conserve history-wrapper wording. Add a dated, reachable successor outside the literal snapshot rather than rewriting the historical claim. Lead decides; no product patch or acceptance is implied.',
                             blocker='Lead must approve the row-specific dated note or choose repoint; then compose/review it with the owning file patch before cutover.')
            elif not result.startswith('preserve-'):
                successors = sorted({s['path'] for r in reach for s in r['successors'] if s['present'] and s['path'] != rec['file']})
                check['candidateSuccessors'] = successors
                if result == 'park-source-removed-by-cutover':
                    check['owner'] = 'Documentation consumer-composition owner / Lead'
                    if check['sourceSuccessors']:
                        check['blocker'] = 'Physical cutover removes '+rec['file']+'; operand reachability does not conserve this passage. Review '+row[0]+' in the non-identical successor(s) '+', '.join(s['path'] for s in check['sourceSuccessors'])+' and compose/review its effective disposition; never inherit a preserve from the deleted location.'
                    else:
                        holder = {'docs/specs/reading-map.md':'docs/reading-map.md', 'docs/specs/workflow.md':'docs/platform/workflow/spec.md'}[rec['file']]
                        assert present(holder)
                        check['recheckHolder'] = dict(path=holder,presentAfterCutover=True,sha256=sha((candidate/holder).read_bytes()))
                        check['actionReason'] = 'The bound unit is a live navigation/source summary citing '+', '.join(paths)+'; its subject must be checked in the non-identical holder, not silently retired or inherited from the deleted map/spec.'
                        check['blocker'] = 'Physical cutover removes '+rec['file']+' with no move destination. Recheck '+row[0]+' ('+', '.join(paths)+') and its bound unit in '+holder+'; compose/review any missing navigation or retire the obsolete clause explicitly. '+check['actionReason']
                elif result == 'park-current-passage-unbound':
                    check['owner'] = 'G9 source-binding reviewer / Documentation consumer-composition owner'
                    check['blocker'] = 'Rebind '+row[0]+' in '+rec['file']+' from the recorded spans to one exact current source unit at final pin F; only then rejudge its preserve premise. No digest-only carry over passage drift.'
                elif result == 'park-source-absent':
                    check['owner'] = 'G9 source-binding reviewer / Lead'
                    check['blocker'] = 'Source '+rec['file']+' is absent at this pin: identify its retirement or exact successor and disposition '+row[0]+' without recreating the removed source.'
                else:
                    lost = ', '.join(r['path'] for r in reach if not r['afterPresent']) or token
                    check['blocker'] = 'For '+row[0]+' in '+rec['file']+', confirm source-bound non-dereferencing semantics of '+lost+' or co-compose/review the live-pointer successor ('+(', '.join(successors) or 'no exact successor currently bound')+'). Lead owns this row before flip; no Step 5 proof inheritance.'
            if (not result.startswith('preserve-') and
                    any(s['path'] == rec['file'] for r in reach for s in r['successors'])):
                check['excludedSelfSuccessor'] = rec['file']
                check['blocker'] += ' L12-35(7): the physical move destination is this consumer itself, not an eligible successor link. Review whether to label the legacy coordinate as non-link provenance or remove the live navigation outside literal carriage; do not propose a self-link.'
            repoints = {
                'f08113':'docs/platform/packaging-distribution/history/distribution-vision.md',
                'f08071':'docs/platform/coexistence/spec.md',
                'f06985':'docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md',
                'f07526':'docs/platform/agent-coordination/architecture/dispatch-control-plane.md',
                'f07527':'docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md',
                'f07528':'docs/platform/agent-coordination/README.md',
            }
            if row[0] in repoints:
                successor = repoints[row[0]]
                assert bound and source_survives and present(successor) and successor != rec['file']
                assert any(successor==s['path'] for r in reach for s in r['successors'])
                check.update(result='repoint-proposal',proposedDisposition='repoint-proposal',evidence=None,
                             successor=dict(path=successor,sha256=sha((candidate/successor).read_bytes()),presentAfterCutover=True),
                             recommendationReason='L13-10 / exhaustive G6 review: this bound navigation must remain reachable after cutover; its legacy operand retires. Use the exact named holder, not historical framing.',
                             blocker='Compose and independently review '+row[0]+' with the owning file patch before flip; no product bytes changed in this records turn.')
                if row[0] in {'f07526','f07527','f07528'}:
                    check['preparedPatch'] = 'prepared-patches.json#patches[0]'
                    check['blocker'] += ' Apply only the single prepared patch covering all three sibling paths AND the line-22 declaration.'
            rows.append(check)
        assert collections.Counter(r['stage'] for r in rows) == {'step-03':4804,'step-04':609}
        assert len(retired) == 38 and all(r['sourceRemoved'] for r in retired)
        assert len({r['rowId'] for r in rows}) == 5413
        expected_members = set()
        for id, batch in records.items():
            stage = catalog[id]['path'][:7]
            for line, rec in enumerate(batch,1):
                for item in rec.get('edges',[]):
                    if item.get('disposition') != 'preserve': continue
                    member = str(item.get('edgeId') or 'slot')+'@'+sha(item['slotKey'])[:20] if stage=='step-04' else str(item.get('referenceId') or item.get('id') or item.get('edgeId'))
                    expected_members.add((catalog[id]['path'],line,member))
        assert seen_members == expected_members, 'final-record preserve identity mismatch'
        # Real source mutations pass through bind_spans AND historical_evidence,
        # not hand-supplied evidence. The first two reproduce the reviewer's bugs.
        probes = []
        for case, source, line, text, reason in [
            ('live pointer with unrelated example forty lines away', 'See docs/specs/x.md\n'+'\n'*40+'e.g. unrelated example\n', 1, 'See docs/specs/x.md', 'literal example; retained native path'),
            ('marker elsewhere in the same bound unit', 'See docs/specs/x.md\ne.g. an unrelated timeout value\n', 1, 'docs/specs/x.md', 'literal example; retained native path'),
            ('same line marker in a different sentence', 'For example a timeout. See docs/specs/x.md', 1, 'docs/specs/x.md', 'literal example'),
            ('same line marker after a semicolon', 'See docs/specs/x.md; for example a timeout', 1, 'docs/specs/x.md', 'literal example'),
            ('same line marker before an em dash', 'For example a timeout — see docs/specs/x.md', 1, 'docs/specs/x.md', 'literal example'),
            ('same line marker in a different table cell', '| For example a timeout | docs/specs/x.md |', 1, 'docs/specs/x.md', 'literal example'),
            ('column selects the unframed duplicate', 'For example docs/specs/x.md. See docs/specs/x.md', 1, 'docs/specs/x.md', 'literal example'),
            ('placeholder alone needs an illustrative reason', 'See docs/history/<id>/proof.md', 1, 'docs/history/<id>/proof.md', 'literal example'),
            ('navigation row under Bee title', '# Bee\n\n| Read first | docs/specs/x.md |\n', 3, '| Read first | docs/specs/x.md |', 'external.project literal example'),
            ('historical reason with mismatching passage', '# History\n\n2026-10-23 completed docs/specs/x.md\n', 3, '2026-10-23 completed docs/specs/other.md', 'dated completed history'),
        ]:
            spans = [dict(line=line,text=text,columnStart=source.splitlines()[line-1].rfind(text)+1)]
            bound = bind_spans(source,spans)
            evidence = historical_evidence(source,bound,reason,unit_at(source,bound),spans[0]) if bound else None
            actual = premise(True,bool(bound),False,evidence,False)
            probes.append(dict(case=case,source=source,sourceSha256=sha(source),spans=spans,reason=reason,bound=bound,currentUnit=unit_at(source,bound) if bound else None,evidence=evidence,actual=actual))
        assert all(p['actual'].startswith('park-') and p['evidence'] is None for p in probes)
        positives = []
        for case, source, reason, expected in [
            ('example framing in the actual passage', 'For example docs/specs/x.md', 'literal example', 'explicit-external-or-example-framing'),
            ('cite the bound placeholder rather than a same-line marker', 'For example docs/history/<id>/proof.md', 'illustrative convention', 'explicit-path-placeholder'),
            ('illustrative placeholder without any marker', 'See docs/history/<id>/proof.md', 'illustrative convention', 'explicit-path-placeholder'),
            ('illustrative placeholder does not borrow another cell marker', '| For example a timeout | docs/history/<id>/proof.md |', 'illustrative convention', 'explicit-path-placeholder'),
            ('source text after explicit snapshot boundary', '# Literal Snapshot\n\ndocs/specs/x.md', 'inside literal carriage', 'literal-carriage-section'),
        ]:
            line = len(source.splitlines())
            # A real census span is path-only; a whole-line span masks this bug.
            text = 'docs/history/<id>/proof.md' if expected=='explicit-path-placeholder' else 'docs/specs/x.md'
            span = dict(line=line,text=text,columnStart=source.splitlines()[line-1].index(text)+1)
            bound = bind_spans(source,[span])
            evidence = historical_evidence(source,bound,reason,unit_at(source,bound),span)
            assert evidence and evidence['kind']==expected
            positives.append(dict(case=case,source=source,span=span,reason=reason,evidence=evidence))
        # Scoped controls for the new operand and file-level rules; old sentence
        # controls above remain the owning proof for their unchanged behavior.
        operand_controls = []
        for rule, value, text, expected, positive in [
            ('line-locator','docs/backlog.md:88-90','', 'docs/backlog.md', True),
            ('line-locator','docs/backlog.md:latest','', 'docs/backlog.md:latest', False),
            ('import-prefix','@AGENTS.md','', 'AGENTS.md', True),
            ('import-prefix','AG@ENTS.md','', 'AG@ENTS.md', False),
            ('full-bound-path','agent-coordination/verification','See `docs/platform/agent-coordination/verification/panel/P05.2.md`', 'docs/platform/agent-coordination/verification/panel/P05.2.md', True),
            ('full-bound-path','agent-coordination/verification','See `docs/platform/other.md`', 'agent-coordination/verification', False),
            ('full-bound-path','a/b','`docs/a/b/one.md` and `docs/a/b/two.md`','a/b',False),
        ]:
            actual = normalize_operand(value,text)
            assert actual == expected, (rule,value,actual)
            operand_controls.append(dict(rule=rule,operand=value,boundText=text,positive=positive,expected=expected,actual=actual))
        actual = normalize_operand('packages/run-supervisor/contracts','[contracts](../../../packages/run-supervisor/contracts)', 'docs/platform/run-supervisor/spec.md')
        assert actual == 'packages/run-supervisor/contracts'
        operand_controls.append(dict(rule='full-bound-path',operand='packages/run-supervisor/contracts',boundText='[contracts](../../../packages/run-supervisor/contracts)',consumer='docs/platform/run-supervisor/spec.md',positive=True,expected=actual,actual=actual))
        for path, before, wildcard, unsafe, positive, expected in [
            ('packages/run-supervisor/contracts',True,False,False,True,True),
            ('packages/missing',False,False,False,False,False),
            ('packages/<id>',True,True,False,False,None),
            ('../packages/contracts',True,False,True,False,None),
            ('docs/specs/retired.md',True,False,False,False,False),
        ]:
            actual = after_presence(path,before,wildcard,unsafe,lambda p:False)
            assert actual == expected
            operand_controls.append(dict(rule='outside-docs-presence',operand=path,beforePresent=before,wildcard=wildcard,unsafe=unsafe,positive=positive,expected=expected,actual=actual))
        file_controls = []
        external = '---\ntype: git-repo\nurl: https://example.org/upstream/repo\nlocal: upstreams/repo\n---\n# Repo index\n\n## Findings\nSee docs/specs/x.md'
        for case, file, source, expected in [
            ('external source header','docs/distillery/sources/repo.md',external,'file-external-repository-header'),
            ('external report header','docs/distillery/reports/repo.md','# Extraction\n\nSource: local clone at `upstreams/repo`, HEAD `abc1234`.\n\n## Findings\nSee docs/specs/x.md','file-external-repository-header'),
            ('same directory without external marker','docs/distillery/sources/repo.md','# Local index\n\n## Findings\nSee docs/specs/x.md',None),
            ('external marker in body only','docs/distillery/reports/repo.md','# Local report\n\n## Findings\nSource: local clone at `upstreams/repo`.\nSee docs/specs/x.md',None),
            ('outside source location','docs/history/repo.md',external,None),
            ('dated archived report','archive/plans/260901-project/reports/proof.md','# Proof report\n\n## Findings\nSee docs/specs/x.md','file-dated-report-location'),
            ('dated report filename','plans/reports/review-260901-proof.md','# Review report\n\n## Findings\nSee docs/specs/x.md','file-dated-report-location'),
            ('undated report','plans/reports/proof.md','# Proof report\n\n## Findings\nSee docs/specs/x.md',None),
            ('dated live history convention','docs/history/260901-project/proof.md','# Proof report\n\n## Findings\nSee docs/specs/x.md',None),
            ('date without real header','archive/plans/260901-project/proof.md','See docs/specs/x.md',None),
        ]:
            line = len(source.splitlines()); span = dict(line=line,text='docs/specs/x.md')
            bound = bind_spans(source,[span])
            evidence = historical_evidence(source,bound,'retained native path',unit_at(source,bound),span,file)
            assert (evidence or {}).get('kind') == expected, case
            actual = premise(True,bool(bound),False,evidence,False)
            assert actual == ('preserve-source-confirmed-history' if expected else 'park-unconfirmed-preserve-premise')
            file_controls.append(dict(case=case,file=file,source=source,span=span,evidence=evidence,actual=actual,positive=expected is not None))
        file = 'docs/platform/proposals/dispatch-control-plane-redesign.md'
        before = source_of(file); after = before
        replacements = [
            (22,'The three inline-code legacy paths are retained pending cutover','The three inline-code legacy paths were repointed to their docs/platform holders at cutover'),
            (29,'docs/architect/agent-coordination/architecture/dispatch-control-plane.md','docs/platform/agent-coordination/architecture/dispatch-control-plane.md'),
            (33,'docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md','docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md'),
            (37,'docs/architect/agent-coordination/README.md','docs/platform/agent-coordination/README.md'),
        ]
        for line, old, new in replacements:
            assert old in before.splitlines()[line-1] and after.count(old) == 1
            after = after.replace(old,new)
        patch = dict(file=file,rowIds=['f07526','f07527','f07528'],status='prepared-not-applied',sourceSha256=sha(before),proposedSha256=sha(after),
                     replacements=[dict(line=line,before=old,after=new) for line,old,new in replacements],
                     patch=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+file,tofile='b/'+file)))
        dump(args.out/'prepared-patches.json',dict(sourceCommit=pin,patches=[patch],independentApproval=False,noReadinessClaim=True))
        counts = dict(total=len(rows),byStage=dict(collections.Counter(r['stage'] for r in rows)),byResult=dict(collections.Counter(r['result'] for r in rows)),excludedRetireWithTree=len(retired),recordBatches=len(catalog),finalBatchPopulation=batch_counts)
        report = dict(sourceCommit=pin,authority='L12-137; G6; L12-121 method extended, not inherited',
                      inputs={f:sha((OLD/f).read_bytes()) for f in ['step-07-consumer-cutover-matrix.json','step-05-cutover-move-set.json','step-07-post-move-proof.mjs','step-02j-census-maps-portals-prose.json']},
                      counts=counts,physical=physical,zeroEdgeBatches=zero_edge_batches,negativeDecisionProbes=probes,positiveEvidenceControls=positives,operandControls=operand_controls,fileEvidenceControls=file_controls,
                      noReadinessClaim=True,independentApproval=False,
                      scope='Tracked source blobs and physical scratch moves only. Exact source spans + reason/operand/source digests per final identity; retained reachability proves operand stability, not contract/runtime parity. Unconfirmed premises are owned parks. No checkout move, source edit, CLI, Git write, live state or test execution.',rows=rows)
        dump(args.out/'proof.json',report)
        dump(args.out/'retire-with-tree.json',dict(sourceCommit=pin,count=len(retired),rows=retired))
        judgments = [r for r in rows if not r['result'].startswith('preserve-')]
        # One owning evidence row in proof.json. Secondary indexes carry locators,
        # decisions and digests, not duplicate multi-kilobyte source passages.
        keys = ['rowId','stage','file','memberId','record','recordLine','currentLines','sourceSha256','itemSha256','result','proposedDisposition','owner','blocker','candidateSuccessors','excludedSelfSuccessor','sourcePresentAfterCutover','sourceSuccessors','successor','recommendationReason','recheckHolder','actionReason','preparedPatch']
        dump(args.out/'judgments.json',dict(sourceCommit=pin,count=len(judgments),owningEvidence='proof.json#rows[rowId]',rows=[{k:r[k] for k in keys if k in r} for r in judgments]))
        keys += ['decisionOwner','successor','proposedDatedNote','alternatives','recommendationReason']
        dump(args.out/'history-wrapper-proposals.json',dict(sourceCommit=pin,count=sum('decisionOwner' in r for r in rows),owningEvidence='proof.json#rows[rowId]',
             compositionInstructions=dict(status='deferred-not-applied',placement='After the closing header fence; before Literal Snapshot. Never insert a note inside the fenced header.',merge='Merge the two notes in each of the 73 two-note files into one note naming both successors.',date='Use the actual flip date at composition, not the draft date 2026-10-23.',wording='For f06391, change records to recorded when composing its owning patch.'),
             rows=[{k:r[k] for k in keys if k in r} for r in rows if 'decisionOwner' in r]))
        print(json.dumps(counts,sort_keys=True))


if __name__ == '__main__': main()
