#!/usr/bin/env python3
"""Differential record mutations against accepted positive pilot records; no live edits."""
import sys
sys.dont_write_bytecode=True
import argparse, copy, importlib.util, json, pathlib
from unittest.mock import patch as mock_patch
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('pilot_check',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--author-commit',required=True);a=ap.parse_args();c=m.Checker(a.author_commit);rs=m.records()
    # Keep every inherited mutation, including proofs on now-retiring sources.
    # Load those complete round-4 records as historical positive fixtures; they
    # still exercise the current checker. Actual packet retirement records are
    # tested separately in step-03-wave1-r2-probes.py. Add only unit metadata
    # required by L12-34, without disabling any checker predicate.
    for i,r in enumerate(rs):
        if r.get('retiresWithTree'):
            archived=[json.loads(line) for line in m.blob('04913b160eac95a199718176ca75780573a3573d',str(m.REL/'step-03-records'/(r['reviewSet']+'.jsonl'))).decode().splitlines()]
            rs[i]=next(x for x in archived if x['file']==r['file'])
    # L12-37 invalidates live old preserve edges in the archived full runner
    # fixture (the actual runner consumer now retires with its tree). Migrate
    # only that in-memory fixture through real aliases, targets and diffs;
    # never waive a predicate or change/remove an inherited mutation.
    migration_spec=importlib.util.spec_from_file_location('fixture_author',P/'step-03-wave3-author.py')
    fixture_author=importlib.util.module_from_spec(migration_spec);migration_spec.loader.exec_module(fixture_author)
    fixture_migrations=[]
    for r in rs:
        body=m.blob(a.author_commit,r['file']).decode();changed=False
        for e in r['edges']:
            holders=c.renamed_alias_holders(r,e)
            if not holders:continue
            assert r['file']=='docs/specs/runner.md' and len(holders)==1
            target=holders[0];legacy=c.entries[e['edgeId']]['normalizedReference'].split('#')[0]
            if e['edgeId']=='maps-j-08299':
                h=next(h for h in m.heading_sections(a.author_commit,target) if h['sample'].startswith('Why the floor'))
                fixture_author.anchored_patch(r,e,legacy,body,target,h['anchor'],nums=[81,82,83],assessment='The cited floor keeps the hard-gate keyword classification; the surrounding proposed ironLaw.level split remains its own source decision, not a claim of this target.')
            elif e['edgeId']=='maps-j-08300':
                h=next(h for h in m.heading_sections(a.author_commit,target) if h['sample'].startswith('Why evidence-only'))
                fixture_author.anchored_patch(r,e,legacy,body,target,h['anchor'],nums=[47,48,49],assessment='The cited invariant is a second independent reader looking at proof; this exact evidence-only section states it. The surrounding proposal changes who types, not who decides.')
            else:
                assert e['edgeId'] in ('maps-j-08275','maps-j-08308','maps-j-08309')
                fixture_author.anchored_patch(r,e,legacy,body,target,assessment='Whole-document reading-list subject is preserved by its exact committed registry rename; no narrower source locator or runtime-description change is asserted.')
            fixture_migrations.append({'file':r['file'],'edgeId':e['edgeId'],'target':target,'rule':'L12-37; real in-memory alias patch, not a check waiver'});changed=True
        if changed:
            edits=[]
            for e in r['edges']:
                if e['disposition']=='patch':edits+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
            after=body
            for start,end,new in sorted(set(edits),reverse=True):after=after[:start]+new+after[end:]
            r['diff']=m.make_diff(r['file'],body,after)
            for e in r['edges']:
                if e['disposition']=='patch':
                    hs=[h for h in m.hunks(r['diff']) if any('-'+body.splitlines()[span['line']-1] in h.splitlines() for span in e['sourceSpans'])]
                    assert len(hs)==1;e['diffHunk']=hs[0].splitlines()[0]
    assert not fixture_migrations # L12-38 exempts all five former alias preserves in the actual retired-decision region
    fixture_history_preserves=[]
    for r in rs:
        body=m.blob(a.author_commit,r['file']).decode();changed=False
        for e in r['edges']:
            if e['disposition']!='patch' or not m.history_at(body,e['sourceSpans'][0]['line'],r['file']):continue
            target=e['target'];anchor=e['anchor'];legacy=(c.entries.get(e['edgeId']) or e.get('authorAddedEdge',{}))['normalizedReference'].split('#')[0]
            state=fixture_author.facts(e,legacy)
            e.update(disposition='preserve',target=None,anchor=None,timing='none',diffHunk=None,reason='L12-38: preserve the actual retired-decision source region. '+state+' Non-executable successor note: '+target+('#'+anchor if anchor else '')+'.')
            fixture_history_preserves.append({'file':r['file'],'edgeId':e['edgeId'],'successor':target});changed=True
        if changed:
            edits=[]
            for e in r['edges']:
                if e['disposition']=='patch':edits+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
            after=body
            for start,end,new in sorted(set(edits),reverse=True):after=after[:start]+new+after[end:]
            r['diff']=m.make_diff(r['file'],body,after)
            for e in r['edges']:
                if e['disposition']=='patch':
                    hs=[h for h in m.hunks(r['diff']) if any('-'+body.splitlines()[span['line']-1] in h.splitlines() for span in e['sourceSpans'])];assert len(hs)==1;e['diffHunk']=hs[0].splitlines()[0]
    for r in rs:
        before=m.blob(a.author_commit,r['file']).decode()
        for e in r['edges']:
            e['unitId']=m.unit_id(before,e['sourceSpans'])
            e['unitDispositionReason']=e['edgeId']+' ['+e['matchedExpression']+'] Distinct claim: Historical positive-fixture source role: '+e['reason']
            declaration=m.carriage_declaration(before,e['sourceSpans'][0]['line'])
            if declaration:
                e.pop('targetFacts',None)
                e['reason']='L12-35(4): inside literal carriage (L12-26(5)); Carriage declaration: '+declaration[1]
    # L12-38 migrates only positive historical fixtures: truthful exemption
    # wording and computed narrative notes. Every inherited mutation/assertion
    # below stays intact and executes against the current checker predicates.
    fixture_narratives=[]
    for r in rs:
        body=m.blob(a.author_commit,r['file']).decode()
        for item in r['checks']['coverage'].get('legacyScan',{}).get('candidates',[]):
            exemption=m.coverage_exemption(r['file'],body,item['span'])
            if exemption and not item.get('edgeId'):item['excludedReason']=exemption
        for e in r['edges']:
            if e['disposition']!='preserve':continue
            legacy=(c.entries.get(e['edgeId']) or e.get('authorAddedEdge',{})).get('normalizedReference','')
            for holder in m.removed_decision_holders(a.author_commit,e,legacy):
                if holder not in [n.rstrip('.') for n in m.successor_notes(e['reason'])]:
                    e['reason']+=' Non-executable successor note: '+holder+'.'
                    fixture_narratives.append({'file':r['file'],'edgeId':e['edgeId'],'holder':holder})
    baseline=c.all(rs);assert not baseline['failures'],baseline
    patch=next(r for r in rs if r['file']=='docs/routing-handoff-contract.md')
    plain=next(r for r in rs if r['file']=='README.md')
    parked=next(r for r in rs if any(e['disposition']=='parked' for e in r['edges']))
    row=next(r for r in rs if any(e['disposition']=='phase9-row-flip' for e in r['edges']))
    checks=[]
    def probe(name,source,mutate,expected):
        r=copy.deepcopy(source);mutate(r);fail=c.check_record(r);names={x['check'] for x in fail}
        assert expected in names,(name,expected,names)
        checks.append({'surfaceClass':3,'probe':name,'expectedCheck':expected,'rejected':True,'observedChecks':sorted(names)})
    def pe(r):return next(e for e in r['edges'] if e['disposition']=='patch')
    def parked_e(r):return next(e for e in r['edges'] if e['disposition']=='parked')
    def row_e(r):return next(e for e in r['edges'] if e['disposition']=='phase9-row-flip')
    probe('unknown record field',plain,lambda r:r.update(extra=True),'schema')
    probe('wrong author digest',plain,lambda r:r.update(digest='0'*64),'digest')
    probe('wrong declared commit',plain,lambda r:r.update(authorInputCommit='0'*40),'digest')
    probe('wrong inventory digest',plain,lambda r:r.update(inventoryFileDigest='0'*64),'digest')
    probe('missing inventory edge',plain,lambda r:r['edges'].pop(),'edge-coverage')
    probe('duplicate inventory edge',plain,lambda r:r['edges'].append(copy.deepcopy(r['edges'][0])),'edge-coverage')
    probe('invented inventory edge',plain,lambda r:r['inventoryEdgeIds'].append('maps-j-invented'),'edge-coverage')
    probe('wrong source column',plain,lambda r:r['edges'][0]['sourceSpans'][0].update(columnStart=2),'source-span')
    probe('old ordinal rebound to different unit',plain,lambda r:r['edges'][0].update(matchedExpression='other source'),'passage-correspondence')
    probe('unknown disposition',plain,lambda r:r['edges'][0].update(disposition='rewrite'),'disposition')
    probe('park without blocked reason',parked,lambda r:parked_e(r).update(blockedReason=None,blockedCategory=None),'parked-state')
    probe('park without dependency',parked,lambda r:parked_e(r).update(dependency=None,dependencyCategory=None),'parked-state')
    probe('row flip scheduled now',row,lambda r:row_e(r).update(timing='now'),'row-semantics')
    probe('preserved citation with executable hunk',plain,lambda r:r['edges'][0].update(diffHunk='@@ fake @@'),'preserve-state')
    probe('missing committed target',patch,lambda r:pe(r).update(target='docs/nonexistent-pilot-target.md'),'target-tree')
    probe('alias key used as destination',patch,lambda r:pe(r).update(target='alias:root-authorities-draft-0060'),'alias-destination')
    probe('retired lookup spelling as destination',patch,lambda r:pe(r).update(target='docs/specs/reading-map.md'),'alias-destination')
    probe('orphan edge hunk',patch,lambda r:pe(r).update(diffHunk='@@ -9999 +9999 @@'),'hunk-binding')
    probe('hunk without disposition',patch,lambda r:r.update(diff=r['diff']+'@@ -9999 +9999 @@\n-x\n+y\n'),'orphan-hunk')
    probe('candidate labelled current',patch,lambda r:r['checks']['relativeResolution'][pe(r)['edgeId']].update(authorityStatus='current-authority'),'authority-timing')
    def early(r):
        pe(r)['timing']='now';r['checks']['relativeResolution'][pe(r)['edgeId']]['authorityStatus']='cutover-patch-only'
    probe('early cutover',patch,early,'authority-timing')
    probe('untraced writer',patch,lambda r:r['checks']['coverage']['writerTrace'].update({pe(r)['edgeId']:'untraced dynamic writer'}),'writer-boundary')
    probe('missing anchor',patch,lambda r:pe(r).update(anchor='nonexistent-pilot-anchor'),'anchor-carriage-locator')
    def wrong_locator(r):
        e=next(e for e in r['edges'] if e['anchor']);r['checks']['anchors'][e['edgeId']]['passage']='not the cited section'
    probe('locator dropped or bound to wrong passage',patch,wrong_locator,'anchor-carriage-locator')
    def carriage(r):
        pe(r)['target']='docs/platform/packaging-distribution/spec.md';pe(r)['anchor']='retained-distribution-source-detail'
    probe('destination in retained carriage',patch,carriage,'anchor-carriage-locator')
    probe('self destination',patch,lambda r:pe(r).update(target=r['file']),'anchor-carriage-locator')
    probe('bad target digest',patch,lambda r:r['checks']['anchors'][pe(r)['edgeId']].update(targetDigest='0'*64),'anchor-carriage-locator')
    def broken_resolution(r):r['checks']['relativeResolution'][pe(r)['edgeId']]['resolvedTarget']='docs/wrong-consumer-dir.md'
    probe('resolve relative link from wrong directory',patch,broken_resolution,'relative-resolution')
    def wrong_form(r):
        e=pe(r);r['checks']['relativeResolution'][e['edgeId']]['replacement']='../'+r['checks']['relativeResolution'][e['edgeId']]['replacement']
    probe('drop repo-root coordinate form',patch,wrong_form,'label-form')
    probe('diff differs from declared unit edits',patch,lambda r:r.update(diff=''),'diff-correspondence')
    def invalid_apply(r):r['diff']=r['diff'].replace('schema work','nonexistent original source text')
    probe('diff cannot apply to pinned author blob',patch,invalid_apply,'git-apply')
    probe('protected root projection hand patch',plain,lambda r:r.update(diff='--- a/README.md\n+++ b/README.md\n@@ -1 +1 @@\n-x\n+y\n'),'projection-source')
    def split_unit(r):
        e=pe(r);e['sourceSpans'].append(copy.deepcopy(e['sourceSpans'][0]))
    probe('partial or duplicated physical link spans',patch,split_unit,'complete-unit')
    def overlap(r):
        es=[e for e in r['edges'] if e['disposition']=='patch'];es[1]['sourceSpans']=copy.deepcopy(es[0]['sourceSpans']);es[1]['sourceSpans'][0]['columnStart']+=1
    probe('overlapping distinct replacements',patch,overlap,'overlap')
    # L12-30: deliberately wrong complete records, after real records pass.
    witnessed=next(r for r in rs if any(e.get('searchWitness') for e in r['edges']))
    probe('missing-target park without search witness',witnessed,lambda r:parked_e(r).pop('searchWitness'),'park-search-witness')
    def count_lie(r):parked_e(r)['searchWitness']['queries'][0]['hitCount']+=1
    probe('invented zero or wrong hit count at pin',witnessed,count_lie,'park-search-witness')
    probe('omitted locator query',witnessed,lambda r:parked_e(r)['searchWitness']['queries'].pop(),'park-search-witness')
    probe('witness at wrong pin',witnessed,lambda r:parked_e(r)['searchWitness'].update(pin='0'*40),'park-search-witness')
    probe('alias search omitted',witnessed,lambda r:parked_e(r)['searchWitness']['aliasLookups'].pop(),'park-search-witness')
    located=next(r for r in rs if any(p.get('sourceLocatorTokens') for p in r['checks']['anchors'].values()))
    def absent_locator(r):
        key=next(k for k,v in r['checks']['anchors'].items() if v.get('sourceLocatorTokens'))
        r['checks']['anchors'][key]['passage']='This target passage has none of the edge locator tokens.'
        r['checks']['anchors'][key].pop('locatorCorrespondence',None)
    probe('patch target passage has no edge locator token',located,absent_locator,'patch-locator-review')
    flagged=copy.deepcopy(rs)
    flagged_record=next(r for r in flagged if r['file']==located['file']);absent_locator(flagged_record)
    assert any(f['file']==located['file'] for f in c.all(flagged)['locatorReviewFlags'])
    checks[-1]['reviewFlagObserved']=True
    def snapshot_target(r):
        e=pe(r);e['target']='docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md';e['anchor']=None
        r['checks']['anchors'][e['edgeId']]={'targetCommit':a.author_commit,'targetDigest':m.sha(m.blob(a.author_commit,e['target']))}
    probe('whole-file source snapshot used as live target',patch,snapshot_target,'anchor-carriage-locator')
    # L12-31: all original probes above/below remain; each new rule is mutated independently.
    anchored=next(r for r in rs if any(e['disposition']=='patch' and r['checks']['anchors'][e['edgeId']].get('sourceLocatorTokens')==['RUL53'] for e in r['edges']))
    def h1_instead_of_holder(r):
        e=next(e for e in r['edges'] if r['checks']['anchors'].get(e['edgeId'],{}).get('sourceLocatorTokens')==['RUL53'])
        h=next(h for h in m.heading_sections(a.author_commit,e['target']) if h['level']==1)
        e['anchor']=h['githubSlug'] if e['matchedExpression'].startswith(('[','![')) else h['anchor']
        r['checks']['anchors'][e['edgeId']]['passage']=h['body']
    probe('H1 anchor hides narrower rule holder',anchored,h1_instead_of_holder,'anchor-precision')
    retiring=next(r for r in rs if any(e['disposition']=='preserve' and e['matchedExpression'].startswith('docs/specs/') for e in r['edges']))
    def retained_word(r):
        e=next(e for e in r['edges'] if e['disposition']=='preserve' and e['matchedExpression'].startswith('docs/specs/'))
        e['reason']='L12-31: retained path exists at author pin'
    probe('retiring-tree preserve falsely says retained',retiring,retained_word,'retiring-preserve-wording')
    added=next(r for r in rs if any(e.get('authorAddedEdge') for e in r['edges']))
    def ae(r):return next(e for e in r['edges'] if e.get('authorAddedEdge'))
    probe('author-added disposition omitted',added,lambda r:r['edges'].remove(ae(r)),'author-added-coverage')
    probe('author-added disposition duplicated',added,lambda r:r['edges'].append(copy.deepcopy(ae(r))),'author-added-coverage')
    probe('author-added coverage join omitted',added,lambda r:r['checks']['coverage']['authorAddedEdgeIds'].pop(),'author-added-coverage')
    def scan_omission(r):
        e=ae(r);r['edges'].remove(e);r['checks']['coverage']['authorAddedEdgeIds'].remove(e['edgeId'])
    probe('author-added edge and declaration jointly omitted',added,scan_omission,'author-added-search-coverage')
    def scan_lie(r):r['checks']['coverage']['legacyScan']['candidates'].pop()
    probe('whole-file supplemental candidate omitted',added,scan_lie,'author-added-search-coverage')
    probe('whole-file supplemental receipt omitted',added,lambda r:r['checks']['coverage'].pop('legacyScan'),'author-added-search-coverage')
    many=next(r for r in rs if any(len(e.get('searchWitness',{}).get('hitGroups',[]))>1 for e in r['edges']))
    def boilerplate(r):
        e=next(e for e in r['edges'] if len(e.get('searchWitness',{}).get('hitGroups',[]))>1)
        for g in e['searchWitness']['hitGroups']:
            g['liveAssessment']='Every hit is unusable.';g.pop('category',None) # L12-32(5) replaces prose distinctness with an enum.
    probe('identical live assessments for all hit groups',many,boilerplate,'distinct-hit-assessments')
    # L12-32: each new mechanical rule rejects an independently wrong complete record.
    probe('reason names a different anchor',patch,lambda r:pe(r).update(reason='L12-32: docs/platform/work-state/spec.md#false-anchor'),'reason-anchor-consistency')
    exists=next(r for r in rs if any(e['disposition']=='preserve' and e['matchedExpression']=='docs/backlog.md' for e in r['edges']))
    def false_never(r):
        e=next(e for e in r['edges'] if e['matchedExpression']=='docs/backlog.md');e['reason']='L12-32: target never existed in git history';e['targetFacts']=[{'state':'never-existed','path':'docs/backlog.md'}]
    probe('never existed contradicts Git ancestry',exists,false_never,'reason-target-history')
    foundations=next(r for r in rs if r['file']=='docs/specs/platform-foundations.md')
    def deleted_lie(r):
        e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08124');e['targetFacts'][0]['commit']=a.author_commit;e['reason']='L12-32: removed at '+a.author_commit
    probe('removed at commit that did not delete path',foundations,deleted_lie,'reason-target-history')
    def rename_as_delete(r):
        e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08131');e['targetFacts'][0]['state']='removed';e['reason']='L12-32: removed at '+e['targetFacts'][0]['commit']
    probe('same-commit rename falsely called deletion',foundations,rename_as_delete,'reason-target-history')
    def wrong_rename(r):
        e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08131');e['targetFacts'][0]['successor']='docs/backlog.md'
    probe('rename successor differs from Git rename',foundations,wrong_rename,'reason-target-history')
    probe('dependency category differs from blocker',parked,lambda r:parked_e(r).update(dependencyCategory='dead-link' if parked_e(r)['blockedCategory']!='dead-link' else 'phase9-carry'),'dependency-category')
    probe('unknown blocker and dependency enum',parked,lambda r:parked_e(r).update(blockedCategory='invented',dependencyCategory='invented'),'dependency-category')
    probe('prose dependency contradicts matching enum',parked,lambda r:parked_e(r).update(dependency='Step 5 parity' if parked_e(r)['blockedCategory']!='step5-parity' else 'Description needs rewrite'),'dependency-category')
    def wrong_line_anchor(r):
        e=next(e for e in r['edges'] if e['anchor']);r['checks']['anchors'][e['edgeId']]['targetLines']=[1];r['checks']['anchors'][e['edgeId']]['targetLineText']=[m.blob(a.author_commit,e['target']).decode().splitlines()[0]]
    probe('anchor differs from evidence enclosing heading',patch,wrong_line_anchor,'anchor-from-evidence')
    def null_line(r):
        e=next(e for e in r['edges'] if e['anchor']);e['anchor']=None
    probe('null anchor with target line evidence',patch,null_line,'anchor-from-evidence')
    def unjustified_whole(r):
        e=next(e for e in r['edges'] if not e['anchor'] and e['disposition']=='patch');r['checks']['anchors'][e['edgeId']].pop('wholeFileJustification')
    probe('whole-file anchor without recorded justification',patch,unjustified_whole,'anchor-from-evidence')
    def wrong_line_text(r):
        e=next(e for e in r['edges'] if e['anchor']);r['checks']['anchors'][e['edgeId']]['targetLineText']=['wrong target text']
    probe('target evidence line differs from pinned text',patch,wrong_line_text,'anchor-from-evidence')
    runner=next(r for r in rs if r['file']=='docs/specs/runner.md')
    def omit_partial(r):
        e=next(e for e in r['edges'] if e['edgeId']=='author-r4-docs-specs-runner-L1729C2');r['edges'].remove(e);r['checks']['coverage']['authorAddedEdgeIds'].remove(e['edgeId']);r['checks']['coverage']['legacyScan']['candidates']=[x for x in r['checks']['coverage']['legacyScan']['candidates'] if x.get('edgeId')!=e['edgeId']]
    probe('partial-root edge and receipt jointly omitted',runner,omit_partial,'author-added-search-coverage')
    probe('missing description comparison',patch,lambda r:r['checks']['coverage']['descriptionTruth'].pop(pe(r)['edgeId']),'description-truth-record')
    probe('description mismatch left executable',patch,lambda r:r['checks']['coverage']['descriptionTruth'][pe(r)['edgeId']]['comparisons']['ports'].update(verdict='mismatch'),'description-truth-record')
    def wrong_hit_category(r):
        e=next(e for e in r['edges'] if e.get('searchWitness',{}).get('hitGroups'));e['searchWitness']['hitGroups'][0]['category']='live'
    probe('unknown witness hit category',many,wrong_hit_category,'distinct-hit-assessments')
    def false_rename_prose(r):
        e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08131');e['reason']='L12-32: renamed at '+e['targetFacts'][0]['commit']+' to docs/backlog.md'
    probe('rename prose names a different successor',foundations,false_rename_prose,'reason-target-history')
    def omit_named_line(r):
        e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08232');r['checks']['anchors'][e['edgeId']]['targetLines']=[131]
    probe('target line named in proof omitted from evidence',runner,omit_named_line,'anchor-from-evidence')
    herdr=next(r for r in rs if r['file']=='docs/specs/herdr-web-dashboard.md')
    def locator_count_lie(r):r['checks']['coverage']['extraLocatorSearches']['maps-j-08107'][0]['result']['hitCount']+=1
    probe('locator-token supplementary replay count is false',herdr,locator_count_lie,'supplemental-locator-replay')
    probe('adjacent description context truncated',patch,lambda r:r['checks']['coverage']['descriptionTruth'][pe(r)['edgeId']].update(adjacentPassage='truncated'),'description-truth-record')
    probe('description target quote invented',patch,lambda r:r['checks']['coverage']['descriptionTruth'][pe(r)['edgeId']]['targetEvidence'][0].update(text='invented target quote'),'description-truth-record')
    probe('standalone anchor reason differs from field',patch,lambda r:pe(r).update(reason='L12-32: #wrong-anchor'),'reason-anchor-consistency')
    optional=copy.deepcopy(parked)
    parked_e(optional)['blockedReason']=None;parked_e(optional)['dependency']=None
    assert not c.check_record(optional), 'L12-32 makes category prose optional'
    optional=copy.deepcopy(many)
    for edge in optional['edges']:
        for group in edge.get('searchWitness',{}).get('hitGroups',[]):
            group.pop('note',None);group.pop('liveAssessment',None);group.pop('carriageAssessment',None)
    assert not c.check_record(optional), 'L12-32 makes hit-group notes optional'
    probe('never-existing claim without Git wording',exists,lambda r:next(e for e in r['edges'] if e['matchedExpression']=='docs/backlog.md').update(reason='L12-32: target never existed'),'reason-target-history')
    assert m.path_history(a.author_commit,'docs/specs/runner.md:26') == m.path_history(a.author_commit,'docs/specs/runner.md')
    manifest=m.manifest_view(rs,a.author_commit)
    bad=copy.deepcopy(manifest);bad['files'][0]['diffSha256']='0'*64;assert 'files' in m.verify_manifest(rs,a.author_commit,bad)
    checks.append({'surfaceClass':3,'probe':'frozen record manifest diff hash mutation','expectedCheck':'manifest-freeze','rejected':True})
    bad=copy.deepcopy(manifest);bad['sets'][1]['selected']=[];assert 'sets' in m.verify_manifest(rs,a.author_commit,bad)
    checks.append({'surfaceClass':3,'probe':'seeded selected membership mutation','expectedCheck':'manifest-freeze','rejected':True})
    missing=rs[:-1];assert any(f['check']=='file-coverage' for f in c.all(missing)['failures']);checks.append({'probe':'missing complete file record','expectedCheck':'file-coverage','rejected':True,'surfaceClass':3})
    wrong=copy.deepcopy(rs);wrong[0]['reviewSet']='batch-999';assert any(f['check']=='set-membership' for f in c.all(wrong)['failures']);checks.append({'probe':'cross-owner batch membership','expectedCheck':'set-membership','rejected':True,'surfaceClass':3})
    # Complete synthetic records bound to in-memory source blobs. No fixture is written to the repo.
    def fixture(old,target='docs/platform/work-state/spec.md',prefix='# Probe\n\n',suffix='\n'):
        f='docs/pilot-probe-consumer.md';before=prefix+old+suffix;line=len(prefix.splitlines())+1
        inv={'edgeId':'maps-j-probe','consumerPath':f,'matchedExpression':old,'physicalSpans':[{'line':line,'columnStart':1,'columnEndExclusive':len(old)+1,'text':old}],'locatorTokens':[],'normalizedReference':'docs/old.md'}
        replacement=m.form(old,f,target,None);after=prefix+replacement+suffix;diff=m.make_diff(f,before,after)
        e={'edgeId':inv['edgeId'],'sourceSpans':inv['physicalSpans'],'matchedExpression':old,'disposition':'patch','diffHunk':m.hunks(diff)[0].splitlines()[0],'reason':'L12-26(7) complete fixture citation','target':target,'anchor':None,'timing':'Phase 9','blockedReason':None,'dependency':None,'blockedCategory':None,'dependencyCategory':None}
        r={'file':f,'inventoryInputCommit':m.INVENTORY,'authorInputCommit':a.author_commit,'inventoryFileDigest':m.sha(before),'digest':m.sha(before),'inventoryEdgeIds':[e['edgeId']],'diff':diff,'edges':[e],'reviewSet':'batch-probe','authoringRules':['L12-26'],
        'checks':{'coverage':{'writerTrace':{e['edgeId']:'read-only citation; no writer/default-root/schema/identity change'}},'anchors':{e['edgeId']:{'targetCommit':a.author_commit,'targetDigest':m.sha(m.blob(a.author_commit,target))}},'relativeResolution':{e['edgeId']:{'replacement':replacement,'resolvedTarget':target,'targetCommit':a.author_commit,'authorityStatus':'cutover-patch-only'}},'labelForm':{}}}
        if target in c.dirs:r['checks']['anchors'][e['edgeId']]={'targetCommit':a.author_commit,'targetTreeOid':m.git('rev-parse',a.author_commit+':'+target).decode().strip()}
        r['checks']['anchors'][e['edgeId']]['wholeFileJustification']='Fixture cites the complete Work-State spec / directory as an area owner, across all sections.'
        r['checks']['coverage']['descriptionTruth']={e['edgeId']:{'sourcePassage':old,'adjacentPassage':m.adjacent_passage(before,e['sourceSpans']),'targetEvidence':[{'line':1,'text':m.blob(a.author_commit,target).decode().splitlines()[0]}],'targetCommit':a.author_commit,'target':target,'targetDigest':m.sha(m.blob(a.author_commit,target)), 'comparisons':{k:{'verdict':'not-asserted','note':'Fixture asserts no '+k} for k in ['counts','ports','defaults','verbFileLists','versions','shippedStatus']},'assessment':'Complete area pointer fixture.'}}
        original_blob=m.blob
        def fake_blob(commit,path):return before.encode() if path==f else original_blob(commit,path)
        e['unitId']=m.unit_id(before,e['sourceSpans'])
        return r,inv,fake_blob
    for name,old,target,wrong in [
        ('image marker','![old.md](./old.md)','docs/platform/work-state/spec.md','[spec.md](./platform/work-state/spec.md)'),
        ('backticks','[`old.md`](./old.md)','docs/platform/work-state/spec.md','[spec.md](./platform/work-state/spec.md)'),
        ('basename label','[old.md](./old.md)','docs/platform/work-state/spec.md','[old.md](./platform/work-state/spec.md)'),
        ('directory slash','repo/docs/architect/','docs/platform/host-invocation-routing','repo/docs/platform/host-invocation-routing'),
        ('repo prefix','repo/docs/specs/work-state.md','docs/platform/work-state/spec.md','docs/platform/work-state/spec.md')]:

        r,inv,fake_blob=fixture(old,target);c.entries[inv['edgeId']]=inv;c.files[r['file']]={'sha256':r['digest'],'edgeIds':[inv['edgeId']]}
        with mock_patch.object(m,'blob',side_effect=fake_blob):
            failures=c.check_record(r);assert failures==[],(name,failures)
            probe('record form '+name,r,lambda rr:rr['checks']['relativeResolution'][inv['edgeId']].update(replacement=wrong),'label-form')
    # Source carriage and duplicate Related list are deliberately wrong complete records.
    for title in ['Literal Snapshot','Retained Distribution Source Detail','Added in candidate: X source carriage','Historical source section abc']:
        r,inv,fake_blob=fixture('docs/specs/work-state.md',prefix='# Probe\n## '+title+'\n');c.entries[inv['edgeId']]=inv;c.files[r['file']]={'sha256':r['digest'],'edgeIds':[inv['edgeId']]}
        with mock_patch.object(m,'blob',side_effect=fake_blob):
            fail=c.check_record(r);assert any(x['check']=='source-region' for x in fail)
        checks.append({'surfaceClass':3,'probe':'wrong record in source carriage '+title,'expectedCheck':'source-region','rejected':True})
    r,inv,fake_blob=fixture('docs/specs/work-state.md',prefix='# Probe\nRelated:\n- docs/platform/work-state/spec.md\n');c.entries[inv['edgeId']]=inv;c.files[r['file']]={'sha256':r['digest'],'edgeIds':[inv['edgeId']]}
    with mock_patch.object(m,'blob',side_effect=fake_blob):
        assert any(x['check']=='related-duplicate' for x in c.check_record(r))
    checks.append({'surfaceClass':3,'probe':'wrong record duplicates a Related sibling','expectedCheck':'related-duplicate','rejected':True})
    assert m.form('repo/docs/architect/','docs/consumer.md','docs/platform/host-invocation-routing',None)=='repo/docs/platform/host-invocation-routing/'
    assert not m.history_at('# Added in candidate: Runner Business Rules\n## Business Rules\nRUL65b\n',3)
    assert not m.history_at('# Live\nImplementation: Carriage only\nCanonical: No\n## Current\nbody\n',5)
    return {'authorCommit':a.author_commit,'historicalFixtureAliasMigrations':fixture_migrations,'historicalFixtureNarrativeMigrations':fixture_narratives,'historicalFixtureRegionPreserves':fixture_history_preserves,'positiveRecords':len(rs),'positiveEdges':baseline['edges'],'negativeProbes':len(checks),'allRejected':True,'probes':checks,'limits':'Semantic content/authority decisions require the independent full-file reviewer. Form/region synthetic witnesses use the same helper functions; record-level mutations use the complete real pilot records.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
