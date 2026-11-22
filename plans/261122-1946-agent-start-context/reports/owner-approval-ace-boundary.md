# Owner approval: agent start context is the composition engine's first slice

Relayed by the supervisor on 2026-11-22 (event 16707082c8c40dac). The owner approved at 21:56, on DOCOS's advice.

1. Agent start context (ASC) is the first slice of the agent context engine (ACE) and its start-time compose door.
2. Phase 2 spec: ACE owns composition and selection; ASC is its door. Amend RUL102 and the owner row of the
   composition contract in the same change. ASC never edits rule text.
3. Owner note: the discussion covered only the door and injection, not rule choice. Phase 6's `when:` matcher goes
   further than that; confirm its scope with the owner before building it.
4. Tell DOCOS when the `when:` field list is fixed.
