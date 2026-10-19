"""L12-26 contextual decisions over committed references. Never edits consumers.
The unchanged anchor API supplies both extractor anchors and GitHub slugs.
"""
import re,json,posixpath,collections,functools

def refine(p,c):
    textcache={}
    def text(f):
        if f not in textcache:textcache[f]=p.read(f).decode() if p.is_file(f) else ''
        return textcache[f]
    @functools.lru_cache(None)
    def linesof(f):return text(f).splitlines()
    @functools.lru_cache(None)
    def statesof(f):return p.document_states(text(f))
    aliases=json.loads(p.read('plans/260925-documentation-authority-unification/reports/phase-06/draft-alias-merged-step10.json'))['entries']
    aliasby=collections.defaultdict(list)
    for a in aliases:aliasby[a['fromPath'].split('#')[0]].append(a)
    registry=json.loads(p.read('docs/doc-registry.json'));moved=collections.defaultdict(set)
    for d in registry['docs']:
        for a in d.get('aliases',[]):
            if d.get('currentPath') and p.is_file(d['currentPath']):moved[a].add(d['currentPath'])
    candidates=sorted(f for f in p.TREE if f.startswith('docs/platform/') and f.endswith('.md') and p.is_file(f))
    js="""import fs from 'node:fs';import {listAnchors} from './scripts/list-doc-anchors.mjs';const p=JSON.parse(fs.readFileSync(0,'utf8')),r={};for(const [f,t] of Object.entries(p))r[f]=listAnchors(t);console.log(JSON.stringify(r));"""
    import subprocess
    anchorfiles=set(candidates)|{e['consumerPath'] for e in c['entries'] if e['consumerPath'].endswith('.md')}
    anchors=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=p.ROOT,input=json.dumps({f:text(f) for f in sorted(anchorfiles)}).encode()))
    @functools.lru_cache(None)
    def historyfile(f):return '/history/' in f or bool(re.search(r'Document type:\s*History|Superseded / implementation history only',text(f)[:2500],re.I))
    @functools.lru_cache(None)
    def declaration_start(f):
        for i,l in enumerate(linesof(f),1):
            if re.search(r'retained verbatim.*(?:non.authority history|not navigation)|full source retained|^Added in candidate:.*(?:source carriage|complete source units)',l,re.I):return i
        return None
    @functools.lru_cache(None)
    def carriage(f,n):
        declared=declaration_start(f)
        return statesof(f).get(n,('',False))[1] or (declared is not None and declared<n)
    def live(f,a=None):
        if not p.is_file(f) or historyfile(f):return False
        n=(a or {}).get('startLine',1)
        return not carriage(f,n)
    def section(f,n):
        heads=[a for a in anchors.get(f,[]) if a.get('kind')=='heading' and a['startLine']<=n]
        return heads[-1] if heads else None
    def successor(base):
        exact=set(moved.get(base,()))
        if not exact:
            name=posixpath.basename(base)
            exact={f for f in p.TREE if f.startswith('docs/knowledge/') and p.is_file(f) and posixpath.basename(f)==name}
        if not exact:
            name=posixpath.basename(base).replace('fgos-coding-implement','fgos-code-implement')
            exact={f for f in p.TREE if f.startswith('docs/knowledge/') and p.is_file(f) and posixpath.basename(f).startswith(name)}
        if base.startswith('docs/decisions/0026-'):exact={'docs/platform/runner/decisions/h-36d872fbb0e5.md'}
        if posixpath.basename(base).startswith('0012-'):exact={'docs/platform/work-state/decisions/retired-decision-history.md'}
        if base.startswith('docs/decisions/0027-'):exact={'docs/platform/work-state/decisions/retired-decision-history.md'}
        if base.startswith('docs/history/'):
            exact|={f for f in candidates if posixpath.basename(f)==posixpath.basename(base)}
        return next(iter(exact)) if len(exact)==1 else None
    def note(e,target,reason):
        e['successorNote']={'successor':target,'executable':False,'reason':reason}
    def setrow(e,rule,action,reason,owner=None,anchor=None):
        e.update(rule=rule,cutoverAction=action,dispositionReason=reason,parkedReason=reason if 'pending' in action else None,cutoverPatch=None)
        if owner is not None:e['desiredOwner']=owner;e['desiredAnchor']=anchor
    def park(e,reason,target=None):
        setrow(e,'semantic-target-unresolved','preserve-pending-target',reason)
        if target:note(e,target,reason)
    def exact(e,f,a=None):
        e['desiredOwner']=f;e['desiredAnchor']=(a or {}).get('anchor');e['resolvedTargetAnchor']=a
        setrow(e,'content-locator' if a else 'navigation','cutover-patch-only','L12-26 committed exact content target; independent semantic review pending')
    # Draft aliases describe candidate conservation, not permission to retire retained roots.
    rootout=[]
    for base in sorted(p.ROOTFILES):
        aa=aliasby.get(base,[]);retired=[a for a in aa if a.get('approved') is True and a.get('retireSource') is True]
        rootout.append({'path':base,'existsAtInput':p.exists(base),'aliasIds':[a['aliasId'] for a in aa],'aliasEvidenceRefs':sorted({a.get('evidenceRef','') for a in aa}),'explicitApprovedRetirement':retired,'outcome':'retire only with explicit approved retirement' if retired else 'retained in place; draft moved/conservation aliases do not authorize retirement','inputHEAD':p.INPUT_COMMIT})
    c['rootAuthorityAliasOutcomes']=rootout
    source_cache={}
    @functools.lru_cache(None)
    def promoted_for(base):return tuple(v for v in candidates if base in text(v) and re.search(r'Promoted from[^\n]*'+re.escape(base),text(v),re.I) and live(v))
    def source(e):
        f=e['consumerPath'];ls=linesof(f);n=e['line'];line=ls[n-1]
        st=statesof(f);h=st[n][0];block=p.block_context(ls,n)
        return ls,line,h,block
    def rewrite(e):
        if e['cutoverAction']!='cutover-patch-only':e['cutoverPatch']=None;return
        dest=e.get('desiredOwner');anc=e.get('desiredAnchor');base=re.sub(r':\d+(?:-\d+)?$','',e['normalizedReference'].split('#')[0])
        if not dest:park(e,'Exact target unresolved');return
        if e['syntax']=='markdown-link' and anc:
            aa=next((a for a in anchors.get(dest,[]) if a['anchor']==anc or a.get('githubSlug')==anc),None)
            if aa:anc=aa.get('githubSlug') or aa['anchor']
        target=dest+('#'+anc if anc else '')
        raw=e.get('destination',e['matchedExpression']);relative=raw.startswith(('./','../'));repo=raw.startswith('repo/')
        out=posixpath.relpath(dest,posixpath.dirname(e['consumerPath']))+('/' if dest.endswith('/') else '')+('#'+anc if anc else '') if relative else ('repo/' if repo else '')+target
        if relative and raw.startswith('./') and not out.startswith('.'):out='./'+out
        if e['syntax']=='markdown-link':
            label=e['label'];bare=label.strip('`');oldbase=raw.split('#')[0]
            pathlabel=e.get('pathTextLabel') or bare==posixpath.basename(oldbase) or bare==oldbase.lstrip('./') or bool(re.fullmatch(r'(?:[\w.-]+/)*[\w.-]+\.md(?:#[^ ]+)?',bare))
            if pathlabel:label=('`'+out+'`') if label.startswith('`') and label.endswith('`') else out
            new=('!' if e['matchedExpression'].startswith('!') else '')+'['+label+']('+out+')'
        elif len(e['references'])>1:
            outs=[]
            for ref in e['references']:
                b=ref.split('#')[0]
                if not b.startswith('docs/architect/'):
                    park(e,'Brace members lack a verified same-path mirror; Step 3 whole-unit rewrite');return
                d=b.replace('docs/architect/','docs/platform/',1)
                if not p.exists(d):park(e,'Brace member lacks unique same-path committed mirror');return
                outs.append(d)
            new='{'+','.join(outs)+'}'
        else:new=out
        e['cutoverPatch']={'old':e['matchedExpression'],'new':new,'timing':'Phase 9 only','operation':'replace complete reference unit','prerequisites':['Step 3 semantic approval','A47 final target conservation','Step 6 evidence parity when applicable']}
    def locators(e,line):
        # Bind only the path's adjacent clause/link label; unrelated sibling citations do not leak.
        expr=e['matchedExpression'];at=line.find(expr)
        scope=e.get('label','')+' '+line[max(0,at-120):at+len(expr)+180]
        if '**CoordinationSession' in line:return ['CoordinationSession']
        tokens=re.findall(r'\bRUL\d+[a-z]?\b|\bV-\d{3}\b|\bAC-I\d+\b|§\s*\d+(?:\.\d+)*|§\s*[A-Za-z][\w .-]{1,50}|Data Dictionary(?:\s+(?:row\s*)?#?\d+)?|decision\s+00\d+|quyết định\s+00\d+',scope,re.I)
        if not tokens:
            tokens=[x for x in re.findall(r'\*\*([^*]{4,160})\*\*|[“"]([^”"\n]{4,120})[”"]',scope) for x in x if x and not re.search(r'docs/|\.md',x)]
        if not tokens and re.search(r'\b\d+(?:[.,]\d+)?\s*(?:Ki?B|bytes?|lines?|dòng)\b',scope,re.I):tokens=['size/content claim']
        return list(dict.fromkeys(t.strip().rstrip(' .,:;') for t in tokens))
    @functools.lru_cache(None)
    def locate(base,tokens):
        area=posixpath.basename(base).removesuffix('.md')
        if area=='distribution':area='packaging-distribution'
        if area=='confinement-authority':area='agent-confinement'
        pool=[f for f in candidates if f.startswith('docs/platform/'+area+'/')]
        if not pool:pool=candidates
        # Explicit promotion statements identify renamed content files.
        promoted=list(promoted_for(base))
        if promoted:pool=list(dict.fromkeys(promoted+pool))
        results=[]
        for token in tokens:
            pattern=re.escape(token).replace(r'\ ',r'\s*')
            if token.lower().replace(' ','')=='§envelope':pattern=r'^##\s+(?:[0-9.)]+\s+)?(?:envelope\b|.*Unified Envelope\b)'
            elif token.lower().startswith('data dictionary'):pattern=r'^\s*#{1,6}\s+.*\bData Dictionary\b'
            elif token.startswith('§'):pattern=r'^\s*#{1,6}\s+(?:[0-9.]+\s*)?'+re.escape(token[1:].strip())+r'(?:[.)\s]|$)'
            elif token.lower().startswith(('decision ','quyết định ')):pattern=r'^\s*#{1,6}\s+'+token.split()[-1]+r'\b'
            elif token.startswith('RUL'):pattern=r'\b'+re.escape(token)+r'\b'
            elif token=='CoordinationSession':pattern=r'^#+\s+CoordinationSession.*Lịch sử'
            matches=[]
            for f in pool:
                if not re.search(pattern,text(f),re.I|re.M):continue
                for n,l in enumerate(linesof(f),1):
                    if re.search(pattern,l,re.I):
                        a=section(f,n)
                        if a:matches.append((f,a,live(f,a),n))
            # Prefer a defining heading/rule at the promoted spec over incidental history mentions.
            defining=[]
            for f,a,lv,n in matches:
                l=linesof(f)[n-1]
                if re.match(r'^\s*(?:#{1,6}\s+|[-*]\s+\*\*)'+re.escape(token)+r'\b',l,re.I) or token.startswith(('§','decision ','quyết định ')):defining.append((f,a,lv,n))
            if defining:matches=defining
            livehits={(f,a['anchor']):(f,a) for f,a,lv,n in matches if lv}
            # A unique live spec beats copies in architecture/decision narratives.
            specs={k:v for k,v in livehits.items() if k[0].endswith('/spec.md')}
            if len(specs)==1:livehits=specs
            if len(livehits)!=1:
                historyhits=[(f,a) for f,a,lv,n in matches if not lv]
                return None,historyhits[0] if historyhits else None
            results.append(next(iter(livehits.values())))
        if len({(f,a['anchor']) for f,a in results})==1:return results[0],None
        return None,None
    def locate_lines(e,base):
        m=re.search(r':(\d+)(?:-(\d+))?$',e['normalizedReference'].split('#')[0])
        if not m or not p.is_file(base):return None,None
        first,last=int(m[1]),int(m[2] or m[1]);source=text(base).splitlines()
        if first<1 or last>len(source) or last<first:return None,None
        passage=[l.strip() for l in source[first-1:last] if len(l.strip())>15]
        hits=[];carriers=[]
        if passage:
            area=posixpath.basename(base).removesuffix('.md')
            area={'distribution':'packaging-distribution','confinement-authority':'agent-confinement'}.get(area,area)
            for f in candidates:
                if not f.startswith('docs/platform/'+area+'/'):continue
                ls=linesof(f)
                starts=[i for i,l in enumerate(ls) if l.strip()==passage[0]]
                for i in starts:
                    tail='\n'.join(ls[i:i+(last-first+5)])
                    if all(l in tail for l in passage):
                        a=section(f,i+1)
                        if a:(hits if live(f,a) else carriers).append((f,a))
        unique={(f,a['anchor']):(f,a) for f,a in hits}
        return (next(iter(unique.values())) if len(unique)==1 else None),(carriers[0] if carriers else None)
    for e in c['entries']:
        ls,line,h,block=source(e);base=re.sub(r':\d+(?:-\d+)?$','',e['normalizedReference'].split('#')[0]);f=e['consumerPath'];n=e['line'];ctx=block['text']
        tokens=locators(e,line);e['locatorTokens']=tokens
        # Per-class audit records all rules that apply, and the final precedence winner.
        classes=[]
        existing=p.exists(base);retiring=base.startswith(('docs/specs/','docs/architect/'))
        samepath=base.replace('docs/architect/','docs/platform/',1)
        related_start=max((i for i,l in enumerate(ls[:n]) if l.strip()=='Related:'),default=-1)
        isrelated=line.strip().startswith('Related:') or bool(related_start>=0 and re.match(r'^\s*[-*]\s',line) and all(not l.strip() or re.match(r'^\s*[-*]\s',l) for l in ls[related_start+1:n]))
        historical=bool(re.search(r'Output created|in this real case|it passed verify|were non.executable|dated (?:audit|log)|Audit erratum|earlier revisions|was (?:created|removed|changed|added)|were (?:created|removed|changed)|had (?:been|no)|Corrections in this candidate|referent preserved|complete retained legacy direct section|before the correction|completed|closed question|correction note|lineage|Historical Document Split',line+' '+h,re.I))
        historical=historical or bool(re.search(r'Output created|it passed verify|in this real case|was (?:created|removed|changed|added)|were (?:created|removed|changed)|already documented|verbatim quotation|quoted (?:plan|text)|the footprint is a single file|had to read',ctx,re.I))
        historical=historical or ('discussion-log' in f and bool(re.search(r'\b20\d\d[-/]\d\d|Output|propos',ctx,re.I)))
        historical=historical or bool(re.search(r'closed questions|resolved questions|audit evidence|past actions|historical.*(?:shape|split|tree)|errata',h,re.I))
        histbody=historyfile(f) and not p.history_header(f,ls,n)
        if re.search(r'\bretired.decision|/decisions/',f) and not p.history_header(f,ls,n):histbody=True
        carri=carriage(f,n)
        if tokens==['CoordinationSession'] and 'see ' in line.lower():historical=False;histbody=False;carri=False
        migration=bool(re.search(r'Canonical for:.*(?:Nothing until promotion|current source remains)|Transitional Status|Migration status|legacy source during migration|legacy roots.*(?:active|until)|still the full legacy map|current source remains|Canonical until|legacy.*remain.*until',line+' '+h,re.I))
        migration=migration or bool(f.endswith('platform-foundations.md') and 'Law Summary' in h and '| ' in line) or bool('switchboard' in f and re.search(r'^2\.|principle 2|docs/specs/<',line,re.I))
        generic=bool(re.search(r'docs/specs/<[^>]+>\.md',line))
        migration=migration and not historyfile(f)
        migexisting=e['rule']=='migration-state' and not historyfile(f)
        lineage=bool(re.search(r'Preserved from|\|\s*source (?:architecture|plan|spec|document)\s*\||Source relationship:|Provenance:',line,re.I))
        superseded=bool(re.search(r'Superseded by:',line,re.I))
        doctorclaim=base=='docs/specs/distribution.md' and bool(re.search(r'doctor.*default.*read.only|default.*doctor.*read.only',line,re.I))
        contractdrift='confinement-authority.v1' in line and 'CTR011' not in line and bool(re.search(r'CTR010',line))
        legacy_sentence=bool(re.search(r'Legacy.*(?:only changes at|chỉ đổi tại|chi doi tai).*Phase 9|old path remains historical source material|legacy.*tree.*(?:organi|tổ chức)',line,re.I))
        checker=bool(e['rule']=='checker-scope' or re.search(r'citation.drift',f) and re.search(r'scope|R1|scan',line,re.I))
        runtime=base=='docs/contracts/fgos-gateway-api-v1.yaml' and not (f.endswith(('.yaml','.yml')) and line.lstrip().startswith('#'))
        helptext=f.startswith('docs/knowledge/') and '--scope' in ctx and bool(re.search(r'cli-004|cli-008|free.form|slug',ctx,re.I))
        # Correct the generator claim rather than inheriting GENERATED FILE headers.
        if f=='docs/backlog.md':
            classes.append(4);e['sourceVsRender']='retained source';e['sourcePath']=f;e['role']='reader'
            if e['rule']=='generated':setrow(e,'navigation','cutover-patch-only' if e.get('desiredOwner') else 'preserve-pending-target','L12-26 hand-maintained backlog; no renderer')
        elif f=='docs/knowledge/decisions-index/decision-record.md':
            classes.append(4);e['role']='reader';e['sourcePath']=f;e['sourceVsRender']='retained source';setrow(e,'frozen-rename-history','preserve','L12-26 frozen rename copy, no live renderer');historical=True
        if f in ('docs/doc-registry.md','docs/doc-registry.json'):
            classes.append(4);e['sourcePath']='src/report/knowledge-projection.mjs'
        if f=='docs/ui-spec/generated/wireframe-v2.html':classes.append(4);e['sourcePath']='.claude/skills/ui-spec/tools/interpret-wireframe.mjs'
        if f.endswith(('.yaml','.yml')) and line.lstrip().startswith('#'):
            classes.append(4);e['role']='reader';setrow(e,'navigation','cutover-patch-only' if e.get('desiredOwner') else 'preserve-pending-target','YAML comment is prose, not contract data')
        if e['rule']=='provenance' and p.actual_pin(line) and not lineage and not historical and not histbody and not carri and not re.search(re.escape(e['matchedExpression'])+r'[^;\n]{0,30}(?:at|commit|blob)\s+`?[0-9a-f]{7,40}',line,re.I) and not re.search(r'^(?:[- >]*)(?:Source|Provenance)|\|\s*(?:source|proof)',line,re.I):
            classes.append(9);setrow(e,'navigation','cutover-patch-only' if e.get('desiredOwner') else 'preserve-pending-target','Nearby pin does not attach to this plain reference')
        if retiring and not tokens and e['rule'] in ('navigation','operative-read'):
            promoted=list(promoted_for(base))
            if len(promoted)==1:exact(e,promoted[0]);classes.append(1)
        generated=e['rule']=='generated'
        if not generated and not e.get('leadOverride') and e['role']!='writer/check':
            if checker or runtime or helptext:
                classes.append(9);e['role']='behavioral';setrow(e,'checker-scope' if checker else 'runtime-reader' if runtime else 'behavioral-help-text','preserve-pending-behavioral-proof','Step 5 changes live reader/check/help contract and docs together')
            elif contractdrift:
                classes.append(1);park(e,'Contract id differs at target registry: confinement-authority.v1 is CTR011; Step 3 whole-sentence decision')
                e['semanticRowProposal']={'old':line,'new':line.replace('CTR010','CTR011'),'timing':'Step 3 candidate only','executionAuthority':False}
            elif migration or generic or migexisting:
                classes.append(6);setrow(e,'migration-state','phase9-row-flip','L12-26 authority/status changes as a whole row, never path substitution or self preserve');e['phase9Flip']='status only' if base in ('docs/backlog.md','docs/reading-map.md','docs/doc-registry.md') or base.startswith(('docs/contracts/','docs/ui-spec/')) else 'exact spec.md owner for work-state/runner/distribution; Step 3 flip value for enduser-docs/component-boundary/contracts'
            elif legacy_sentence and not carri:
                classes.append(6);park(e,'L12-26 sentence about legacy file/tree itself; Step 3 whole-sentence decision')
            elif lineage:
                classes.extend([5,8]);setrow(e,'provenance','preserve','L12-26 source/lineage cells preserve historical referent')
            elif isrelated and not carri:
                classes.append(8);setrow(e,'navigation','cutover-patch-only' if e.get('desiredOwner') else 'preserve-pending-target','L12-26 live wrapper Related list outside snapshot')
            elif superseded:
                classes.append(8);setrow(e,'provenance' if historyfile(f) else 'navigation','preserve' if historyfile(f) else 'cutover-patch-only','L12-26 Superseded by preservation only on History files')
            elif e['rule']=='provenance':
                classes.append(5);setrow(e,'provenance','preserve','Authenticated source column/pinned citation preserved; nearby pins were separately rejected')
            elif carri or historical or histbody:
                classes.append(5);setrow(e,'verbatim-carriage' if carri else 'historical-narrative','preserve','L12-26 completed past action / retained history witness')
                if carri:e['carriagePolicy']={'preserveWithoutAlias':True,'phase9LinkCheck':'exclude verbatim carriage region; Phase 9 computes its own baseline'}
            elif existing and not retiring and not any(a.get('approved') is True and a.get('retireSource') is True for a in aliasby.get(base,[])):
                classes.append(3);setrow(e,'retained-reference','preserve','L12-26 committed retained file; no explicit approved Phase 6 retirement alias',base)
            elif re.search(r'Legacy.*only changes at Phase 9|legacy.*(?:tree|file).*organi|old path remains historical',line,re.I):
                classes.append(6);park(e,'L12-26 sentence about legacy file/tree itself; Step 3 semantic decision')
            elif doctorclaim:
                classes.append(1);target='docs/platform/packaging-distribution/contracts/setup-doctor-registry.md'
                a=next((a for a in anchors.get(target,[]) if a.get('kind')=='heading' and 'Implementation Evidence' in a.get('text',a.get('title',''))),None)
                if not a:a=section(target,128)
                if a and live(target,a):exact(e,target,a)
                else:park(e,'Doctor default-path evidence has no committed live contract passage')
            elif (tokens or re.search(r':\d+(?:-\d+)?$',e['normalizedReference'])) and retiring:
                classes.append(1);target,carrier=locate_lines(e,base)
                if not target and tokens==['size/content claim']:
                    area=posixpath.basename(base).removesuffix('.md');area={'distribution':'packaging-distribution','confinement-authority':'agent-confinement'}.get(area,area)
                    spec='docs/platform/'+area+'/spec.md'
                    hs=[a for a in anchors.get(spec,[]) if a.get('kind')=='heading' and not a.get('anchor','').startswith('added-in-candidate')]
                    if hs and live(spec,hs[0]):target=(spec,hs[0])
                if not target and tokens:target,carrier=locate(base,tuple(tokens))
                if target:exact(e,*target)
                else:park(e,'L12-26 locator lacks unique live passage; Step 3 exact target required',carrier[0]+'#'+carrier[1]['anchor'] if carrier else None)
            elif e['rule']=='retired-checkpoint-write' and p.is_file(samepath) and live(samepath):
                classes.append(9);exact(e,samepath)
        if base in ('docs/specs/enduser-docs-authoring.md','docs/specs/enduser-docs-index.md','docs/specs/platform-foundations.md','docs/specs/workflow.md') and e['cutoverAction'] in ('cutover-patch-only','preserve-pending-target'):
            classes.append(9);park(e,'P8-DOC-GAP-02 / L12-27: no Phase 6 destination; Step 3 carry before retirement, owner for delete-without-carry')
        if not existing and (posixpath.basename(base).startswith('0012-') or base.startswith(('docs/how-to/','docs/explanation/','docs/decisions/','docs/reference/','docs/tutorials/','docs/history/'))):
            classes.append(2);found=successor(base)
            if found:
                if posixpath.basename(base).startswith('0012-'):
                    a=next((a for a in anchors.get(found,[]) if 'ADR 0012 Unified' in a.get('text',a.get('title',''))),None)
                    if not a:a=next((a for a in anchors.get(found,[]) if (a.get('githubSlug') or '').startswith('8-adr-0012')),None)
                    if a:found+='#'+a['anchor']
                note(e,found,'L12-26 registry aliases and committed moved-file lookup; name drift recorded; lookup only')
            elif not e.get('successorNote'):note(e,None,'Exact committed successor unresolved; Step 3 lookup')
            if e['cutoverAction']=='cutover-patch-only':park(e,'Moved before cutover; Step 3 exact consumer patch',found)
        if '*' in base and not re.search(r'<[^>]+>',base):
            classes.append(9);directory=base[:base.index('*')].rstrip('/')
            while directory and not p.is_dir(directory):directory=posixpath.dirname(directory)
            e['globDirectory']=directory or None;e.pop('successorNote',None)
            if directory:e['desiredOwner']=directory;e['desiredAnchor']=None
            if directory and e['cutoverAction']=='cutover-patch-only':park(e,'Glob tree statement; Step 3 whole expression semantic choice')
        # Retention is a target contract; wrapper navigation cannot retire a path.
        if existing and not retiring and e['rule'] in ('navigation','operative-read','retained-reference') and e['cutoverAction'] in ('cutover-patch-only','preserve-pending-target') and not any(a.get('approved') is True and a.get('retireSource') is True for a in aliasby.get(base,[])):
            classes.append(3);setrow(e,'retained-reference','preserve','L12-26 retained committed path in every wrapper context',base)
        # Never patch into carriage or an unrelated area portal for a retired single document.
        dest=e.get('desiredOwner');anc=e.get('desiredAnchor')
        if e['cutoverAction']=='cutover-patch-only' and dest:
            a=next((a for a in anchors.get(dest,[]) if a['anchor']==anc or a.get('githubSlug')==anc),None) if anc else None
            if not live(dest,a) and p.is_file(dest):
                classes.append(5);park(e,'Candidate target is history/carriage; root authority stays retained',dest+('#'+anc if anc else ''))
            elif dest.endswith('/README.md') and not base.endswith('/README.md') and base.startswith('docs/architect/') and not p.is_dir(base):
                carriers=[f for f in candidates if historyfile(f) and posixpath.basename(f)==posixpath.basename(base)]
                if carriers:classes.append(9);park(e,'Retired single document only has carriage; portal cannot replace exact content',carriers[0]+('#literal-snapshot' if 'Literal Snapshot' in text(carriers[0]) else ''))
        if e['cutoverAction']=='cutover-patch-only' and e.get('desiredOwner')==f:
            classes.append(8);setrow(e,'lineage-self-reference','preserve','Self-reference / same Related list lineage, not executable')
        if isrelated and e['cutoverAction']=='cutover-patch-only':
            dest=e.get('desiredOwner');start=n-1
            while start>=0 and ls[start].strip()!='Related:':start-=1
            related=[]
            if start>=0:
                for item in ls[start+1:]:
                    if item.strip() and not re.match(r'^\s*[-*]\s',item):break
                    related.extend(p.norm(f,m[0].strip('`')) for m in p.TOKEN.finditer(item))
            if dest and dest in related:setrow(e,'lineage-existing-related','preserve','Target already present in Related list; preserve lineage; Phase 9 broken-link baseline')
        if e['rule'].startswith('lineage-') and base.startswith(('docs/specs/','docs/architect/')):
            e['phase9BaselineCarry']='Preserved Related/self lineage to a retiring source; include in the Phase 9 broken-link baseline'
        # A shell fence is a single command unit. Park it as a unit pending Step 5.
        start=block.get('startLine',n);body='\n'.join(ls[max(0,start-1):block.get('endLine',n)])
        if e['cutoverAction'] in ('cutover-patch-only','preserve-pending-target') and command_block(body):
            classes.append(7);e['commandUnit']={'startLine':start,'endLine':block['endLine'],'sha256':p.sha(body.encode())};e['role']='behavioral';setrow(e,'command-unit','preserve-pending-behavioral-proof','Fenced shell command decided as one unit in Step 5')
        rewrite(e)
        if e['cutoverPatch']:classes.append(7)
        if e.get('carriagePolicy') and e['rule']!='verbatim-carriage':e.pop('carriagePolicy',None)
        e['blockedStatus']='blocked' if 'pending' in e['cutoverAction'] else 'proposed-only' if e['cutoverPatch'] else 'row-flip-pending' if e['cutoverAction']=='phase9-row-flip' else 'preserved'
        e['l12_26Classes']=sorted(set(classes))
        e.pop('mechanicalTargetCheck',None)
        # Class 10 records cause, never claims that this census is the whole baseline.
        if e['syntax']=='markdown-link' and not p.exists(base) and not re.search(r'[<>*{}]',base):
            origin=re.search(r'Provenance:\s*(docs/\S+?)(?:\s+at|;|$)',text(f)[:3000])
            priorbase=p.norm(origin[1],e.get('destination','')) .split('#')[0] if origin and e.get('destination') else None
            reason='broken by relocation into verbatim history' if priorbase and p.exists(priorbase) and ('/history/' in f or e.get('carriagePolicy')) else 'pre-existing missing target' if priorbase and not p.exists(priorbase) else 'missing in input tree; Phase 9 determines inherited baseline'
            e['brokenLinkCause']=reason;e['l12_26Classes']=sorted(set(e['l12_26Classes']+[10]))
    # Extend successor lookup to effective class-1/2 overlays without changing precedence witnesses.
    c['overlaySuccessorNotes']=[]
    for control in c['overlayControls']:
        row=next(x['row'] for x in c['overlayEffectiveRows'] if x['baseKey']==control['baseKey'])
        ref=row.get('normalizedReference','');base=ref.split('#')[0]
        if base and not p.exists(base):
            found=successor(base)
            if found:c['overlaySuccessorNotes'].append({'controlId':control['controlId'],'successor':found,'executable':False,'effectiveSha256':control['effectiveSha256']})
    c['earlierClassSuccessorNotes']=[]
    effective={tuple(x['baseKey']):x['row'] for x in c['overlayEffectiveRows']}
    for table in ('step-02-census-instructions.json','step-02-census-skills-prompts.json'):
        data=p.load(table)
        for original in data['entries']:
            row=effective.get((str(p.R.relative_to(p.ROOT)/table),original['edgeId']),original)
            ref=row.get('normalizedReference','');base=ref.split('#')[0]
            if not base or p.exists(base) or re.search(r'[<>*{}]',base):continue
            found=successor(base)
            if found:c['earlierClassSuccessorNotes'].append({'sourceTable':table,'edgeId':row['edgeId'],'consumerPath':row['consumerPath'],'reference':ref,'effectiveRowSha256':p.sha(p.encoded(row)),'successor':found,'executable':False})
    c['earlierClassProposals']=[]
    notes={x['controlId']:x for x in c['overlaySuccessorNotes']}
    for control in c['overlayControls']:
        row=next(x['row'] for x in c['overlayEffectiveRows'] if x['baseKey']==control['baseKey'])
        original=row.get('cutoverAction','');action='cutover-patch-only' if original=='exact-cutover-patch' else original
        patch=row.get('cutoverPatch');base=row.get('normalizedReference','').split('#')[0]
        blocked=row.get('status')=='blocked' or 'pending' in action
        if blocked:action='preserve-pending-target';patch=None
        if p.exists(base) and not base.startswith(('docs/specs/','docs/architect/')) and action in ('cutover-patch-only','preserve-pending-target'):
            action='preserve';patch=None;blocked=False
        c['earlierClassProposals'].append({'controlId':control['controlId'],'historicalEffectiveSha256':control['effectiveSha256'],'cutoverAction':action,'cutoverPatch':patch,'blockedStatus':'blocked' if blocked else 'proposed-only' if action=='cutover-patch-only' else 'preserved','successorNote':notes.get(control['controlId']),'executionAuthority':False})
    c['overlayControlPolicy']='Raw overlay rows are immutable historical witnesses. Phase 9 uses earlierClassProposals, with candidate-only/blocked status and additive successor notes; no historical exact-cutover-patch row is executable.'
    # Recheck every target and note from the input tree, including generated anchors.
    checks={}
    def check(ref):
        if ref in checks:return checks[ref]
        f,_,a=ref.partition('#');aa=next((x for x in anchors.get(f,[]) if x['anchor']==a or x.get('githubSlug')==a),None) if a else None
        failures=[] if p.exists(f) else ['missing-target']
        if a and not aa:failures.append('missing-anchor')
        checks[ref]={'owner':f,'anchor':a or None,'exists':p.exists(f),'anchorExists':not a or bool(aa),'sha256':p.sha(p.read(f)) if p.is_file(f) else None,'failures':failures}
        if aa:checks[ref]['passage']={'startLine':aa['startLine'],'endLine':aa['endLine']}
        return checks[ref]
    for e in c['entries']:
        if e.get('desiredOwner'):
            ref=e['desiredOwner']+('#'+e['desiredAnchor'] if e.get('desiredAnchor') else '');e['mechanicalTargetCheck']=check(ref)
            if e['cutoverPatch'] and e['mechanicalTargetCheck']['failures']:park(e,'Committed target/anchor check failed');e['blockedStatus']='blocked'
        if e.get('successorNote',{}).get('successor'):e['successorNote']['mechanicalCheck']=check(e['successorNote']['successor'])
    c['targetChecks']=checks;c['parserVersion']=6
    c['counts'].update(edges=len(c['entries']),rules=dict(collections.Counter(e['rule'] for e in c['entries'])),actions=dict(collections.Counter(e['cutoverAction'] for e in c['entries'])))
    c['classStatus']='class 3 consolidated L12-26; Step 2 OPEN; no class-4 work in this batch'
    return overlay_bindings(p,merge_lineage(p,help_proposals(p,c)))


