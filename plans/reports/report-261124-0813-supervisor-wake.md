# Supervisor wake 2026-11-24 08:13

- Queue had 4 events: two `session-no-result` for unit runs 1795482425181 and 1795482592112, and two `lane-freed` on fg-server2. All four are now marked handled.
- Running plan: 261121-2110-component-authority-doors. Its lead is live and busy: phase 10b is `running`, and the lead is waiting on `fgos request result c-71068-1795482707691 --wait 50`. That lead owns the follow-up for the two no-result units, so I left it alone.
- Admission: no plan is admissible. Leads live: 1 of 3. Lanes free: 4 of 4.
- Six owner questions are still open: q-lnjt5zzbfq, q-aanvfxaopa, q-t5anmlcb7q, q-j4yeougr72, q-ddj673fmju and q-e62q73d2au. None has been answered, so no successor needs to be started.
