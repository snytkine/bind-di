import { copyComponents, depsResolved, UnsortedAndSorted } from './initializer';
import { IfComponentDetails, IfIocComponent, IfIocContainer } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';

const debug = require('debug')('bind:init:check');

const TAG = 'SORT_COMPONENTS';
/**
 * Sort components in order of dependencies resolved
 * where first element will be component with no dependencies,
 * second will be either no dependencies or with dependencies resolved
 * by first component, thirds is component with no dependencies
 * or dependencies resolved
 * by first 2, etc...
 *
 * If return object from this function has .unsorted array length > 0
 * this means that not all dependencies can be resolved.
 * It may also mean a dependency loop
 *
 *
 * @param {UnsortedAndSorted<T>} input
 * @returns {UnsortedAndSorted<T>}
 */
export const sortComponents = <T>(input: UnsortedAndSorted<T>): UnsortedAndSorted<T> => {
  let resolvedOne = false;
  if (input.unsorted.length === 0) {
    return input;
  }

  const ret: UnsortedAndSorted<T> = {
    unsorted: [],
    sorted: copyComponents(input.sorted),
  };

  for (const component of input.unsorted) {
    if (depsResolved(component, input.sorted)) {
      ret.sorted.push(component);
      resolvedOne = true;
    } else {
      ret.unsorted.push(component);
    }
  }

  if (!resolvedOne) {
    debug(
      `%s Dependencies not satisfied. 
        Check the following components for missing or circular dependencies`,
      TAG,
    );

    return ret;
  }

  return sortComponents(ret);
};

/**
 * Get Promise of Array of sorted components
 * Sorted by dependency resolution. First component has no dependency,
 * second has only dependencies that can be resolved in first container,
 * third has only dependencies that can be resolved by first and second, etc.
 *
 * @param container
 * @returns Promise<Array<IfComponentDetails>> or rejected promise with FrameworkError
 */
export function getSortedComponents(container: IfIocContainer): Promise<Array<IfComponentDetails>> {
  const { components } = container;
  if (!components.length) {
    debug('%TAG Components array is empty. Nothing to sort', TAG);
  }
  const { sorted, unsorted } = sortComponents<IfIocComponent>({
    unsorted: components,
    sorted: [],
  });

  if (unsorted.length > 0) {
    const error = `
                    Dependency sorting failed. Following components have unresolved dependencies.
                    Please check your dependencies. There may be an "import loop"
                    Components with unresolved dependencies are:
                    ${unsorted.map(component => component.identity.toString()).join(', ')}
                    ===============================
                    `;
    return Promise.reject(new FrameworkError(error));
  }

  return Promise.resolve(sorted);
}
