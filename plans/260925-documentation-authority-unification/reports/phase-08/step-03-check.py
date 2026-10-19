#!/usr/bin/env python3
"""Pinned-tree record checks. Git apply checks use disposable /tmp files; no Git writes.
No consumer edit, production resolver, or second anchor slugger is implemented here.
"""
import sys
sys.dont_write_bytecode=True
import importlib.util
import argparse, collections, difflib, functools, hashlib, json, math, os, pathlib, posixpath, re, subprocess, tempfile
_spec=importlib.util.spec_from_file_location('step03_resolve',pathlib.Path(__file__).with_name('step-03-resolve.py'))
resolver=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(resolver)
ROOT = pathlib.Path(__file__).resolve().parents[4]
REL = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
INVENTORY = '1a0f61ac53433292e08fb378ebbb6c1c72fd3b74'
SETS = ('001', '002', '040', '041')
FIELDS = {'file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','diff','edges','checks','reviewSet','authoringRules'}
CATEGORIES = {'step5-parity','phase9-carry','description-rewrite','dead-link','GAP-01','GAP-02','GAP-03','workflow-carry'}
HIT_CATEGORIES = {'citation-only','carriage','partial-holder','unrelated','dead'}
EDGE_FIELDS = {'blockedCategory','dependencyCategory','edgeId','sourceSpans','matchedExpression','disposition','diffHunk','reason','target','anchor','timing','blockedReason','dependency'}
ENV = dict(os.environ); ENV.pop('CLAUDE_CODE_SESSION_ID', None)

def sha(b): return hashlib.sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()
def git(*args): return subprocess.check_output(['git','-C',str(ROOT),*args], env=ENV,stderr=subprocess.PIPE)
@functools.lru_cache(None)
def blob(commit, file): return git('show',commit+':'+file)
@functools.lru_cache(None)
def census(): return json.loads((ROOT/REL/'step-02j-census-maps-portals-prose.json').read_text())
def population():
    result={}; batch=None
    for line in (ROOT/REL/'step-03-authoring-request.md').read_text().splitlines():
        m=re.match(r'Batch (\d+)',line)
        if m: batch=m[1]
        m=re.match(r'\| `([^`]+)` \|',line)
        if m and batch in SETS: result[m[1]]=batch
    return result

def records():
    return [json.loads(l) for b in SETS for l in (ROOT/REL/'step-03-records'/('batch-'+b+'.jsonl')).read_text().splitlines()]

def selected(rs,commit,batch):
    seed='A51-step03-file-v1\0'+commit+'\0'+batch
    group=[r for r in rs if r['reviewSet']=='batch-'+batch and not r.get('retiresWithTree')]
    pop=sorted(r['file'] for r in group if r['diff'])
    ranks=sorted([{'file':p,'rankHash':sha(seed+'\0'+p)} for p in pop],key=lambda x:(x['rankHash'],x['file']))
    witnesses=[{'file':r['file'],'bytes':len(blob(commit,r['file'])),'edges':len(r['edges']),
                'sizeThreshold':len(blob(commit,r['file']))>=65536,'edgeThreshold':len(r['edges'])>=40}
               for r in group if len(blob(commit,r['file']))>=65536 or len(r['edges'])>=40]
    sample=[x['file'] for x in ranks[:math.ceil(.15*len(pop))]]
    return {'set':'batch-'+batch,'seed':seed,'population':pop,'populationCount':len(pop),'ranks':ranks,
            'sample':sample,'mandatoryWitnesses':witnesses,'selected':sorted(set(sample)|{w['file'] for w in witnesses}),
            'distinctReviewCount':len(set(sample)|{w['file'] for w in witnesses}),
            'pilotFullReviewFiles':sorted(r['file'] for r in group),
            'dispositions':dict(collections.Counter(e['disposition'] for r in group for e in r['edges']))}

def spans_text(text,spans):
    ls=text.splitlines(); pieces=[]
    for s in spans:
        assert set(s)=={'line','columnStart','columnEndExclusive','text'}
        assert 1<=s['line']<=len(ls) and 1<=s['columnStart']<=s['columnEndExclusive']
        p=ls[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1]
        assert p==s['text'] and p
        pieces.append(p)
    return '\n'.join(pieces)

def bounds(text,spans):
    ls=text.splitlines(keepends=True); offsets=[0]
    for l in ls: offsets.append(offsets[-1]+len(l))
    return [(offsets[s['line']-1]+s['columnStart']-1,offsets[s['line']-1]+s['columnEndExclusive']-1) for s in spans]

def normalize(file,destination):
    p=destination.split('#',1)[0]
    if p.startswith('repo/'): p=p[5:]
    elif not p.startswith(('docs/','plans/','scripts/','src/','packages/','apps/','core/')):
        p=posixpath.join(posixpath.dirname(file),p)
    return posixpath.normpath(p)

def form(old,file,target,anchor):
    m=re.fullmatch(r'(!?)\[([^\]]+)\]\(([^)]+)\)',old,re.S)
    dest=m[3] if m else old
    # This pilot authors single physical span units; wrapped units remain explicit dispositions.
    plain=target+('#'+anchor if anchor else '')
    if dest.startswith('repo/'): new='repo/'+plain
    elif dest.startswith(('docs/','plans/','src/','scripts/','packages/','apps/','core/')): new=plain
    else:
        new=posixpath.relpath(target,posixpath.dirname(file) or '.')+('#'+anchor if anchor else '')
        if dest.startswith('./') and not new.startswith('.'): new='./'+new
    if dest.split('#')[0].endswith('/') and not anchor: new=new.rstrip('/')+'/'
    if not m: return new
    image,label=m[1],m[2]; stripped=label.strip('`')
    if stripped==dest or stripped==dest.split('#')[0]: label=('`' if label.startswith('`') else '')+new+('`' if label.endswith('`') else '')
    elif stripped==posixpath.basename(dest.split('#')[0]):
        label=('`' if label.startswith('`') else '')+posixpath.basename(target)+('`' if label.endswith('`') else '')
    return image+'['+label+']('+new+')'

