#!/usr/bin/env python3
"""Plan-local read-only census/parser. JSON goes to stdout; never edits consumers.
Usage: python3 step-02h-parser.py > /tmp/fgos-work/step-02h-data.json
The packager is a separate, plan-scoped authoring operation.
"""
import sys
sys.dont_write_bytecode=True
import collections, copy, hashlib, json, math, posixpath, re, subprocess
from pathlib import Path
R=Path(__file__).resolve().parent
ROOT=R.parents[3]
def sha(b): return hashlib.sha256(b).hexdigest()
def encoded(x): return json.dumps(x,ensure_ascii=False,sort_keys=True).encode()
def load(n): return json.loads((R/n).read_text())
# All consumer bytes, population and target existence come from one explicit tree.
# Plan artifacts are immutable inputs on disk; no project state is opened.
INPUT_REF=sys.argv[sys.argv.index('--input-commit')+1] if '--input-commit' in sys.argv else 'HEAD'
INPUT_COMMIT=subprocess.check_output(['git','rev-parse','--verify',INPUT_REF+'^{commit}'],cwd=ROOT,text=True).strip()
TREE={}
for record in subprocess.check_output(['git','ls-tree','-r','-t','-z',INPUT_COMMIT],cwd=ROOT).split(b'\0'):
    if record:
        meta,path=record.split(b'\t',1);mode,kind,oid=meta.decode().split()
        TREE[path.decode()]={'kind':kind,'oid':oid}
