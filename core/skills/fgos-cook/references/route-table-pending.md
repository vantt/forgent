# Route table: pending

The table that would say, per slice kind, which capability, rigor, tier, collaboration
pattern and persona to use is **not written**. It waits for the Seat Binding spec,
which changes what rigor and tier mean. Writing it now would fix rules that spec is
about to replace, so [`fgos-cook`](../SKILL.md) has none.

## Inputs the loop needs from it

For each slice kind (read-only exploration, mechanical edit, ordinary code, contract
or locked-law change, irreversible or data change, test first, diagnosis of a failed
verify, review of a document, docs, integration check):

| Input | Today | Needed from the table |
|---|---|---|
| capability | you pick from `../_shared/capability-catalog.md` by the nature of the artifact | the default capability per kind |
| rigor | you judge from what the slice touches, never below the frame's floor | the rigor per kind and when to raise it |
| pattern | omit selection flags: the door inherits the activity's `unit`; use `--pattern`, `--params` or `--param` only to change the degree for this dispatch, with `--reason`, and inspect the result's pin for what ran and why | when to use catalog patterns such as `solo`, `reviewed`, `rfc` or `panel` |
| persona | a name from `fgos agents list`, only when it plainly fits | which persona per kind |
| tier / provider | never set; `bind()` decides | nothing: stays out of the loop |
| ask-first kinds | irreversible, data or security work goes to the owner before any dispatch | the list of kinds |

## What the loop does until then

- Choose capability and rigor per slice by judgment, write the choice and the reason
  in the notebook, and keep rigor at or above the frame floor.
- Let the door inherit the activity's `unit`; change the degree only as described
  in `case-and-doors.md`, which also covers older installed releases. A `solo` run
  with `--verify` verifies once and can leave a receipt; without a command it leaves
  none, which the milestone then shows. Do not invent a pairing of rigor with tier
  or with provider family.
- When the loop would need a rule only the table can give, record the question as a
  parked item; do not fill the gap with a private convention.
