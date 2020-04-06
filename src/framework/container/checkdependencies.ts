import { IfComponentDetails, IfComponentWithDependencies, IfIocComponent } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';
import { ComponentScope } from '../../enums';
import { isSameIdentity } from '../../metadata';
import { arrayNotEmpty, notEmpty } from '../lib';
import { ComponentIdentity } from '../../lib/componentidentity';

const debug = require('debug')('bind:init:check');

const TAG = 'CHECK_DEPENDENCIES';

/**
 * Dependency Scope rule is that component cannot depend on
 * component with smaller scope.
 *
 * @param parent IfComponentDetails
 * @param dependency IfComponentDetails
 * @param dependencyName string
 *
 * @returns Array<FrameworkError> an empty array is returns when
 * validation is successful. Array with one FrameworkError object
 * is returns in case when dependency has smaller scope than parent.
 */
export function validateDependencyScopeRule(
  parent: IfComponentDetails,
  dependency: IfComponentDetails,
  dependencyName: string,
): FrameworkError | undefined {
  if (parent.scope > dependency.scope) {
    /**
     * Smaller scope cannot be injected into broader scope
     * Specific example - prototype scoped component cannot be a dependency of a singleton
     */
    return new FrameworkError(`Dependency on Smaller-Scoped component is not allowed.
        Component "${parent.identity}" 
                has a scope "${ComponentScope[parent.scope]}" but has
                ${dependencyName} dependency on component "${dependency.identity}" 
                with a smaller scope of "${ComponentScope[dependency.scope]}"`);
  }

  return undefined;
}

/**
 * Check that component does not have a chain of dependencies that loop back to self
 * An example of a loop: A depends on B, B depends on C, C depends on A
 * This type of loop cannot be allowed
 *
 * @todo instead of throwing on first loop detection return array
 * of all collected FrameworkError errors
 *
 * @param components: Array<IfIocComponent>
 * @returns undefined
 * @throws FrameworkError in case dependency look is detected
 */
export function checkDependencyLoop(components: Array<IfIocComponent>): void {
  const FUNC_NAME = 'checkDependencyLoop';
  debug('%s Entered checkDependencyLoop with %s components', components.length);

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
        .concat(component.extraDependencies)
        .filter(dep => !!dep),
      visited: false,
    };
  });

  debug('%s namedComponents: %o', TAG, namedComponents);

  const check = (
    component: IfComponentWithDependencies,
    parents: Array<ComponentIdentity> = [],
  ): void => {
    const id = component.identity.toString();
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
          .map(componentIdentity => componentIdentity.toString()).join(` 
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

/**
 * Loops over all components in container and makes sure that all
 * constructor dependencies in every component can be satisfied
 * by another component found in container.
 *
 * @todo container may have setting flag to check for dependency types
 * This means in case of named dependencies also validate the dependency class
 * but only if dependency component is known and not a generic type (not String, Object, etc)
 * In longer run may allow a subtype to be used for a dependency. For example
 * if dependency type is Smartphone then dependency component can be an Iphone
 *
 * @param components: Array<IfIocComponent>
 * @return array of FrameworkError objects. Returning empty array means there were no
 * errors detected (all constructor dependencies or all components were satisfied)
 */
export function checkConstructorDependencies(
  components: Array<IfIocComponent>,
): Array<FrameworkError> {
  debug('%s Entered checkConstructorDependencies', TAG);

  return components
    .map(component => {
      return component.constructorDependencies.reduce(
        (acc: Array<FrameworkError | undefined>, dep, i) => {
          const errors = [...acc];
          const found = components.find(c => isSameIdentity(dep, c.identity));
          if (!found) {
            errors.push(
              new FrameworkError(`Component ${component.identity} 
                has unsatisfied constructor dependency for parameter "${i}" 
                on dependency ${dep}`),
            );
          } else {
            const scopeRuleValidation = validateDependencyScopeRule(
              component,
              found,
              'constructor',
            );

            errors.push(scopeRuleValidation);
          }

          return errors;
        },
        [],
      );
    })
    .filter(arrayNotEmpty)
    .flat()
    .filter(notEmpty);
}

export function checkExtraDependencies(components: Array<IfIocComponent>): Array<FrameworkError> {
  debug('%s Entered checkExtraDependencies', TAG);

  return components
    .map(component => {
      const extraDependencies = component.extraDependencies || [];
      return extraDependencies.reduce((acc: Array<FrameworkError | undefined>, dep) => {
        const errors = [...acc];
        const found = components.find(c => isSameIdentity(dep, c.identity));
        if (!found) {
          errors.push(
            new FrameworkError(`Component ${component.identity} 
                has unsatisfied extra dependency on component ${dep}`),
          );
        }
        /**
         * NO scope rules validation
         * for extraDependencies
         */

        return errors;
      }, []);
    })
    .filter(arrayNotEmpty)
    .flat()
    .filter(notEmpty);
}

export function checkPropDependencies(components: Array<IfIocComponent>): Array<FrameworkError> {
  debug('%s Entered checkPropDependencies', TAG);

  return components
    .map(component => {
      return component.propDependencies.reduce((acc: Array<FrameworkError>, propDep) => {
        const errors = [...acc];
        const found = components.find(c => isSameIdentity(propDep.dependency, c.identity));
        if (!found) {
          errors.push(
            new FrameworkError(`Component ${component.identity} 
                has unsatisfied dependency for property "${String(propDep.propertyName)}" 
                on dependency ${propDep.dependency}`),
          );
        } else {
          const scopeRuleValidation = validateDependencyScopeRule(
            component,
            found,
            `"${String(propDep.propertyName)}" property`,
          );

          errors.push(scopeRuleValidation);
        }

        return errors;
      }, []);
    })
    .filter(arrayNotEmpty)
    .flat()
    .filter(notEmpty);
}

/**
 * Check that all components have a corresponding component available
 * for all its' dependencies
 *
 * @param IfIocContainer
 * @return Array of FrameworkError object. Empty array is returned if no dependency
 * errors are found.
 */
export const checkDependencies = (
  components: Array<IfIocComponent>,
): Promise<Array<IfIocComponent>> => {
  const ret = [];
  const DOTTED_LINE = '\n..................................................\n';
  try {
    checkDependencyLoop(components);
  } catch (e) {
    if (e instanceof FrameworkError) {
      ret.push(e);
    } else {
      ret.push(new FrameworkError(`Error while testing for dependency loop ${e.message}`, e));
    }
  }

  const res = [
    ...ret,
    ...checkConstructorDependencies(components),
    ...checkPropDependencies(components),
    ...checkExtraDependencies(components),
  ].filter(notEmpty);

  if (res.length > 0) {
    const errors = res.map(e => e.message);
    return Promise.reject(
      new FrameworkError(`${DOTTED_LINE}
    Dependency validation errors:\n${DOTTED_LINE}\n${errors.join(DOTTED_LINE)}`),
    );
  }

  return Promise.resolve(components);
};
