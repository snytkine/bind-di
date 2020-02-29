import 'reflect-metadata';
import { IfComponentIdentity, StringOrSymbol, Target } from '../definitions';
import { COMPONENT_IDENTITY, UNNAMED_COMPONENT } from '../consts';

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
    const ret = <IfComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target, propertyKey);
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
