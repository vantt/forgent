// checks.mjs — thin re-export shim (CONTEXT.md D1,
// docs/history/setup-doctor-config-registry/): the doctor check registry
// itself now lives in registrations.mjs, so a new module registering a
// check or fix never needs to edit this file. This file exists
// only so callers that already import from `checks.mjs`
// (`bin/fgos.mjs`, `test/setup/checks.test.mjs`) keep working unchanged —
// `DOCTOR_CHECKS` is a live re-exported binding to the same array
// `registrations.mjs` builds and mutates, not a snapshot copied here.

export {
  DOCTOR_CHECKS,
  FIX_REGISTRATIONS,
  registerCheck,
  createDoctorRun,
  registerFix,
  runFixes,
  runBridged,
  resolveMainCheckout,
  integrationScriptPath,
  mainCheckoutHookWired,
  checkConfinementHerdrMaturity,
  checkAgySubHomesConfigured,
  checkRunnerPatternsConfig,
} from './registrations.mjs';
