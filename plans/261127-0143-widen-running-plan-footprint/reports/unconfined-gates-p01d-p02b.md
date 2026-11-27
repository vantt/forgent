# Unconfined gates p01d / p02b (13:09, lead:SUPERVISOR)

Scratch tree 026c0850b8 = origin/main + p01d e1bba8bf3e + p02b 8b0559fbc4; host rebuilt from it.

## (1) cargo test -p fgos --test supervision_verbs
```
test result: ok. 28 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.88s
exit=0
```

## (2) FGOS_HOST_BIN=<rebuilt> node scripts/run-tests.mjs test/session-host/head-request.test.mjs
```
ℹ pass 85
ℹ fail 0
exit=0
```
