#!/usr/bin/env python3
"""Read-only L12-30 candidate search at an explicit Git pin; never selects authority.
Uses repository listAnchors for coordinates. Results include rejected carriage hits.
"""
import argparse, functools, hashlib, json, os, pathlib, re, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[4]
ROOTS=('docs/platform','docs/knowledge','docs/reference','docs/tutorials')
ALIAS='plans/260925-documentation-authority-unification/alias-table.json'
ENV=dict(os.environ);ENV.pop('CLAUDE_CODE_SESSION_ID',None)
def git(*args):return subprocess.check_output(['git','-C',str(ROOT),*args],env=ENV,stderr=subprocess.PIPE)
@functools.lru_cache(None)
def text(pin,path):return git('show',pin+':'+path).decode()

def carriage(body,line,path=''):
    if '/history/' in path or re.search(r'^Document type:\s*History',body[:7000],re.M|re.I):return True
    # L12-30(3): candidate status alone does not imply snapshot carriage.
    if re.search(r'Source snapshot retained|Full source retained',body[:7000],re.I):return True
    # L12-30's 08187/08188 pairing treats whole-source Architecture carriers alike.
    # Area-spec candidate metadata alone remains valid per L12-26 (including System Overview).
    header=body[:7000]
    if (re.search(r'^Document type:\s*Architecture',header,re.M) and
        re.search(r'^Writer type:\s*Agent carriage',header,re.M) and
        re.search(r'^Purpose:\s*Preserve the complete',header,re.M)):return True
    stack=[];framed=False
    for n,s in enumerate(body.splitlines(),1):
        if n>line:break
        m=re.match(r'^(#{1,6})\s+(.+)',s)
        if m:
            level=len(m[1]);stack=[x for x in stack if x[0]<level];stack.append((level,m[2]));framed=False
        if re.search(r'retained verbatim.*(?:non.authority history|not navigation)',s,re.I):framed=True
    return framed or any(re.search(r'literal snapshot|historical source section|source carriage|retained.*source (?:detail|material)|full source retained',s,re.I) for _,s in stack)

def passage(body,spans):
    lines=body.splitlines();return '\n'.join(lines[i-1] for i in sorted({s['line'] for s in spans}))

def tokens(passage):
    # All tokens in the physical passage, rather than advisory census locator hints.
    ts=re.findall(r'\b(?:RUL\d+[a-z]?|D-ADR\d+|ADR-\d+)\b|(?<![\w/-])00\d{2}(?![\w/-])',passage)
    ts+=re.findall(r'["“]([^"”\n]{3,160})["”]',passage)
    # Explicit section locators are useful even when the heading was translated.
    ts += [ ('§'+v.strip() if re.match(r'^\d',v.strip()) else v.strip()) for v in re.findall(r'§([^`,;()\n]+?)(?=\s+(?:§|và)|[,;()`]|$)',passage)]
    return sorted({s.strip() for s in ts if s.strip()})

@functools.lru_cache(None)
def anchor_list(pin,path):
    js="import {listAnchors} from './scripts/list-doc-anchors.mjs'; let s=''; for await(const x of process.stdin)s+=x; console.log(JSON.stringify(listAnchors(s)));"
    assert (ROOT/'scripts/list-doc-anchors.mjs').read_bytes()==git('show',pin+':scripts/list-doc-anchors.mjs')
    body=text(pin,path).encode()
    api=git('show',pin+':scripts/list-doc-anchors.mjs')+git('show',pin+':scripts/generate-doc-inventory.mjs')
    cache=pathlib.Path('/tmp/fgos-work/step03-anchor-cache');cache.mkdir(parents=True,exist_ok=True)
    entry=cache/(hashlib.sha256(api+body).hexdigest()+'.json')
    if entry.exists():return json.loads(entry.read_text())
    result=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,input=body,env=ENV))
    entry.write_text(json.dumps(result));return result

