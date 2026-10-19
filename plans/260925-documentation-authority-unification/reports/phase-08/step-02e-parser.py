#!/usr/bin/env python3
"""Plan-local read-only census/parser. JSON goes to stdout; never edits consumers.
Usage: python3 step-02e-parser.py > /tmp/fgos-work/step-02e-data.json
The packager is a separate, plan-scoped authoring operation.
"""
import collections, copy, hashlib, json, math, posixpath, re, subprocess
from pathlib import Path
R=Path(__file__).resolve().parent
ROOT=R.parents[3]
def sha(b): return hashlib.sha256(b).hexdigest()
def encoded(x): return json.dumps(x,ensure_ascii=False,sort_keys=True).encode()
def load(n): return json.loads((R/n).read_text())
def read(p):
    assert not any(x in p.split('/') for x in ('.fgos','.bee')),p
    return (ROOT/p).read_bytes()
def expand(s):
    m=re.search(r'\{([^{}]+)\}',s)
    if not m or ',' not in m[1]: return [s]
    return [v for a in m[1].split(',') for v in expand(s[:m.start()]+a.strip()+s[m.end():])]
def norm(path,ref):
    ref=ref.strip('`').rstrip('.,;:')
    if ref.startswith('<') and ref.endswith('>'):ref=ref[1:-1]
    if ref.startswith('repo/'): ref=ref[5:]
    if ref.startswith('/docs/'):ref=ref[1:]
    if ref.startswith(('http://','https://','mailto:','#')):return ref
    if ref.startswith(('docs/','plans/','src/','test/','scripts/','core/','domains/')): return ref
    return posixpath.normpath(posixpath.join(posixpath.dirname(path),ref))
ROOTFILES={'docs/README.md','docs/architecture-map.md','docs/architecture-manifest.json','docs/backlog.md','docs/coexistence.md','docs/distribution-vision.md','docs/doc-governance.md','docs/doc-registry.md','docs/id-systems-audit.md','docs/io-contract.md','docs/operator-runbook-herdr-cockpit.md','docs/platform-foundations.md','docs/reading-map.md','docs/routing-handoff-contract.md','docs/work-item-lifecycle-vision.md'}
def relevant(ref):
    p=ref.split('#')[0].split(':')[0]
    return p in ROOTFILES or bool(re.match(r'^docs/(specs|architect|ui-spec|contracts|history)(/|$)',p)) or '/agent-coordination/verification/' in p