def help_proposals(p,c):
    """Rebind the two named earlier CLI help rows; no new code-class census."""
    table='step-02-census-cli-help.json';old=p.load(table);rows=[]
    for prior in old['entries']:
        if prior['edgeId'] not in ('cli-004','cli-008'):continue
        path=prior['consumerPath'];raw=p.read(path);lines=raw.decode().splitlines()
        matches=[(n+1,l) for n,l in enumerate(lines) if l.strip()==prior['callSite'].strip()]
        if len(matches)!=1:raise ValueError('CLI help passage correspondence not unique: '+prior['edgeId'])
        n,line=matches[0]
        rows.append({'edgeId':prior['edgeId'],'sourceTable':table,'consumerPath':path,'fileDigest':p.sha(raw),'line':n,'callSite':line,'callSiteSha256':p.sha(line.encode()),'role':'behavioral','rule':'free-form-scope-help-text','cutoverAction':'preserve-pending-behavioral-proof','blockedStatus':'blocked','cutoverPatch':None,'candidateText':line.replace('docs/specs/<area>.md','a free-form platform area slug'),'executionAuthority':False,'reason':'L12-26 class 9: scope is a free-form slug, not a filesystem path; Step 5 pairs help text with behavior, no executable patch','beforeSha256':p.sha(p.encoded(prior))})
    c['earlierClassHelpProposals']=rows
    return c


