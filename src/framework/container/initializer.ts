import {
  IfIocComponent,
  IfIocContainer,
  IfComponentDetails,
  IfComponentFactoryMethod,
  IfComponentPropDependency,
} from '../../definitions';
import { ComponentScope } from '../../enums';
import copyIdentity from '../../metadata/copyidentity';
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

export const copyComponents = (a: Array<IfComponentDetails>): Array<IfComponentDetails> => {
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
      provides: componentDetails.provides && componentDetails.provides.map(copyFactoryMethod),
      extraDependencies: componentDetails.extraDependencies.map(copyIdentity),
    };
  });
};

export type UnsortedAndSorted<T> = {
  unsorted: Array<IfComponentDetails>;
  sorted: Array<IfComponentDetails>;
};

/**
 * Given a componentDetails and array of componentDetails
 * checks in all constructor dependencies and prop dependencies
 * of component can be found in given array of components.
 *
 * @param component component to check
 * @param aComponents array of components to look for dependencies
 * @returns boolean true if all component dependencies can be found in given array
 * of components, false otherwise.
 *
 * @todo return Promise<boolean>? this way can return rejected Promise with error
 */
export const depsResolved = (
  component: IfComponentDetails,
  aComponents: Array<IfComponentDetails>,
): boolean => {
  debug('%s entered depsResolved for component="%s"', TAG, component.identity);
  /**
   * Every propDependency and every Constructor Dependency must be provided by
   * components in the aComponents.
   *
   * @todo what about checking for scope rules? provided component scope cannot be
   * smaller than component scope. (Smaller scope cannot be injected into larger scope)
   */
  const ctorDepsresolved = component.constructorDependencies.map(ctorDep => {
    return aComponents.findIndex(comp => {
      return (
        isSameIdentity(comp.identity, ctorDep) ||
        (comp.provides &&
          comp.provides.findIndex(provided => {
            return isSameIdentity(provided.providesComponent, ctorDep);
          }) > -1)
      );
    });
  });

  const propDepsresolved = component.propDependencies.map(propDep => {
    return aComponents.findIndex(comp => {
      return (
        isSameIdentity(comp.identity, propDep.dependency) ||
        (comp.provides &&
          comp.provides.findIndex(provided => {
            return isSameIdentity(provided.providesComponent, propDep.dependency);
          }) > -1)
      );
    });
  });

  debug(
    '%s deps for component "%s"  ctorDepsresolved="%o" propDepsresolved="%o"',
    TAG,
    component.identity,
    ctorDepsresolved,
    propDepsresolved,
  );

  return !propDepsresolved.includes(-1) && !ctorDepsresolved.includes(-1);
};

export const initIterator = async function* initIterator(
  container: IfIocContainer,
  components: Array<IfComponentDetails>,
): AsyncIterableIterator<string> {
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

      yield o[comp.postConstruct]().then(() => comp.identity.toString());
    }
  }
};
