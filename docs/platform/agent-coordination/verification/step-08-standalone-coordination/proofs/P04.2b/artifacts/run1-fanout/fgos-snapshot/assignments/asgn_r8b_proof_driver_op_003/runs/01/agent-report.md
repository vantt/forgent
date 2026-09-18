# Coordinator run: asgn_r8b_proof_driver_op_003

Objective: fan out two independent, bounded research questions.

No Work content or context refs were attached to this assignment, so two general
software-engineering research questions were self-selected to exercise the
`independent-research-fan-out-fan-in` protocol end-to-end.

## Fan-out 1: Monolith vs microservices

Monoliths package logic/data/UI into one deployed process; microservices decompose
into independently owned, API/event-connected services.

- Deployment/ops: monolith releases as one unit (simpler, but coordinated); microservices
  deploy independently (needs tracing/orchestration).
- Scaling: monolith scales as a whole (wasteful); microservices scale per-service (adds
  network latency).
- Team autonomy: monolith needs shared codebase ownership; microservices let small teams
  own services end-to-end but need clear contracts.
- Rule of thumb: start monolithic for small teams/young projects/tight latency needs;
  move to microservices once independent scaling or deployment conflicts bottleneck
  velocity and operational maturity exists. Modular monoliths are a middle ground.

## Fan-out 2: Password storage best practices

- Use memory-hard, adaptive hashes: Argon2 (OWASP-preferred), bcrypt, or scrypt. Never
  MD5/SHA-1 — broken and cheaply brute-forced.
- Every password needs a unique, random salt (16+ bytes); bcrypt/Argon2 handle this
  internally.
- Also: optional server-side pepper, rate limiting/account lockout, never log plaintext
  passwords.

## Unresolved

- No concrete research questions were supplied via Work/contextRefs. If specific content
  was intended for this fan-out, supply it and re-dispatch.
