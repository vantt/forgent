# System Vision: Trong Mem Ngoai Cung

Document type: System-wide architecture vision
Design status: Guiding vision
Implementation: Cross-cutting
Last reviewed: 2026-09-05
Canonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS

## 1. Vision

fgOS should be **trong mem, ngoai cung**: a strong body operated by a superior
intelligence.

The outside must be hard:

- contracts are explicit;
- state transitions are lawful;
- evidence is auditable;
- capabilities are fenced;
- roots and writer authority are typed;
- runtime behavior is reproducibly verifiable.

The inside must be soft:

- prose can carry judgment;
- skills can adapt to context;
- agents can reason, reframe, negotiate, and recover;
- coordination can use human-shaped operating patterns;
- domain behavior can stay expressive instead of becoming only schema.

The target is not softness instead of rigor, or rigor instead of intelligence.
The target is a living system that is flexible, graceful, quick, strong, and
precise because each side does its own job.

```txt
Outside hard:
  contract, state, capability, topology, proof, audit

Inside soft:
  soul, prose, skill, judgment, collaboration, domain intelligence
```

## 2. Why This Exists

Step 09 exposed the failure mode this vision is meant to prevent.

During the group-thinking work, implementation pressure pulled attention toward
harnesses, schemas, tests, and fixtures. Those were necessary: without them the
system cannot be trusted. But too much attention on harness alone made the
Master Coordination shape hard to deploy as a living operating pattern. The
system could become correct but stiff: safe mechanics with too little soul,
prose, and skill surface for agents to actually coordinate well.

That is not the intended fgOS shape.

fgOS exists to help developers and business workflows forge agents faster. A
platform that only exposes hard machinery makes every new agent app rebuild
its own operating intelligence in prose outside the system. A platform that
only exposes prose and skill without hard contracts becomes fragile and
unverifiable. The product needs both.

## 3. Design Rule

Every major architecture slice must ask two questions:

```txt
What is the hard outer contract?
What is the soft inner operating intelligence?
```

The hard outer contract includes:

- identity and root ownership;
- state classes and event truth;
- command boundaries;
- capability grants and refusals;
- evidence and proof rules;
- compatibility, rollback, and repair behavior.

The soft inner operating intelligence includes:

- skill flow;
- prose handoff;
- domain doctrine;
- role posture;
- judgment heuristics;
- collaboration style;
- recovery playbook;
- human-facing explanation.

A design that has only the hard side is incomplete. A design that has only the
soft side is incomplete.

## 4. Practical Consequences

1. **Harness is not the product experience.** Harness proves safety and
   repeatability. It must not replace the skill/prose path that makes agents
   effective.
2. **Skill/prose is not an escape hatch from proof.** Soft operating
   intelligence still enters through declared contracts, capability checks, and
   evidence rules.
3. **Runtime kernels stay small and hard.** The kernel should enforce legality,
   not absorb every domain judgment into schema.
4. **Domain adapters carry living intelligence.** Coding, marketing, and future
   business domains should express their own doctrine, prompts, evidence
   posture, and operating style behind stable ports.
5. **Projection matters.** Skills, agents, prose, and managed instruction files
   are not secondary decoration. They are how the inner intelligence becomes
   usable by real agents.
6. **A proof slice must prove usability, not only legality.** A slice is weak if
   it passes tests but cannot be launched, resumed, understood, or operated by a
   real agent without reconstructing missing prose from chat history.

## 5. Relation To Current Streams

| Stream | Hard Outside | Soft Inside |
|---|---|---|
| Workspace Topology | typed roots, identities, capabilities, leases | clear operational guidance for which workspace an agent is in and what it may touch |
| Packaging/Distribution | release manifests, activation bindings, projection ledgers | projected skills/prose/agents that make the selected runtime usable |
| Agent Coordination | FlowDefinition, CoordinationSession, Assignment, RunResult | group-thinking protocols, coordinator playbooks, role posture, synthesis style |
| Coding Domain / Step 10 | Work Driver ports, evidence contracts, workspace/occupancy grants | Coding Domain Adapter behavior, coding doctrine, prompts, skills, review/debug/implementation habits |
| Host Invocation | stable command/API entry and provider routing | surfaces that preserve context and help humans/agents operate the system |

## 6. Review Check

Before closing an architecture plan or implementation slice, reviewers should
ask:

```txt
Does the outside stay hard enough to verify?
Does the inside stay soft enough to think and adapt?
Did we preserve the skill/prose/soul surface, or only the harness?
Did we preserve the harness/contract surface, or only the prose?
```

If the answer is no on either side, the slice is not done.

