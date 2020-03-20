import {
  IfComponentIdentity,
  IfIocComponent,
  IfIocContainer,
  IScopedComponentStorage,
  isDefined,
  Maybe,
} from '../../definitions';
import { ComponentScope } from '../../enums';
import { initIterator } from './initializer';
import FrameworkError from '../../exceptions/frameworkerror';
import isSameIdentity from '../../metadata/issameidentity';
import jsonStringify from '../lib/jsonstringify';
import stringifyIdentify from '../lib/stringifyidentity';
import { checkDependencies } from './checkdependencies';
import { getSortedComponents } from './sortcomponents';

const debug = require('debug')('bind:container');

const TAG = 'Container';

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
  getComponentDetails(id: IfComponentIdentity): Maybe<IfIocComponent> {
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

    return ret;
  }

  getComponent(id: IfComponentIdentity, scopedStorages?: Array<IScopedComponentStorage>): any {
    debug(
      `%s Entered Container.getComponent 
        Requesting component="%s" With scopedStorage="%s"`,
      TAG,
      stringifyIdentify(id),
      !!scopedStorages,
    );

    let ret: any;

    const details = this.getComponentDetails(id);
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
      throw new FrameworkError(`Failed find component by Identity="${stringifyIdentify(id)}"`);
    }

    return ret;
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

    const sorted = await checkDependencies(this).then(getSortedComponents);

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
        const obj = component.get();
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
