# Review a38 step-05 seam 4, part s4-src-p03

Part: skills-and-support, 1 file, 152 items (3 admitted literals, 57 admitted dynamic tuples all parked, 92 rejected tuples). No diff / rollbackDiff / coCutPaths, so no diff review applies.

## core/skills/distill/scripts/distill.mjs (pin 95301cb9a) — verdict: rework

Items reviewed: 152 (3 literal + 149 dynamic). The 3 literals (reference-000285 L17, 000286 L26, 000287 L3) are admitted/preserve and correct: `docs/distillery` is a retained root (outside docs/specs and docs/architect, no alias in alias-table.json or switchboard; L12-26 item 3 retains it).

### OUTCOME defects

D1. Same-passage literal/tuple outcome conflict (L12-69/71 "same-passage literal and dynamic tuple share one outcome").
- reference-000286 (L26 `const REFS_DIR = "docs/distillery"`) is preserve, but dynamic-001704 on the same passage (L23-29, L26) is parked. One must change. Correct: preserve (retained root, not a retiring target; no Phase 9 patch exists).
- The park blocker ("population depends on supplied roots/view; bounded export and parity", blockedSeams generators) is not a real blocker for this file. distill.mjs is a hand-written skill helper, not a generated output, and nothing blocks a retained-root preserve. Same finding applies to every REFS_DIR document-path park, since they all target a path that stays put:
  001671 (L122), 001673 (L128), 001675 (L129), 001681 (L141), 001684 (L156), 001685 (L156), 001686 (L169), 001687 (L169), 001688 (L173), 001696 (L245), 001697 (L247), 001699-001703 (L250-258), 001711-adjacent none, 001759 (L407), 001760 (L411), 001771 (L459), 001772 (L464), 001782 (L499), 001784-001786 (L505-508), 001790 (L519), 001795 (L546), 001800-001802 (L587-588), 001811 (L74).
  Correction: preserve with a retained-root witness (docs/distillery retained, L12-26 item 3), the same as 000285-000287. If the Lead wants to keep them parked, the record must name a blocker that actually prevents preserve (none found).

D2. Admitted tuples that construct no document path (rule: a rejected/non-document tuple must not be admitted; scalar/accumulator/serialization reject).
- 001721 (L292), 001749 (L377), 001769 (L451): `path.join(repo, ".git")` is a git-clone existence probe, not a document. Reject (non-document-fs-probe).
- 001753 (L384): `missingPaths = []` is an accumulator. Its sibling 001754 (L394, same loop) is rejected as accumulator; the two must agree. Reject.
- 001804 (L643): `segments.join("|")` is table-row serialization. The same-passage write payload `lines.join("\n")` (001805, L645) is rejected. Reject 001804 to agree.
- 001682/001683 (L148), 001698 (L247), 001710 (L27 `CLONES_DIR = "upstreams"`), 001765 (L432), 001766 (L433): these build the git clone directory (`upstreams/<name>`, `meta.local`), which is a code checkout, not a document. Reject (clone-directory), or the record must say what document they read. The only document link is the .gitignore, handled by 001703.
- Root-only operands 001694, 001695, 001809, 001810, 001812, 001813 and the `root = requireRoot(args)` assignments (001714, 001733, 001738, 001758, 001764, 001781, 001789, 001794, 001799) resolve the project root and do not name a document path. See Lead question Q1.

D3. Rejected tuples that emit a document path in user-visible output (rule: runtime-emitted strings are user-visible output; admit and give them the same outcome as the path they name).
- 001711 (L270) `drop candidate sources into ${REFS_DIR}/intake.md`
- 001741 (L356) `add it to ${REFS_DIR}/taxonomy.txt first`
- 001791 (L521) `create ${REFS_DIR}/porting-log.md`
- 001815 (L83) `needs an existing ${REFS_DIR}/ directory`
  These interpolate the docs/distillery constant into the message. Correction: ADMIT, preserve, sharing the REFS_DIR outcome (D1). Currently rejected as "non-document-formatting", which is wrong because they name the path.

### Record-text notes
- The parked reason strings are generic ("Bounded caller input -> <operand>") and the blocker text is copied verbatim across 57 items. Whatever the final outcome, each should state the actual use (read/write/probe) of the target.
- 001672 (`${name}.md`, L122) is rejected while its enclosing tuple 001671 is admitted. Acceptable only if the record says it is the filename operand inside 001671.
- 001293-style clone-path messages (001718, 001719, 001722, 001723) are correctly rejected (clone paths, not documents).

### Lead-judgment questions
- Q1. Root-only operands (resolve/cwd/requireRoot/parent). L12-71 item 7 treats root/mainCheckout parks as coupled to the owning document check. Decide whether root assignments stay admitted (then they follow the REFS_DIR outcome, preserve) or reject as scalar pass-through. Either way the outcome must not be park.
- Q2. Computed-path messages (001131-region items 001716, 001717, 001679/001680 `${file}`, 001677 `no index file at ${file}`, 001708/001709 `${root}`) print a document path derived from REFS_DIR at runtime but do not contain the literal. Lead should decide whether these count as user-visible output admissions. They would take the same preserve outcome if admitted.
- Q3. 001755 (L399): regex `\]\(sources/${name}\.md#...\)` matches relative links into docs/distillery/sources inside the matrix. It reads link text, not a path, so reject is defensible. Confirm.

## Counts
- Files: 1, verdict rework.
- Items reviewed: 152. Outcome defects: D1 covers about 35 parked items plus the 000286 conflict; D2 covers 17 specific ids (001721, 001749, 001769, 001753, 001804, 001682, 001683, 001698, 001710, 001765, 001766 plus root-only group pending Q1); D3 covers 4 ids (001711, 001741, 001791, 001815).
- Rejected tuples confirmed correct: about 88 of 92 (all formatting, error text, clone-path text, regex, template, join-for-display).
- Admitted literals confirmed correct: 3 of 3.
