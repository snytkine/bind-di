/**
 * Tests variable for being object or function and not null
 *
 * https://tc39.github.io/ecma262/#sec-object-type
 * @param x
 */
const isObject = x => {
  return typeof x === 'object' ? x !== null : typeof x === 'function';
};

export default isObject;
