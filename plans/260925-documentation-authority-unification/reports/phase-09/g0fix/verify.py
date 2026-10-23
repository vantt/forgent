"""Current G0 binding/residual proof; always evaluates HEAD + working-tree bytes.
The author-pin-only replay is retired by w3-ledger-fix-brief.md: its conditional
credential patch is now an applied current holder, and both ancestry spellings
must no longer pass. Historical receipts and before-inputs remain Git evidence.
The final-recipe verifier owns all cases; this old public path is wiring only.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'ledgerfix'))
from verify import main

if __name__ == '__main__':
    main()
