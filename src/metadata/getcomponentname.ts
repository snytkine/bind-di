import 'reflect-metadata';
import { StringOrSymbol } from '../definitions/types';
import { COMPONENT_IDENTITY, UNNAMED_COMPONENT } from '../consts';
import { ComponentIdentity } from '../utils/componentidentity';
import { Target } from '../definitions/target';

const debug = require('debug')('bind:metadata');

const TAG = 'getComponentName';
/**
 * Get the name of component from class or instance
 * use metadata value if available, otherwise use the .name of class or .name of constructor.prototype
 * @param {Object} component
 * @returns {string}
 */
export default function getComponentName(
  target: Target,
  propertyKey?: StringOrSymbol,
): StringOrSymbol {
  if (target) {
    const ret = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target, propertyKey);
    if (ret) {
      debug(
        '%s Found component name from COMPONENT_IDENTITY metadata ',
        TAG,
        String(ret.componentName),
      );

      return ret.componentName;
    }
  }

  return UNNAMED_COMPONENT;
}
