// Whether a session rotates now: `none`, `soft` or `hard`, from the measured fraction, the thresholds of its
// persona and the at-rest facts. Pure; the caller supplies every fact.

/** `{ soft, hard }` of `persona`: its own override where set, else the global values. */
export function thresholdsFor(config, persona) {
  const own = config?.personas?.[persona] ?? {};
  const soft = own.soft ?? config.soft;
  const hard = own.hard ?? config.hard;
  if (!(soft <= hard)) throw new RangeError(`session rotation: soft ${soft} is above hard ${hard}${own.soft !== undefined || own.hard !== undefined ? ` for persona ${persona}` : ''}`);
  return { soft, hard };
}

/**
 * `{ rotate, reason }`. A background task or cron of the session blocks both levels (rotating would lose it);
 * a pending owner question blocks only `soft`, because `hard` carries the question verbatim into the handoff.
 */
export function decideRotation({ fraction, config, persona, pendingQuestion = false, backgroundTasks = [], sessionCrons = [] }) {
  if (!Number.isFinite(fraction)) return { rotate: 'none', reason: 'no-measure' };
  const { soft, hard } = thresholdsFor(config, persona);
  if (fraction < soft) return { rotate: 'none', reason: 'below-soft' };
  if (backgroundTasks.length > 0 || sessionCrons.length > 0) return { rotate: 'none', reason: 'background-work-running' };
  if (fraction >= hard) return { rotate: 'hard', reason: 'at-or-above-hard' };
  if (pendingQuestion) return { rotate: 'none', reason: 'pending-question' };
  return { rotate: 'soft', reason: 'at-or-above-soft' };
}
