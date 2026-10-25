#!/usr/bin/env python3
"""Owning proof for the new strict verdict join; no existing tool proves it.

Only in-memory ledger/review fixtures. No Git writes, product tests or addons.
"""
import copy
import importlib.util
import pathlib
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import json

spec = importlib.util.spec_from_file_location('g0_join', pathlib.Path(__file__).with_name('join.py'))
join = importlib.util.module_from_spec(spec)
spec.loader.exec_module(join)


class VerdictJoin(unittest.TestCase):
    def setUp(self):
        self.row = dict(claimId='claim_one', targetOwner='holder.md', targetAnchor='a',
                        targetUnitDigest='a' * 64, targetAncestry=['Heading'])
        self.row['bindingSha256'] = join.digest(self.row)
        self.group = dict(file='new.json', pointer='/bindingRefresh/0', row=self.row,
                          origins=[], refs={('old.json', '/claims/0'), ('new.json', '/bindingRefresh/0')},
                          ids={'claim_one'}, decisionCommit='0',
                          rowFingerprint=join.row_fingerprint({'bindingRefresh': [self.row]}, '/bindingRefresh/0'))

    def review(self, verdict='APPROVE', epoch='2', **changes):
        value = dict(id='claim_one', file='old.json', pointer='/claims/0', verdict=verdict,
                     bindingSha256=self.row['bindingSha256'], targetUnitDigest=self.row['targetUnitDigest'])
        value.update(changes)
        return dict(value=value, path='reviews/test.json', pointer='/rows/0', reviewCommit=epoch, unique=True)

    def judge(self, reviews):
        return join.judge(self.group, reviews, lambda old, new: int(new) > int(old))

    def test_exact_independent_approval_follows_the_effective_lineage(self):
        self.assertEqual(self.judge([self.review()])['errors'], [])

    def test_either_missing_or_changed_digest_cannot_approve(self):
        for key in ('bindingSha256', 'targetUnitDigest'):
            for value in (None, 'b' * 64):
                with self.subTest(key=key, value=value):
                    self.assertIn('mismatched', self.judge([self.review(**{key: value})])['errors'])

    def test_an_unrelated_claim_or_shard_cannot_lend_its_approval(self):
        for changes in ({'id': 'claim_other'}, {'file': 'unrelated.json'}):
            self.assertIn('missing', self.judge([self.review(**changes)])['errors'])

    def test_latest_rework_stays_open_until_a_later_exact_approval(self):
        self.assertIn('open-REWORK', self.judge([self.review(epoch='1'), self.review('REWORK', epoch='2')])['errors'])
        self.assertNotIn('open-REWORK', self.judge([self.review('REWORK', epoch='1'), self.review(epoch='2')])['errors'])
        self.assertIn('open-REWORK', self.judge([self.review('REWORK'), self.review()])['errors'])

    def test_a_stale_rework_does_not_reopen_a_different_current_binding(self):
        self.assertEqual(self.judge([self.review(), self.review('REWORK', bindingSha256='b' * 64)])['errors'], [])

    def test_stale_verdict_cannot_approve_a_changed_decision_with_unchanged_digests(self):
        self.group['decisionCommit'] = '3'
        result = self.judge([self.review(epoch='2')])
        self.assertEqual(result['errors'], ['stale'])
        self.assertFalse(result['approvals'])
        self.assertEqual(len(result['staleVerdicts']), 1)
        self.assertFalse(self.judge([self.review('REWORK', epoch='2')])['openRework'])

    def test_fresh_verdict_requires_git_ancestry_not_a_timestamp_or_pin(self):
        self.group['decisionCommit'] = '2'
        for commit in ('2', '3'):
            self.assertFalse(self.judge([self.review(epoch=commit)])['errors'])
        result = join.judge(self.group, [self.review(epoch='99')], lambda old, new: False)
        self.assertEqual(result['errors'], ['stale'])

    def test_matching_fingerprint_authenticates_the_current_decision_without_ancestry(self):
        self.group['decisionCommit'] = '3'
        self.assertFalse(self.judge([self.review(epoch='1', rowFingerprint=self.group['rowFingerprint'])])['errors'])
        self.assertEqual(self.judge([self.review(epoch='1', rowFingerprint='wrong')])['errors'], ['stale'])
        # A fingerprint does not excuse an incorrect binding or ambiguous review.
        self.assertIn('mismatched', self.judge([self.review(
            rowFingerprint=self.group['rowFingerprint'], bindingSha256='wrong')])['errors'])

    def test_fingerprint_covers_decisions_and_inherited_claim_but_not_snapshots(self):
        doc = {'claims': [dict(rationale='parent', disposition='move', bindings=[copy.deepcopy(self.row)])]}
        pointer = '/claims/0/bindings/0'
        original = join.row_fingerprint(doc, pointer)
        for key, value in [('disposition', 'supersede'), ('rationale', 'new reason'),
                           ('reason', 'overlay reason'), ('changedClauses', [{'oldWording': 'old'}]),
                           ('supersedesBinding', {'pointer': '/claims/1'}), ('reviewStatus', 'pending'),
                           ('targetAncestry', ['Changed']), ('bindingSha256', 'changed')]:
            changed = copy.deepcopy(doc)
            changed['claims'][0]['bindings'][0][key] = value
            self.assertNotEqual(original, join.row_fingerprint(changed, pointer), key)
        doc['claims'][0]['bindings'][0]['priorReview'] = {'rationale': 'snapshot'}
        doc['claims'][0]['bindings'][0]['reviewNote'] = 'author metadata'
        doc['claims'][0]['bindings'][0]['targetUnitWitnesses'] = [{'rationale': 'snapshot'}]
        self.assertEqual(original, join.row_fingerprint(doc, pointer))
        doc['claims'][0]['rationale'] = 'changed parent'
        self.assertNotEqual(original, join.row_fingerprint(doc, pointer))

    def test_last_decision_commit_ignores_other_rows_and_detects_reverts(self):
        def document(rationale):
            return {'claims': [dict(self.row, rationale=rationale)]}
        current = document('current')
        old = document('old')
        cases = [
            (b'4 3\n3 2\n2 1\n1\n', {'4': current, '3': current, '2': old, '1': current}, '3'),
            # The merge's first parent lacks the decision, its second carries it.
            # A linear interleaved log would incorrectly call the merge an edit.
            (b'5 3 4\n3 1\n4 2\n2 1\n1\n',
             {'5': current, '3': old, '4': current, '2': old, '1': old}, '4'),
        ]
        for history, versions, expected in cases:
            with self.subTest(history=history), patch.object(join, 'git', return_value=history), patch.object(
                    join.subprocess, 'run', side_effect=lambda argv, **kw: SimpleNamespace(
                        returncode=0, stdout=json.dumps(versions[argv[-1].split(':')[0]]).encode())):
                self.assertEqual(join.decision_commits('HEAD', {'one.json': current}),
                                 {('one.json', '/claims/0'): expected})

    def test_aggregate_counts_do_not_expand_into_row_verdicts(self):
        data = {'verdict': 'APPROVE', 'counts': {'APPROVE': 1057}, 'items': [{'id': 'G0', 'verdict': 'APPROVE'}]}
        self.assertEqual(list(join.records(data)), [])
        data['rows'] = [self.review()['value']]
        self.assertEqual(len(list(join.records(data))), 1)

    def test_malformed_binding_hash_is_rejected_even_with_matching_review(self):
        self.row['bindingSha256'] = 'b' * 64
        self.assertIn('effective-binding-hash-invalid', self.judge([self.review()])['errors'])

    def test_review_local_pointer_needs_unique_digest_match(self):
        r = self.review(id='B-00', file=None, pointer='/claims/0')
        self.assertEqual(self.judge([r])['errors'], [])
        r['unique'] = False
        self.assertIn('mismatched', self.judge([r])['errors'])

    def test_successor_chains_and_in_place_changes_are_not_dropped(self):
        original = copy.deepcopy(self.row)
        successor = copy.deepcopy(original)
        successor['supersedesBinding'] = dict(shard='old.json', pointer='/claims/0',
                                             targetAnchor='a', targetUnitDigest='a' * 64)
        docs = {'old.json': {'claims': [original]}, 'new.json': {'bindingRefresh': [successor]}}
        register = {'changedBindings': [{'file': 'old.json', 'keys': ['claims', 0]}]}
        groups, errors = join.resolve(register, docs, {'old.json': {'claims': [original]}})
        self.assertFalse(errors)
        self.assertEqual(set(groups), {('new.json', '/bindingRefresh/0')})
        self.assertEqual(len(next(iter(groups.values()))['origins']), 2)
        changed = copy.deepcopy(original)
        changed['targetUnitDigest'] = 'c' * 64
        obligations = join.obligations({'changedBindings': []}, {'old.json': {'claims': [changed]}},
                                      {'old.json': {'claims': [original]}})
        self.assertIn('in-place-binding-change-since-frozen-source', obligations[('old.json', '/claims/0')])

    def test_missing_rows_and_ambiguous_supersessions_cannot_pass(self):
        groups, errors = join.resolve({'changedBindings': [{'file': 'missing', 'keys': ['claims', 0]}]}, {}, {})
        self.assertFalse(groups)
        self.assertEqual(len(errors), 1)
        row = copy.deepcopy(self.row)
        row['supersedesBinding'] = dict(shard='old.json', pointer='/claims/0', targetAnchor='a', targetUnitDigest='a' * 64)
        with self.assertRaises(AssertionError):
            join.supersessions({'one': {'bindingRefresh': [row]}, 'two': {'bindingRefresh': [row]}})


if __name__ == '__main__':
    unittest.main()