def merge_lineage(p,c):
    """Reuse the packet's source join to rebind historical row lineage after main drift."""
    import importlib.util
    spec=importlib.util.spec_from_file_location('lineage_join',p.R/'step-02j-packet.py')
    packet=importlib.util.module_from_spec(spec);spec.loader.exec_module(packet)
    old=p.load('step-02i-census-maps-portals-prose.json')
    digests={f['path']:f['sha256'] for f in old['files']}
    changed={f['path'] for f in c['files'] if f['path'] in digests and f['sha256']!=digests[f['path']]}
    previous=[e for e in old['entries'] if e['consumerPath'] in changed]
    current=[e for e in c['entries'] if e['consumerPath'] in changed]
    joins=packet.source_join(previous,current)
    for e in current:e['priorRows']=[]
    controls=[]
    for before in previous:
        for after in joins[before['edgeId']]:
            seen={x['rowId'] for x in after['priorRows']}
            after['priorRows']+= [x for x in before['priorRows'] if x['rowId'] not in seen]
        controls.append({'controlId':'merge-lineage-'+before['edgeId'],'beforeEdgeId':before['edgeId'],'consumerPath':before['consumerPath'],'beforeFileDigest':before['fileDigest'],'reference':before['normalizedReference'],'beforeCallSiteSha256':before['callSiteSha256'],'afterEdgeIds':[x['edgeId'] for x in joins[before['edgeId']]],'status':'source correspondence rebound' if joins[before['edgeId']] else 'no unique current correspondence; historical row remains mandatory review'})
    index=collections.defaultdict(list)
    for e in c['entries']:
        for row in e['priorRows']:index[row['rowId']].append(e['edgeId'])
    for row in c['priorReconciliation']:
        row['edgeIds']=index[row['priorRowId']]
        if any(row['priorRowId']==x['rowId'] for e in previous for x in e['priorRows']):row['disposition']='L12-27 merged-source lineage rebound through complete reference/call-site identity; no same-line-only approval' if row['edgeIds'] else 'Input source changed; no unique current correspondence; retain historical row for review'
    c['mergePriorJoinRebindings']={'changedFiles':sorted(changed),'controls':controls,'unmatched':sum(not x['afterEdgeIds'] for x in controls),'rule':'Existing packet source_join, full reference/call-site content before physical overlap; unmatched source drift stays explicit, never labelled a code exclusion'}
    return c