@functools.lru_cache(None)
def anchors(commit,target):
    # Use the repository API, with committed API bytes verified before import.
    for p in ['scripts/list-doc-anchors.mjs','scripts/generate-doc-inventory.mjs']:
        assert (ROOT/p).read_bytes()==blob(commit,p),'Anchor API working tree differs from declared commit'
    js="import {listAnchors} from './scripts/list-doc-anchors.mjs'; let s=''; for await (const x of process.stdin) s+=x; console.log(JSON.stringify(listAnchors(s)));"
    return json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,input=blob(commit,target),env=ENV))

def locator_present(token,body):
    token=token.lstrip('§')
    if re.fullmatch(r'(?:RUL\d+[a-z]?|D-ADR\d+|ADR-\d+|00\d{2})',token):
        return bool(re.search(r'(?<![\w])'+re.escape(token)+r'(?![\w])',body,re.I))
    return token.casefold() in body.casefold()

@functools.lru_cache(None)
def heading_sections(commit,target):
    lines=blob(commit,target).decode().splitlines();result=[]
    for a in anchors(commit,target):
        if a['kind']!='heading':continue
        n=a['startLine'];h=re.match(r'^(#{1,6})\s',lines[n-1])
        if not h:continue
        level=len(h[1]);end=next((i for i in range(n,len(lines)) if re.match(r'^#{1,'+str(level)+r'} ',lines[i])),len(lines))
        result.append({**a,'level':level,'sectionEndLine':end,'body':'\n'.join(lines[n-1:end])})
    return result

RETIRING_ROOTS = ('docs/specs/', 'docs/architect/')
RETIREMENT_EXCEPTIONS = {'docs/specs/workflow.md', 'docs/specs/reading-map.md', 'docs/specs/work-state.md'}

def evidence_payload(file):
    # Maintained indexes/READMEs are not relocated evidence payloads.
    return file.startswith(RETIRING_ROOTS) and '/verification/' in file and not file.endswith('/README.md')

def may_retire(file):
    return file.startswith(RETIRING_ROOTS) and file not in RETIREMENT_EXCEPTIONS and not evidence_payload(file)

def edge_count(record):
    return len(record.get('edgeIds', [])) if record.get('retiresWithTree') else len(record['edges'])

def related_header(text, line):
    # A wrapper header ends at a blank line, code fence, or heading. A Related
    # block inside Literal Snapshot is source bytes, not wrapper navigation.
    lines=text.splitlines()
    if not re.match(r'^\s*(?:[-*] |Related:)',lines[line-1]):return False
    fences=[i for i,l in enumerate(lines,1) if l.startswith('```')]
    if len(fences)>=2 and fences[0]<15 and line>fences[1]:return False
    if any(re.match(r'^## ',l) for l in lines[:line]):return False
    start=line-1
    while start>=0 and lines[start].strip() and not lines[start].startswith(('```','~~~','#')):
        if re.match(r'^Related:\s*', lines[start]):return True
        if start<line-1 and not re.match(r'^\s*[-*] ',lines[start]):return False
        start-=1
    return False

def unit_id(text, spans):
    n=spans[0]['line'];lines=text.splitlines();line=lines[n-1]
    if line.lstrip().startswith('|'):return 'row-L'+str(n)
    if 'Canonical for:' in line and 'current source remains' in line:return 'canonical-L'+str(n)
    # Every status/migration bullet group has one unit, bounded by headings,
    # blank lines and non-list paragraphs (continuations remain in the group).
    heading='';heading_line=0
    for i,l in enumerate(lines[:n],1):
        if re.match(r'^#{1,6} ',l):heading=l;heading_line=i
    if re.search(r'migration|transitional status|current (?:source|authority)|legacy source',heading,re.I) and re.match(r'^\s*[-*] ',line):
        a=n-1
        while a>heading_line and lines[a-1].strip() and not lines[a-1].startswith('#'):a-=1
        return 'status-bullets-L'+str(a+1)
    return 'line-L'+str(n)

def retirement_failures(r, checker):
    failures=[]
    def require(name, predicate):
        if not predicate:failures.append({'file':r.get('file'),'check':name})
    f=r['file'];before=blob(checker.commit,f);old=blob(INVENTORY,f)
    require('retirement-eligibility', may_retire(f))
    require('retirement-no-diff', r.get('diff')=='' and r.get('edges')==[])
    require('retirement-schema', set(r)=={'file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','edgeIds','authorAddedEdges','diff','edges','reviewSet','authoringRules','retiresWithTree','reason'} and r['retiresWithTree'] is True and bool(r['reason']))
    require('digest', r['authorInputCommit']==checker.commit and r['inventoryInputCommit']==INVENTORY and r['digest']==sha(before) and r['inventoryFileDigest']==sha(old)==checker.files[f]['sha256'])
    ids=r['inventoryEdgeIds'];added=r['authorAddedEdges'];allids=ids+[e['edgeId'] for e in added]
    require('retirement-supplemental-coverage', collections.Counter(e['edgeId'] for e in added)==collections.Counter(e['edgeId'] for e in prior_added_edges(f,r['reviewSet'])))
    require('retirement-edge-coverage', collections.Counter(ids)==collections.Counter(checker.files[f]['edgeIds']) and len(allids)==len(set(allids)) and collections.Counter(r['edgeIds'])==collections.Counter(allids))
    for e in added:
        try:
            assert set(e)=={'edgeId','sourceSpans','matchedExpression','authorAddedEdge'}
            assert e['edgeId'] not in checker.entries and e['authorAddedEdge']['normalizedReference']
            assert spans_text(before.decode(),e['sourceSpans'])==e['matchedExpression']
        except (AssertionError,KeyError):require('retirement-added-coverage',False)
    return failures

