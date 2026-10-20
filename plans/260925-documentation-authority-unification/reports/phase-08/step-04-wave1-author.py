#!/usr/bin/env python3
"""Explicit Step 4 wave 1 authoring. Produces report records, never applies diffs."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,re,collections,copy
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m;PIN=q.PIN
SETS=q.BATCHES[:16]
# Whole physical consumers (including generated joins) are read, not just grep hits.
# Receipts preserve exact bytes, line counts, section framing, and current pin.
READS={}
def fullread(file):
 data=m.blob(PIN,file);assert (m.ROOT/file).read_bytes()==data
 body=data.decode();READS[file]={'file':file,'inputCommit':PIN,'digest':m.sha(data),'bytes':len(data),'lines':len(body.splitlines()),'headings':[{'line':i,'text':l} for i,l in enumerate(body.splitlines(),1) if re.match(r'^#{1,6} ',l)],'method':'Entire pinned blob read and decoded; every line traversed, every slot rebound; full context in review payload. Independent semantic review pending.'}
 return body

def spanunit(row):
 # A split class4/6 token is one complete reference despite several scheduling
 # slots. Repeated evidence prefixes remain an explicit multi-span preserve.
 refids={x['edgeId'] for x in row['inventoryRefs']}
 siblings=[x for x in q.POP['rows'] if x['bucket']=='step4' and x['file']==row['file'] and x['edgeId']==row['edgeId'] and x['kind']==row['kind']]
 if row['edgeId'].startswith(('class4-','class6-')):
  coords=sorted({q.canon(s):s for x in siblings for s in q.spans(x)}.values(),key=lambda x:(x['line'],x['columnStart']))
  if len(coords)>1 and all(coords[i]['line']+1==coords[i+1]['line'] for i in range(len(coords)-1)):return coords
 return q.spans(row)
def logical(spans):return re.sub(r'\n\s*(?://!?|\*|#|>)?\s*','', '\n'.join(s['text'] for s in spans))
def pathof(e):
 raw=e['logicalReference'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',raw)
 if link:raw=link[1]
 return re.sub(r':\d+(?:[-–]\d+)?$','',raw.split('#')[0]).rstrip(':')

def blank(row):
 ss=spanunit(row);e={'edgeId':row['edgeId'],'slotKey':q.slotkey({'file':row['file'],'edgeId':row['edgeId'],'line':row['binding'].get('oldLine',row['binding'].get('line')),'inventoryRefs':row['inventoryRefs']}),'inventoryRefs':row['inventoryRefs'],'consumerFile':row['file'],'renderOnly':q.isrender(row),'slotSourceSpans':q.spans(row),'sourceSpans':ss,'matchedExpression':'\n'.join(x['text'] for x in ss),'logicalReference':logical(ss),'disposition':'preserve','diffHunk':None,'reason':'','target':None,'anchor':None,'timing':'none','blockedReason':None,'dependency':None,'blockedCategory':None,'dependencyCategory':None}
 e['legacyPath']=pathof(e);e['inventoryOccurrences']=q.inventory_occurrences(e);return e

def preserve(e,body):
 n=e['sourceSpans'][0]['line'];passage=m.resolver.passage(body,e['sourceSpans'])
 if e['consumerFile'].startswith('archive/'):
  why='Archived plan/report records the original evidence destination or captured verification result. Preserve history/provenance exactly (L12-38/40/46), including original line locators and relative link labels; tree retires at Phase 9 where the cited path is under specs/architect. No current authority or post-cutover link acceptance is asserted.'
 elif e['consumerFile'].startswith('plugins/'):
  why='L12-58(3): headerless plugin is its own source owner, with no generator claiming it. This slot is historical decision evidence or the external-project history convention. Preserve the named history/capture identity, not a generated repair.'
 elif '/history/' in e['legacyPath'] or '<feature>' in e['legacyPath'] or '<id>' in e['legacyPath']:
  why='L12-10/38/40: preserve the external-project artifact convention or named historical implementation/decision evidence, including sibling CONTEXT/RESEARCH/DISCUSSION names. This does not prescribe this repository’s cutover layout.'
 else:
  why='L12-26/38: surviving native path, literal example, implementation provenance or captured contract reference; its runtime/reader behavior is outside this comment-only record and remains with Step 5. No authority-path rewrite is made.'
 e['reason']='A51, '+why+' Exact passage: '+repr(passage)

def witness(e,body,why):
 w=m.resolver.witness(m.resolver.resolve(PIN,e['legacyPath'],m.resolver.passage(body,e['sourceSpans'])),why)
 for g in w['hitGroups']:g['category']='citation-only' if g['liveCount'] else 'carriage' if g['carriageCount'] else 'dead'
 return w

def park(e,body,why,cat):
 e.update(disposition='parked',timing='none',blockedReason=why,dependency=why,blockedCategory=cat,dependencyCategory=cat,reason='A51, L12-30/31/32/58: '+why)
 e['searchWitness']=witness(e,body,why)

def patch(r,e,body,target,line,why,whole=False):
 tb=m.blob(PIN,target).decode();ts=tb.splitlines();sections=m.heading_sections(PIN,target)
 h=max((h for h in sections if h['startLine']<=line<=h['sectionEndLine']),key=lambda h:h['level']) if not whole else None
 anchor=h['anchor'] if h else None
 e.update(disposition='patch',target=target,anchor=anchor,timing='Phase 9',reason='A51, L12-7/30/31/32/58: '+why+' Phase 9 exact patch specification; current operative route remains unchanged until cutover.')
 key=e['slotKey'];replacement=m.form(e['logicalReference'],r['file'],target,anchor)
 r['checks']['relativeResolution'][key]={'replacement':replacement,'resolvedTarget':target,'targetCommit':PIN,'authorityStatus':'cutover-patch-only'}
 r['checks']['labelForm'][key]={'source':e['logicalReference'],'replacement':replacement,'method':'Step 3 form(); preserves path/relative/image/link-label form'}
 proof={'targetCommit':PIN,'targetDigest':m.sha(tb),'passage':ts[line-1],'targetEvidenceLine':line,'targetLines':[] if whole else [line],'targetLineText':[] if whole else [ts[line-1]],'sourceLocatorTokens':[]}
 if whole:proof['wholeFileJustification']=why+' Whole-file pointer spans the complete document.'
 r['checks']['anchors'][key]=proof
 r['checks']['coverage']['descriptionTruth'][key]={'sourcePassage':m.resolver.passage(body,e['sourceSpans']),'adjacentPassage':m.adjacent_passage(body,e['sourceSpans']),'target':target,'targetCommit':PIN,'targetDigest':m.sha(tb),'targetEvidence':[{'line':line,'text':ts[line-1]}],'comparisons':{k:{'verdict':'not-asserted','note':why} for k in ['counts','ports','defaults','verbFileLists','versions','shippedStatus']},'assessment':why}
 r['checks']['coverage']['writerTrace'][key]='read-only citation; no writer/default-root/schema/identity change'

def disposition(r,e,body):
 f=e['consumerFile'];path=e['legacyPath'];eid=e['edgeId'];passage=m.resolver.passage(body,e['sourceSpans'])
 if e['renderOnly']:
  e['reason']='A51, L12-58: render/projection occurrence is a census/provenance join only. Canonical source '+r['file']+' owns any Phase 9 specification; no render diff, no generation or installed parity claim. Exact render passage: '+repr(passage);return
 if f.startswith('archive/') or path.startswith('docs/history/') or path.startswith(('docs/contracts/','docs/ui-spec/')) or not path.startswith(('docs/specs','docs/architect','docs/platform-foundations.md','docs/distribution-vision.md')):
  preserve(e,body);return
 if '<area>' in path or path=='docs/specs/':
  park(e,body,'Description needs rewrite: this complete narrative/index/writer contract assumes one docs/specs/<area>.md layout. Candidate ownership splits specs, decisions and subcomponents; preserve end-user pointers and trace the actual registry/index reader in Step 5 before specifying the whole authority statement.','description-rewrite');return
 if path=='docs/specs/platform-foundations.md':
  park(e,body,'P8-DOC-GAP-02: carry the exact '+('D-ADR0035 mission boundary' if eid in ('instructions-010','instructions-011') else 'D-ADR0054/RUL11 narrative' if eid=='instructions-023' else 'D-ADR0062/RUL104 narrative')+' from the retiring platform-foundations area spec into a live candidate narrative holder. The locked-law body is not that decision holder.','GAP-02');return
 if path=='docs/platform-foundations.md':
  target='docs/platform/platform-foundations.md';line=86
  a=re.search(r'#l(\d+)--',e['logicalReference'])
  if a:
   line=next(h['startLine'] for h in m.heading_sections(PIN,target) if h['sample'].startswith('L'+a[1]+' '))
  if f=='AGENTS.md' and eid=='instructions-001':line=222
  patch(r,e,body,target,line,'Candidate carries the full locked-law text. The specific law citation retains its own heading; the DoD entry selects L5; generic law ownership selects the complete law-body heading. L12-54(2) treats this law body as live.');return
 if path=='docs/specs/runner.md' and eid in ('skills-090','skills-112'):
  patch(r,e,body,'docs/platform/runner/subcomponents/h-6979005beaf7/spec.md',78,'The RUL45 trust-boundary paragraph explicitly calls title/description untrusted and describes its prompt/shell boundary. The full rule is the narrow holder; shaping cites the same untrusted-input claim.');return
 if path=='docs/specs/runner.md' and eid in ('instructions-008','instructions-009'):
  patch(r,e,body,'docs/platform/runner/decisions/h-36d872fbb0e5.md',921,'Exact titled 0030 decision states the four product priorities and expands 0025; the adjacent source priorities match this narrative.');return
 if path=='docs/specs/system-overview.md':
  patch(r,e,body,'docs/platform/system-overview/spec.md',1,'The source names the entire area/entity/flow overview. This is a whole-file area-spec entry, not a narrower locator.',whole=True);return
 if path=='docs/specs/reading-map.md':
  patch(r,e,body,'docs/reading-map.md',1,'The maintained root reading map is the whole-repository navigation entry; Phase 9 must first merge the remaining source reading-map content under the accepted Step 3 carry. No subsection is singled out.',whole=True);return
 if path=='docs/distribution-vision.md' and f=='AGENTS.md':
  patch(r,e,body,'docs/platform/vision.md',1,'The whole platform vision document owns install/setup direction as part of the platform mission; later Phase 9 conservation must carry the distribution vision in full.',whole=True);return
 if path=='docs/specs/herdr-web-dashboard.md' and f.endswith('errors.ts'):
  patch(r,e,body,'docs/platform/herdr-web-dashboard/spec.md',280,'The exact Edge Cases Settled passage says gateway unreachable, plainly report/retry and never show stale data as current. Replace obsolete numeric lines with its heading anchor.');return
 if path=='docs/specs/herdr-web-dashboard.md' and f.endswith('network.ts'):
  park(e,body,'Description needs rewrite: wrapped R5 citation claims no dedicated reachable-on-network field and baseUrl-only observation. Candidate R5 now states static serving defaults and gateway lifecycle/bind; resolve this complete old-R5 claim and locator before redirecting. Both physical census segments share this disposition.','description-rewrite');return
 if path=='docs/specs/distribution.md':
  park(e,body,'Phase 9 carry: source cites '+('gateway token global-config row 5b' if 'gateway' in f else 'the RUL9/RUL11 diagnostic/fix contract')+'. The candidate packaging spec retains that exact old row/rule under source-detail carriage; the live doctor contract differs from the stated reversal/gloss or lacks the exact token row. Carry or reconcile this precise claim into a live holder before changing its citation.','phase9-carry');return
 if path.startswith('docs/architect/knowledge-registry'):
  park(e,body,'Phase 9 carry: the exact attestation/doc-slot §7.4 or §8 rule cited by this maintained skill/comment needs a non-carriage successor passage and schema/reader parity. Preserve registry end-user pointers; do not guess a write destination from an alias.','phase9-carry');return
 park(e,body,'Phase 9 carry: map the exact registered-session merge-into-main exemption/return progress distinction in this comment to a live post-merge holder, retaining the adjacent deliberately-unchanged behavior claim. A broad runner area pointer does not prove this claim.','phase9-carry')

def main():
 (P/'step-04-records').mkdir(exist_ok=True)
 for b in SETS:
  rows=q.manifest_rows(b);owners=sorted(set(q.record_owner(x) for x in rows));rs=[]
  for file in b['consumerFiles']:fullread(file)
  for file in owners:
   body=fullread(file);rr=[x for x in rows if q.record_owner(x)==file];inputs=[{'path':k,**q.POP['inputPins'][k]} for k in sorted({ref['inventory'] for row in rr for ref in row['inventoryRefs']})]
   r={'file':file,'inventoryInputCommit':inputs[0]['commit'],'inventoryInputs':inputs,'authorInputCommit':PIN,'inventoryFileDigest':m.sha(m.blob(inputs[0]['commit'],file)),'digest':m.sha(body),'inventoryEdgeIds':[x['edgeId'] for x in rr],'diff':'','edges':[],'checks':{'coverage':{'writerTrace':{},'descriptionTruth':{},'scope':'Every frozen batch slot; other buckets remain in Step 3/5 or L12-10 custody. No new census identities invented.'},'anchors':{},'relativeResolution':{},'labelForm':{}},'reviewSet':b['batch'],'authoringRules':['A51','L12-7','L12-10','L12-21..L12-58'],'sourceRenderProvenance':q.provenance(file),'wholeFileRead':READS[file]}
   for row in rr:
    e=blank(row);disposition(r,e,m.blob(PIN,e['consumerFile']).decode());r['edges'].append(e)
   for e in r['edges']:
    if not e['renderOnly']:continue
    matches=[x for x in r['edges'] if not x['renderOnly'] and x['logicalReference']==e['logicalReference']]
    if matches:
     source=matches[0];e['sourceSlotKey']=source['slotKey'];e['disposition']=source['disposition'];e['timing']=source['timing'];e['reason']+=' Source disposition: '+source['disposition']+'. '+source['reason']
     if source['disposition']=='parked':
      for field in ['blockedCategory','dependencyCategory','blockedReason','dependency']:e[field]=source[field]
   # One canonical complete diff over current bytes; render slots join this
   # source's disposition but never carry a hunk or replacement themselves.
   changes=[]
   for e in r['edges']:
    if not e['renderOnly'] and e['disposition']=='patch':changes.extend(m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['slotKey']]['replacement']))
   after=body
   for a,z,value in reversed(sorted(set(changes))):after=after[:a]+value+after[z:]
   r['diff']=m.make_diff(file,body,after)
   for e in r['edges']:
    if not e['renderOnly'] and e['disposition']=='patch':
     n=e['sourceSpans'][0]['line'];e['diffHunk']=next(h.splitlines()[0] for h in m.hunks(r['diff']) if (lambda a,c:a<=n<a+c)(*map(int,re.match(r'@@ -(\d+)(?:,(\d+))?',h).groups(default='1'))))
   rs.append(r)
  (P/'step-04-records'/ (b['batch']+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
  print(b['batch'],len(rs),sum(len(r['edges']) for r in rs),flush=True)
 q.save('step-04-wave1-whole-file-reads.json',list(READS.values()))
if __name__=='__main__':main()