def command_block(body):
    """Language-tagged or recognizably shell-shaped fence; pasted prompts stay prose."""
    if re.search(r'^\s*```(?:sh|bash|shell)\s*$',body,re.M):return True
    prompt=re.search(r'(?:^|\n)\s*(?:TASK|SCOPE_DOCS|CONTEXT_DOCS|PROMPT|PERSISTENT STATE)\s*:',body,re.I)
    return bool(not prompt and re.search(r'^\s*```\s*$',body,re.M) and re.search(r'^\s*(?:\$\s+)?(?:find|rg|node|npm|fgos|git|mkdir|test -s)\s',body,re.M))


def overlay_bindings(p,c):
    """Authenticate immutable pre-main witnesses, then bind current source by passage."""
    import subprocess
    oldcommit=p.load('step-02i-census-maps-portals-prose.json')['inputHEAD']
    cache={};effective={tuple(x['baseKey']):x['row'] for x in c['overlayEffectiveRows']};bindings=[]
    def historical(f):
        if f not in cache:
            assert not any(x in f.split('/') for x in ('.fgos','.bee'))
            cache[f]=subprocess.check_output(['git','show',oldcommit+':'+f],cwd=p.ROOT)
        return cache[f]
    for control in c['overlayControls']:
        row=effective[tuple(control['baseKey'])];f=row.get('consumerPath',row.get('path'))
        if not f:continue
        old=historical(f);assert not row.get('fileDigest') or p.sha(old)==row['fileDigest'],('historical overlay file digest',control['controlId'])
        oldlines=old.decode().splitlines();spans=row.get('physicalSpans') or ([{'line':row['line'],'columnStart':row['columnStart'],'columnEndExclusive':row['columnEndExclusive'],'text':row['matchedExpression']}] if all(k in row for k in ('line','columnStart','columnEndExclusive','matchedExpression')) else [])
        for s in spans:assert oldlines[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1]==s['text'],('historical overlay span',control['controlId'])
        now=p.read(f);lines=now.decode().splitlines();candidates=[]
        if spans:
            original=oldlines[spans[0]['line']-1]
            for n,line in enumerate(lines,1):
                if line!=original:continue
                delta=n-spans[0]['line'];resolved=[{**s,'line':s['line']+delta} for s in spans]
                if all(1<=s['line']<=len(lines) and lines[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1]==s['text'] for s in resolved):candidates.append(resolved)
        # Exact source passage precedes token fallback; no same-ordinal match.
        if len(candidates)!=1 and spans:
            us,_=p.units(f,now.decode());ref=row.get('normalizedReference','').rstrip(':')
            hits=[u for u in us if ref in u['references']]
            if len(hits)==1:candidates=[hits[0]['physicalSpans']]
        resolved=candidates[0] if len(candidates)==1 else []
        bindings.append({'controlId':control['controlId'],'consumerPath':f,'historicalInputCommit':oldcommit,'historicalFileSha256':p.sha(old),'historicalSpansVerified':True,'historicalEffectiveSha256':control['effectiveSha256'],'currentFileSha256':p.sha(now),'physicalSpans':resolved,'matchedExpression':''.join(s['text'] for s in resolved),'status':'bound by complete passage' if resolved or not spans else 'no unique current passage; historical witness retained for mandatory review','approvalCarried':False})
    c['overlaySourceBindings']=bindings
    byid={b['controlId']:b for b in bindings}
    for proposal in c['earlierClassProposals']:
        if str(proposal.get('cutoverAction','')).startswith('Step 5 parity-gated'):
            candidate=(proposal.get('cutoverPatch') or {}).get('new')
            proposal.update(cutoverAction='preserve-pending-behavioral-proof',cutoverPatch=None,blockedStatus='blocked',candidateText=candidate)
        b=byid.get(proposal['controlId'])
        if b and b['status'].startswith('no unique'):
            proposal.update(cutoverAction='preserve-pending-target',cutoverPatch=None,blockedStatus='blocked')
    return c