def exists(p):return p.rstrip('/') in TREE
def is_file(p):return TREE.get(p.rstrip('/'),{}).get('kind')=='blob'
def is_dir(p):return TREE.get(p.rstrip('/'),{}).get('kind')=='tree'
BLOBS={}
BATCH=subprocess.Popen(['git','cat-file','--batch'],cwd=ROOT,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
def read(p):
    assert not any(x in p.split('/') for x in ('.fgos','.bee')),p
    oid=TREE[p]['oid']
    if oid not in BLOBS:
        BATCH.stdin.write((oid+'\n').encode());BATCH.stdin.flush()
        header=BATCH.stdout.readline().split();assert header[1]==b'blob',p
        BLOBS[oid]=BATCH.stdout.read(int(header[2]));assert BATCH.stdout.read(1)==b'\n'
    return BLOBS[oid]
def expand(s):
    m=re.search(r'\{([^{}]+)\}',s)
    if not m or ',' not in m[1]: return [s]
    return [v for a in m[1].split(',') for v in expand(s[:m.start()]+a.strip()+s[m.end():])]
def norm(path,ref):
    ref=ref.strip('`').rstrip(',;:')
    if not ref.endswith('...'):ref=ref.rstrip('.')
    if ref.startswith('<') and ref.endswith('>'):ref=ref[1:-1]
    if ref.startswith('repo/'): ref=ref[5:]
    if ref.startswith('/docs/'):ref=ref[1:]
    if ref.startswith(('http://','https://','mailto:','#')):return ref
    if ref.startswith(('docs/','plans/','src/','test/','scripts/','core/','domains/')): return ref
    resolved=posixpath.normpath(posixpath.join(posixpath.dirname(path),ref))
    return resolved+('/' if ref.endswith('/') and not resolved.endswith('/') else '')
ROOTFILES={'docs/README.md','docs/architecture-map.md','docs/architecture-manifest.json','docs/backlog.md','docs/coexistence.md','docs/distribution-vision.md','docs/doc-governance.md','docs/doc-registry.md','docs/id-systems-audit.md','docs/io-contract.md','docs/operator-runbook-herdr-cockpit.md','docs/platform-foundations.md','docs/reading-map.md','docs/routing-handoff-contract.md','docs/work-item-lifecycle-vision.md'}
def relevant(ref):
    p=ref.split('#')[0].split(':')[0]
    return p in ROOTFILES or bool(re.match(r'^docs/(specs|architect|ui-spec|contracts|history)(/|$)',p)) or '/agent-coordination/verification/' in p
# A reference token is consumed whole. Braces and placeholders are part of it.
TOKEN=re.compile(r'(?<![\w/.-])(?:repo/)?(?:/?docs/|(?:\.\./)+(?:[\w.-]+/)*|\./)[^\s`\"\'|\[\]()]+')
LINK=re.compile(r'!?\[([^\]\n]*)\]\(\s*(<?[^\s)]+>?)\s*(?:[\"\'][^\n]*?[\"\']\s*)?\)')
def code_relative_reason(raw,line,before,kind):
    if kind=='markdown-link' or not raw.startswith(('./','../')):return None
    if (re.search(r'(?:import|require)\s*\(\s*[\"\']?$',before) or re.search(r'\bnode\s+-e\b',line)):
        return 'Code import/require/node -e specifier; cwd/module semantics, not a documentation reference'
    if re.search(r'[\"\'][^\"\'\n]*[\"\']\s*:\s*[\"\']?$',before) or re.search(r'(?:\b(?:config|JSON)\s+(?:value|example)|package\.json|inline example)',before.split('\n')[-1],re.I) or re.fullmatch(r'\./[A-Za-z](?:[.,;:]?)',raw):
        return 'Code config/JSON value or inline relative example; not a documentation reference'
    return None

def units(path,text,prior=()):
    """Links are indivisible, then whole plain/code tokens outside link spans.
    Newline in an inline-code reference is joined only if both ends are path-like.
    Fenced JS and script blocks are not documentation path populations.
    """
    lines=text.splitlines(keepends=True); offsets=[];off=0
    for line in lines:offsets.append(off);off+=len(line)
    import bisect
    def loc(a,b):
        start=bisect.bisect_right(offsets,a)-1;stop=bisect.bisect_right(offsets,max(a,b-1))-1
        return [{'line':i+1,'columnStart':max(a,offsets[i])-offsets[i]+1,'columnEndExclusive':min(b,offsets[i]+len(lines[i].rstrip('\r\n')))-offsets[i]+1,'text':text[max(a,offsets[i]):min(b,offsets[i]+len(lines[i].rstrip('\r\n')))]} for i in range(start,stop+1)]
    masked=[];fence=None;script=False
    for i,line in enumerate(lines):
        mark=re.match(r'^\s*(`{3,}|~{3,})(.*)',line)
        js=bool(fence and fence[1] in ('js','javascript','jsx','typescript','ts'))
        if mark:
            if fence and mark[1][0]==fence[0][0]:fence=None
            elif not fence:fence=(mark[1],mark[2].strip().lower())
            js=js or bool(fence and fence[1] in ('js','javascript','jsx','typescript','ts'))
        if '<script' in line.lower():script=True
        if js or script:masked.append((offsets[i],offsets[i]+len(line),'JavaScript/script code is not a documentation reference'))
        if '</script>' in line.lower():script=False
    occupied=[];out=[];excluded=[]
    inline=[(m.start(),m.end()) for m in re.finditer(r'(?<!`)`[^`\n]+`(?!`)',text)]
    def add(a,b,raw,kind,label=None,dest=None):
        spans=loc(a,b)
        refs=[norm(path,x) for x in expand(dest if dest is not None else raw.replace('\n','').replace('\r',''))]
        forced=any(any(z['line']==e.get('line') and z['columnStart']<e.get('columnEndExclusive',0) and z['columnEndExclusive']>e.get('columnStart',0) for z in spans) for e in prior)
        relative_code=code_relative_reason(raw,lines[spans[0]['line']-1],text[max(0,a-100):a],kind)
        if not any(relevant(x) for x in refs) and not forced and not relative_code:return
        item={'physicalSpans':spans,'matchedExpression':text[a:b],'references':refs,'syntax':kind}
        if label is not None:item.update(label=label,destination=dest,pathTextLabel=bool(TOKEN.fullmatch(label.strip('`')) or label.strip('`')==dest))
        reason=next((why for x,y,why in masked if a<y and b>x),None)
        if reason and (raw.startswith(('docs/','repo/docs/')) or kind=='markdown-link' and dest.startswith(('docs/','repo/docs/'))):
            item['embeddedCodeLiteral']=True;reason=None
        if kind!='markdown-link' and raw.startswith(('./','../')):
            physical=lines[spans[0]['line']-1]
            before=text[max(0,a-100):a]
            if re.search(r'(?:import|require)\s*\(\s*[\"\']?$',before) or re.search(r'\bnode\s+-e\b',physical):
                reason='Code import/require/node -e specifier; cwd/module semantics, not a documentation reference'
        if relative_code:reason=relative_code
        if reason:item['reason']=reason;excluded.append(item)
        else:out.append(item)
    for m in LINK.finditer(text):
        if any(a<=m.start()<b for a,b in inline):continue
        occupied.append((m.start(),m.end()))
        add(m.start(),m.end(),m[0],'markdown-link',m[1],m[2].strip('<>'))
    # Inline code may wrap physically; only a no-whitespace path continuation joins.
    for m in re.finditer(r'(?<!`)`([^`]+)`(?!`)',text):
        if '\n' not in m[1] or any(a<=m.start()<b for a,b in occupied):continue
        parts=m[1].splitlines()
        if len(parts)>3 or any(not x or re.search(r'\s',x) for x in parts):continue
        joined=''.join(parts)
        if not TOKEN.fullmatch(joined):continue
        occupied.append((m.start(1),m.end(1)));add(m.start(1),m.end(1),joined,'wrapped-token')
    for m in TOKEN.finditer(text):
        if any(a<=m.start()<b or m.start()<=a<m.end() for a,b in occupied):continue
        raw=m[0].rstrip(',;:')
        if not raw.endswith('...'):raw=raw.rstrip('.')
        # A comma separates plain prose tokens, except inside a brace group.
        depth=0;end=0
        for c in raw:
            if c=='{':depth+=1
            if c=='}':depth-=1
            if c==',' and depth==0:break
            end+=1
        raw=raw[:end]
        add(m.start(),m.start()+len(raw),raw,'token')
    return sorted(out,key=lambda x:(x['physicalSpans'][0]['line'],x['physicalSpans'][0]['columnStart'])),excluded

def block_context(lines,n):
    """Physical paragraph/list item or fenced example, with its introducing paragraph.
    Field-valued examples retain the field name so EVIDENCE_DIR never taints ROSTER_SOURCE.
    """
    i=n-1;section=0;heading='';fence=None;start=i;stop=i+1
    if lines[i].startswith('|'):return {'startLine':n,'endLine':n,'heading':'','text':lines[i]}
    for j in range(i+1):
        h=re.match(r'^\s*#{1,6}\s+(.*)',lines[j])
        if h:section=j;heading=h[1]
        m=re.match(r'^\s*(`{3,}|~{3,})',lines[j])
        if m:
            if fence and m[1][0]==fence[1]:fence=None
            elif not fence:fence=(j,m[1][0])
    if fence:
        start=fence[0]
        stop=next((j+1 for j in range(i+1,len(lines)) if re.match(r'^\s*'+re.escape(fence[1])+r'{3,}',lines[j])),len(lines))
    else:
        while start>section and lines[start-1].strip():
            if start<i and re.match(r'^\s*(?:[-*]|\d+\.)\s+',lines[start]):break
            start-=1
        while stop<len(lines) and lines[stop].strip() and not re.match(r'^\s*(?:#{1,6}|[-*]|\d+\.)\s+',lines[stop]):stop+=1
    # Blank separation before a fenced layout is conventional, not a context boundary.
    intro=start-1
    while intro>section and not lines[intro].strip():intro-=1
    begin=start
    if fence or (intro>=section and lines[intro].rstrip().endswith(':')):
        begin=intro
        while begin>section and lines[begin-1].strip():begin-=1
    for j in range(begin-1,section-1,-1):
        if re.match(r'^[A-Z][A-Z /_-]{4,}$',lines[j].strip()):
            heading=lines[j].strip();break
    return {'startLine':begin+1,'endLine':stop,'heading':heading,'text':'\n'.join(lines[begin:stop])}

def block_writer(ref,source,block):
    if '/verification/' not in ref and not ref.rstrip('/').endswith('/verification'):return False
    field=re.match(r'^\s*([A-Z][A-Z_]+)\s*[:=]',source)
    if field:return field[1] in ('EVIDENCE_DIR','PROOF_DIR','PROOF_ROOT','OUTPUT_DIR')
    return bool(re.search(r'(?:^|\n)\s*(?:[-*]|\d+\.)?\s*(?:Create\s*:|Write\s*:|mkdir\s|test -s\s)|proof artifact path convention|PERSISTENT STATE',block['text']+'\n'+block['heading'],re.I))

def operative_read(source,headercell=''):
    if headercell in ('đọc gì trước','read first','what to read first'):return True
    # Match a reading instruction and its documentation object. Word compounds
    # and incidental prose about reading runtime data are not instructions.
    obj=r'(?:`?(?:docs/|repo/docs/|\.\.?/)|\[)'
    english=bool(re.search(r'\bread(?: and follow)?\s*:?\s+(?:the\s+)?'+obj,source,re.I))
    english=english or bool(re.search(r'\bread it first\b|\bmust be read before\b|\bwhat to read first\?',source,re.I))
    vietnamese=bool(re.search(r'(?:^\s*|[:;]\s*|[-*]\s+)(?:đọc(?: và làm theo)?|SCOPE_DOCS|CONTEXT_DOCS)\s*:?\s*'+obj,source,re.I))
    return english or vietnamese

def overlays():
    """Field-level overlays in explicit chronological precedence, including partial rows."""
    sources=['step-02c-slice1-corrections.json','step-02d-slice2-corrections.json','step-02d-wrapped-citation-rescan.json']
    effective={};controls=[]
    for name in sources:
        d=load(name)
        for e in d.get('entries',[])+d.get('newEdges',[])+d.get('rebindings',[]):
            ident=e.get('edgeId',e.get('id'));s=e.get('supersedes')
            key=(s['file'],s['rowId']) if s else (str(R.relative_to(ROOT)/name),ident)
            if key not in effective:
                if s:
                    base=json.loads(read(s['file']))
                    base=next(x for x in base['entries'] if x.get('edgeId',x.get('id'))==s['rowId'])
                    assert sha(encoded(base))==s['originalRowSha256'],ident
                else:base={}
            else:base=effective[key]
            merged=copy.deepcopy(base)
            for k in e.get('replacesFields',e.keys()):
                if k in e:merged[k]=e[k]
            # Metadata identifies the effective overlay and is never lost on partial rows.
            merged.update({k:v for k,v in e.items() if k not in merged or k in ('supersedes','decision','replacesFields')})
            effective[key]=merged
            controls.append({'controlId':f'overlay-{len(controls)+1:03}','sourceTable':name,'rowId':ident,'baseKey':list(key),'overlaySha256':sha(encoded(e))})
    for c in controls:c['effectiveSha256']=sha(encoded(effective[tuple(c['baseKey'])]))
    return effective,controls

def document_states(text):
    lines=text.splitlines()
    heading='';carriage=False;carriageLevel=None;tableheads=[];front=False;authkey=False;historyBody=False;historyMetadataClosed=False;fence=None
    historyHeader=bool(re.search(r'Document type: History',text[:2000]) and re.search(r'Implementation: (?:Historical source retained|Source snapshot retained)',text[:2000]))
    state={}
    for i,line in enumerate(lines,1):
        if i==1 and line=='---':front=True
        elif front and line=='---':front=False
        if front and re.match(r'^\w[\w_]*:',line):authkey=line.startswith('authoritative_for:')
        mark=re.match(r'^\s*(`{3,}|~{3,})',line)
        if mark:
            if fence and mark[1][0]==fence[0]:
                fence=None
                if historyHeader and not historyMetadataClosed:historyBody=True;historyMetadataClosed=True
            elif not fence:fence=mark[1]
        h=re.match(r'^(#{1,6})\s+(.*)',line) if not fence else None
        if h:
            historyBody=False # L12-24: implicit History body ends at the next heading.
            heading=h[2]
            level=len(h[1])
            if carriageLevel is not None and level<=carriageLevel:carriageLevel=None
            if re.search(r'literal snapshot|verbatim|source snapshot|retained.*source detail|retained.selected.source|conserved.source|conservation carrier|^Restored ',heading,re.I):carriageLevel=level
        if re.search(r'Added in candidate.*complete source units|Added in candidate: verbatim restoration',line,re.I):carriageLevel=len(h[1]) if h else 2
        if re.search(r'Added in candidate: Historical snapshot',line,re.I) and re.search(r'Document type: History',text[:text.find(line)]):carriageLevel=1
        carriage=carriageLevel is not None or historyBody
        if line.startswith('|'):
            # Headers are recognized by their separator, not by a keyword
            # appearing in a data cell. State includes the final table row.
            if i<len(lines) and re.match(r'^\s*\|?\s*:?-{3,}',lines[i]):
                tableheads=[c.strip(' `').lower() for c in line.strip('|').split('|')]
        else:tableheads=[]
        state[i]=(heading,carriage,front and authkey,list(tableheads))
    return state

LOCATOR_CACHE={}
def locator_anchor(ref,dest):
    match=re.search(r':(\d+)(?:-(\d+))?$',ref.split('#')[0])
    if not match:return None
    source=ref.split('#')[0][:match.start()]
    if not is_file(source) or not dest or not is_file(dest):return None
    key=(ref,dest)
    if key not in LOCATOR_CACHE:
        payload={'source':read(source).decode(),'target':read(dest).decode(),'start':int(match[1]),'end':int(match[2] or match[1])}
        js="""import fs from 'node:fs';
import {listAnchors} from './scripts/list-doc-anchors.mjs';
const p=JSON.parse(fs.readFileSync(0,'utf8'));const hs=listAnchors(p.source).filter(a=>a.kind==='heading');
const old=hs.filter(a=>a.startLine<=p.start).at(-1);const next=hs.find(a=>a.startLine>p.start);
const matches=old&&p.start>=1&&p.end>=p.start&&p.end<=p.source.split(String.fromCharCode(10)).length&&(!next||p.end<next.startLine)?listAnchors(p.target).filter(a=>a.kind==='heading'&&a.githubSlug===old.githubSlug):[];
console.log(JSON.stringify(matches.length===1?matches[0].anchor:null));"""
        LOCATOR_CACHE[key]=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,input=json.dumps(payload).encode()))
    return LOCATOR_CACHE[key]

