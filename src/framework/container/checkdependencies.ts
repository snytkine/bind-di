import { IfComponentDetails, IfComponentIdentity, IfComponentPropDependency, IfIocContainer } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';
import stringifyIdentify from '../lib/stringifyidentity';
import { ComponentScope } from '../../enums';
import { RESERVED_COMPONENT_NAMES } from '../../consts';
import { isSameIdentity } from '../../metadata';
import { IfComponentWithDependencies } from '../../definitions/componentwithdependencies';

const debug = require('debug')('bind:init:depscheck');

const TAG = 'CHECK_DEPENDENCIES';


/**
 * Check that component does not have a chain of dependencies that loop back to self
 * An example of a loop: A depends on B, B depends on C, C depends on A
 * This type of loop cannot be allowed
 *
 *
 * @todo this is old implementation, uses component names.
 * Should instead use Identify and equals method of Identify class
 *
 * @param container: IfIocContainer
 * @returns undefined
 * @throws FrameworkError in case dependency look is detected
 *
 */
export function checkDependencyLoop(container: IfIocContainer): void {
  const FUNC_NAME = 'checkDependencyLoop';
  debug('%s Entered checkDependencyLoop', TAG);

  const { components } = container;

  /**
   * First, convert array of components into an array of simple
   * objects {id:componentName, dependencies: string[], visited: boolean}
   * dependencies will be an array of component names (strings) of all constructor
   * dependencies and property dependencies
   * The 'visited' flag is set when a child component has been checked.
   * This will reduce number of passes
   * because otherwise in a complex dependencies graph multiple components have dependencies on same components
   * and once we already check a child component on one pass we don't have to check it if we arrived to same
   * component via different path
   *
   * @type {{name: string; dependencies: string[], visited: boolean}[]}
   */
  const namedComponents: Array<IfComponentWithDependencies> = components.map(component => {
    return {
      identity: component.identity,
      dependencies: component.constructorDependencies
        .concat(component.propDependencies.map(pd => pd.dependency))
        .concat(component.factoryDependency)
        .filter(dep => !!dep),
      visited: false,
    };
  });

  debug('%s namedComponents: %o', TAG, namedComponents);

  const check = (
    component: IfComponentWithDependencies,
    parents: Array<IfComponentIdentity> = [],
  ): void => {
    const id = stringifyIdentify(component.identity);
    debug('Entered %s.check with component "%s"', FUNC_NAME, id);
    if (component.visited) {
      debug('%s Component "%s" already visited', TAG, id);
      return;
    }
    /**
     * @todo try to use .map instead of foreach and map results to either errors or null
     * then filter by non-null values and should get back array of dependency loop error objects
     * This way we can collect all errors instead of throwing on the first detected loop
     */
    parents.forEach((parentId, i, arrParents) => {
      if (isSameIdentity(parentId, component.identity)) {
        /**
         * Create array that starts and ends
         * with component name that started circular dependency problem
         * slice will make sure the chain starts and the element
         * that was just matches with isSameIdentity and will not
         * include any additional components that may exist
         * in the arrParents.
         */
        const depChain = arrParents
          .concat(parentId)
          .slice(i)
          .map(componentIdentity => stringifyIdentify(componentIdentity)).join(` 
            -> `);

        throw new FrameworkError(`Circular dependency chain detected for components: 
       ${depChain}
       `);
      }
    });

    /**
     * For every child component name:
     * generate an array of child components
     * then run each child component through check (recurse to this function), but append
     * the name of 'this' component to array of parents.
     * After every child component check is done set the visited = true on that child
     * When this function is run recursively with a child component it is possible that
     * that component will have own child components and recursion
     * repeats for each or child's children, and so on,
     * until the component with no children is found, at which point the recursion will
     * start to unwind.
     */
    component.dependencies
      .map(depComponent => namedComponents.find(nc => isSameIdentity(nc.identity, depComponent)))
      .filter(x => !!x)
      .reduce((acc, child) => {
        check(child, acc);
        Reflect.set(child, 'visited', true);

        return acc;
      }, parents.concat(component.identity));
  };

  for (const nc of namedComponents) {
    check(nc);
  }
}


export function checkConstructorDependencies(container: IfIocContainer): Array<FrameworkError> {
  debug('%s Entered checkConstructorDependencies', TAG);
  const { components } = container;

  const ret = components.map(component => {
    return component.constructorDependencies.reduce((acc: Array<FrameworkError>, dep, i) => {
      const ret = [...acc];
      const found = components.find(c => isSameIdentity(dep, c.identity));
      if (!found) {
        ret.push(new FrameworkError(`Component ${stringifyIdentify(component.identity)} 
                has unsatisfied constructor dependency for parameter "${i}" 
                on dependency ${stringifyIdentify(dep)}`));
      } else {

        /**
         * Smaller scope cannot be injected into broader scope
         * Most specific - prototype scoped component cannot be a dependency of a singleton
         */
        if (component.scope > found.scope) {
          ret.push(new FrameworkError(`Invalid dependency Scope.
        Component "${stringifyIdentify(component.identity)}" 
                has a scope ${ComponentScope[component.scope]} but has constructor 
                dependency on component "${stringifyIdentify(found.identity)}" 
                with a smaller scope "${ComponentScope[found.scope]}"`),
          );
        }
      }

      return ret;
    }, []);
  }).filter(x => x.length > 0).flat();

  return ret;
}


