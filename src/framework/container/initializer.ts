import {
  IfIocComponent,
  IfIocContainer,
  IfComponentDetails,
  IfComponentFactoryMethod,
  IfComponentPropDependency,
} from '../../definitions';
import { ComponentScope } from '../../enums';
import stringifyIdentify from '../lib/stringifyidentity';
import { copyIdentity } from '../../metadata';
import isSameIdentity from '../../metadata/issameidentity';

const debug = require('debug')('bind:container');

export const TAG = 'Initializer';

/**
 * The reason for async is to return a promise
 * the reason for a promise so that this function can be chained
 * with other loader functions like initializer
 *
 * @param {Array<IfIocComponent<T>>} components
 * @returns {Promise<Array<IfIocComponent<T>>>}
 */
export const sortdependencies = async <T>(
  components: Array<IfIocComponent>,
): Promise<Array<IfIocComponent>> => {
  return components;
};

const copyPropDependency = (dep: IfComponentPropDependency): IfComponentPropDependency => {
  return {
    propertyName: dep.propertyName,
    dependency: copyIdentity(dep.dependency),
  };
};

const copyFactoryMethod = (m: IfComponentFactoryMethod): IfComponentFactoryMethod => {
  return {
    methodName: m.methodName,
    providesComponent: copyIdentity(m.providesComponent),
  };
};

const copyComponents = (a: Array<IfComponentDetails>): Array<IfComponentDetails> => {
  return a.map(componentDetails => {
    return {
      identity: copyIdentity(componentDetails.identity),
      scope: componentDetails.scope,
      propDependencies: componentDetails.propDependencies.map(copyPropDependency),
      constructorDependencies: componentDetails.constructorDependencies.map(dependentyIdentity =>
        copyIdentity(dependentyIdentity),
      ),
      componentMetaData: componentDetails.componentMetaData,
      preDestroy: componentDetails.preDestroy,
      postConstruct: componentDetails.postConstruct,
      provides: componentDetails.provides.map(copyFactoryMethod),
    };
  });
};

export type UnsortedAndSorter<T> = {
  unsorted: Array<IfComponentDetails>;
  sorted: Array<IfComponentDetails>;
};

const depsResolved = (
  component: IfComponentDetails,
  aComponents: Array<IfComponentDetails>,
): boolean => {
  debug('%s entered depsResolved for component="%s"', TAG, stringifyIdentify(component.identity));
  /**
   * Every propDependency and every Constructor Dependency must be provided by
   * components in the aComponents
   */
  const ctorDepsresolved = component.constructorDependencies.map(ctorDep => {
    return aComponents.findIndex(comp => {
      return (
        isSameIdentity(comp.identity, ctorDep) ||
        comp.provides.findIndex(provided => {
          return isSameIdentity(provided.providesComponent, ctorDep);
        }) > -1
      );
    });
  });

  const propDepsresolved = component.propDependencies.map(propDep => {
    return aComponents.findIndex(comp => {
      return (
        isSameIdentity(comp.identity, propDep.dependency) ||
        comp.provides.findIndex(provided => {
          return isSameIdentity(provided.providesComponent, propDep.dependency);
        }) > -1
      );
    });
  });

  debug(
    '%s deps for component "%s"  ctorDepsresolved="%o" propDepsresolved="%o"',
    TAG,
    stringifyIdentify(component.identity),
    ctorDepsresolved,
    propDepsresolved,
  );

  return !propDepsresolved.includes(-1) && !ctorDepsresolved.includes(-1);
};

export const initIterator = async function*(
  container: IfIocContainer,
  components: Array<IfComponentDetails>,
): AsyncIterableIterator<boolean> {
  for (const comp of components) {
    /**
     * Only Singleton can have initializer functions
     * Factory components are the ones that mostly use initializers
     * but in general any singleton component can have initializer
     * Only singletons are allowed to have initializers because
     * the initialization function is only called once during container
     * initialization.
     * Non-singleton components cannot have initializer called
     * because initializer returns a promise but container must return
     * instance, it cannot return a Promise of component.
     */
    if (comp.scope === ComponentScope.SINGLETON && comp.postConstruct) {
      const o = container.getComponent(comp.identity);

      yield o[comp.postConstruct]().then(() => stringifyIdentify(comp.identity));
    }
  }
};

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
 * @param {UnsortedAndSorter<T>} input
 * @returns {UnsortedAndSorter<T>}
 */
export const sortComponents = <T>(input: UnsortedAndSorter<T>): UnsortedAndSorter<T> => {
  let resolvedOne = false;
  if (input.unsorted.length === 0) {
    return input;
  }

  const ret: UnsortedAndSorter<T> = {
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