def reference_roots(file, text):
    roots=[posixpath.dirname(file)]
    if file.startswith('docs/platform/'):
        roots.append('/'.join(file.split('/')[:3]))
        # Source-carriage subpaths retain their source-area coordinates. Bind
        # this fallback to the explicit wrapper provenance, never to a basename
        # match elsewhere in the repository.
        header=text.split('```',2)[1] if '```' in text[:150] else text[:2500]
        for line in header.splitlines():
            if not re.match(r'^(?:Provenance|Source type):',line):continue
            for hit in re.findall(r'docs/(?:specs|architect)/[^\s`;,]+',line):
                path=hit.rstrip('.')
                roots.append(posixpath.dirname(path) if path.endswith('.md') else re.split(r'[*<{]',path)[0].rstrip('/'))
    return list(dict.fromkeys(roots))

@functools.lru_cache(None)
def prior_added_edges(file, review_set):
    path=str(REL/'step-03-records'/(review_set+'.jsonl'))
    records=[json.loads(line) for line in blob('04913b160eac95a199718176ca75780573a3573d',path).decode().splitlines()]
    return [e for r in records if r['file']==file for e in r['edges'] if e.get('authorAddedEdge')]

def scan_candidates(commit,file,inventory_spans):
    """Whole-file supplemental search; candidates need an edge or an explicit exclusion.
    Basename set comes from committed retiring trees. Full paths include retained legacy
    user/history roots too; boundary prevents matching docs/how-to inside how-to-X.md.
    """
    tree=git('ls-tree','-r','--name-only',commit).decode().splitlines()
    names=sorted({p.rsplit('/',1)[-1] for p in tree if p.startswith(('docs/specs/','docs/architect/')) and p.endswith('.md')},key=lambda x:(-len(x),x))
    full=r'(?<![\w/-])(?:repo/)?docs/(?:specs|architect|how-to|explanation|decisions|history|reference|tutorials|distillery)(?=/|[\s`),;]|$)(?:/[^\s`<>"\]\[),;|}]*)?'
    bare=r'(?<![\w/-])(?:'+'|'.join(re.escape(n) for n in names)+r')(?::\d+(?:[-–]\d+)?)?(?![\w.-])'
    partial=r'(?<![\w/-])(?:\.\./)?(?:specs|architect)/[^\s`<>"\]\[),;|}]+\.md(?::\d+(?:[-–]\d+)?)?(?:#[^\s`<>"\]\[),;|}]+)?'
    pattern=re.compile(full+'|'+partial+'|'+bare)
    result=[]
    tree_set=set(tree);dirs={p[:i] for p in tree for i,c in enumerate(p) if c=='/'}
    roots=reference_roots(file,blob(commit,file).decode())
    relative=re.compile(r'(?<![\w/.-])(?:[.]{1,2}/)*(?:[\w.-]+/)+[\w.-]*\.md(?::\d+(?:[-–]\d+)?)?(?:#[^\s`<>\"\]\[),;|}]+)?|`([^`\n]+)`')
    for n,line in enumerate(blob(commit,file).decode().splitlines(),1):
        matches=[(m.start(),m.end(),m.group()) for m in pattern.finditer(line)]
        for hit in relative.finditer(line):
            a,b=hit.span(1) if hit.group(1) is not None else hit.span();token=line[a:b]
            raw=re.sub(r':\d+(?:[-–]\d+)?$','',token.split('#')[0])
            if not re.fullmatch(r'(?:[.]{1,2}/)*[\w./-]+/?',raw):continue
            targets={posixpath.normpath(posixpath.join(root,raw)) for root in roots}
            local_roots=[posixpath.dirname(file)]+(['/'.join(file.split('/')[:3])] if file.startswith('docs/platform/') else [])
            if any((p in tree_set or p in dirs) and not p.startswith(RETIRING_ROOTS) for p in [posixpath.normpath(posixpath.join(root,raw)) for root in local_roots]):continue
            if not any(p.startswith(RETIRING_ROOTS) and (p in tree_set or p in dirs) for p in targets):continue
            if not any(x<=a and b<=y for x,y,_ in matches):matches=[x for x in matches if not (a<=x[0] and x[1]<=b)];matches.append((a,b,token))
        # A Markdown link is one reference, including its label. Never add
        # separate sibling-path edges for the label and destination.
        for link in re.finditer(r'!?\[[^\]\n]+\]\(([^)\n]+)\)',line):
            raw=link[1].split('#')[0]
            local_roots=[posixpath.dirname(file)]+(['/'.join(file.split('/')[:3])] if file.startswith('docs/platform/') else [])
            resolved=[posixpath.normpath(posixpath.join(root,raw)) for root in roots]
            local=[posixpath.normpath(posixpath.join(root,raw)) for root in local_roots]
            if any(p in tree_set or p in dirs for p in local if not p.startswith(RETIRING_ROOTS)):continue
            if not any(p.startswith(RETIRING_ROOTS) and (p in tree_set or p in dirs) for p in resolved):continue
            a,b=link.span();matches=[x for x in matches if not (a<=x[0] and x[1]<=b)];matches.append((a,b,link[0]))
        for a,b,token in sorted(matches):
            if any(x['line']==n and x['columnStart']<=a+1<x['columnEndExclusive'] for x in inventory_spans):continue
            result.append({'line':n,'columnStart':a+1,'columnEndExclusive':b+1,'text':token})
    return result