def build():
    old=load('step-02c-census-maps-portals-prose.json');effective,controls=overlays()
    prior={e['edgeId']:effective.get((str(R.relative_to(ROOT)/'step-02c-census-maps-portals-prose.json'),e['edgeId']),e) for e in old['entries']}
    extras=[]
    for (table,ident),e in effective.items():
        if e.get('consumerPath') in {f['path'] for f in old['files']} and ident not in prior and 'line' in e and 'columnStart' in e:
            extras.append(e)
    byfile=collections.defaultdict(list)
    for e in list(prior.values())+extras:byfile[e['consumerPath']].append(e)
    aliases=json.loads((ROOT/'plans/260925-documentation-authority-unification/reports/phase-06/draft-alias-merged-step10.json').read_text())['entries']
    aliasby=collections.defaultdict(list)
    for a in aliases:aliasby[a['fromPath']].append(a)
    # Re-enumerate the tracked population; an old file list cannot prove coverage.
    tracked=sorted(p for p,v in TREE.items() if v['kind']=='blob')
    seed={e['path']:e['category'] for e in load('consumer-inventory.json')['consumerFiles']}
    priorfiles=set()
    for name in ['step-02-census-instructions.json','step-02-census-skills-prompts.json']:
        priorfiles.update(e['path'] if isinstance(e,dict) else e for e in load(name)['files'])
    def payload(path):
        parts=path.split('/')
        return path.startswith(('docs/architect/','docs/platform/')) and 'verification' in parts and len(parts)-parts.index('verification')-1>=2
    selected=[p for p in tracked if p and p not in priorfiles and not payload(p) and not p.startswith('docs/history/') and (p.startswith('docs/') and p.endswith('.md') or seed.get(p)=='reading-maps-portals-and-docs' or p=='README.md')]
    assert set(selected)=={f['path'] for f in old['files']},'Tracked class-3 population changed; enumerate additions/removals before packet generation'
    entries=[];files=[];exclusions=[];reconcile=[];targetpins={}
    switch=read('docs/transitional-switchboard.md');switchlines=switch.decode().splitlines()
    generated={'docs/decisions/index.md':'src/report/decision-index.mjs','docs/knowledge/decisions-index/decision-record.md':'src/report/decision-index.mjs (historical generated snapshot; source does not currently refresh this copy)','docs/doc-registry.md':'src/report/doc-registry.mjs','docs/doc-registry.json':'src/report/doc-registry.mjs','docs/ui-spec/generated/wireframe-v2.html':'.claude/skills/ui-spec/tools/build.mjs', 'docs/backlog.md':'.bee/backlog.jsonl via bee backlog render (state not read)'}
    def owner(ref,read_instruction=False):
        base,sep,fragment=ref.partition('#');base=re.sub(r':\d+(?:-\d+)?$','',base)
        if base.rstrip('/')=='docs/ui-spec' or base.startswith('docs/ui-spec/'):return base,fragment or None,'L12-24 retained UI spec self target'
        if base=='docs/specs/reading-map.md':return 'docs/reading-map.md',None,'L12-21 frozen reading-map decision'
        if read_instruction and base.startswith('docs/specs/'):
            exact='docs/platform/'+posixpath.basename(base)[:-3]+'/spec.md'
            if is_file(exact):return exact,fragment or None,'L12-23 exact spec for operative read'
        if base=='docs/specs/observe.md':return 'docs/platform/observe/spec.md',fragment or None,'L12-22 exact Observe spec'
        legacy='docs/architect/agent-coordination/'
        if base.rstrip('/')==legacy+'verification' or base.startswith(legacy+'verification/'):
            return base.replace(legacy,'docs/platform/agent-coordination/',1),fragment or None,'L12-22 same-path evidence mirror, including directory root'
        if base.startswith('docs/architect/') and is_dir(base):
            direct=base.replace('docs/architect/','docs/platform/',1)
            if is_dir(direct):return direct,fragment or None,'L12-22 same-path directory mirror'
        candidates=aliasby.get(ref) or aliasby.get(base,[])
        pairs={(a['toOwner'],a.get('toAnchor')) for a in candidates if a.get('toOwner')}
        dest,anchor=next(iter(pairs)) if len(pairs)==1 else (None,None)
        if base.startswith('docs/architect/'):
            direct=base.replace('docs/architect/','docs/platform/',1)
            if is_file(direct):return direct,fragment or None,'Exact single retained destination rather than area portal'
        if read_instruction and base.startswith('docs/architect/agent-coordination/'):
            suffix=base[len('docs/architect/agent-coordination/'):]
            exact='docs/platform/agent-coordination/'+suffix
            if is_file(exact):return exact,fragment or None,'Exact retained file for operative read instruction'
            return None,None,'Exact retained read target unresolved; portal substitution forbidden'
        if read_instruction and dest and dest.endswith('/README.md') and not base.endswith('/README.md'):
            return None,None,'Exact operative read target unresolved; area portal cannot replace retained file'
        return dest,anchor,'Unique draft mapping; lookup only' if dest else 'No unique exact mapping'
    for oldfile in old['files']:
        path=oldfile['path'];data=read(path);text=data.decode();lines=text.splitlines();parsed,rejected=units(path,text,byfile[path]);ids=[]
        for e in rejected:
            e.update(consumerPath=path,fileDigest=sha(data),exclusionId=f'excluded-{len(exclusions)+1:04}');exclusions.append(e)
        # Sections with verbatim carriage have their own boundary, rather than a candidate-wide guess.
        state=document_states(text)
        for u in parsed:
            s=u['physicalSpans'][0];line=s['line'];col=s['columnStart'];end=u['physicalSpans'][-1];source=lines[line-1]
            prev=[e for e in byfile[path] if any(z['line']==e['line'] and z['columnStart']<e['columnEndExclusive'] and z['columnEndExclusive']>e['columnStart'] for z in u['physicalSpans'])]
            # A brace-list is one physical unit with distinct resolved references.
            for ref in u['references']:
                if not relevant(ref) and not prev:continue
                heading,carriage,key,heads=state[line];block=block_context(lines,line);around='\n'.join(lines[max(0,line-3):min(len(lines),line+2)])
                cell=source[:col-1].count('|')-1 if source.startswith('|') else -1
                headercell=heads[cell] if 0<=cell<len(heads) else ''
                base=re.sub(r':\d+(?:-\d+)?$','',ref.split('#')[0]);operative=operative_read(source,headercell)
                dest,anchor,why=owner(ref,operative)
                rule='navigation';action='preserve-pending-target';role='reader';patch=None;note=None
                # Priority: explicit live overrides precede carriage/provenance heuristics.
                override=next((e.get('leadOverride') for e in prev if e.get('leadOverride')),None)
                writer=bool(override) or path=='docs/how-to/author-a-plan-loop-track.md' and '/verification/' in ref and any(e['edgeId'] in ['maps-01522','maps-01523','maps-01524','maps-01525','maps-01526','maps-01527'] for e in prev)
                literal=carriage
                writer=writer or (not literal and block_writer(ref,source,block))
                checker=bool(re.search(r'docs/specs(?:/|$)',base) and (path.endswith('fix-bare-citation-findings.md') or re.search(r'citation.drift|check-decision-citation',path+' '+source,re.I) and re.search(r'default|scope|scan|node |--root',source,re.I)))
                upstream=path.startswith('docs/distillery/')
                history=base.rstrip('/')=='docs/history' or base.startswith('docs/history/')
                template=path.startswith('docs/templates/')
                placeholder=bool(re.search(r'<[^>]+>|\.\.\.',ref))
                provenance=bool(u.get('embeddedCodeLiteral') and path.endswith('.md')) or bool(re.search(r'^(?:[- >]*)(?:\*\*)?(?:Source type|Provenance|Original source|Source relationship|Supersedes)(?:\*\*)?:',source,re.I))
                provenance=provenance or headercell in ('source path','source','legacy source','former source','legacy file','former file')
                provenance=provenance or bool(re.search(r'plan|ledger|inventory|migration',path,re.I) and re.search(r'\bsource\b|nguồn',headercell))
                provenance=provenance or path.endswith('/documentation-standardization-plan.md') and headercell in ('proof or source root','proof root','source document','source path')
                provenance=provenance or bool(re.search(r'(?:from|at|blob|commit|source unit|source locator|historical redirect).*\b[0-9a-f]{7,40}\b',source,re.I))
                provenance=provenance or any(e.get('edgeKind')=='provenance' for e in prev)
                provenance=provenance or 'historical redirect' in source.lower() or bool(re.search(r'track.closeout|closeout',path+' '+heading,re.I) and re.search(r'file|changed|touch|modified',heading+' '+source,re.I))
                # authoritative_for state is tracked at the exact front-matter key
                migration=path=='docs/platform/README.md' and headercell in ('current source during migration','target doc') or path=='docs/transitional-switchboard.md' and source.startswith('|') and ('authoritystatus' in heads or 'legacy-current' in source or 'candidate' in source or 'current authority' in source.lower())
                literal=carriage
                retired_checkpoint=bool(dest and '/history/retired-engine/' in dest and 'handoff' in path and re.search(r'append checkpoint|ghi.*checkpoint',block['text'],re.I))
                if writer:
                    rule='writer-L12-19' if override else 'live-evidence-writer';action='preserve-pending-behavioral-proof';role='writer/check';why='Step 5 trace adoption, exact destination and checks together; no executable new';
                elif checker and not (path=='docs/transitional-switchboard.md' and source.startswith('|')):rule='checker-scope';action='preserve-pending-behavioral-proof';role='behavioral';why='Step 5 script default and documented command must change together'
                elif retired_checkpoint:rule='retired-checkpoint-write';action='preserve';why='L12-22 retired handoff checkpoint instruction; only history carrier remains'
                elif history:rule='retained-history';action='preserve';dest=anchor=None;why='L12-22 docs/history is retained historical topology'
                elif upstream:rule='external-project';action='preserve';dest=anchor=None;why='L12-10 upstream citation has no fgOS owner'
                elif template:rule='template';action='preserve';dest=anchor=None;why='L12-10 shipped placeholder topology'
                elif key:rule='authoritative_for';action='preserve';dest=anchor=None;why='Exact-match key; src/report/authoritative-match.mjs'
                elif migration and not literal:rule='migration-state';action='phase9-row-flip';why='Phase 9 updates authority/status/destination cells as a row; no path substitution'
                elif placeholder:rule='template-placeholder';action='preserve';dest=anchor=None;why='L12-22 whole placeholder topology preserved, never partial patch'
                elif literal:rule='verbatim-carriage';action='preserve';why='L12-23 explicit current-file carriage region; Phase 9 link check excludes verbatim regions'
                elif provenance:rule='provenance';action='preserve';why='L12-21/22 preserve source locator/pinned citation/audit/closeout evidence'
                elif base.rstrip('/')=='docs/ui-spec' or base.startswith('docs/ui-spec/'):
                    rule='ui-spec-self-reference';action='preserve';dest=base;anchor=None;why='L12-24 retained docs/ui-spec topology from every consumer'
                elif path in generated:rule='generated';action='preserve-pending-behavioral-proof';role='generator';why='Step 5 generator source owns retargeting; never hand patch output'
                elif any(e.get('edgeId')=='maps-01794' for e in prev):rule='historical-quote';action='preserve';dest=anchor=None;why='L12-21 quoted term no longer exists in either map'
                elif base=='docs/architect/packaging-distribution/' and ('host-invocation' in path):
                    rule='roadmap-semantic';dest='docs/platform/packaging-distribution/README.md';anchor=None;action='preserve-pending-target';why='Step 3 whole sentence semantic rewrite to promoted packaging decision portal'
                elif base.startswith('docs/platform/') or base in ('docs/reading-map.md','docs/backlog.md','docs/doc-registry.md','docs/architecture-manifest.json'):
                    rule='retained-reference';action='preserve';dest=anchor=None;why='Existing retained path; no migration substitution'
                elif not path.endswith('.md'):
                    rule='contract-data';action='preserve-pending-behavioral-proof';role='behavioral';why='Step 5 actual data reader must be traced'
                elif operative:
                    rule='operative-read';action='cutover-patch-only' if dest else 'preserve-pending-target'
                elif dest:action='cutover-patch-only'
                if base.rstrip('/') in ('docs/architect','docs/specs') and rule in ('navigation','operative-read'):
                    rule='legacy-tree-semantic';action='preserve-pending-target';dest=anchor=None;why='L12-24 whole legacy-tree mention; Step 3 decides the sentence, never path substitution'
                if literal and action=='preserve':
                    carriagePolicy={'preserveWithoutAlias':True,'phase9LinkCheck':'exclude verbatim carriage region; pre-existing broken links are historical witnesses'}
                else:carriagePolicy=None
                if not exists(base) and not dest and base.startswith('docs/architect/'):
                    suffix=base[len('docs/architect/'):];direct='docs/platform/'+suffix
                    choices=[direct,posixpath.dirname(direct)+'/proposals/'+posixpath.basename(base)]
                    found=[p for p in choices if is_file(p)]
                    if len(set(found))==1 and action not in ('cutover-patch-only','phase9-row-flip','preserve-pending-behavioral-proof'):
                        dest=found[0];action='preserve';rule='deleted-historical-target';why='L12-22 deleted locator; findable successor is lookup-only, never executable'
                # Already-moved locators need an explicit lookup note even when
                # the live consumer must wait for Step 3 exact semantic approval.
                if not exists(base) and base.startswith(('docs/how-to/','docs/explanation/','docs/decisions/')):
                    name=posixpath.basename(base)
                    choices=[p for p in TREE if is_file(p) and p.startswith('docs/knowledge/') and posixpath.basename(p)==name]
                    if not choices and base.startswith(('docs/how-to/','docs/explanation/')):
                        choices=[p for p in TREE if is_file(p) and p.startswith('docs/knowledge/') and posixpath.basename(p).startswith(name)]
                    if name.startswith('0026-'):choices=['docs/platform/runner/decisions/h-36d872fbb0e5.md']
                    elif name.startswith('0027-'):choices=['docs/platform/work-state/decisions/retired-decision-history.md']
                    if not choices and name=='smoke-test-fgos-coding-implement-with-a-trivial-item.md':
                        choices=[p for p in TREE if is_file(p) and p.startswith('docs/knowledge/') and posixpath.basename(p)==name.replace('fgos-coding-implement','fgos-code-implement')]
                    if len(choices)==1 and is_file(choices[0]):
                        successor=choices[0]
                        note={'successor':successor,'executable':False,'reason':'L12-23 already-moved or name-drift locator; Step 3 chooses exact patch for live consumer'}
                        if not literal and rule not in ('provenance','template','external-project','authoritative_for'):
                            action='preserve-pending-target';patch=None;rule='moved-target';why='Already moved before cutover; successor lookup note; Step 3 exact patch pending'
                if dest==path:
                    action='preserve';rule='self-reference-preserved';why='No self-link patch'
                if not note and action=='preserve' and not exists(base) and dest:
                    if base=='docs/architect/agent-coordination/verification/implementation-alignment.md':
                        dest='docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md';anchor='literal-snapshot'
                    note={'successor':dest+('#'+anchor if anchor else ''),'executable':False,'reason':'Deleted historical target; preserve original witness'}
                if not note and action=='preserve' and not exists(base) and rule not in ('external-project','template') and not re.search(r'[<>*{}]',base):
                    successor=(dest+('#'+anchor if anchor else '')) if dest else None
                    if base in ('docs/architect/agent-coordination/verification/implementation-alignment.md','docs/platform/agent-coordination/verification/implementation-alignment.md'):
                        successor='docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md#literal-snapshot'
                    note={'successor':successor,'executable':False,'reason':'Deleted historical target; preserve original witness; '+('successor lookup only' if successor else 'exact successor unresolved, Step 3 review needed')}
                if action=='cutover-patch-only' and re.search(r':\d+(?:-\d+)?$',ref.split('#')[0]):
                    anchor=locator_anchor(ref,dest)
                    if not anchor:
                        action='preserve-pending-target';rule='line-locator-unresolved';why='L12-24 source line locator has no unique matching target heading; Step 3 exact anchor required'
                if action=='cutover-patch-only':
                    # Keep unresolved fragments parked; no guessing anchors from prose.
                    if anchor in ('document entry','whole document'):anchor=None
                    if '#' in ref and not anchor:anchor=ref.split('#',1)[1]
                    if dest and '/history/retired-engine/' in dest:
                        action='preserve-pending-target';why='No executable patch into literal carriage; Step 3 must select an operative retained passage'
                    else:
                        target=dest+('#'+anchor if anchor else '')
                        newdest=target
                        if u['syntax']=='markdown-link':
                            if not u['destination'].startswith(('docs/','repo/','/docs/')):newdest=posixpath.relpath(dest,posixpath.dirname(path))+('/' if dest.endswith('/') else '')+('#'+anchor if anchor else '')
                            label=(('`'+newdest+'`') if u['label'].startswith('`') and u['label'].endswith('`') else newdest) if u['pathTextLabel'] else u['label']
                            new=('!' if u['matchedExpression'].startswith('!') else '')+'['+label+']('+newdest+')'
                        elif len(u['references'])>1:
                            new=None;action='preserve-pending-target';why='Brace references expanded; Step 3 chooses whole-unit list rewrite'
                        else:new=target
                        if action=='cutover-patch-only':patch={'old':u['matchedExpression'],'new':new,'timing':'Phase 9 only','operation':'replace complete reference unit','prerequisites':['Step 3 semantic approval','A47 final target conservation','Step 6 evidence parity when applicable']}
                ident=f'maps-h-{len(entries)+1:05}';ids.append(ident)
                contexts=[{'line':i+1,'text':lines[i][:500]} for i in range(max(0,line-3),min(len(lines),line+2))]
                e={**u,'edgeId':ident,'consumerPath':path,'fileDigest':sha(data),'line':line,'columnStart':col,'columnEndExclusive':s['columnEndExclusive'],'normalizedReference':ref,'desiredOwner':dest,'desiredAnchor':anchor,'rule':rule,'role':role,'preCutoverAction':'preserve bytes','cutoverAction':action,'cutoverPatch':patch,'dispositionReason':why,'parkedReason':why if action not in ('preserve','phase9-row-flip') else None,'sourceVsRender':'generated' if path in generated else 'retained source','sourcePath':generated.get(path,path),'context':contexts,'callSiteSha256':sha(source.encode()),'currentAuthorityRoute':{'switchboardDigest':sha(switch),'matchedRowLines':[i+1 for i,l in enumerate(switchlines) if '`'+base+'`' in l],'referenceAsWritten':ref},'aliasLookup':{'use':'lookup only; never writing destination','candidateIds':[a['aliasId'] for a in aliasby.get(ref,aliasby.get(base,[]))]},'writeDestination':ref if writer else None,'reviewer':'Lead-started A38 independent reviewer pending','test':'Replay source bytes/full unit; exact target and anchors; Step 3 semantic proof; Step 5 behavioral parity where marked','priorRows':[{'rowId':e['edgeId'],'effectiveSha256':sha(encoded(e))} for e in prev]}
                if writer:e['writerBlock']={k:v for k,v in block.items() if k!='text'};e['writerBlock']['sha256']=sha(block['text'].encode())
                if carriagePolicy:e['carriagePolicy']=carriagePolicy
                if override:e['leadOverride']=override
                if note:e['successorNote']=note
                entries.append(e)
        files.append({'path':path,'sha256':sha(data),'bytes':len(data),'edgeIds':ids})
    # Use the existing anchor API without changing the extractor or comparator.
    targetrefs=sorted({(e['desiredOwner'] or '')+('#'+e['desiredAnchor'] if e['desiredAnchor'] and e['desiredAnchor'] not in ('document entry','whole document') else '') for e in entries if e['desiredOwner']})
    targetrefs=sorted(set(targetrefs)|{e['successorNote']['successor'] for e in entries if e.get('successorNote',{}).get('successor')})
    payload={}
    for ref in targetrefs:
        file=ref.split('#')[0]
        payload[ref]={'exists':exists(file),'directory':is_dir(file),'content':read(file).decode() if is_file(file) else None,'sha256':sha(read(file)) if is_file(file) else None}
    js="""import fs from 'node:fs';
import {listAnchors,anchorExists} from './scripts/list-doc-anchors.mjs';
const data=JSON.parse(fs.readFileSync(0,'utf8'));const out={};
for(const [ref,x] of Object.entries(data)){const [file,...frag]=ref.split('#');const anchor=frag.join('#');
const row={owner:file,anchor:anchor||null,exists:x.exists,anchorExists:false,sha256:x.sha256,failures:[]};
if(!x.exists)row.failures.push('missing-target');
else {row.directory=x.directory;row.anchorExists=!anchor||(!x.directory&&anchorExists(x.content,anchor));
if(!row.anchorExists)row.failures.push(x.directory?'directory-fragment':'missing-anchor');
if(anchor&&!x.directory){const a=listAnchors(x.content).find(a=>a.anchor===anchor||a.githubSlug===anchor);if(a)row.passage={startLine:a.startLine,endLine:a.endLine};}}
out[ref]=row;}console.log(JSON.stringify(out));"""
    checks=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,input=json.dumps(payload).encode()))
    for e in entries:
        if e.get('successorNote',{}).get('successor'):e['successorNote']['mechanicalCheck']=checks[e['successorNote']['successor']]
        if not e['desiredOwner']:continue
        if e['desiredAnchor'] in ('document entry','whole document'):e['desiredAnchor']=None
        ref=e['desiredOwner']+('#'+e['desiredAnchor'] if e['desiredAnchor'] else '')
        e['mechanicalTargetCheck']=checks[ref]
        if checks[ref]['failures'] and e['cutoverPatch']:
            e['candidateSuggestion']=e['cutoverPatch']['new'];e['cutoverPatch']=None;e['cutoverAction']='preserve-pending-target'
            e['parkedReason']='Mechanical target/anchor failure; Step 3 exact target required'
    # Every old scanner row receives a disposition, including subsumed prefixes/code.
    priorjoins=collections.defaultdict(list)
    for e in entries:
        for p in e['priorRows']:priorjoins[p['rowId']].append(e['edgeId'])
    for oldrow in old['entries']:
        matches=priorjoins[oldrow['edgeId']]
        why='whole reference unit(s), labels/destinations unified and braces expanded' if matches else ('JS operand/regex/minified code token; not a documentation path' if '/' not in oldrow['matchedExpression'] else 'substring inside a longer non-reference token; whole-token matching excludes this scanner hit')
        reconcile.append({'priorRowId':oldrow['edgeId'],'effectiveSha256':sha(encoded(prior[oldrow['edgeId']])),'edgeIds':matches,'disposition':why})
    result={'parserVersion':4,'inputHEAD':INPUT_COMMIT,'scope':old['scope'],'populationProof':{'method':'git ls-tree at inputHEAD, original class boundary/exclusions and seed categories reapplied','selectedFiles':len(selected),'priorOwnedFilesExcluded':len(priorfiles),'matchesPriorClassFileSet':True},'classStatus':'class 3 static regeneration; Step 2 OPEN; class 4 not started','files':files,'entries':entries,'excludedCodeUnits':exclusions,'priorReconciliation':reconcile,'overlayControls':controls,'overlayEffectiveRows':[{'baseKey':list(k),'row':v,'effectiveSha256':sha(encoded(v))} for k,v in effective.items()],'externalLinks':old['externalLinks'],'targetChecks':checks,'anchorApiPins':{p:sha(read(p)) for p in ['scripts/list-doc-anchors.mjs','scripts/generate-doc-inventory.mjs']},'nativeEvidence':{'receipt':'step-02c-inventory-export.json','reconciliation':'step-02c-inventory-reconciliation.json','dynamicUnresolved':'step-02c-dynamic-unresolved.json','status':'Preserved unresolved; no re-export or parity acceptance'},'actualTargetContentEdits':[],'actualN1Scope':[],'counts':{'files':len(files),'edges':len(entries),'rules':dict(collections.Counter(e['rule'] for e in entries)),'actions':dict(collections.Counter(e['cutoverAction'] for e in entries)),'codeExclusions':len(exclusions)}}
    reconcileby={x['priorRowId']:x for x in reconcile}
    for e in old['entries']:
        join=reconcileby[e['edgeId']]
        if not join['edgeIds']:
            exclusions.append({'exclusionId':f'excluded-{len(exclusions)+1:04}','consumerPath':e['consumerPath'],'fileDigest':e['fileDigest'],'physicalSpans':[{'line':e['line'],'columnStart':e['columnStart'],'columnEndExclusive':e['columnEndExclusive'],'text':e['matchedExpression']}],'matchedExpression':e['matchedExpression'],'priorRowId':e['edgeId'],'reason':join['disposition']})
    result['counts']['codeExclusions']=sum('code' in e['reason'].lower() or 'js ' in e['reason'].lower() for e in exclusions)
    return result
if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,indent=2))
