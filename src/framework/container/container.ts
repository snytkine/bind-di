import {
  IfComponentIdentity,
  IfIocComponent,
  IfIocContainer,
  IfComponentPropDependency,
  IScopedComponentStorage,
  IfComponentDetails,
} from '../../definitions';
import { ComponentScope } from '../../enums';
import { RESERVED_COMPONENT_NAMES } from '../../consts';

import { initIterator, sortComponents } from './initializer';
import FrameworkError from '../../exceptions/frameworkerror';
import isSameIdentity from '../../metadata/issameidentity';
import jsonStringify from '../lib/jsonstringify';
import stringifyIdentify from '../lib/stringifyidentity';
import { checkDependencyLoop } from './checkdependencies';

const debug = require('debug')('bind:container');

const TAG = 'Container';

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
          found?.identity?.clazz?.name !== dep.dependency?.clazz?.name
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

export default class Container implements IfIocContainer {
  private readonly componentsStore: Array<IfIocComponent>;

  /**
   * @todo this will be configurable by passing options to constructor
   * @type {ComponentScope}
   */
  public readonly defaultScope: ComponentScope = ComponentScope.SINGLETON;

  constructor() {
    /**
     * Polyfill Symbol.asyncIterator
     * @type {any | symbol}
     */
    if (!Symbol) {
      throw new FrameworkError(
        'Symbol not defined. Most likely you are using an old version on Node.js',
      );
    }
    if (!Symbol.asyncIterator) {
      Reflect.set(Symbol, 'asyncIterator', Symbol.for('Symbol.asyncIterator'));
    }
    // (Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator');
    this.componentsStore = [];
  }

  get components(): Array<IfIocComponent> {
    return Array.from(this.componentsStore);
  }

  /**
   *
   * @todo consider not throwing exception but instead return something like a Try object
   * where it may have value or Error.
   * In the future if we switch to all-async container then return Promise<component> instead
   * Returning a Promise will solve this issue of throwing exception
   * We can already do this now and return immediately resolved promise.
   *
   * 2 named components can have same clazz and className
   * example: 2 different mongo Collection instances will both have same className and class
   * or 2 or more instances of same object produced by component factory always have same className and class
   *
   * If looking for unnamed component we can allow finding a named one
   * only if named component is the only one with same class
   *
   * @param {IfComponentIdentity} id
   * @returns {IfIocComponent<T>}
   * @throws FrameworkError if component is not found by id
   */
  getComponentDetails(id: IfComponentIdentity): IfIocComponent {
    debug(
      '%s Entered Container.getComponentDetails Requesting component="%s"',
      TAG,
      stringifyIdentify(id),
    );

    /**
     * For a named component a match is by name
     * For unnamed component a match is by clazz
     */
    const ret: IfIocComponent = this.componentsStore.find(component =>
      isSameIdentity(id, component.identity),
    );

    if (!ret) {
      throw new FrameworkError(`
            Container Component Not found by Identity="${stringifyIdentify(id)}"`);
    }

    return ret;
  }

  getComponent(id: IfComponentIdentity, scopedStorage?: Array<IScopedComponentStorage>): any {
    debug(
      `%s Entered Container.getComponent 
        Requesting component="%s" With scopedStorage="%s"`,
      TAG,
      stringifyIdentify(id),
      !!scopedStorage,
    );

    return this.getComponentDetails(id).get(this, scopedStorage);
  }

  addComponent(component: IfIocComponent): boolean {
    debug(
      '%s Entered Container.addComponent with component="%s"',
      TAG,
      stringifyIdentify(component.identity),
    );
    if (this.has(component.identity)) {
      throw new FrameworkError(`
            Container already has component "${stringifyIdentify(component.identity)}"`);
    }

    /**
     * Update default scope
     * Unannotated component will not have any scope set, not even DEFAULT_SCOPE
     * because it Component function was never applied to that component class, so
     * it does not have any metadata at all.
     */
    if (!component.scope) {
      debug(
        '%s Component "%s" Does not have defined scope. Setting default scope="%s"',
        TAG,
        stringifyIdentify(component.identity),
        ComponentScope[this.defaultScope],
      );

      Reflect.set(component, 'scope', this.defaultScope);
    }

    this.componentsStore.push(component);

    return true;
  }

  async initialize(): Promise<IfIocContainer> {
    debug('%s Entered initialize. components="%s"', TAG, jsonStringify(this.components));
    checkDependencyLoop(this);
    checkDependencies(this);

    /**
     * @todo refactor into separate function getSortedComponents
     * to return only one array of sorted OR Error
     * In other words return Try<SortedComponents>
     */
    const { sorted, unsorted } = sortComponents<IfIocComponent>({
      unsorted: this.components,
      sorted: [],
    });

    if (unsorted.length > 0) {
      const error = `
                    Dependency sorting error. Following components have unresolved dependencies.
                    Check dependency loop.
                    ${unsorted.map(component => stringifyIdentify(component.identity)).join(',')}
                    `;

      throw new FrameworkError(error);
    }

    debug('%s initialize sorted="%s"', TAG, jsonStringify(sorted));

    /**
     * Now initialize components that have initializer
     */
    const initializable = sorted.filter(component => !!component.postConstruct);
    if (initializable.length > 0) {
      debug('%s has %d initializable components', TAG, initializable.length);

      for await (const initialized of initIterator(this, initializable)) {
        debug('%s Initialized component %s', TAG, initialized);
      }
    } else {
      debug('%s has no initializable components', TAG);
    }

    return this;
  }

  cleanup(): Promise<boolean> {
    const a: Array<Promise<Boolean>> = this.components
      .filter(component => !!component.preDestroy)
      .map(component => {
        const obj = component.get(this);
        const methodName = component.preDestroy;

        return obj[methodName]();
      });

    return Promise.all(a).then(() => true);
  }

  has(id: IfComponentIdentity): boolean {
    try {
      return !!this.getComponentDetails(id);
    } catch (e) {
      return false;
    }
  }
}