def history_at(text,line,target=''):
    if '/history/' in target or re.search(r'^Document type:\s*History',text[:7000],re.M|re.I): return True
    stack=[]; framed=False
    for i,l in enumerate(text.splitlines(),1):
        if i>line: break
        h=re.match(r'^(#{1,6})\s+(.+)',l)
        if h:
            lev=len(h[1]);stack=[x for x in stack if x[0]<lev];stack.append((lev,h[2]));framed=False
        if re.search(r'retained verbatim.*(?:non.authority history|not navigation)',l,re.I):framed=True
    return framed or any(re.search(r'literal snapshot|historical source section|source carriage|retained.*source (?:detail|material)|full source retained|added in candidate.*source carriage',h,re.I) for _,h in stack)

def make_diff(file,before,after):
    return ''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+file,tofile='b/'+file,n=3)) if before!=after else ''

def hunks(diff):
    return [m.group(0) for m in re.finditer(r'^@@ .*?(?=^@@ |\Z)',diff,re.M|re.S)]

def adjacent_passage(text,spans):
    lines=text.splitlines();start=min(x['line'] for x in spans)-1;end=max(x['line'] for x in spans)
    boundary=lambda line:bool(re.match(r'^(?:\s*$|#{1,6} |[-*] |\d+\. |\|)',line))
    while start>0 and not boundary(lines[start]) and lines[start-1].strip():
        start-=1
        if boundary(lines[start]):break
    while end<len(lines) and not boundary(lines[end]):end+=1
    return '\n'.join(lines[start:end])

def blocker_category(prose):
    if not prose:return None
    p=prose.lower()
    if 'description' in p and ('rewrite' in p or 'rewrit' in p):return 'description-rewrite'
    if 'step 5' in p:return 'step5-parity'
    gap=re.search(r'GAP-0[123]',prose,re.I)
    if gap:return gap[0].upper()
    if 'workflow carry' in p:return 'workflow-carry'
    if 'dead' in p or 'never existed' in p:return 'dead-link'
    return 'phase9-carry'

@functools.lru_cache(None)
def path_history(commit,path):
    # Short decision ids denote their historical .md record, not extensionless files.
    path=re.sub(r':\d+(?:[-–]\d+)?$','',path.removeprefix('repo/').split('#')[0]).rstrip('/')
    if re.fullmatch(r'docs/decisions/\d{4}',path):path+='*'
    return git('log','--format=%H',commit,'--',path).decode().splitlines()

@functools.lru_cache(None)
def commit_changes(commit):
    # No path filter: rename detection needs both sides, including cross-directory moves.
    return [line.split('\t') for line in git('diff-tree','--root','--no-commit-id','-r','-M','--name-status',commit).decode().splitlines()]

def factual_reason(commit,e,legacy):
    reason=e['reason']
    facts=e.get('targetFacts',[])
    # Structured fields bind claims even where source passages themselves quote old wording.
    for fact in facts:
        path=fact['path'];state=fact['state']
        history=path_history(commit,path)
        if state=='never-existed':assert not history, path+' existed in pin ancestry'
        elif state in ('removed','renamed'):
            rev=git('rev-parse',fact['commit']+'^{commit}').decode().strip()
            assert subprocess.run(['git','-C',str(ROOT),'merge-base','--is-ancestor',rev,commit],env=ENV).returncode==0
            changes=commit_changes(rev)
            if state=='removed':assert ['D',path] in changes, 'not a deletion (may be a rename): '+path
            else:assert any(x[0].startswith('R') and x[1:]==[path,fact['successor']] for x in changes), 'not a rename: '+path
        else:assert state=='exists' and git('ls-tree',commit,'--',path).strip(),path
    # Verify prose claims too; a mutation cannot retain valid fields and lie in the reason.
    if re.search(r'\bnever[ -]exist(?:ed|ing)\b',reason,re.I):
        assert not path_history(commit,legacy),'false never-existed reason: '+legacy
    for match in re.finditer(r'(removed|renamed) at ([0-9a-f]{7,40})',reason):
        state,rev=match.groups()
        assert any(f['state']==state and f.get('commit','').startswith(rev) for f in facts),'unbound history claim'
        if state=='renamed':
            named=re.match(r' to ([^\s;,()`]+)',reason[match.end():])
            assert named and any(f['state']==state and f.get('successor')==named[1] for f in facts),'rename prose successor differs from fields'
    return True

def verify_witness(witness,commit,legacy,passage):
    # Replay through the existing resolver; old free-text assessment fields are optional
    # in L12-32 records. Project enum categories to its legacy assertion interface.
    compatible={**witness,'hitGroups':[{**g,'liveAssessment':g.get('liveAssessment') or g.get('note') or g.get('category',''),
                  'carriageAssessment':g.get('carriageAssessment') or 'Source history carriage is not a live target.'} for g in witness['hitGroups']]}
    return resolver.verify(compatible,commit,legacy,passage)

