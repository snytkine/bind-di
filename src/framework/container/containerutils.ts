import {
    IfIocContainer,
    IfComponentDetails,
    IocComponentType,
    Target,
    IfComponentIdentity, IScopedComponentStorage, IComponentStorage,
} from '../../';
import { getComponentMeta } from './getcomponentmeta';
import { IfComponentFactoryMethod } from '../../definitions/container';
import { ComponentScope } from '../../enums/componentscope';

import { getScope } from '../../decorators/scope';

const TAG = 'CONTAINER_UTILS';
const debug = require('debug')('bind:container');

const assertNoProvides = (meta: IfComponentDetails) => {
    if (meta.provides && meta.provides.length > 0) {
        throw new Error(`Only Singleton Component can provide other components. Component "${stringifyIdentify(meta.identity)} has scope=${meta.scope}`);
    }
};


const assertNoPostConstruct = (meta: IfComponentDetails) => {
    if (meta.postConstruct) {
        throw new Error(`Only Singleton Component can have postConstruct method. Component "${stringifyIdentify(meta.identity)} has scope=${meta.scope}`);
    }
};


const assertNoPreDestroy = (meta: IfComponentDetails) => {
    if (meta.preDestroy) {
        throw new Error(`Only Singleton Component can have preDestroy method. Component "${stringifyIdentify(meta.identity)} has scope=${meta.scope}`);
    }
};

export const stringifyIdentify = (identity: IfComponentIdentity): string => {
    return `componentName=${String(identity?.componentName)} className=${identity?.clazz?.name}`;
};

/**
 * RequestLogger depends on Logger and on Request object
 * Request is RequestScoped
 *
 * getter function: look for object in RequestScopeStore
 * a) Found object -> return it
 * b) Not found: get dependencies from Container. Container will get Logger
 * will then need to get Request.
 * Container get Details of Request
 */

/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
export function addSingletonComponent(container: IfIocContainer, meta: IfComponentDetails): void {

    debug(TAG, 'Adding singleton componentName=', stringifyIdentify(meta.identity));
    const name = meta.identity.componentName;
    const className = meta.identity?.clazz?.name;

    /**
     * Getter of Singleton component
     * does not take context as second param
     */
    const getter = function () {

        let instance: any;

        return function (ctnr: IfIocContainer) {
            debug(TAG, 'Getter called for Singleton componentName=', String(name), 'className=', className);

            if (instance) {
                debug(TAG, 'Returning same instance of componentName=', String(name), 'className=', className);

                return instance;
            }

            debug(TAG, 'Creating new instance of Singleton componentName=', String(name), ' className=', className, ' with constructor args', meta.constructorDependencies);
            const constructorArgs = meta.constructorDependencies.map(dependency => ctnr.getComponent(dependency));

            instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

            debug(TAG, 'Adding dependencies to Singleton component\' ', name, '\' ', meta.propDependencies);

            /**
             * Have instance object
             * now set properties with prop dependency instances
             *
             * The instance that was set via close will get its props set
             * and will also be returned
             */
            return meta.propDependencies.reduce((prev, curr) => {

                /**
                 * Don't add if instance already has property with the same name
                 * it could be the case with class inheritance where child class
                 * redefined property but parent class has same property is annotated with @Inject
                 *
                 * @type {any}
                 */
                if (!prev[curr.propertyName]) {
                    prev[curr.propertyName] = ctnr.getComponent(curr.dependency);
                } else {
                    debug(name, 'Singleton component already has property=', curr.propertyName);
                }

                return prev;
            }, instance);
        };

    };


    const component = {
        ...meta,
        get: getter,
    };

    container.addComponent(component);


    /**
     * Now if this component also provides any components
     * also add provided components
     */
    if (meta.provides.length > 0) {
        debug('Singleton component "%s" provides "%d" components. Adding them', String(name), meta.provides.length);

        meta.provides.reduce((prev: IfIocContainer, curr: IfComponentFactoryMethod) => {
            /**
             * Can provided component have own dependencies?
             * Here we just basically hard-coding the fact that provided component
             * does not have any dependencies.
             * Basically provided component is returned from a factory
             * component's method, so it's factory component's job
             * to instantiate the provided component and return it.
             */
            const providedComponent: IfComponentDetails = {
                identity: curr.providesComponent,
                scope: getScope(meta.identity.clazz, curr.methodName),
                propDependencies: [],
                constructorDependencies: [],
                provides: [],
            };

            /**
             * Here we always treat provided component as singleton
             *
             * @todo in the future if provided component can be of other scopes
             * then we need to update this logic - cannot always return instance.
             */
            const getter = function () {

                let instance;

                return function (ctnr: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>) {
                    debug(TAG, 'Getter called on Factory-Provided componentName=', String(providedComponent?.identity?.componentName), ' className=', providedComponent?.identity?.clazz?.name, ' of factory componentName=', stringifyIdentify(meta.identity), ' factory=', stringifyIdentify(meta.identity));

                    if (instance) {
                        debug('%S Factory-Provided component="%s" already created. Returning same instance', TAG, stringifyIdentify(providedComponent.identity));

                        return instance;
                    }

                    /**
                     * Factory Component is always singleton? Yes for now
                     * but not sure if there is any possibility to have ContextScoped factory
                     * Maybe in the future there could be a SessionScoped factory, then
                     * we will have to pass ctx param since it will contain means to get
                     * session-scoped objects
                     * @type {any}
                     */
                    const factory = ctnr.getComponent(meta.identity, scopedComponentStorage);
                    debug('%s Calling factory method="%s" of factory component="%s" factory className="%s"', TAG, curr.methodName, stringifyIdentify(meta.identity), meta?.identity?.clazz?.name);

                    /**
                     * Now we have the instance of factory component
                     * just call the method that provides this component
                     * to get the actual provided component.
                     */
                    instance = factory[curr.methodName]();

                    return instance;

                };

            }();

            const component = {
                ...providedComponent,
                get: getter,
            };

            debug('%s Adding factory-provided component="%s" scope="%s"', TAG, stringifyIdentify(component.identity), component.scope);

            prev.addComponent(component);

            return prev;

        }, container);

    }
}