export function checkPropDependencies(container: IfIocContainer): Array<FrameworkError> {
  debug('%s Entered checkPropDependencies', TAG);
  const ret = [];
  const { components } = container;


  return ret;

}

/**
 * Check that all components have a corresponding component available
 * for all its' dependencies
 *
 * @param IfIocContainer
 */
const checkDependencies = (container: IfIocContainer): Promise<IfIocContainer> => {
  const { components } = container;

  debug('%s entered checkDependencies', TAG);

  /* const unresolved: Array<IfComponentIdentity> = components.reduce((acc: Array<IfComponentIdentity>, next, i, aComponents) => {

   const componentsToCheck = [...aComponents].splice(i, 1);
   const ret = [...acc];
   if (!depsResolved(next, componentsToCheck)) {
   ret.push(next.identity);
   }
   return ret;
   }, []); */

  try {
    /**
     * Factor this out into 2 functions: checkConstructorDependencies
     * checkPropDependencies and each one to return Promise<IfIocContainer>
     */
    components.forEach((component, i) => {
      /**
       * Check constructor dependencies
       */
      component.constructorDependencies.forEach((dep: IfComponentIdentity) => {
        let found: IfComponentDetails;
        try {
          found = container.getComponentDetails(dep);
        } catch (e) {
          throw new FrameworkError(
            `Component ${stringifyIdentify(component.identity)} 
                has unsatisfied constructor dependency for argument "${i}" 
                on dependency ${stringifyIdentify(dep)}`,
            e,
          );
        }

        /**
         * Smaller scope cannot be injected into broader scope
         * Most specific - prototype scoped component cannot be a dependency of a singleton
         */
        if (component.scope > found.scope) {
          throw new FrameworkError(`Component "${stringifyIdentify(component.identity)}" 
                has a scope ${ComponentScope[component.scope]} but has constructor 
                dependency on component "${stringifyIdentify(found.identity)}" 
                with a smaller scope "${ComponentScope[found.scope]}"`);
        }

        /**
         * @todo validate dependency class reference
         * for this must allow class of dependency to be sub-class
         * For example if dependency is on Animal the resolved dependency is Dog then it's OK
         * but it's not OK for class to have dependency on Dog but resolved dependency to be
         * supertype like Animal. Only Co-Variant dependency should be allowed.
         */
      });

      /**
       * Check property dependencies
       */
      component.propDependencies.forEach((dep: IfComponentPropDependency) => {
        let found: IfComponentDetails;
        try {
          found = container.getComponentDetails(dep.dependency);
        } catch (e) {
          debug('%s Container error propDependency Exception %o', TAG, e);
        }

        if (!found) {
          throw new FrameworkError(`Component "${String(component.identity.componentName)} 
                className=${component.identity?.clazz?.name}" has unsatisfied property dependency 
                for propertyName="${String(dep.propertyName)}" 
                dependency="${String(dep.dependency.componentName)}" 
                dependency className=${dep.dependency?.clazz?.name}`);
        }

        /**
         * Validate found dependency must match class
         * @todo right now only matching by class name, not by
         * class reference. Should match be done by class reference?
         *
         * @todo use an option in container settings to enable/disable this validation
         */
        if (
          dep.dependency?.clazz?.name &&
          found?.identity?.clazz?.name &&
          !RESERVED_COMPONENT_NAMES.includes(dep.dependency?.clazz?.name) &&
          found?.identity?.clazz?.name!==dep.dependency?.clazz?.name
        ) {
          throw new FrameworkError(`Component "${String(component.identity.componentName)}" 
                has property dependency "${String(dep.dependency.componentName)}:${
            dep.dependency?.clazz?.name
          }" 
                for propertyName="${String(dep.propertyName)}" but dependency component 
                has className="${found?.identity?.clazz?.name}"`);
        }

        /**
         * Smaller scope cannot be injected into broader scope
         * Most specific - prototype scoped component cannot be a dependency of a singleton
         */
        if (component.scope > found.scope) {
          const err = `Component ${stringifyIdentify(component.identity)}
                 has a scope "${ComponentScope[component.scope]}"
                 but has property dependency for
                 propertyName="${String(dep.propertyName)}" on component 
                 "${stringifyIdentify(found.identity)}" with a smaller scope
                "${ComponentScope[found.scope]}"`;
          throw new FrameworkError(err);
        }
      });
    });

    return Promise.resolve(container);
  } catch (e) {
    return Promise.reject(e);
  }
};