def evidence_anchor(commit,e,proof):
    lines=proof.get('targetLines',[])
    named=[int(n) for n in re.findall(re.escape(posixpath.basename(e['target']))+r':(\d+)',proof.get('locatorScopeReason',''))]
    assert all(n in lines for n in named), 'target line named in proof is omitted from evidence'
    if not lines:
        assert e['anchor'] is None and proof.get('wholeFileJustification'), 'missing line evidence / whole-file justification'
        return
    assert e['anchor'] is not None,'line evidence cannot use null anchor'
    sections=heading_sections(commit,e['target'])
    holders=[h for h in sections if all(h['startLine']<=n<=h['sectionEndLine'] for n in lines)]
    holder=max(holders,key=lambda h:(h['level'],h['startLine']))
    assert e['anchor']==holder['anchor'],'anchor differs from nearest extractor heading'
    text=blob(commit,e['target']).decode().splitlines()
    assert proof['targetLineText']==[text[n-1] for n in lines], 'line evidence differs from pinned target'

class Checker:
    def __init__(self,commit):
        self.commit=commit;self.entries={e['edgeId']:e for e in census()['entries']};self.files={f['path']:f for f in census()['files']}
        alias=json.loads(blob(commit,'plans/260925-documentation-authority-unification/alias-table.json'))
        self.aliases={x.get('id',x.get('aliasId','')) for x in alias.get('entries',[])}|{x.get('fromPath','') for x in alias.get('entries',[])}
        self.tree=set(git('ls-tree','-r','--name-only',commit).decode().splitlines())
        self.dirs={str(pathlib.PurePosixPath(p).parent) for p in self.tree}
        self.dirs.update('/'.join(p.split('/')[:i]) for p in self.tree for i in range(1,len(p.split('/'))))
    def check_record(self,r,apply=True):
        if r.get('retiresWithTree'):return retirement_failures(r,self)
        failures=[]
        def check(name,fn):
            try: assert fn() is not False
            except (AssertionError,KeyError,ValueError,IndexError,TypeError,StopIteration,subprocess.CalledProcessError) as ex: failures.append({'file':r.get('file'),'check':name,'detail':str(ex)[:300]})
        check('schema',lambda: set(r)==FIELDS and all(EDGE_FIELDS<=set(e)<=EDGE_FIELDS|{'searchWitness','authorAddedEdge','targetFacts','unitId','unitDispositionReason'} for e in r['edges']) and isinstance(r['diff'],str) and all(isinstance(r['checks'][k],dict) for k in ['coverage','anchors','relativeResolution','labelForm']))
        f=r['file']; before=blob(self.commit,f).decode(); old=blob(INVENTORY,f).decode()
        check('digest',lambda:r['authorInputCommit']==self.commit and r['inventoryInputCommit']==INVENTORY and r['digest']==sha(before) and r['inventoryFileDigest']==sha(old)==self.files[f]['sha256'])
        expected=self.files[f]['edgeIds'];actual=[e['edgeId'] for e in r['edges'] if not e.get('authorAddedEdge')]
        check('projection-source',lambda:not r['diff'] or (pathlib.PurePosixPath(f).name not in ['AGENTS.md','CLAUDE.md'] and f!='README.md' and 'fgos:instruction-projection:start' not in before and not re.search(r'^Do not edit:\s*true',before[:6000],re.M|re.I)))
        check('edge-coverage',lambda:collections.Counter(expected)==collections.Counter(actual)==collections.Counter(r['inventoryEdgeIds']) and len(actual)==len(set(actual)))
        def added_coverage():
            added=[e for e in r['edges'] if e.get('authorAddedEdge')]
            declared=r['checks']['coverage'].get('authorAddedEdgeIds',[])
            ids=[e['edgeId'] for e in added]
            assert collections.Counter(ids)==collections.Counter(declared) and len(ids)==len(set(ids))
            assert not set(ids)&set(self.entries)
            units=[]
            for e in added:
                meta=e['authorAddedEdge']
                assert meta['normalizedReference'] and meta['discoveryReason'] and meta['searchMethod']
                assert spans_text(before,e['sourceSpans'])==e['matchedExpression']
                units.append(tuple(bounds(before,e['sourceSpans'])))
            assert len(units)==len(set(units))
            for e in added:
                assert all(not (a<d and c<b) for a,b in bounds(before,e['sourceSpans'])
                           for other in r['edges'] if other is not e for c,d in bounds(before,other['sourceSpans']))
        check('author-added-coverage',added_coverage)
        def supplemental_search():
            coverage=r['checks']['coverage']
            if f in population():assert 'legacyScan' in coverage
            if 'legacyScan' not in coverage:
                assert not any(e.get('authorAddedEdge') for e in r['edges'])
                return # Synthetic probe records predate the complete-file author receipt.
            receipt=coverage['legacyScan']
            inv_spans=[x for key in expected for x in self.entries[key]['physicalSpans']]
            found=scan_candidates(self.commit,f,inv_spans)
            assert [x['span'] for x in receipt['candidates']]==found
            assert receipt['method'] and receipt['pin']==self.commit
            joins=[]
            for item in receipt['candidates']:
                if item.get('edgeId'):
                    e=next(e for e in r['edges'] if e['edgeId']==item['edgeId'])
                    assert e.get('authorAddedEdge') and e['sourceSpans']==[item['span']]
                    joins.append(e['edgeId'])
                else:assert item.get('excludedReason')
            assert collections.Counter(joins)==collections.Counter(coverage.get('authorAddedEdgeIds',[]))
        check('author-added-search-coverage',supplemental_search)
        def extra_locator_searches():
            for eid,queries in r['checks']['coverage'].get('extraLocatorSearches',{}).items():
                assert any(e['edgeId']==eid for e in r['edges'])
                for q in queries:
                    assert q['result']==resolver.query(self.commit,q['query']) and q['category'] in HIT_CATEGORIES
        check('supplemental-locator-replay',extra_locator_searches)
        def units():
            groups=collections.defaultdict(list)
            for e in r['edges']:
                expected_unit=unit_id(before,e['sourceSpans'])
                # Complete real records carry unitId; synthetic unit fixtures also
                # bind it explicitly. No ordinal or edge-id unit escape.
                assert e.get('unitId')==expected_unit
                groups[expected_unit].append(e)
            for edges in groups.values():
                if len({e['disposition'] for e in edges})>1:
                    assert all(isinstance(e.get('unitDispositionReason'),str) and e['unitDispositionReason'].strip() for e in edges), 'mixed unit lacks per-edge reason'
                if edges and edges[0]['unitId'].startswith('canonical-'):
                    assert all(e['disposition']=='phase9-row-flip' for e in edges)
        check('unit-consistency',units)
        changes=[]; used_hunks=set()
        for e in r['edges']:
            eid=e['edgeId']; inv=self.entries.get(eid)
            if not inv and e.get('authorAddedEdge'):
                inv={'consumerPath':f,'physicalSpans':e['sourceSpans'],'matchedExpression':e['matchedExpression'],
                     'normalizedReference':e['authorAddedEdge']['normalizedReference'],'locatorTokens':[]}
            if not inv: continue
            check('related-retiring-preserve',lambda e=e,inv=inv:not (e['disposition']=='preserve' and inv['normalizedReference'].startswith(RETIRING_ROOTS) and related_header(before,e['sourceSpans'][0]['line'])))
            check('source-span',lambda e=e:spans_text(before,e['sourceSpans'])==e['matchedExpression'])
            def correspondence(e=e,inv=inv):
                if e.get('authorAddedEdge'): return
                assert inv['consumerPath']==f
                assert spans_text(old,inv['physicalSpans'])==inv['matchedExpression']
                # Equal blobs require exact complete unit binding; drift needs explicit before/after passage journal.
                if before==old: assert e['sourceSpans']==inv['physicalSpans'] and e['matchedExpression']==inv['matchedExpression']
                else:
                    j=r['checks']['coverage']['rebindings'][eid]
                    assert j['inventoryExpression']==inv['matchedExpression'] and j['authorExpression']==e['matchedExpression'] and j['correspondenceReason']
                    assert j['inventoryContext'] in old and j['authorContext'] in before
            check('passage-correspondence',correspondence)
            check('disposition',lambda e=e:e['disposition'] in ['patch','preserve','parked','phase9-row-flip'] and bool(e['reason']) and bool(re.search(r'L12-|A51|Step [345]',e['reason'])))
            check('reason-anchor-consistency',lambda e=e:all(a==e['anchor'] for a in re.findall(r'#([^\s`;,).]+)',e['reason'])) if e['disposition']=='patch' else True)
            check('reason-target-history',lambda e=e,inv=inv:factual_reason(self.commit,e,inv['normalizedReference'].split('#')[0]))
            def categories(e=e):
                a=e.get('blockedCategory');b=e.get('dependencyCategory')
                assert a==b and (a in CATEGORIES if e['disposition']=='parked' else a is None)
                if a:
                    assert (not e['blockedReason'] or blocker_category(e['blockedReason'])==a) and (not e['dependency'] or blocker_category(e['dependency'])==b)
            check('dependency-category',categories)
            if e['disposition']=='parked':check('parked-state',lambda e=e:e.get('blockedCategory') in CATEGORIES and e.get('dependencyCategory') in CATEGORIES and all(e[k] is None or isinstance(e[k],str) for k in ('blockedReason','dependency')) and e['timing']=='none' and e['diffHunk'] is None and e['target'] is None)
            source_passage=resolver.passage(before,e['sourceSpans'])
            if e['disposition']=='parked':
                # Explicit semantic/parity parks also replay a search; absence claims cannot escape
                # the check by changing one wording of 'missing target'.
                check('park-search-witness',lambda e=e: verify_witness(e['searchWitness'],self.commit,inv['normalizedReference'].split('#')[0],source_passage))
            if e['disposition']=='phase9-row-flip':check('row-semantics',lambda e=e:e['timing']=='Phase 9' and e['diffHunk'] is None and e['target'] is None and 'row' in e['reason'].lower() and bool(e['dependency']))
            if e['disposition']=='preserve':
                check('preserve-state',lambda e=e:e['timing']=='none' and e['diffHunk'] is None)
                check('retiring-preserve-wording',lambda e=e,inv=inv:not (inv['normalizedReference'].startswith(('docs/specs/','docs/architect/')) and re.search(r'\bretained\b',e['reason'],re.I)))
            witness=e.get('searchWitness') or r['checks']['coverage'].get('resolutionSearches',{}).get(eid)
            if witness:
                groups=witness.get('hitGroups',[])
                check('distinct-hit-assessments',lambda groups=groups:all(g.get('category') in HIT_CATEGORIES for g in groups))
            if e['target']:
                check('target-tree',lambda e=e:e['target'] in self.tree|self.dirs)
                check('alias-destination',lambda e=e:not e['target'].startswith(('alias:','lookup:')) and e['target'] not in self.aliases and not e['target'].startswith(('docs/specs/','docs/architect/')))
            if e['disposition']!='patch':continue
            h=e['diffHunk'];used_hunks.add(h)
            check('hunk-binding',lambda h=h:h in [x.splitlines()[0] for x in hunks(r['diff'])])
            check('authority-timing',lambda e=e:e['timing'] in ['now','Phase 9'] and (not f.startswith(('docs/specs/','docs/architect/')) or e['timing']=='Phase 9') and r['checks']['relativeResolution'][e['edgeId']]['authorityStatus']==('current-switchboard' if e['timing']=='now' else 'cutover-patch-only'))
            check('writer-boundary',lambda e=e:r['checks']['coverage']['writerTrace'][e['edgeId']]=='read-only citation; no writer/default-root/schema/identity change' and not e['blockedReason'])
            check('source-region',lambda e=e:related_header(before,e['sourceSpans'][0]['line']) or not history_at(before,e['sourceSpans'][0]['line'],f))
            target=e['target']; anchor=e['anchor']
            def target_anchor(e=e,inv=inv):
                proof=r['checks']['anchors'][e['edgeId']]
                if e['target'] in self.dirs:
                    assert e['anchor'] is None and e['target']!=f
                    assert proof['targetCommit']==self.commit and proof['targetTreeOid']==git('rev-parse',self.commit+':'+e['target']).decode().strip()
                    return
                t=blob(self.commit,e['target']).decode(); aa=anchors(self.commit,e['target']) if e['anchor'] else []
                hits=[a for a in aa if (a['githubSlug'] if e['matchedExpression'].startswith(('[','![')) else a['anchor'])==e['anchor']]
                assert not e['anchor'] or hits
                line=hits[0]['startLine'] if hits else 1
                assert not resolver.carriage(t,line,e['target'])
                assert e['target']!=f
                proof=r['checks']['anchors'][e['edgeId']]
                assert proof['targetCommit']==self.commit and proof['targetDigest']==sha(t)
                locators=proof.get('sourceLocatorTokens',inv['locatorTokens'])
                if locators:
                    assert e['anchor'] and proof.get('passage') and proof['passage'] in t
                    start=hits[0]['startLine']; lines=t.splitlines(); heading=re.match(r'^(#+) ',lines[start-1]); level=len(heading[1]) if heading else 6
                    end=next((i for i in range(start,len(lines)) if re.match(r'^#{1,'+str(level)+r'} ',lines[i])),len(lines))
                    assert proof['passage'] in '\n'.join(lines[start-1:end])
                    assert all(tok.lstrip('§') in proof['passage'] or (proof.get('locatorCorrespondence',{}).get('source')==tok and proof['locatorCorrespondence'].get('target') in proof['passage'] and proof['locatorCorrespondence'].get('reason')) for tok in locators)
            check('anchor-carriage-locator',target_anchor)
            def precise_anchor(e=e,inv=inv):
                if not e['anchor'] or e['target'] not in self.tree:return
                aa=heading_sections(self.commit,e['target'])
                current=next(a for a in aa if e['anchor'] in (a['anchor'],a['githubSlug']))
                if current['level']!=1:return
                proof=r['checks']['anchors'][e['edgeId']]
                terms=proof.get('sourceLocatorTokens',inv.get('locatorTokens',[]))
                # Any narrower holder makes the title an imprecise locator anchor.
                assert not any(a['level']>1 and any(locator_present(tok,a['body']) for tok in terms) for a in aa), 'file H1 hides a narrower locator holder'
            check('anchor-precision',precise_anchor)
            check('anchor-from-evidence',lambda e=e:evidence_anchor(self.commit,e,r['checks']['anchors'][e['edgeId']]))
            def description(e=e):
                d=r['checks']['coverage']['descriptionTruth'][e['edgeId']]
                assert d['sourcePassage']==source_passage and d['targetCommit']==self.commit
                assert d['adjacentPassage']==adjacent_passage(before,e['sourceSpans'])
                assert d['target']==e['target'] and d['targetDigest']==sha(blob(self.commit,e['target']))
                assert set(d['comparisons'])=={'counts','ports','defaults','verbFileLists','versions','shippedStatus'}
                assert all(x.get('verdict') in ('matches','not-asserted') and x.get('note') for x in d['comparisons'].values())
                assert d['assessment']
                target_lines=blob(self.commit,e['target']).decode().splitlines()
                assert d['targetEvidence'] and all(x['text']==target_lines[x['line']-1] for x in d['targetEvidence'])
            check('description-truth-record',description)
            def locator_review(e=e):
                proof=r['checks']['anchors'][e['edgeId']]
                terms=resolver.tokens(source_passage)
                # A locator-free area pointer is distinguished from nearby, unrelated locators
                # by the explicit source binding; translated headings require exact correspondence.
                terms=proof.get('sourceLocatorTokens',terms)
                if not terms:return
                passage=proof.get('passage','')
                if not any(tok.lstrip('§').casefold() in passage.casefold() for tok in terms):
                    correspond=proof.get('locatorCorrespondence',{})
                    assert correspond.get('source') in terms and correspond.get('target') in passage and correspond.get('reason'),'patch locator absent from target passage: review required'
            check('patch-locator-review',locator_review)
            if not target: continue
            entry=r['checks']['relativeResolution'].get(eid,{})
            replacement=entry.get('replacement','')
            check('label-form',lambda e=e,replacement=replacement:replacement==form(e['matchedExpression'],f,e['target'],e['anchor']))
            def resolution(e=e,replacement=replacement,entry=entry):
                m=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',replacement,re.S); dest=m[1] if m else replacement
                assert normalize(f,dest)==e['target'] and entry['resolvedTarget']==e['target'] and entry['targetCommit']==self.commit
            check('relative-resolution',resolution)
            # Prevent a Related list patch becoming an existing sibling entry.
            def related(e=e):
                lines=before.splitlines();n=e['sourceSpans'][0]['line'];start=max(0,n-35);pre='\n'.join(lines[start:n])
                if 'Related:' not in pre:return
                block=pre.split('Related:')[-1].strip('\n')
                # Related ends at its blank line, fence, or heading; it is not a 35-line window.
                if any(not l.strip() or l.startswith(('```','~~~','#')) for l in block.splitlines()):return
                rest=block+'\n'+'\n'.join(lines[n:n+20]).split('\n\n')[0].split('```')[0]
                assert e['target'] not in rest
            check('related-duplicate',related)
            bs=bounds(before,e['sourceSpans'])
            check('complete-unit',lambda bs=bs:len(bs)==1)
            if len(bs)==1:changes.append((bs[0][0],bs[0][1],replacement))
        check('orphan-hunk',lambda:used_hunks=={x.splitlines()[0] for x in hunks(r['diff'])})
        unique=sorted(set(changes));after=before
        check('overlap',lambda:all(unique[i][1]<=unique[i+1][0] for i in range(len(unique)-1)))
        for a,b,s in reversed(unique):after=after[:a]+s+after[b:]
        check('diff-correspondence',lambda:make_diff(f,before,after)==r['diff'])
        if r['diff'] and apply:
            def apply_check():
                scratch=pathlib.Path('/tmp/fgos-work');scratch.mkdir(exist_ok=True)
                with tempfile.TemporaryDirectory(prefix='step03-',dir=scratch) as td:
                    env={k:v for k,v in ENV.items() if not k.startswith(('GIT_', 'FGOS_'))};env['GIT_CONFIG_NOSYSTEM']='1';env['GIT_CONFIG_GLOBAL']='/dev/null'
                    env['GIT_CEILING_DIRECTORIES']=td
                    path=pathlib.Path(td)/f;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(before.encode())
                    run=subprocess.run(['git','-C',td,'apply','--check','-'],input=r['diff'].encode(),capture_output=True,env=env)
                    assert run.returncode==0,run.stderr.decode()
            check('git-apply',apply_check)
        return failures
    def all(self,rs):
        fail=[];expected=population()
        if (ROOT/REL/'step-02j-census-maps-portals-prose.json').read_bytes()!=blob(self.commit,str(REL/'step-02j-census-maps-portals-prose.json')):fail.append({'check':'inventory-pin'})
        if collections.Counter(r['file'] for r in rs)!=collections.Counter(expected.keys()):fail.append({'check':'file-coverage'})
        for r in rs:
            if r['reviewSet']!='batch-'+expected.get(r['file'],'?'):fail.append({'check':'set-membership','file':r['file']})
            fail.extend(self.check_record(r))
        review=[]
        for r in rs:
            source=blob(self.commit,r['file']).decode()
            for e in r['edges']:
                if e['disposition']!='patch' or e['target'] not in self.tree:continue
                proof=r['checks']['anchors'].get(e['edgeId'],{})
                terms=resolver.tokens(resolver.passage(source,e['sourceSpans']))
                passage=proof.get('passage',blob(self.commit,e['target']).decode())
                if terms and not any(t.lstrip('§').casefold() in passage.casefold() for t in terms):
                    review.append({'file':r['file'],'edgeId':e['edgeId'],'check':'patch-locator-review',
                                   'locatorTokens':terms,'reason':'No physical-passage locator token occurs in the target passage; independently confirm translated heading or sibling-locator scope.',
                                   'recordedScopeReason':proof.get('locatorScopeReason'),'correspondence':proof.get('locatorCorrespondence')})
        return {'authorCommit':self.commit,'files':len(rs),'edges':sum(edge_count(r) for r in rs),'failures':fail,'failureCount':len(fail),'locatorReviewFlags':review}

