#!/usr/bin/env python3
"""Pinned-tree record checks. All Git mutations are confined to disposable /tmp repos.
No consumer edit, production resolver, or second anchor slugger is implemented here.
"""
import argparse, collections, difflib, functools, hashlib, json, math, os, pathlib, posixpath, re, subprocess, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[4]
REL = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
INVENTORY = '1a0f61ac53433292e08fb378ebbb6c1c72fd3b74'
SETS = ('001', '002', '040', '041')
FIELDS = {'file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','diff','edges','checks','reviewSet','authoringRules'}
EDGE_FIELDS = {'edgeId','sourceSpans','matchedExpression','disposition','diffHunk','reason','target','anchor','timing','blockedReason','dependency'}
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
    group=[r for r in rs if r['reviewSet']=='batch-'+batch]
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

class Checker:
    def __init__(self,commit):
        self.commit=commit;self.entries={e['edgeId']:e for e in census()['entries']};self.files={f['path']:f for f in census()['files']}
        alias=json.loads(blob(commit,'plans/260925-documentation-authority-unification/alias-table.json'))
        self.aliases={x.get('id',x.get('aliasId','')) for x in alias.get('entries',[])}|{x.get('fromPath','') for x in alias.get('entries',[])}
        self.tree=set(git('ls-tree','-r','--name-only',commit).decode().splitlines())
        self.dirs={str(pathlib.PurePosixPath(p).parent) for p in self.tree}
        self.dirs.update('/'.join(p.split('/')[:i]) for p in self.tree for i in range(1,len(p.split('/'))))
    def check_record(self,r,apply=True):
        failures=[]
        def check(name,fn):
            try: assert fn() is not False
            except (AssertionError,KeyError,ValueError,IndexError,TypeError,subprocess.CalledProcessError) as ex: failures.append({'file':r.get('file'),'check':name,'detail':str(ex)[:300]})
        check('schema',lambda: set(r)==FIELDS and all(set(e)==EDGE_FIELDS for e in r['edges']) and isinstance(r['diff'],str) and all(isinstance(r['checks'][k],dict) for k in ['coverage','anchors','relativeResolution','labelForm']))
        f=r['file']; before=blob(self.commit,f).decode(); old=blob(INVENTORY,f).decode()
        check('digest',lambda:r['authorInputCommit']==self.commit and r['inventoryInputCommit']==INVENTORY and r['digest']==sha(before) and r['inventoryFileDigest']==sha(old)==self.files[f]['sha256'])
        expected=self.files[f]['edgeIds'];actual=[e['edgeId'] for e in r['edges']]
        check('projection-source',lambda:not r['diff'] or (pathlib.PurePosixPath(f).name not in ['AGENTS.md','CLAUDE.md'] and f!='README.md' and 'fgos:instruction-projection:start' not in before and not re.search(r'^Do not edit:\s*true',before[:6000],re.M|re.I)))
        check('edge-coverage',lambda:collections.Counter(expected)==collections.Counter(actual)==collections.Counter(r['inventoryEdgeIds']) and len(actual)==len(set(actual)))
        changes=[]; used_hunks=set()
        for e in r['edges']:
            eid=e['edgeId']; inv=self.entries.get(eid)
            if not inv: continue
            check('source-span',lambda e=e:spans_text(before,e['sourceSpans'])==e['matchedExpression'])
            def correspondence(e=e,inv=inv):
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
            if e['disposition']=='parked':check('parked-state',lambda e=e:bool(e['blockedReason']) and bool(e['dependency']) and e['timing']=='none' and e['diffHunk'] is None and e['target'] is None)
            if e['disposition']=='phase9-row-flip':check('row-semantics',lambda e=e:e['timing']=='Phase 9' and e['diffHunk'] is None and e['target'] is None and 'row' in e['reason'].lower() and bool(e['dependency']))
            if e['disposition']=='preserve':check('preserve-state',lambda e=e:e['timing']=='none' and e['diffHunk'] is None)
            if e['target']:
                check('target-tree',lambda e=e:e['target'] in self.tree|self.dirs)
                check('alias-destination',lambda e=e:not e['target'].startswith(('alias:','lookup:')) and e['target'] not in self.aliases and not e['target'].startswith(('docs/specs/','docs/architect/')))
            if e['disposition']!='patch':continue
            h=e['diffHunk'];used_hunks.add(h)
            check('hunk-binding',lambda h=h:h in [x.splitlines()[0] for x in hunks(r['diff'])])
            check('authority-timing',lambda e=e:e['timing'] in ['now','Phase 9'] and (not f.startswith(('docs/specs/','docs/architect/')) or e['timing']=='Phase 9') and r['checks']['relativeResolution'][e['edgeId']]['authorityStatus']==('current-switchboard' if e['timing']=='now' else 'cutover-patch-only'))
            check('writer-boundary',lambda e=e:r['checks']['coverage']['writerTrace'][e['edgeId']]=='read-only citation; no writer/default-root/schema/identity change' and not e['blockedReason'])
            check('source-region',lambda e=e:not history_at(before,e['sourceSpans'][0]['line'],f))
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
                assert not history_at(t,line,e['target'])
                assert e['target']!=f
                proof=r['checks']['anchors'][e['edgeId']]
                assert proof['targetCommit']==self.commit and proof['targetDigest']==sha(t)
                if inv['locatorTokens']:
                    assert e['anchor'] and proof.get('passage') and proof['passage'] in t
                    start=hits[0]['startLine']; lines=t.splitlines(); heading=re.match(r'^(#+) ',lines[start-1]); level=len(heading[1]) if heading else 6
                    end=next((i for i in range(start,len(lines)) if re.match(r'^#{1,'+str(level)+r'} ',lines[i])),len(lines))
                    assert proof['passage'] in '\n'.join(lines[start-1:end])
                    assert all(tok.lstrip('§') in proof['passage'] for tok in inv['locatorTokens'])
            check('anchor-carriage-locator',target_anchor)
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
                rest=pre.split('Related:')[-1]+'\n'+'\n'.join(lines[n:n+20]).split('```')[0]
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
                    subprocess.run(['git','init','-q',td],check=True,env=env)
                    path=pathlib.Path(td)/f;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(before.encode())
                    subprocess.run(['git','-C',td,'add','--',f],check=True,env=env)
                    run=subprocess.run(['git','-C',td,'apply','--check','--cached','-'],input=r['diff'].encode(),capture_output=True,env=env)
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
        return {'authorCommit':self.commit,'files':len(rs),'edges':sum(len(r['edges']) for r in rs),'failures':fail,'failureCount':len(fail)}

def manifest_view(rs,commit):
    files=[]
    for r in rs:
        data=(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n').encode()
        files.append({'file':r['file'],'set':r['reviewSet'],'sourceBytes':len(blob(commit,r['file'])),'digest':r['digest'],'inventoryFileDigest':r['inventoryFileDigest'],'diffSha256':sha(r['diff']),'recordSha256':sha(data),'recordBytes':len(data),'edgeCount':len(r['edges']),'dispositions':dict(collections.Counter(e['disposition'] for e in r['edges']))})
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
        manifest=json.loads((ROOT/REL/'step-03-pilot-manifest.json').read_text())
        for key in verify_manifest(rs,commit,manifest):out['failures'].append({'check':'manifest-freeze','field':key})
        out['failureCount']=len(out['failures'])
    print(json.dumps(out,ensure_ascii=False,indent=2));return bool(out.get('failureCount',0))
if __name__=='__main__':raise SystemExit(main())
