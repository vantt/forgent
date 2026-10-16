// lock-scope.mjs -- the transaction scope a caller passes explicitly to
// every acquire. Inside one scope a lock may only be taken at a rank
// strictly above every rank the scope already holds; two locks of one rank
// in one scope are refused too. A violation throws at once: nothing is
// opened, no helper runs. Two scopes in one process do not see each other
// (the kernel excludes their descriptions; no process-wide rank set).

import { HolderLockError } from './protocol.mjs';

export class LockScope {
  #label;
  #held = new Map();

  constructor(label = 'scope') {
    this.#label = String(label);
  }

  get label() {
    return this.#label;
  }

  /** `[{ name, rank }]` of every lock this scope holds, in acquire order. */
  holding() {
    return [...this.#held.values()].map((entry) => ({ ...entry }));
  }

  /** Throw `lock-order-violation` unless `rank` is above every held rank. */
  assertCanAcquire(name, rank) {
    const held = this.holding();
    const blocking = held.filter((entry) => entry.rank >= rank);
    if (blocking.length === 0) return;
    const same = blocking.some((entry) => entry.rank === rank);
    throw new HolderLockError(
      'lock-order-violation',
      `scope ${this.#label} holds ${blocking.map((entry) => `${entry.name}(${entry.rank})`).join(', ')} and may not acquire ${name}(${rank}): ${same ? 'one rank at a time per scope' : 'ranks only go up inside a scope'}`,
      { scope: this.#label, held, acquiring: { name, rank } },
    );
  }

  /** Record `handle` as held by this scope (called by the facade after a successful acquire). */
  track(handle) {
    this.#held.set(handle, { name: handle.name, rank: handle.rank });
  }

  /** Forget `handle` (called by the facade on release). */
  untrack(handle) {
    this.#held.delete(handle);
  }
}

export function createLockScope(label) {
  return new LockScope(label);
}

/** The scope argument every acquire takes: a LockScope, nothing implicit. */
export function assertLockScope(scope) {
  if (!(scope instanceof LockScope)) {
    throw new HolderLockError('lock-scope-required', 'acquire needs an explicit LockScope as its first argument (createLockScope)', { got: scope === null ? 'null' : typeof scope });
  }
  return scope;
}