def manifest_view(rs,commit):
    files=[]
    for r in rs:
        data=(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n').encode()
        files.append({'file':r['file'],'set':r['reviewSet'],'sourceBytes':len(blob(commit,r['file'])),'digest':r['digest'],'inventoryFileDigest':r['inventoryFileDigest'],'diffSha256':sha(r['diff']),'recordSha256':sha(data),'recordBytes':len(data),'retiresWithTree':bool(r.get('retiresWithTree')),'edgeCount':edge_count(r),'dispositions':dict(collections.Counter(e['disposition'] for e in r['edges']))})
    return {'authorInputCommit':commit,'inventoryInputCommit':INVENTORY,'files':files,'sets':[selected(rs,commit,b) for b in SETS]}

def verify_manifest(rs,commit,manifest):
    expected=manifest_view(rs,commit)
    fail=[k for k,v in expected.items() if manifest.get(k)!=v]
    record_files=[{'path':str(REL/'step-03-records'/('batch-'+b+'.jsonl')),'sha256':sha((ROOT/REL/'step-03-records'/('batch-'+b+'.jsonl')).read_bytes())} for b in SETS]
    if manifest.get('recordFiles')!=record_files:fail.append('recordFiles')
    return fail

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--author-commit',required=True);ap.add_argument('--select',action='store_true');ap.add_argument('--records',type=pathlib.Path);args=ap.parse_args()
    commit=git('rev-parse',args.author_commit+'^{commit}').decode().strip()
    assert commit==args.author_commit,'Supply the full pinned author commit'
    rs=[json.loads(x) for x in args.records.read_text().splitlines()] if args.records else records()
    out={'sets':[selected(rs,commit,b) for b in SETS]} if args.select else Checker(commit).all(rs)
    if not args.select and not args.records:
        manifest=json.loads((ROOT/REL/'step-03-pilot-r5-manifest.json').read_text())
        for key in verify_manifest(rs,commit,manifest):out['failures'].append({'check':'manifest-freeze','field':key})
        out['failureCount']=len(out['failures'])
    print(json.dumps(out,ensure_ascii=False,indent=2));return bool(out.get('failureCount',0))
if __name__=='__main__':raise SystemExit(main())
