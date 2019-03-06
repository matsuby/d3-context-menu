export function noop() {}

/**
 * @param {*} value
 * @returns {Boolean}
 */
export function isFn(value) {
  return typeof value === 'function';
}

/**
 * @param {*} value
 * @returns {Function}
 */
export function toFactory(value, fallback) {
  value = (value === undefined) ? fallback : value;
  return isFn(value) ? value : () => value;
}
