# <Area Name>

```txt
Document type: Area portal
Audience: Human reviewer, architect, implementer, agent
Purpose: Enter this area, understand ownership, choose what to read next
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: <area navigation and ownership>
Use this when: You need to understand or change <area>
Do not use this for: Exact behavior details or historical rationale
Last reviewed: YYYY-MM-DD
Related:
- `spec.md`
```

## 1. What This Area Owns

## 2. Current Shape

## 3. Read First

| Need | Read |
|---|---|
| Full direction / north star | [vision.md](vision.md) |
| Preserved intent across simplified slices | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Current behavior/state | [spec.md](spec.md) |
| Child component map | [subcomponents/](subcomponents/) or §6 below |
| Design rationale/boundaries | [architecture/](architecture/) |
| Exact interfaces/rules | [contracts/](contracts/) |
| Proof/evidence | [verification/](verification/) |
| Open proposals | [proposals/](proposals/) |
| Historical context | [history/](history/) |

## 4. Decision Surface

| Status | Question / Decision | Where |
|---|---|---|
| Settled |  |  |
| Open |  |  |
| Needs human review |  |  |

## 5. Canonical Documents

| Purpose | Path | Authority |
|---|---|---|
| Full direction | [vision.md](vision.md) | Canonical for intended direction |
| Preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) | Canonical for deferred-preserved intent |
| Current behavior | [spec.md](spec.md) | Canonical for current state |
| Subcomponents | [subcomponents/](subcomponents/) or §6 below | Canonical for child component navigation |
| Architecture | [architecture/](architecture/) | Canonical for rationale/boundary |
| Contract | [contracts/](contracts/) | Normative interface/rule |

## 6. Subcomponent Map

| Subcomponent | Owns | Does not own | Status | Read |
|---|---|---|---|---|
|  |  |  | implemented / partial / planned / legacy-current / unknown |  |

Use this table even before subcomponent directories exist. Create
`subcomponents/<name>/README.md` only when the child component needs local
navigation, contracts, verification, or history.

## 7. Key Contracts

## 8. Related Areas

| Area | Relationship |
|---|---|

## 9. Component Boundary Impact

| Question | Answer |
|---|---|
| Does this area own a platform component? |  |
| Does this area change parent/child component boundaries? |  |
| Does this area introduce or change subcomponents? |  |
| Relevant `docs/platform/component-boundary.md` entry |  |

Record `No component-boundary change` when the area change does not affect the
whole-system boundary map.

## 10. How To Change This Area

1. Read this README and `spec.md`.
2. Read `vision.md` and `intent-preservation-ledger.md` when the work narrows
   or stages the full design.
3. Check the subcomponent map when the work touches a child component.
4. Check relevant contracts and verification.
5. Check whether `docs/platform/component-boundary.md` needs an update.
6. Open or update a discussion scratchpad if shaping is needed.
7. Promote settled changes into canonical docs.
8. Add or update proof.

## 11. Maintenance Notes

## 12. Related Files

| Relationship | File |
|---|---|
| states full direction | [vision.md](vision.md) |
| preserves deferred intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| defines current behavior | [spec.md](spec.md) |
| maps child components | [subcomponents/](subcomponents/) |
| explains design shape | [architecture/](architecture/) |
| defines normative rules | [contracts/](contracts/) |
| proves claims | [verification/](verification/) |
