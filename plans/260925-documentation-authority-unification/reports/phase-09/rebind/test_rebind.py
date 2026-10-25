#!/usr/bin/env python3
"""Owning record-tool proofs for identical groups and superseded origins.

No earlier test owns matches()'s formerly missing group-digest behavior or the
check door's treatment of immutable, explicitly superseded pilot preimages.
No product code, native addons, Git writes or repository fixtures are needed.
"""
import contextlib
import copy
import io
import json
from pathlib import Path
import runpy
import sys
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
MODULE = runpy.run_path(str(Path(__file__).with_name('rebind.py')))
MATCHES = MODULE['matches']
MAIN = MODULE['main']


class BindingChecks(unittest.TestCase):
    def test_identical_group_requires_every_distinct_member_at_its_own_ancestry(self):
        units = [dict(anchor=str(i), textDigest='a' * 64, ancestry=[str(i)]) for i in range(2)]
        row = dict(targetOwner='holder.md', targetAnchor=None, targetUnitDigest='a' * 64,
                   successorGroup=dict(memberCount=2, members=[dict(path='holder.md',
                       anchor=u['anchor'], unitDigest=u['textDigest'], ancestry=u['ancestry']) for u in units]))
        self.assertEqual(MATCHES(row, units), units)
        self.assertEqual(MATCHES(row, units[:1]), [])
        for field, value in [('path', 'other.md'), ('ancestry', ['wrong']),
                             ('unitDigest', 'b' * 64), ('anchor', 'absent')]:
            bad = copy.deepcopy(row)
            bad['successorGroup']['members'][1][field] = value
            self.assertEqual(MATCHES(bad, units), [], field)
        bad = copy.deepcopy(row)
        bad['successorGroup']['members'][1] = copy.deepcopy(bad['successorGroup']['members'][0])
        self.assertEqual(MATCHES(bad, units), [])
        self.assertEqual(MATCHES({**row, 'targetUnitDigest': None}, units), [])
        bad = copy.deepcopy(row)
        bad['successorGroup']['memberCount'] = 3
        self.assertEqual(MATCHES(bad, units), [])

    def test_single_unit_still_requires_the_bound_anchor_and_digest(self):
        unit = dict(anchor='here', textDigest='a' * 64, ancestry=[])
        row = dict(targetOwner='holder.md', targetAnchor='here', targetUnitDigest='a' * 64)
        self.assertEqual(MATCHES(row, [unit]), [unit])
        self.assertEqual(MATCHES({**row, 'targetAnchor': 'elsewhere'}, [unit]), [])
        self.assertEqual(MATCHES({**row, 'targetUnitDigest': 'b' * 64}, [unit]), [])

    def test_check_accepts_an_old_origin_only_when_its_exact_successor_is_live(self):
        # Old target bytes stay immutable; no scope expansion to the pilot is needed.
        old = dict(claimId='claim_fixture', targetOwner='holder.md', targetAnchor='here',
                   targetUnitDigest='a' * 64, targetAncestry=[])
        successor = dict(targetOwner='holder.md', targetAnchor='here', targetUnitDigest='b' * 64,
                         targetAncestry=[], supersedesBinding=dict(shard='origin.json',
                             pointer='/claims/0', targetAnchor='here', targetUnitDigest='a' * 64))
        docs = {'origin.json': {'claims': [old]}, 'overlay.json': {'bindingRefresh': [successor]}}
        for live_digest, expected in [('b' * 64, 0), ('c' * 64, 1)]:
            catalog = dict(catalog={'holder.md': dict(units=[dict(anchor='here',
                textDigest=live_digest, ancestry=[])])})
            with patch.dict(MAIN.__globals__, documents=lambda: docs, extract=lambda request: catalog), \
                    patch('os.chdir'), patch.object(sys, 'argv', ['rebind.py', '--check']), \
                    contextlib.redirect_stdout(io.StringIO()) as output:
                self.assertEqual(MAIN(), expected)
            result = json.loads(output.getvalue())
            self.assertEqual(result['drift'], expected)
            self.assertEqual(len(result['authenticatedSupersededOrigins']), 1 - expected)
        # Merely pointing at the old location cannot authenticate a wrong digest.
        successor['supersedesBinding']['targetUnitDigest'] = 'd' * 64
        with patch.dict(MAIN.__globals__, documents=lambda: docs, extract=lambda request: dict(
                catalog={'holder.md': dict(units=[dict(anchor='here', textDigest='b' * 64, ancestry=[])])})), \
                patch('os.chdir'), patch.object(sys, 'argv', ['rebind.py', '--check']), \
                contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(MAIN(), 1)


if __name__ == '__main__':
    unittest.main()
