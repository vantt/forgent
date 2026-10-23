// The journal row's retention sentence: pure, so the row's thresholds are testable without a repository.
// Finished chains no door compacts yet stay on disk: their count and oldest age show one kind growing unbounded.
const retentionLimits = { chains: 64, days: 7 };
export function retentionNote({ retainedChains: n, oldestRetainedAtMs: at, retainedBytes: bytes, ledgerCapacityWarning }, now = Date.now()) {
  const days = at == null ? null : Math.max(0, now - at) / 86_400_000;
  const facts = `${n} finished Git operation(s) retained (${Math.ceil(bytes / 1024)} KiB, oldest ${days == null ? 'age unknown' : `${days.toFixed(1)} days`})`;
  if (ledgerCapacityWarning) return 'warning: the Git WAL id ledger is at capacity (ids are never deleted); report this row';
  return !n ? null : n > retentionLimits.chains || days > retentionLimits.days ? `warning: ${facts}, past ${retentionLimits.chains} operations or ${retentionLimits.days} days; Worktree and Refs chains are not compacted yet, so report this row to schedule it` : `info: ${facts}`;
}
