#!/usr/bin/env python3
"""Owning proof for the new strict verdict join; no existing tool proves it.

Only in-memory ledger/review fixtures. No Git writes, product tests or addons.
"""
import copy
import importlib.util
import pathlib
import unittest

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
                          ids={'claim_one'})

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
