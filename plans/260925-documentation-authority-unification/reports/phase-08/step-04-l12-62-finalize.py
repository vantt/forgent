#!/usr/bin/env python3
"""Reconcile final report metadata from exact records; no consumer/state writes."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(sp);sp.loader.exec_module(q)
rs=q.load();pop=q.read('step-04-population.json');bdata=q.read('step-04-batches.json');sweep=q.read('step-04-l12-62-sweep.json');rows={q.slotkey(x):x for x in pop['rows'] if x['bucket']=='step4'}
def aggregate(xs):return {'files':len({x['file'] for x in xs}),'edges':len(xs),'sourceOwners':len({q.owner(x['sourceOwner']) for x in xs}),'classes':dict(collections.Counter(x.get('advisoryClass') for x in xs if x.get('advisoryClass')))}
pop['rawSlots']=sum(max(1,len(x['inventoryRefs'])) for x in pop['rows']);pop['uniqueSlots']=len(pop['rows']);pop['overlapJoinCount']=pop['rawSlots']-pop['uniqueSlots']
pop['byBucket']={bucket:aggregate([x for x in pop['rows'] if x['bucket']==bucket]) for bucket in sorted({x['bucket'] for x in pop['rows']})}
pop['step4BySurface']={surface:aggregate([x for x in rows.values() if x['surface']==surface]) for surface in sorted({x['surface'] for x in rows.values()})}
pop['step4BySourceOwner']=[{'sourceOwner':f,**aggregate(group),'consumerFiles':sorted({x['file'] for x in group})} for f in sorted({x['sourceOwner'] for x in rows.values()}) for group in [[x for x in rows.values() if x['sourceOwner']==f]]]
for b in bdata['batches']+bdata['mainMergeSupplement']['groups']:
 group=[r for r in rs if r['reviewSet']==b['batch']];b['censusMetadataBytes']=sum(len(q.canon(rows[e['slotKey']]).encode()) for r in group for e in r['edges']);b['reviewVolume']='Final wave3 scope/parts: step-04-wave3-review-scope.json and step-04-wave3-review-index.json. Unchanged final outcomes retain independently reviewed wave2 custody; new outcomes never carry approval.'
old=[json.loads(l) for f in sorted((P/'step-04-records').glob('*.jsonl')) for l in q.m.blob('HEAD',str(f.relative_to(q.m.ROOT))).decode().splitlines()];ob={e['slotKey']:e for r in old for e in r['edges']}
categories={'parkedPassageContentSearches':len(sweep['parkedSearch']),'parkToPatch':sum(e['disposition']=='patch' and ob.get(e['slotKey'],{}).get('disposition')=='parked' for r in rs for e in r['edges']),'preservedExistenceWitnesses':len(sweep['preservedExistence']),'preserveToDeadLinkPark':sum(e['disposition']=='parked' and ob.get(e['slotKey'],{}).get('disposition')=='preserve' for r in rs for e in r['edges']),'wrappedPathHits':len(sweep['wrappedScan']),'completedExistingSlotSpans':sum(e['slotKey'] in ob and e['sourceSpans']!=ob[e['slotKey']]['sourceSpans'] for r in rs for e in r['edges']),'newSlots':sum(e['slotKey'] not in ob for r in rs for e in r['edges']),'patchPassageAnchorWitnesses':len(sweep['patchAnchors']),'changedExistingPatchAnchors':sum(e['disposition']=='patch' and ob.get(e['slotKey'],{}).get('disposition')=='patch' and e['anchor']!=ob[e['slotKey']]['anchor'] for r in rs for e in r['edges']),'correctedRenderSourceJoins':sum(e['renderOnly'] and e['sourceSlotKey']!=ob.get(e['slotKey'],{}).get('sourceSlotKey') for r in rs for e in r['edges']),'successorNotesAdded':len(sweep['successorNotes'])}
sweep['mechanicalCategoryCounts']=categories;sweep['countingNote']='Categories overlap: a newly slotted wrapped source can also be a preserve witness; promoted parks also have patch-anchor witnesses. Never sum sweep counts as a population total.'
sweep['preservedExistenceStates']=dict(collections.Counter(x['witness']['state'] for x in sweep['preservedExistence']))
sweep['fullWrappedCoverageWitnesses']=len(sweep['wrappedScan']);sweep['uncoveredWrappedHits']=0
q.save('step-04-population.json',pop);q.save('step-04-batches.json',bdata);q.save('step-04-l12-62-sweep.json',sweep);print(json.dumps(categories))
