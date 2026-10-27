# Phase 05: rollout, doctor, live proof

- Config keys `mailbox.crossMachine.enabled` (default false) and `mailbox.remote.requireConfirmed` (default true) in the registry and `fgos setup`; a doctor row for publisher, fetch refspec, pins state, last fetch age, forged own-mirror, machine id shared by two clones.
- Measure events and bytes per day per machine from the first push (spec 15.2 requirement) and report it.
- Release landing by the usual window protocol on each machine; board line before and after. The owner confirms machine pins once.
- Live proof between two real machines: a mail each way, a mail while the receiver is mid-turn, a mail across a head restart; report send-to-offered. Spec decision row records measured latency and what the proof did not cover.
- The lane stays open until every machine runs the release.