export function addScopedComponent(container: IfIocContainer, meta: IfComponentDetails): void {

    /**
     * Validate:
     * 1) scoped component cannot have non-empty 'provides'
     * 2) scoped component cannot have @PostConstruct and @PreDestroy methods
     */
    assertNoProvides(meta);
    assertNoPostConstruct(meta);
    assertNoPreDestroy(meta);

    debug('%s Adding scoped component="%s" scope="%s"', TAG, stringifyIdentify(meta.identity), meta.scope);

    const getter = function (ctnr: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>) {

        let componentStorage: IComponentStorage;
        /**
         * Check if scopedComponentStorage is passed
         * then find the one with .scope === meta.scope
         * otherwise create new one using deps from ctnr
         * and set result in that scopedComponentStorage using .setComponent on it.
         * and also return component of cause
         */
        if (scopedComponentStorage) {
            const scopedStorage = scopedComponentStorage.find(_ => _.scope===meta.scope);
            if (scopedStorage) {
                componentStorage = scopedStorage.storage;
                let storedComponent = componentStorage.getComponent(meta.identity);
                if (storedComponent) {
                    debug('Component "%s" found in componentStorage', stringifyIdentify(meta.identity));
                    return storedComponent;
                }
            }
        }


        /**
         * Create new instance
         */
        const constructorArgs = meta.constructorDependencies.map(
                _ => ctnr.getComponent(_, scopedComponentStorage));
        const instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

        debug('%s Adding %d dependencies to NewInstance component="%s"', meta.propDependencies.length, stringifyIdentify(meta.identity));
        const ret = meta.propDependencies.reduce((prev, curr) => {

            /**
             * Add prop dependency but ONLY if this property is not already set
             * It would be set if sub-class overrides parent where in parent
             * this property is auto-wired with @Inject but sub-class overrides it
             * with own value.
             */
            if (!prev[curr.propertyName]) {
                prev[curr.propertyName] = ctnr.getComponent(curr.dependency, scopedComponentStorage);
            } else {
                debug('%s Component "%s" Instance component already has own property "%s', TAG, stringifyIdentify(meta.identity), curr.propertyName);
            }

            return prev;

        }, instance);


        /**
         * Now add ret to componentStorage and also return it
         */
        componentStorage.setComponent(meta.identity, ret);

        return ret;

    };

    const component = {
        ...meta,
        get: getter,
    };

    container.addComponent(component);
}


/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
export function addPrototypeComponent(container: IfIocContainer, meta: IfComponentDetails): void {

    /**
     * Validate
     * 1) Prototype component cannot have @PostConstruct and @PreDestroy
     * 2) cannot have non-empty .provides array
     */
    assertNoPreDestroy(meta);
    assertNoPostConstruct(meta);
    assertNoProvides(meta);

    debug(TAG, 'Adding prototype component=', String(meta.identity.componentName), ' className=', meta.identity?.clazz?.name);
    const name = String(meta.identity.componentName);
    const getter = function (ctnr: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>) {

        debug(TAG, 'Creating new instance of componentName=\'', name, '\' className=', meta.identity?.clazz?.name, ', with constructor args', meta.constructorDependencies, ' with scopedComponentStorage=', !!scopedComponentStorage);
        const constructorArgs = meta.constructorDependencies.map(
                _ => ctnr.getComponent(_, scopedComponentStorage));
        const instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

        debug(TAG, 'Adding dependencies to NewInstance componentName=\'', name, '\' className=', meta.identity?.clazz?.name, '\' ', meta.propDependencies);
        return meta.propDependencies.reduce((prev, curr) => {

            /**
             * Add prop dependency but ONLY if this property is not already set
             * It would be set if sub-class overrides parent where in parent
             * this property is auto-wired with @Inject but sub-class overrides it
             * with own value.
             */
            if (!prev[curr.propertyName]) {
                prev[curr.propertyName] = ctnr.getComponent(curr.dependency, scopedComponentStorage);
            } else {
                debug(name, 'Instance component already has own property', curr.propertyName);
            }

            return prev;

        }, instance);

    };

    const component = {
        ...meta,
        get: getter,
    };

    container.addComponent(component);
}

/**
 *
 * @param container
 * @param clazz Expected to be a Class of component
 * @param file string a full path to a file containing the class.
 * Multiple classes can share the same file because its allowed to declare more than
 * one component in a file
 */
export function addComponent(container: IfIocContainer, clazz: Target): void {

    const meta = getComponentMeta(clazz);

    meta.scope = meta.scope || container.defaultScope;

    if (meta.scope===ComponentScope.SINGLETON) {
        return addSingletonComponent(container, meta);
    } else if (meta.scope===ComponentScope.NEWINSTANCE) {
        return addPrototypeComponent(container, meta);
    } else if (meta.scope) {
        return addScopedComponent(container, meta);
    } else {
        throw new TypeError(`UNSUPPORTED_SCOPE_ERROR. Unable to add component. ${stringifyIdentify(meta.identity)} with scope=${String(meta.scope)}`);
    }
}



