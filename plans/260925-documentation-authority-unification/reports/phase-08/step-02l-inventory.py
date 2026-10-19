#!/usr/bin/env python3
"""Inventory-only extension of the copied 02j lexer; committed Git bytes only.
Print all three inventories as JSON; --class N prints only that class.
No writes, runtime tracing, target substitution or semantic patch generation.
"""
import sys
sys.dont_write_bytecode=True
import collections,importlib.util,json,posixpath,re
from pathlib import Path
R=Path(__file__).resolve().parent

def module(name):
    s=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
p=module('step-02l-parser')
SEED={x['path']:x['category'] for x in p.load('consumer-inventory.json')['consumerFiles']}
INITIAL={x['path'] for x in p.load('step-02i-class4-initial-census.json')['files']}
FORBIDDEN={'.fgos','.bee','.git','node_modules','target'}
DEFINITIONS={4:'generators/projections/checkers',5:'tests/fixtures',6:'runtime readers/writers including gateway, CLI help, setup/doctor default roots'}

def surface(path):
    parts=path.split('/')
    if path.startswith('archive/plans/'):return None
    if path.startswith('docs/history/') or path.startswith(('docs/architect/','docs/platform/')) and 'verification' in parts and len(parts)-parts.index('verification')-1>=2:return None
    if FORBIDDEN.intersection(parts) or path.startswith('plans/') or re.search(r'(?:^|/)(?:secrets?[^/]*|[^/]*\.env)(?:$|\.)',path,re.I):return None
    # Recorded initial class-4 membership is retained, even for frozen baselines.
    if path in INITIAL:return 4
    if SEED.get(path)=='tests-and-fixtures' or re.search(r'(?:^|/)(?:tests?|fixtures?|testdata|dogfood-fixture)(?:/|$)|(?:\.|-)test\.|\.spec\.',path):return 5
    if SEED.get(path) in ('generators-and-checks','generated-render') or path.startswith(('scripts/','src/report/','.agents/skills/','plugins/fgOS/skills/')) or re.search(r'(?:^|/)(?:generate[-_]|check[-_]|render[-_])',path):return 4
    if SEED.get(path) in ('cli-help','setup-doctor','runtime-and-comments') and not path.endswith('.md'):return 6
    if path.startswith('.claude/skills/') and '/tools/' in path:return 4
    if path.startswith(('src/','apps/','packages/','bin/','core/','domains/','.claude/skills/','.github/','.githooks/','plugins/')) and not path.endswith(('.md','.svg','.png','.jpg','.lock')):return 6
    if path in ('docs/decisions/index.md','docs/doc-registry.json','docs/doc-registry.md','docs/enduser-docs-index.json'):return 4
    if path.startswith('docs/') and not path.endswith(('.md','.svg','.png','.jpg','.jpeg','.pdf')):return 6
    if path in ('package.json','Cargo.toml','.gitignore'):return 6
    return None

# Conservative explicit call-site inventory. All joins/resolves/URLs are listed,
# even without a docs cue: indirect/configured roots are never guessed away.
DYNAMIC=re.compile(r'\b(?:[\w$]+\.)?(?:join|resolve|joinpath)\s*\(|\bnew\s+URL\s*\(|`[^`\n]*\$\{[^`\n]*`|\b(?:[\w$]*(?:root|dir|path|glob|scope)[\w$]*)\s*(?::|=|\?\?|\|\|)',re.I)
DOC_CUE=re.compile(r'docs(?:/|\\|\b)|specs|architect|contracts|reading.map|documentation|legacy',re.I)
SPLIT=re.compile(r'''(?P<call>(?:\b[\w$]+\.)?(?:join|resolve|joinpath)|\.join)\s*\(\s*["']docs["']\s*,\s*["'](?P<root>specs|architect|contracts|ui-spec|history|how-to|explanation|decisions|reference|tutorials|distillery)["'](?:\s*,\s*["'](?P<tail>[^"']*)["'])?''')

def role(path,line,klass,history=False):
    if history:return 'recorded-outcome'
    if re.match(r'^\s*(?://|#|/\*|\*)',line):return 'comment'
    if re.search(r'help|usage|description\s*:',line,re.I):return 'help-text'
    if klass==5:return 'fixture-literal'
    if re.search(r'write|mkdir|output|emit|render|generate|save',line,re.I):return 'writer'
    if re.search(r'default|(?:root|dir|path|glob|scope)\s*(?:=|:|\?\?|\|\|)',line,re.I):return 'default-root'
    return 'reader'

def span(text,a,b):
    before=text[:a];line=before.count('\n')+1;col=a-(before.rfind('\n')+1)+1
    out=[]
    for part in text[a:b].splitlines(keepends=True):
        clean=part.rstrip('\r\n');out.append({'line':line,'columnStart':col,'columnEndExclusive':col+len(clean),'text':clean});line+=1;col=1
    return out

