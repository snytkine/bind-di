import {
  IfIocComponent,
  IfIocContainer,
  IScopedComponentStorage,
  isDefined,
} from '../../definitions';
import { ComponentScope } from '../../enums';
import { initIterator } from './initializer';
import FrameworkError from '../../exceptions/frameworkerror';
import isSameIdentity from '../../metadata/issameidentity';
import jsonStringify from '../lib/jsonstringify';
import { checkDependencies } from './checkdependencies';
import { getSortedComponents } from './sortcomponents';
import { ComponentIdentity } from '../../utils/componentidentity';
import { CONTAINER_COMPONENT } from '../../consts';
import { Identity } from '../identity';

const debug = require('debug')('bind:container');

const TAG = 'Container';

export default class Container implements IfIocContainer {
  private componentsStore: Array<IfIocComponent> = [];

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
   * @param {ComponentIdentity} id
   * @returns {IfIocComponent<T>}
   * @throws FrameworkError if component is not found by id
   */
  getComponentDetails(id: ComponentIdentity): IfIocComponent {
    debug('%s Entered Container.getComponentDetails Requesting component="%s"', TAG, id);

    /**
     * Special case if requesting this container
     * return a special component with getter
     * that returns this object.
     */
    /* if (id.componentName===CONTAINER_COMPONENT) {
     return {
     identity: Identity(CONTAINER_COMPONENT),
     propDependencies: [],
     constructorDependencies: [],
     extraDependencies: [],
     scope: ComponentScope.SINGLETON,
     get: () => this,
     };
     } */

    /**
     * For a named component a match is by name
     * For unnamed component a match is by clazz
     */
    const ret: IfIocComponent = this.componentsStore.find(component =>
      isSameIdentity(id, component.identity),
    );

    if (!ret) {
      throw new FrameworkError(`Component details not found by id=${id}`);
    }
    return ret;
  }

  getComponent(id: ComponentIdentity, scopedStorages?: Array<IScopedComponentStorage>): any {
    debug(
      '%s Entered Container.getComponent Requesting component="%s" With scopedStorage="%s"',
      TAG,
      id,
      !!scopedStorages,
    );

    let ret: any;
    let details;
    try {
      details = this.getComponentDetails(id);
    } catch (e) {
      debug('%s getComponents() did not find details. Error=%o', TAG, e);
    }
    /**
     * @todo this does not make sense
     * What is going on here is we are allowing for a
     * component to not be known to container but will still
     * look for it in scoped storages. This is dangerous because
     * the container init() function must check dependency graph and
     * at that point all components must be known to container otherwise
     * the initialization will throw error.
     *
     * So really this should be removed and reduces to just
     * ret = details.get(scopedStorages);
     * also no need to wrap details = this.getComponentDetails(id);
     * in try/catch, just let the exception to be thrown.
     */
    if (isDefined(details)) {
      ret = details.get(scopedStorages);
    } else if (scopedStorages) {
      /**
       * Component details not found in container
       * If scopedStorages are passed then look
       * for component in scoped storages.
       */
      ret = scopedStorages.reduce((acc: any, next) => {
        if (acc) {
          return acc;
        }

        return next.getComponent(id);
      }, undefined);
    }

    if (!ret) {
      throw new FrameworkError(`Failed find component by Identity="${id.toString()}"`);
    }

    return ret;
  }

  addComponent(component: IfIocComponent): boolean {
    debug('%s Entered Container.addComponent with component="%s"', TAG, component.identity);

    if (this.has(component.identity)) {
      const existing = this.getComponentDetails(component.identity);
      /**
       * if existing component has exactly the same .clazz as component.identity
       * then we should just ignore this because that means that this method
       * is somehow called more than once with same exact component.
       */
      if (existing.identity.clazz && component.identity.clazz === existing.identity.clazz) {
        debug('%s attempting to add same component twice id="%s"', TAG, existing.identity);
      } else {
        throw new FrameworkError(`
            Container already has component "${component.identity.toString()}"`);
      }
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
        component.identity,
        ComponentScope[this.defaultScope],
      );

      Reflect.set(component, 'scope', this.defaultScope);
    }

    this.componentsStore.push(component);

    return true;
  }

  /**
   * Initialize container with array of components.
   * @param aComponents
   * @return Promise of Array of previous components (may be empty array)
   */
  async initialize(aComponents?: Array<IfIocComponent>): Promise<Array<IfIocComponent>> {
    const prevComponentsStore = this.components;

    const components = aComponents || this.componentsStore;

    debug('%s Entered initialize. components="%s"', TAG, jsonStringify(this.components));

    const sorted = await checkDependencies(components).then(getSortedComponents);

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

    /**
     * Special case register
     * special type of component that
     * will return this object when requesting
     * component with identity CONTAINER_COMPONENT
     */
    components.push({
      identity: Identity(CONTAINER_COMPONENT),
      propDependencies: [],
      constructorDependencies: [],
      extraDependencies: [],
      scope: ComponentScope.SINGLETON,
      get: () => this,
    });

    /**
     * Set componentsStore
     */
    this.componentsStore = components;
    debug(
      '%s initialize() set this.componentStore with %s components',
      TAG,
      this.componentsStore.length,
    );
    debug(
      '%s initialize() returning previous store with %s components',
      TAG,
      prevComponentsStore.length,
    );

    return prevComponentsStore;
  }

  cleanup(): Promise<boolean> {
    /**
     * Here work on actual this.componentsStore (not on copy)
     */
    const a: Array<Promise<Boolean>> = this.componentsStore
      .filter(component => !!component.preDestroy)
      .map(component => {
        /**
         * Can call .get without scopedStorages because
         * only singleton components can have preDestroy methods
         */
        const obj = component.get();
        const methodName = component.preDestroy;

        return obj[methodName]();
      });

    return Promise.all(a)
      .then(() => {
        this.componentsStore.forEach(comp => {
          Reflect.deleteProperty(comp, 'get');
          Reflect.deleteProperty(comp, 'extraDependencies');
          Reflect.deleteProperty(comp, 'constructorDependencies');
          Reflect.deleteProperty(comp, 'propDependencies');
          Reflect.deleteProperty(comp, 'identity');
          Reflect.deleteProperty(comp, 'provides');
          Reflect.deleteProperty(comp, 'componentMetaData');
        });
      })
      .then(() => {
        this.componentsStore = null;
        return true;
      })
      .then(() => true);
  }

  has(id: ComponentIdentity): boolean {
    try {
      return !!this.getComponentDetails(id);
    } catch (e) {
      return false;
    }
  }
}
