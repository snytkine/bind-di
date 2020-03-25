import 'reflect-metadata';
import { Identity } from '../framework/identity';
import { ComponentIdentity } from '../lib/componentidentity';

/**
 * Tests variable for being object or function and not null
 *
 * https://tc39.github.io/ecma262/#sec-object-type
 * @param x
 */
export const isObject = x => {
  return typeof x === 'object' ? x !== null : typeof x === 'function';
};

export const copyIdentity = (identity: ComponentIdentity): ComponentIdentity => {
  return Identity(identity.componentName, identity.clazz);
};
