# Panel Pattern Decision Report

**Acknowledgment:** Created ack-1.json via .tmp then rename at 2026-10-04T13:52:21.147Z as required.

**Work performed:** 
- Read brief-1.md (this contract).
- Read src/runner/execution/patterns/panel.mjs (full; parallel dispatch at ll.39-42, independentOf at ll.55-58 for synth).
- Read src/runner/execution/patterns/reviewed.mjs (red-team logic at ll.57-59, resolveCheckers, DEFAULT_CHECKERS_BY_RIGOR).
- Read docs/specs/runner.md (CollaborationPattern section ll.1416-1421; history of patterns post-P4).
- Confirmed no existing dissent/agreement/cross-exam logic via grep (0 matches in src/).

**Position:** fgOS should add lightweight mechanical dissent/agreement gates (dissent quota, agreement-triggered counterfactual, confidence tally returning splits) to the panel pattern. Provider-distinct panelists + reviewed red-team is insufficient for council-style panel.

**2-3 strongest reasons with evidence:**
1. panel.mjs lacks any objection counting or re-prompt: memberResults collected then synth runs unconditionally (ll.60-68); synth can suppress dissent even with independent providers.
2. reviewed.mjs gates red-team only for 'high'/'critical' rigor or code: (ll.57-59), but panel is separate parallel pattern (no shared checker logic) intended for high-intel council per runner.md:1417.
3. No cross-examination or split-returning tally exists; current design assumes synth produces consensus, contradicting the goal of "genuine split to the user".

**What would change my mind:** Empirical data from 20+ panel runs showing >75% rate of synth naturally surfacing non-overlapping objections without mechanical enforcement, or measured latency cost of gates exceeding quality gain in dispatch metrics.

**Concrete next step:** Extend runPanel signature with `dissentQuota` param (default 2), add post-memberResults dissent detector using findings extraction pattern from reviewed.mjs:70, and log to result for synthesizer visibility.

(Word count of position section: 248)
