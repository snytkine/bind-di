import 'reflect-metadata';
import { COMPONENT_IDENTITY } from '../consts';
import { ComponentIdentity } from '../utils/componentidentity';
import { Target } from '../definitions/target';

const debug = require('debug')('bind:decorator');

const TAG = 'getClassName';

export default function getClassName(target: Target): string {
  let res = '';
  if (target) {
    const identity = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target);

    if (identity && identity.clazz) {
      debug('%s Found className from COMPONENT_IDENTITY metadata ', TAG, identity);
      res = identity.clazz.name;
    }
    if (target.name) {
      debug('%s Found className in .name property "%s"', TAG, target.name);

      res = target.name;
    }
    if (target.constructor && target.constructor.name) {
      debug('Found className in constructor.name "%s"', TAG, target.constructor.name);

      res = target.constructor.name;
    }
  }

  return res;
}