def dynamic_units(path,text):
    result=[];seen=set()
    for m in DYNAMIC.finditer(text):
        n=text.count('\n',0,m.start())+1
        # One construction per physical call site; preserve full physical line.
        key=(n,m.start()-text.rfind('\n',0,m.start()))
        if key in seen:continue
        seen.add(key);end=min(len(text),m.start()+800)
        # Call sites get a bounded balanced expression, not a guessed target.
        stop=text.find('\n',m.start());stop=len(text) if stop<0 else stop
        expression=m[0] if m[0].startswith('`') else text[m.start():min(stop,m.start()+240)]
        if not m[0].rstrip().endswith('(') and not m[0].startswith('`'):
            expression=re.split(r'[,;]',expression,1)[0]
        if m[0].rstrip().endswith('('):
            depth=1;quote=None;escape=False;i=m.end()
            while i<end and depth:
                c=text[i]
                if escape:escape=False
                elif c=='\\':escape=True
                elif quote:
                    if c==quote:quote=None
                elif c in "'\"`":quote=c
                elif c=='(':depth+=1
                elif c==')':depth-=1
                i+=1
            expression=text[m.start():i]
        a=m.start();b=a+len(expression)
        context=text[max(0,text.rfind('\n',0,max(0,a-500))):min(len(text),b+500)]
        result.append({'physicalSpans':span(text,a,b),'matchedExpression':expression,'documentationCue':bool(DOC_CUE.search(context)),'status':'untraced construction; target not guessed','constructionKind':'template-string' if m[0].startswith('`') else 'path-call' if '(' in m[0] else 'config/default-root'})
    if path=='scripts/generate-shipped-path-inventory.mjs':
        # Lead ruling: ALLOWED_ROOTS bare docs is a default-root construction.
        for hit in re.finditer(r"['\"]docs['\"]",text):
            if 'ALLOWED_ROOTS' in text[max(0,hit.start()-200):hit.start()]:
                result.append({'physicalSpans':span(text,hit.start(),hit.end()),'matchedExpression':hit[0],'documentationCue':True,'status':'untraced construction; target not guessed','constructionKind':'config/default-root'})
    return result

def extract(path,text,klass,digest):
    lines=text.splitlines();state=p.document_states(text if path.endswith('.md') else re.sub(r'(?m)^#{1,6} ', '// ', text))
    units,excluded=p.units(path,text)
    # Code/import strings are data in behavioral classes; do not drop a relevant
    # relative path just because the prose lexer marked its code syntax excluded.
    units += [u for u in excluded if any(p.relevant(x) for x in u['references'])]
    # Behavioral runtime-relative and external absolute path literals have cwd
    # semantics. Record complete literal and repository suffix lookup explicitly.
    for hit in re.finditer(r'''(?:\./docs/|/(?:[^/\s`"'<>|()\[\],;]+/)+docs/)[^\s`"'<>|()\[\],;]+''',text):
        raw=hit[0].rstrip('.')
        ref=raw[raw.index('docs/'):]
        if p.relevant(ref):units.append({'physicalSpans':span(text,hit.start(),hit.start()+len(raw)),'matchedExpression':raw,'references':[ref],'syntax':'runtime-coordinate-literal','coordinateHint':'repository suffix existence only; runtime cwd/external coordinate untraced'})
    for hit in re.finditer(r'''docs/[^\s`"'<>|()\[\],;]+\+docs/[^\s`"'<>|()\[\],;]+''',text):
        refs=[p.norm(path,x) for x in hit[0].split('+') if x.startswith('docs/')]
        units.append({'physicalSpans':span(text,hit.start(),hit.end()),'matchedExpression':hit[0],'references':refs,'syntax':'compound-root-expression'})
    for m in SPLIT.finditer(text):
        ref='docs/'+m['root']+('/'+m['tail'] if m['tail'] else '/')
        units.append({'physicalSpans':span(text,m.start(),m.end()),'matchedExpression':m[0],'references':[posixpath.normpath(ref)],'syntax':'split-path-construction'})
    rows=[];keys=set()
    # region_state is the copied lexer authority for explicit carriage headings.
    for u in sorted(units,key=lambda u:(u['physicalSpans'][0]['line'],u['physicalSpans'][0]['columnStart'])):
        n=u['physicalSpans'][0]['line'];line=lines[n-1]
        for ref in u['references']:
            if not p.relevant(ref):continue
            key=(json.dumps(u['physicalSpans'],sort_keys=True),ref)
            if key in keys:continue
            keys.add(key)
            heading,carriage,_,_=state[n]
            history='/history/' in path or bool(re.search(r'Document type:\s*History|implementation history only', '\n'.join(lines[:45]),re.I))
            base=re.sub(r':\d+(?:-\d+)?$','',ref.split('#')[0]);pattern=bool(re.search(r'[*?{<]',base))
            lookup=base
            if pattern:lookup=re.split(r'[*?{<]',base)[0].rstrip('/')
            rows.append({'coordinateHint':u.get('coordinateHint','lexer-relative-to-consumer or repository literal'),'consumerPath':path,'physicalSpans':u['physicalSpans'],'matchedExpression':u['matchedExpression'],'legacyTarget':ref,'fileDigest':digest,'coarseClass':klass,'roleHint':role(path,line,klass,history),'carriageHistoryFlags':{'carriageRegion':carriage,'historyFile':history,'historyHeading':bool(re.search(r'history|lịch sử|recorded|changelog',heading,re.I))},'existenceAtInputCommit':{'literalTargetExists':p.exists(base),'checkedPath':lookup,'checkedPathExists':p.exists(lookup),'kind':p.TREE.get(lookup.rstrip('/'),{}).get('kind'),'patternOrPlaceholder':pattern},'syntax':u['syntax']})
    dynamic=[]
    for d in dynamic_units(path,text):
        n=d['physicalSpans'][0]['line'];dynamic.append({'consumerPath':path,'line':n,'columnStart':d['physicalSpans'][0]['columnStart'],'physicalSpans':[{k:v for k,v in x.items() if k!='text'} for x in d['physicalSpans']],'matchedExpression':d['matchedExpression'],'documentationCue':d['documentationCue'],'constructionKind':d['constructionKind'],'roleHint':role(path,lines[n-1],klass)})
    return rows,dynamic

