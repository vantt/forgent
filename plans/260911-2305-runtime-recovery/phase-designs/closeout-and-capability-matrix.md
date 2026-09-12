# P08 - Closeout And Capability Matrix

**Status:** PENDING ALL PRIOR ACCEPTANCE  
**Owner:** integration, setup/doctor and documentation maintainers

## Closeout Gate

Every capability row must name profile, adapter, evidence and typed fallback.
No row is advertised while its evidence is `open`, `disabled` or dependent on
an unresolved finding.

| Capability | Required proof | Default |
|---|---|---|
| local cli-spawn recovery | P02L parent-crash, protected launch envelope/binding/capture/receipt, worker outbox, evaluator baseline, recoverable confinement finalization, controller-only settlement and legacy parity | required for conservative core because `cli-spawn` is default |
| local recovered collect | P02L current-control token, protected capture/receipt digest and evaluator-baseline parity | enabled only for exact current Run with intact protected artifacts |
| same-Run reattach | S1 + S2 F-b plus adapter-proven resource incarnation | enabled only for a proving adapter; current CLI otherwise observes/parks |
| recovered local cancel | effect-boundary kill proof against host/boot/pid/start-time/PGID | unsupported in first P02L; supervisor-owned timers still work |
| shared-cwd mutating continuation | workspace occupancy and quiescence proof | unsupported until P06-style authority exists |
| no duplicate launch | S2 fresh-submit/F-f proof | fresh launch only; replacement/resubmit disabled without `absent-proven` |
| Herdr bwrap launch | P02H prepared-command digest + local-bwrap-v1 attestation + outbox receipt | ready for first launch/observe/park; replacement still needs `absent-proven` |
| post-delivery repeat | S3 provider-only effect proof | current bwrap still parks filtered-network/effect claims outside local-bwrap-v1 support |
| fallback | S3 compiler provenance proof | enabled only for governed candidates |
| public recovery plan | S4 stale/single-consume proof | enabled after S4 |
| writable takeover | P06 B02/B03/X05 | disabled |
| terminal transfer | P07 X08/C-g and engine backlog | refused by current CP profile |

## Verification

Run focused phase suites, then `npm test`. Compare capability matrix against
actual results, run setup/doctor registration for new configuration or infra,
render all changed markdown and audit schema-1 replay fixtures. Inspect the
final diff for source/test scope and run the repository change detector before
any merge.

## Residuals

Document Herdr gateway limitations, live-PID unreclaimability, force-release
deferred to R3, and every typed park/refusal. Closeout cannot convert a warning
into an enabled capability.
