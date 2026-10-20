#!/usr/bin/env python3
"""Pinned L12-52 controls; no records or consumer bytes are written."""
import sys
sys.dont_write_bytecode=True
import copy, importlib.util, json, pathlib
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('check',P/'step-03-check.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'

def main():
    inv=next(e for e in m.census()['entries'] if e['edgeId']=='maps-j-07625')
    edge={'edgeId':inv['edgeId'],'matchedExpression':inv['matchedExpression'],
          'sourceSpans':inv['physicalSpans'],'disposition':'preserve','target':None,'anchor':None}
    file=inv['consumerPath'];legacy=inv['normalizedReference']
    holders=m.removed_decision_holders(PIN,edge,legacy)
    assert len(holders)==1 and holders[0].split('#')[0]==file,holders
    section=next(h for h in m.heading_sections(PIN,file) if h['anchor']==holders[0].split('#')[1])
    heading=m.blob(PIN,file).decode().splitlines()[section['startLine']-1].lstrip('#').strip()
    edge['reason']='L12-52(1): Non-executable internal-correspondence note: `'+heading+'`.'
    m.removed_decision_successor(PIN,file,edge,legacy)
    negatives=[]
    for label,change in [
        ('wrong-heading',{'reason':'L12-52(1): Non-executable internal-correspondence note: `Invented heading`.'}),
        ('executable-self-link',{'target':file,'anchor':holders[0].split('#')[1]}),
        ('missing-internal-note',{'reason':'L12-52(1): historical reference.'}),
        ('markdown-self-link-in-note',{'reason':edge['reason']+' [self](#'+holders[0].split('#')[1]+')'})]:
        bad=copy.deepcopy(edge);bad.update(change)
        try:m.removed_decision_successor(PIN,file,bad,legacy)
        except AssertionError as exc:negatives.append({'probe':label,'rejected':True,'reason':str(exc)})
        else:raise AssertionError(label+' accepted')
    file='docs/platform/system-architecture/history/architect-readme.md'
    text=m.blob(PIN,file).decode();lines=text.splitlines()
    start=next(i for i,l in enumerate(lines,1) if 'Full source text follows' in l)
    body=next(i for i,l in enumerate(lines,1) if '[Architect Roadmap]' in l)
    assert m.carriage_declaration(text,17) is None
    assert m.related_header(text,17)
    assert m.carriage_declaration(text,body)
    assert not m.related_header(text,body)
    # The exact predicate used by related-retiring-preserve rejects the old
    # metadata-as-carriage preserve; body links remain source carriage.
    def preserve_allowed(line):
        return not (legacy_wrapper.startswith(m.RETIRING_ROOTS) and m.related_header(text,line))
    legacy_wrapper='docs/architect/README.md'
    assert not preserve_allowed(17)
    negatives.append({'probe':'wrapper-related-preserved-as-carriage','rejected':True,'check':'related-retiring-preserve'})
    # No inferred boundary from filenames or generic history: the explicit
    # marker and carriage H1 are both necessary for this waiver.
    unmarked=text.replace(lines[start-1],'Source details below.')
    assert m.carriage_declaration(unmarked,17)
    ordinary=text.replace(lines[0],'# Architect README')
    assert m.carriage_declaration(ordinary,body)
    return {'pin':PIN,'positiveProbes':2,'negativeProbes':len(negatives),'allRejected':True,
            'positiveControls':[{'probe':'same-consumer-exact-heading','holder':holders[0],'heading':heading},
                                {'probe':'explicit-source-body-boundary','metadataLine':17,'markerLine':start,'bodyLine':body}],
            'probes':negatives,'boundaryControls':['no marker keeps prior carriage semantics','no carriage H1 receives no wrapper exemption'],
            'limits':'Focused source/predicate controls; unchanged title-collision suites and complete current records replay separately.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