def build():
    result={k:{'inputCommit':p.INPUT_COMMIT,'surfaceClass':k,'definition':v,'acceptance':'A51 inventory only; class and role advisory; no patch proposals','dynamicPolicy':'Conservative superset of path calls, template strings and configured/default roots; all untraced, including sites without nearby documentation cues. Targets not guessed. Dynamic file digests/classes inherit from files table/container.','files':[],'entries':[],'dynamicConstructions':[],'population':{'textFilesScanned':0,'nonTextFiles':[]}} for k,v in DEFINITIONS.items()}
    for path,item in sorted(p.TREE.items()):
        if item['kind']!='blob':continue
        klass=surface(path)
        if klass is None:continue
        raw=p.read(path)
        try:text=raw.decode('utf-8')
        except UnicodeDecodeError:
            result[klass]['population']['nonTextFiles'].append(path);continue
        if '\0' in text:
            result[klass]['population']['nonTextFiles'].append(path);continue
        d=result[klass];d['population']['textFilesScanned']+=1;digest=p.sha(raw)
        rows,dynamic=extract(path,text,klass,digest)
        if not rows and not dynamic and path not in INITIAL:continue
        for row in rows:row['edgeId']=f"class{klass}-l-{len(d['entries'])+1:06}";d['entries'].append(row)
        for row in dynamic:row['constructionId']=f"class{klass}-dynamic-{len(d['dynamicConstructions'])+1:06}";d['dynamicConstructions'].append(row)
        d['files'].append({'path':path,'sha256':digest,'bytes':len(raw),'edges':len(rows),'dynamicConstructions':len(dynamic)})
    for k,d in result.items():
        grouped=collections.defaultdict(list)
        for x in d['dynamicConstructions']:
            end=x['physicalSpans'][-1]
            grouped[x['consumerPath']].append([x['line'],x['columnStart'],end['line'],end['columnEndExclusive'],x['matchedExpression'],x['constructionKind'],x['documentationCue'],x['roleHint']])
        d['dynamicCallSiteColumns']=['line','columnStart','endLine','columnEndExclusive','matchedExpression','constructionKind','documentationCue','roleHint']
        d['dynamicConstructions']=[{'consumerPath':path,'fileDigest':next(f['sha256'] for f in d['files'] if f['path']==path),'callSites':rows} for path,rows in sorted(grouped.items())]
        d['counts']={'edges':len(d['entries']),'edgeFiles':len({x['consumerPath'] for x in d['entries']}),'files':len(d['files']),'dynamicConstructions':sum(len(x['callSites']) for x in d['dynamicConstructions']),'dynamicFiles':len({x['consumerPath'] for x in d['dynamicConstructions']})}
    return result
if __name__=='__main__':
    d=build();print(json.dumps(d[int(sys.argv[sys.argv.index('--class')+1])] if '--class' in sys.argv else d,ensure_ascii=False,sort_keys=True,separators=(',',':')))
