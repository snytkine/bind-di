import { FrameworkError } from '../../exceptions';
import { Target } from '../../definitions';
import getTargetStereotype from './gettargetstereotype';

const debug = require('debug')('promiseoft:decorators');

const TAG = 'GET_FUNCTION_PARAMS';

/**
 * Extract param names from function
 * including from arrow function
 * https://stackoverflow.com/questions/1007981/
 *
 * @todo try to use acorn parser instead
 * https://www.npmjs.com/package/acorn
 *
 * const acorn = require('acorn');
 * const argNames = acorn.parse(f).body[0].params.map(x => x.name);
 * console.log(argNames);  // Output: [ 'a', 'b', 'c' ]
 *
 * @param func Function to parse
 * @returns array index-based array of parameter names
 * @throws FrameworkError if input is not a function
 */
const getFunctionParameters = (func: Function): string[] => {
  const t = typeof func;

  if (t !== 'function') {
    throw new FrameworkError(`Input to getFunctionParameters must be a function. Was ${t}`);
  }

  return new RegExp(`(?:${func.name}\\s*|^)\\s*\\((.*?)\\)`)
    .exec(func.toString().replace(/\n/g, ''))[1]
    .replace(/\/\*.*?\*\//g, '')
    .replace(/ /g, '')
    .split(',')
    .map(val => val.split('=')[0]);
};

/**
 *
 * @param target: Target
 * @param methodName: string name of Target's method
 * @param parameterIndex: number
 *
 * @return string name of object method param that matches param index
 * @throws FrameworkError if property of Target is not a function
 * or if there is no param for the paramIndex or if Regex fails to extract
 * named parameters from function.
 */
const getMethodParamName = (target: Target, methodName: string, parameterIndex: number): string => {
  const targetStereoType = getTargetStereotype(target);
  debug('%s targetStereoType="%s"', TAG, targetStereoType);
  /**
   * @todo allow to work with stereotype Prototype and Constructor
   * Right now it's expected to be PROTOTYPE only.
   * In case of constructor Function use the .prototype of constructor
   */

  const targetMethod = target[methodName];
  if (!targetMethod && typeof targetMethod !== 'function') {
    throw new FrameworkError(`getMethodParamName failed to get method ${methodName} 
    from target ${target?.constructor?.name}`);
  }

  const aParams = getFunctionParameters(targetMethod);

  if (!aParams && !Array.isArray(aParams)) {
    throw new FrameworkError(`getMethodParamName failed to extract method params from
    method="${methodName}" on target=${target?.constructor?.name}`);
  }

  if (!aParams[parameterIndex]) {
    throw new FrameworkError(`parameter name not found for index ${parameterIndex} 
    in method ${target?.constructor?.name}.${methodName}`);
  }

  return aParams[parameterIndex];
};

export { getFunctionParameters, getMethodParamName };