# A reference token is consumed whole. Braces and placeholders are part of it.
TOKEN=re.compile(r'(?<![\w/.-])(?:repo/)?(?:/?docs/|(?:\.\./)+(?:[\w.-]+/)*|\./)[^\s`\"\'|\[\]()]+')
LINK=re.compile(r'!?\[([^\]\n]*)\]\(\s*(<?[^\s)]+>?)\s*(?:[\"\'][^\n]*?[\"\']\s*)?\)')
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
        if not any(relevant(x) for x in refs) and not forced:return
        item={'physicalSpans':spans,'matchedExpression':text[a:b],'references':refs,'syntax':kind}
        if label is not None:item.update(label=label,destination=dest,pathTextLabel=bool(TOKEN.fullmatch(label.strip('`')) or label.strip('`')==dest))
        reason=next((why for x,y,why in masked if a<y and b>x),None)
        if reason and (raw.startswith(('docs/','repo/docs/')) or kind=='markdown-link' and dest.startswith(('docs/','repo/docs/'))):
            item['embeddedCodeLiteral']=True;reason=None
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
        raw=m[0].rstrip('.,;:')
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
                    base=json.loads((ROOT/s['file']).read_text())
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
    tracked=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT,text=True).split('\0')
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
        if base=='docs/specs/reading-map.md':return 'docs/reading-map.md',None,'L12-21 frozen reading-map decision'
        evidence='docs/architect/agent-coordination/verification/'
        if base.startswith(evidence):return base.replace(evidence,'docs/platform/agent-coordination/verification/',1),fragment or None,'L12-21 same-path evidence mirror'
        candidates=aliasby.get(ref) or aliasby.get(base,[])
        pairs={(a['toOwner'],a.get('toAnchor')) for a in candidates if a.get('toOwner')}
        dest,anchor=next(iter(pairs)) if len(pairs)==1 else (None,None)
        if base.startswith('docs/architect/') and (read_instruction or dest and dest.endswith('/README.md') and not base.endswith('/README.md')):
            direct=base.replace('docs/architect/','docs/platform/',1)
            if (ROOT/direct).is_file():return direct,fragment or None,'Exact single retained destination rather than area portal'
        if read_instruction and base.startswith('docs/architect/agent-coordination/'):
            suffix=base[len('docs/architect/agent-coordination/'):]
            exact='docs/platform/agent-coordination/'+suffix
            if (ROOT/exact).is_file():return exact,fragment or None,'Exact retained file for operative read instruction'
            return None,None,'Exact retained read target unresolved; portal substitution forbidden'
        if read_instruction and dest and dest.endswith('/README.md') and not base.endswith('/README.md'):
            return None,None,'Exact operative read target unresolved; area portal cannot replace retained file'
        return dest,anchor,'Unique draft mapping; lookup only' if dest else 'No unique exact mapping'
    for oldfile in old['files']:
        path=oldfile['path'];data=read(path);text=data.decode();lines=text.splitlines();parsed,rejected=units(path,text,byfile[path]);ids=[]
        for e in rejected:
            e.update(consumerPath=path,fileDigest=sha(data),exclusionId=f'excluded-{len(exclusions)+1:04}');exclusions.append(e)
        # Sections with verbatim carriage have their own boundary, rather than a candidate-wide guess.
        heading='';carriage=False;carriageLevel=None;tableheads=[];front=False;authkey=False
        state={}
        for i,line in enumerate(lines,1):
            if i==1 and line=='---':front=True
            elif front and line=='---':front=False
            if front and re.match(r'^\w[\w_]*:',line):authkey=line.startswith('authoritative_for:')
            h=re.match(r'^(#{1,6})\s+(.*)',line)
            if h:
                heading=h[2]
                level=len(h[1])
                if carriageLevel is not None and level<=carriageLevel:carriageLevel=None
                if re.search(r'literal snapshot|verbatim|source snapshot|retained.selected.source|conserved.source|conservation carrier|^Restored ',heading,re.I):carriageLevel=level
            if re.search(r'Added in candidate: verbatim restoration',line,re.I):carriageLevel=len(h[1]) if h else 2
            carriage=carriageLevel is not None
            if line.startswith('|'):
                cells=[c.strip(' `').lower() for c in line.strip('|').split('|')]
                if any(c in ('source path','source','legacy source','current source during migration','authoritystatus') for c in cells):tableheads=cells
            else:tableheads=[]
            state[i]=(heading,carriage,front and authkey,list(tableheads))
        for u in parsed:
            s=u['physicalSpans'][0];line=s['line'];col=s['columnStart'];end=u['physicalSpans'][-1];source=lines[line-1]
            prev=[e for e in byfile[path] if any(z['line']==e['line'] and z['columnStart']<e['columnEndExclusive'] and z['columnEndExclusive']>e['columnStart'] for z in u['physicalSpans'])]
            # A brace-list is one physical unit with distinct resolved references.
            for ref in u['references']:
                if not relevant(ref) and not prev:continue
                heading,carriage,key,heads=state[line];around='\n'.join(lines[max(0,line-3):min(len(lines),line+2)])
                cell=source[:col-1].count('|')-1 if source.startswith('|') else -1
                headercell=heads[cell] if 0<=cell<len(heads) else ''
                base=ref.split('#')[0];operative=bool(re.search(r'\b(?:read(?: and follow)?|SCOPE_DOCS|CONTEXT_DOCS)\b|đọc',source,re.I))
                dest,anchor,why=owner(ref,operative)
                rule='navigation';action='preserve-pending-target';role='reader';patch=None;note=None
                # Priority: explicit live overrides precede carriage/provenance heuristics.
                override=next((e.get('leadOverride') for e in prev if e.get('leadOverride')),None)
                writer=bool(override) or path=='docs/how-to/author-a-plan-loop-track.md' and '/verification/' in ref and any(e['edgeId'] in ['maps-01522','maps-01523','maps-01524','maps-01525','maps-01526','maps-01527'] for e in prev)
                writer=writer or '/verification/' in ref and bool(re.search(r'EVIDENCE_DIR=|\b(?:write|create|mkdir|record it|test -s)\b',source,re.I))
                checker=bool(re.search(r'docs/specs(?:/|$)',base) and (path.endswith('fix-bare-citation-findings.md') or re.search(r'citation.drift|check-decision-citation',path+' '+source,re.I) and re.search(r'default|scope|scan|node |--root',source,re.I)))
                upstream=path.startswith('docs/distillery/') or 'docs/history/' in base
                template=path.startswith('docs/templates/')
                provenance=bool(u.get('embeddedCodeLiteral') and path.endswith('.md')) or bool(re.search(r'^(?:[- >]*)(?:\*\*)?(?:Source type|Provenance|Original source|Source relationship|Supersedes)(?:\*\*)?:',source,re.I))
                provenance=provenance or headercell in ('source path','source','legacy source','former source')
                provenance=provenance or bool(re.search(r'(?:from|at|blob|commit|source unit|source locator|historical redirect).*\b[0-9a-f]{7,40}\b',source,re.I))
                provenance=provenance or any(e.get('edgeKind')=='provenance' for e in prev)
                provenance=provenance or 'historical redirect' in source.lower() or bool(re.search(r'track.closeout|closeout',path+' '+heading,re.I) and re.search(r'file|changed|touch|modified',heading+' '+source,re.I))
                # authoritative_for state is tracked at the exact front-matter key
                migration=headercell=='current source during migration' or path=='docs/transitional-switchboard.md' and source.startswith('|') and ('authoritystatus' in heads or 'legacy-current' in source or 'candidate' in source or 'current authority' in source.lower())
                literal=carriage or '/history/retired-engine/' in path or any(e.get('edgeKind')=='conserved-source-context' for e in prev)
                if writer:
                    rule='writer-L12-19' if override else 'live-evidence-writer';action='preserve-pending-behavioral-proof';role='writer/check';why='Step 5 trace adoption, exact destination and checks together; no executable new';
                elif checker and not (path=='docs/transitional-switchboard.md' and source.startswith('|')):rule='checker-scope';action='preserve-pending-behavioral-proof';role='behavioral';why='Step 5 script default and documented command must change together'
                elif upstream:rule='external-project';action='preserve';dest=anchor=None;why='L12-10 upstream citation has no fgOS owner'
                elif template:rule='template';action='preserve';dest=anchor=None;why='L12-10 shipped placeholder topology'
                elif key:rule='authoritative_for';action='preserve';dest=anchor=None;why='Exact-match key; src/report/authoritative-match.mjs'
                elif provenance:rule='provenance';action='preserve';why='L12-21 preserve source locator/pinned citation/audit/closeout evidence'
                elif migration:rule='migration-state';action='phase9-row-flip';why='Phase 9 updates authority/status/destination cells as a row; no path substitution'
                elif path in generated:rule='generated';action='preserve-pending-behavioral-proof';role='generator';why='Step 5 generator source owns retargeting; never hand patch output'
                elif base.startswith('docs/ui-spec/') and path.startswith('docs/ui-spec/'):rule='ui-spec-self-reference';action='preserve';dest=anchor=None;why='Compiler schema/config root is retained docs/ui-spec'
                elif any(e.get('edgeId')=='maps-01794' for e in prev):rule='historical-quote';action='preserve';dest=anchor=None;why='L12-21 quoted term no longer exists in either map'
                elif base=='docs/architect/packaging-distribution/' and ('host-invocation' in path):
                    rule='roadmap-semantic';dest='docs/platform/packaging-distribution/README.md';anchor=None;action='preserve-pending-target';why='Step 3 whole sentence semantic rewrite to promoted packaging decision portal'
                elif literal:rule='verbatim-carriage';action='preserve';why='No edits within verbatim source carriage; candidate status alone is not authority'
                elif base.startswith('docs/platform/') or base in ('docs/reading-map.md','docs/architecture-manifest.json'):
                    rule='retained-reference';action='preserve';dest=anchor=None;why='Existing retained path; no migration substitution'
                elif not path.endswith('.md'):
                    rule='contract-data';action='preserve-pending-behavioral-proof';role='behavioral';why='Step 5 actual data reader must be traced'
                elif operative:
                    rule='operative-read';action='cutover-patch-only' if dest else 'preserve-pending-target'
                elif dest:action='cutover-patch-only'
                if dest==path:
                    action='preserve';rule='self-reference-preserved';why='No self-link patch'
                if action=='preserve' and not (ROOT/base).exists() and dest:
                    if base=='docs/architect/agent-coordination/verification/implementation-alignment.md':
                        dest='docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md';anchor='literal-snapshot'
                    note={'successor':dest+('#'+anchor if anchor else ''),'executable':False,'reason':'Deleted historical target; preserve original witness'}
                if action=='preserve' and not (ROOT/base).exists() and rule not in ('external-project','template') and not re.search(r'[<>*{}]',base):
                    successor=(dest+('#'+anchor if anchor else '')) if dest else None
                    if base in ('docs/architect/agent-coordination/verification/implementation-alignment.md','docs/platform/agent-coordination/verification/implementation-alignment.md'):
                        successor='docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md#literal-snapshot'
                    note={'successor':successor,'executable':False,'reason':'Deleted historical target; preserve original witness; '+('successor lookup only' if successor else 'exact successor unresolved, Step 3 review needed')}
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
                            if not u['destination'].startswith(('docs/','repo/','/docs/')):newdest=posixpath.relpath(dest,posixpath.dirname(path))+('#'+anchor if anchor else '')
                            label=newdest if u['pathTextLabel'] else u['label']
                            new='['+label+']('+newdest+')'
                        elif len(u['references'])>1:
                            new=None;action='preserve-pending-target';why='Brace references expanded; Step 3 chooses whole-unit list rewrite'
                        else:new=target
                        if action=='cutover-patch-only':patch={'old':u['matchedExpression'],'new':new,'timing':'Phase 9 only','operation':'replace complete reference unit','prerequisites':['Step 3 semantic approval','A47 final target conservation','Step 6 evidence parity when applicable']}
                ident=f'maps-e-{len(entries)+1:05}';ids.append(ident)
                contexts=[{'line':i+1,'text':lines[i][:500]} for i in range(max(0,line-3),min(len(lines),line+2))]
                e={**u,'edgeId':ident,'consumerPath':path,'fileDigest':sha(data),'line':line,'columnStart':col,'columnEndExclusive':s['columnEndExclusive'],'normalizedReference':ref,'desiredOwner':dest,'desiredAnchor':anchor,'rule':rule,'role':role,'preCutoverAction':'preserve bytes','cutoverAction':action,'cutoverPatch':patch,'dispositionReason':why,'parkedReason':why if action not in ('preserve','phase9-row-flip') else None,'sourceVsRender':'generated' if path in generated else 'retained source','sourcePath':generated.get(path,path),'context':contexts,'callSiteSha256':sha(source.encode()),'currentAuthorityRoute':{'switchboardDigest':sha(switch),'matchedRowLines':[i+1 for i,l in enumerate(switchlines) if '`'+base+'`' in l],'referenceAsWritten':ref},'aliasLookup':{'use':'lookup only; never writing destination','candidateIds':[a['aliasId'] for a in aliasby.get(ref,aliasby.get(base,[]))]},'writeDestination':ref if writer else None,'reviewer':'Lead-started A38 independent reviewer pending','test':'Replay source bytes/full unit; exact target and anchors; Step 3 semantic proof; Step 5 behavioral parity where marked','priorRows':[{'rowId':e['edgeId'],'effectiveSha256':sha(encoded(e))} for e in prev]}
                if override:e['leadOverride']=override
                if note:e['successorNote']=note
                entries.append(e)
        files.append({'path':path,'sha256':sha(data),'bytes':len(data),'edgeIds':ids})
    # Use the existing anchor API without changing the extractor or comparator.
    targetrefs=sorted({(e['desiredOwner'] or '')+('#'+e['desiredAnchor'] if e['desiredAnchor'] and e['desiredAnchor'] not in ('document entry','whole document') else '') for e in entries if e['desiredOwner']})
    targetrefs=sorted(set(targetrefs)|{e['successorNote']['successor'] for e in entries if e.get('successorNote',{}).get('successor')})
    js="""import fs from 'node:fs'; import crypto from 'node:crypto';
import {listAnchors,anchorExists} from './scripts/list-doc-anchors.mjs';
const refs=JSON.parse(fs.readFileSync(0,'utf8'));const out={};const cache=new Map();
for(const ref of refs){ const [file,...frag]=ref.split('#'); const anchor=frag.join('#');
 const row={owner:file,anchor:anchor||null,exists:false,anchorExists:false,sha256:null,failures:[]};
 try{const stat=fs.statSync(file);row.exists=true;row.directory=stat.isDirectory();
 if(row.directory){row.anchorExists=!anchor;if(anchor)row.failures.push('directory-fragment');}
 else {let c=cache.get(file);if(!c){const bytes=fs.readFileSync(file);const content=bytes.toString('utf8');c={bytes,content,anchors:file.endsWith('.md')?listAnchors(content):[]};cache.set(file,c);}
 row.sha256=crypto.createHash('sha256').update(c.bytes).digest('hex');row.anchorExists=!anchor||anchorExists(c.content,anchor);
 if(!row.anchorExists)row.failures.push('missing-anchor');
 if(anchor){const a=c.anchors.find(a=>a.anchor===anchor||a.githubSlug===anchor);if(a)row.passage={startLine:a.startLine,endLine:a.endLine};}
 }
 }catch(e){row.failures.push(e.code==='ENOENT'?'missing-target':e.message);}out[ref]=row;}
console.log(JSON.stringify(out));"""
    checks=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,input=json.dumps(targetrefs).encode()))
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
    for oldrow in old['entries']:
        matches=[e['edgeId'] for e in entries if any(p['rowId']==oldrow['edgeId'] for p in e['priorRows'])]
        why='whole reference unit(s), labels/destinations unified and braces expanded' if matches else ('JS operand/regex/minified code token; not a documentation path' if '/' not in oldrow['matchedExpression'] else 'substring inside a longer non-reference token; whole-token matching excludes this scanner hit')
        reconcile.append({'priorRowId':oldrow['edgeId'],'effectiveSha256':sha(encoded(prior[oldrow['edgeId']])),'edgeIds':matches,'disposition':why})
    result={'parserVersion':1,'inputHEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'scope':old['scope'],'populationProof':{'method':'fresh git ls-files, original class boundary/exclusions and seed categories reapplied','selectedFiles':len(selected),'priorOwnedFilesExcluded':len(priorfiles),'matchesPriorClassFileSet':True},'classStatus':'class 3 static regeneration; Step 2 OPEN; class 4 not started','files':files,'entries':entries,'excludedCodeUnits':exclusions,'priorReconciliation':reconcile,'overlayControls':controls,'overlayEffectiveRows':[{'baseKey':list(k),'row':v,'effectiveSha256':sha(encoded(v))} for k,v in effective.items()],'externalLinks':old['externalLinks'],'targetChecks':checks,'anchorApiPins':{p:sha(read(p)) for p in ['scripts/list-doc-anchors.mjs','scripts/generate-doc-inventory.mjs']},'nativeEvidence':{'receipt':'step-02c-inventory-export.json','reconciliation':'step-02c-inventory-reconciliation.json','dynamicUnresolved':'step-02c-dynamic-unresolved.json','status':'Preserved unresolved; no re-export or parity acceptance'},'actualTargetContentEdits':[],'actualN1Scope':[],'counts':{'files':len(files),'edges':len(entries),'rules':dict(collections.Counter(e['rule'] for e in entries)),'actions':dict(collections.Counter(e['cutoverAction'] for e in entries)),'codeExclusions':len(exclusions)}}
    for e in old['entries']:
        join=next(x for x in reconcile if x['priorRowId']==e['edgeId'])
        if not join['edgeIds']:
            exclusions.append({'exclusionId':f'excluded-{len(exclusions)+1:04}','consumerPath':e['consumerPath'],'fileDigest':e['fileDigest'],'physicalSpans':[{'line':e['line'],'columnStart':e['columnStart'],'columnEndExclusive':e['columnEndExclusive'],'text':e['matchedExpression']}],'matchedExpression':e['matchedExpression'],'priorRowId':e['edgeId'],'reason':join['disposition']})
    result['counts']['codeExclusions']=sum('code' in e['reason'].lower() or 'js ' in e['reason'].lower() for e in exclusions)
    return result
if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,indent=2))
