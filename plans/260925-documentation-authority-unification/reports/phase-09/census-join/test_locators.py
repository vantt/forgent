#!/usr/bin/env python3
"""Owning regression proof: re-pinning cannot revert recorded locator corrections.

Existing test-locators.mjs extracts JS boundaries, not settlement evidence anchors.
Only record reads and read-only Git ancestry; no test/source execution or addons.
"""
import copy
import importlib.util
import json
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('census_join', HERE / 'join.py')
join = importlib.util.module_from_spec(spec)
spec.loader.exec_module(join)


class Locators(unittest.TestCase):
    def setUp(self):
        self.decisions = {r['id']: r for r in json.loads((HERE / 'settlement-decisions.json').read_text())['rows']}

    def test_recorded_corrections_survive_a_pin_with_no_matching_evidence(self):
        for rid, line in [('pc-d-1101', 30), ('pc-d-0924', 3868), ('pc-d-0449', 184)]:
            with self.subTest(row=rid):
                anchor = join.settlement_locator(self.decisions[rid], 'new-pin-without-evidence')
                self.assertEqual(anchor['line'], line)
                self.assertEqual(anchor['pin'], '5820ca6780ff6eec28afe09a128ac95fcd11d06c')

    def test_missing_or_invalid_recorded_locator_fails_loudly(self):
        decision = copy.deepcopy(self.decisions['pc-d-1101'])
        decision['correctedLocator']['line'] = 99999
        with self.assertRaisesRegex(AssertionError, 'corrected locator lacks unique evidence'):
            join.settlement_locator(decision, 'new-pin')
        decision.pop('correctedLocator')
        decision['evidence'] = []
        with self.assertRaisesRegex(AssertionError, 'no same-file locator evidence'):
            join.settlement_locator(decision, 'new-pin')

    def test_newest_same_file_evidence_replaces_stale_first_span(self):
        decision = copy.deepcopy(self.decisions['pc-d-1101'])
        decision.pop('correctedLocator')
        self.assertEqual(join.settlement_locator(decision, 'new-pin')['line'], 30)
        decision['sourceSha256'] = '0' * 64
        with self.assertRaisesRegex(AssertionError, 'locator source drift'):
            join.settlement_locator(decision, 'new-pin')


if __name__ == '__main__':
    unittest.main()
