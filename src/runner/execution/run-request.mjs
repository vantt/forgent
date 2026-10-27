// Normalizes and validates request parameter flags (--params, --param).

export class RunRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RunRequestError';
    this.code = code;
  }
}

function makeScalar(key, raw) {
  const scalar = { key, raw };
  Object.defineProperty(scalar, 'value', {
    get() {
      return this.raw;
    },
    enumerable: false,
    configurable: true,
  });
  return scalar;
}

/**
 * Normalizes request parameter flags into a canonical request shape.
 *
 * @param {object} [flags]
 * @param {string} [flags.params] JSON string representing a plain object
 * @param {string|string[]|boolean} [flags.param] Key-value parameter specification(s)
 * @returns {{ params?: object, scalars: Array<{ key: string, raw: string }> }}
 */
export function requestFromFlags(flags = {}) {
  const params = flags?.params;
  const param = flags?.param;
  let parsedParams;

  if (params !== undefined) {
    if (typeof params !== 'string') {
      throw new RunRequestError('param-invalid', '--params must be a JSON string');
    }
    let parsed;
    try {
      parsed = JSON.parse(params);
    } catch (e) {
      throw new RunRequestError('param-invalid', `--params must be valid JSON: ${e.message}`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new RunRequestError('param-invalid', '--params must parse to a plain JSON object');
    }
    parsedParams = parsed;
  }

  const scalars = [];
  const seenParamKeys = new Set();

  if (param !== undefined) {
    if (param === true) {
      throw new RunRequestError('param-invalid', '--param requires a key=value pair');
    }
    const rawList = Array.isArray(param) ? param : [param];
    for (const item of rawList) {
      if (typeof item !== 'string') {
        throw new RunRequestError('param-invalid', '--param value must be a string key=value pair');
      }
      const eqIdx = item.indexOf('=');
      if (eqIdx === -1) {
        throw new RunRequestError('param-invalid', `--param "${item}" missing "=" delimiter`);
      }
      const key = item.slice(0, eqIdx);
      const raw = item.slice(eqIdx + 1);
      if (key === '') {
        throw new RunRequestError('param-invalid', `--param "${item}" key cannot be empty`);
      }
      if (raw === '') {
        throw new RunRequestError('param-invalid', `--param "${item}" value cannot be empty`);
      }
      if (seenParamKeys.has(key)) {
        throw new RunRequestError('param-request-conflict', `parameter "${key}" specified more than once in --param`);
      }
      seenParamKeys.add(key);

      if (parsedParams && Object.hasOwn(parsedParams, key)) {
        throw new RunRequestError('param-request-conflict', `parameter "${key}" specified in both --params and --param`);
      }

      scalars.push(makeScalar(key, raw));
    }
  }

  const result = { scalars };
  if (parsedParams !== undefined) {
    result.params = parsedParams;
  }
  return result;
}
