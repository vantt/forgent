#!/usr/bin/env python3
"""Final source-line overlap, complete sibling-link, and exact-heading controls."""
import sys
sys.dont_write_bytecode=True
import copy, importlib.util, json, pathlib
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('check',P/'step-03-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'

def main():
    negatives=[];positives=[]
    def reject(name,fn):
        try:fn()
        except AssertionError as ex:negatives.append({'probe':name,'rejected':True,'reason':str(ex)})
        else:raise AssertionError(name+' was accepted')
    text='first line\nsecond line\nthird line\n'
    def span(n):
        line=text.splitlines()[n-1];return {'line':n,'columnStart':1,'columnEndExclusive':len(line)+1,'text':line}
    def record(a,b,second_start=2):
        return {'edges':[],'checks':{'coverage':{'switchboardStatusRowFlips':[{'sourceSpans':[span(1),span(2)],'replacement':a},{'sourceSpans':[span(second_start)],'replacement':b}]}}}
    m.replacement_unit_consistency(record('same','same'),text);positives.append('identical-overlapping-replacements')
    m.replacement_unit_consistency(record('first','other',3),text);positives.append('different-disjoint-replacements')
    reject('different-overlapping-status-units',lambda:m.replacement_unit_consistency(record('first','other'),text))
    edge={'edgeId':'probe','sourceSpans':[span(2)],'disposition':'phase9-row-flip','reason':'L12-54 Replacement: edge replacement'}
    fixture={'edges':[edge],'checks':{'coverage':{'rowReplacementUnits':[{'sourceSpans':[span(1),span(2)],'edgeIds':['probe'],'replacement':'edge replacement'}],'switchboardStatusRowFlips':[{'sourceSpans':[span(2)],'replacement':'status replacement'}]}}}
    reject('bound-edge-unit-overlaps-status-unit',lambda:m.replacement_unit_consistency(fixture,text))
    fixture['checks']['coverage']['switchboardStatusRowFlips']=[]
    m.replacement_unit_consistency(fixture,text);positives.append('single-bound-whole-range-edge-replacement')
    fixture['edges'][0]['reason']='L12-54 Replacement: stale edge replacement'
    reject('whole-range-binding-disagrees-with-edge',lambda:m.replacement_unit_consistency(fixture,text))
    # Exercise the actual scanner and coverage predicate against the pinned inventory.
    r=next(json.loads(line) for line in (P/'step-03-records/batch-086.jsonl').read_text().splitlines())
    checker=m.Checker(PIN)
    inv=[s for key in r['inventoryEdgeIds'] for s in checker.entries[key]['physicalSpans']]
    found=m.scan_candidates(PIN,r['file'],inv)
    links=[e for e in r['edges'] if e['edgeId'].startswith('author-wave5h-source-inventory-')]
    assert len(links)==3 and all(e['sourceSpans'][0] in found for e in links)
    assert not any(s['line'] in (40,44) and any(s['columnStart']>e['sourceSpans'][0]['columnStart'] and s['columnEndExclusive']<e['sourceSpans'][0]['columnEndExclusive'] for e in links) for s in found)
    positives.append('three-complete-sibling-links-no-basename-fragments')
    broken=copy.deepcopy(r)
    broken['checks']['coverage']['legacyScan']['candidates']=[x for x in broken['checks']['coverage']['legacyScan']['candidates'] if x.get('edgeId')!=links[-1]['edgeId']]
    failures=checker.check_record(broken,apply=False)
    assert any(x['check']=='author-added-search-coverage' for x in failures)
    negatives.append({'probe':'missing-complete-sibling-link-receipt','rejected':True,'check':'author-added-search-coverage'})
    r=next(r for r in [json.loads(l) for l in (P/'step-03-records/batch-115.jsonl').read_text().splitlines()] if r['file']=='docs/platform/runner/decisions/h-36d872fbb0e5.md')
    e=next(e for e in r['edges'] if e['edgeId']=='maps-j-07625')
    legacy=checker.entries[e['edgeId']]['normalizedReference']
    m.removed_decision_successor(PIN,r['file'],e,legacy);positives.append('exact-full-internal-heading')
    truncated=copy.deepcopy(e)
    truncated['reason']=__import__('re').sub(r'Non-executable internal-correspondence note:\s*`([^`]+)`',lambda hit:'Non-executable internal-correspondence note: `'+hit[1][:70]+'`',e['reason'])
    reject('truncated-internal-heading',lambda:m.removed_decision_successor(PIN,r['file'],truncated,legacy))
    nested=next(e for e in r['edges'] if e['edgeId']=='maps-j-07641')
    legacy=checker.entries[nested['edgeId']]['normalizedReference']
    m.removed_decision_successor(PIN,r['file'],nested,legacy);positives.append('exact-internal-heading-preserves-inline-backticks')
    malformed=copy.deepcopy(nested)
    malformed['reason']=malformed['reason'].replace('note: ``','note: `').replace('`` in this consumer','` in this consumer')
    reject('inline-backticks-need-complete-heading-quotation',lambda:m.removed_decision_successor(PIN,r['file'],malformed,legacy))
    switchboard=next(r for r in [json.loads(l) for l in (P/'step-03-records/batch-130.jsonl').read_text().splitlines()] if r['file']=='docs/transitional-switchboard.md')
    assert not checker.check_record(switchboard,apply=False)
    positives.append('real-switchboard-single-replacement-ranges-pass')
    conflicting=copy.deepcopy(switchboard)
    unit=conflicting['checks']['coverage']['rowReplacementUnits'][0]
    conflict=copy.deepcopy(conflicting['checks']['coverage']['switchboardStatusRowFlips'][0])
    conflict.update(sourceSpans=unit['sourceSpans'],replacement='conflicting status replacement')
    conflicting['checks']['coverage']['switchboardStatusRowFlips'].append(conflict)
    assert any(x['check']=='replacement-unit-overlap' for x in checker.check_record(conflicting,apply=False))
    negatives.append({'probe':'real-switchboard-status-overlaps-edge-range','rejected':True,'check':'replacement-unit-overlap'})
    translated=next(r for r in [json.loads(l) for l in (P/'step-03-records/batch-070.jsonl').read_text().splitlines()] if r['file']=='docs/knowledge/decisions-index/decision-record.md')
    e=next(e for e in translated['edges'] if e['edgeId']=='maps-j-04205')
    legacy=checker.entries[e['edgeId']]['normalizedReference']
    expected='docs/platform/work-state/decisions/retired-decision-history.md#4-adr-0004-scope-and-non-goals'
    assert expected in m.removed_decision_holders(PIN,e,legacy)
    m.removed_decision_successor(PIN,translated['file'],e,legacy);positives.append('translated-0004-title-has-deleted-narrative-correspondence')
    absent=copy.deepcopy(e);absent['reason']=__import__('re').sub(r' Non-executable successor note: [^\s]+','',e['reason'])
    reject('translated-narrative-successor-cannot-be-omitted',lambda:m.removed_decision_successor(PIN,translated['file'],absent,legacy))
    e=next(e for e in translated['edges'] if e['edgeId']=='maps-j-04217')
    legacy=checker.entries[e['edgeId']]['normalizedReference']
    expected='docs/platform/work-state/decisions/retired-decision-history.md#10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule'
    assert m.removed_decision_holders(PIN,e,legacy)==(expected,)
    m.removed_decision_successor(PIN,translated['file'],e,legacy);positives.append('0019-list-item-carriage-survives-rule-gloss-expansion')
    absent=copy.deepcopy(e);absent['reason']=__import__('re').sub(r' Non-executable successor note: [^\s]+','',e['reason'])
    reject('0019-translated-successor-cannot-be-omitted',lambda:m.removed_decision_successor(PIN,translated['file'],absent,legacy))
    e=next(e for e in translated['edges'] if e['edgeId']=='maps-j-04223')
    legacy=checker.entries[e['edgeId']]['normalizedReference']
    wanted=m.removed_decision_holders(PIN,e,legacy)
    assert wanted==('docs/platform/work-state/decisions/retired-decision-history.md#13-adr-0032-multi-role-team-harness',),wanted
    m.removed_decision_successor(PIN,translated['file'],e,legacy);positives.append('0032-harness-stays-distinct-from-iron-law')
    wrong=copy.deepcopy(e)
    collision=next(h for h in m.decision_narrative_holders(PIN,'0032') if '/runner/' in h)
    wrong['reason']+=' Non-executable successor note: '+collision+'.'
    reject('0032-translated-title-cannot-borrow-iron-law-holder',lambda:m.removed_decision_successor(PIN,translated['file'],wrong,legacy))
    return {'pin':PIN,'allRejected':True,'negativeProbes':len(negatives),'positiveProbes':len(positives),'positives':positives,'probes':negatives}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