def coordinate(pin,path,line):
    if not path.endswith('.md'):return {'anchor':None,'githubSlug':None}
    aa=[a for a in anchor_list(pin,path) if a['startLine']<=line]
    a=max(aa,key=lambda a:a['startLine']) if aa else {}
    return {'anchor':a.get('anchor'),'githubSlug':a.get('githubSlug')}

@functools.lru_cache(None)
def query(pin,term):
    run=subprocess.run(['git','-C',str(ROOT),'grep','-n','-I','-F','-e',term,pin,'--',*ROOTS],capture_output=True,env=ENV)
    if run.returncode not in (0,1):raise RuntimeError(run.stderr.decode())
    hits=[]
    for row in run.stdout.decode().splitlines():
        path,n,content=row[len(pin)+1:].split(':',2);n=int(n)
        hits.append({'file':path,'line':n,'text':content,'carriage':carriage(text(pin,path),n,path),**coordinate(pin,path,n)})
    return {'query':term,'hitCount':len(hits),'liveHitCount':sum(not h['carriage'] for h in hits),'hits':hits}

@functools.lru_cache(None)
def aliases(pin,legacy):
    matches=[]
    def walk(obj,source):
        if isinstance(obj,dict):
            if legacy in obj.get('aliases',[]) or obj.get('fromPath')==legacy or obj.get('legacyPath')==legacy:
                matches.append({'source':source,'entry':obj})
            for val in obj.values():walk(val,source)
        elif isinstance(obj,list):
            for val in obj:walk(val,source)
    for source in (ALIAS,'docs/doc-registry.json'):walk(json.loads(text(pin,source)),source)
    return matches

def resolve(pin,legacy,source_passage):
    # Always search the literal path too; tokenless missing-target parks still have a query.
    terms=sorted(set([legacy]+tokens(source_passage)))
    return {'pin':pin,'roots':list(ROOTS),'legacyPath':legacy,'passage':source_passage,
            'aliasLookups':[{'source':p,'matches':[a['entry'] for a in aliases(pin,legacy) if a['source']==p]} for p in (ALIAS,'docs/doc-registry.json')],
            'queries':[query(pin,t) for t in terms]}

def witness(result,assessment):
    return {**{k:v for k,v in result.items() if k!='queries'},
            'queries':[{k:v for k,v in q.items() if k!='hits'} | {'hitsSha256':hashlib.sha256(json.dumps(q['hits'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()} for q in result['queries']],
            'assessment':assessment,
            'hitGroups':[{'query':q['query'],
                          'carriageCount':q['hitCount']-q['liveHitCount'],
                          'liveCount':q['liveHitCount'],
                          'carriageAssessment':'L12-30(3): source snapshot/history carriage is not a patch target.',
                          'liveAssessment':assessment} for q in result['queries']]}


def verify(recorded,pin,legacy,source_passage):
    expected=witness(resolve(pin,legacy,source_passage),recorded.get('assessment'))
    actual_groups=recorded.get('hitGroups',[])
    assert len(actual_groups)==len(expected['hitGroups']),'missing hit group'
    for actual,want in zip(actual_groups,expected['hitGroups']):
        assert isinstance(actual.get('liveAssessment'),str) and actual['liveAssessment'].strip()
        assert isinstance(actual.get('carriageAssessment'),str) and actual['carriageAssessment'].strip()
        for key in ('query','carriageCount','liveCount'):assert actual[key]==want[key]
    expected['hitGroups']=actual_groups
    assert recorded==expected,'search witness differs from pinned replay'
    assert isinstance(recorded.get('assessment'),str) and recorded['assessment'].strip(),'missing per-hit usability assessment'

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--pin',required=True);ap.add_argument('--file',required=True);ap.add_argument('--edge-id',required=True);a=ap.parse_args()
    base=pathlib.Path(__file__).resolve().parent
    entries=json.loads((base/'step-02j-census-maps-portals-prose.json').read_text())['entries']
    e=next(e for e in entries if e['edgeId']==a.edge_id);assert e['consumerPath']==a.file
    print(json.dumps(resolve(a.pin,e['normalizedReference'].split('#')[0],passage(text(a.pin,a.file),e['physicalSpans'])),ensure_ascii=False,indent=2))
