import {
    IComponentStorage,
    IfComponentDetails,
    IfComponentIdentity,
    IfIocContainer,
    IScopedComponentStorage,
    Target,
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
            return meta.propDependencies.reduce(
                    (prev, curr) => {

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

    }();


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

                return function (ctnr: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>): Object {
                    debug(`%s Getter called on Factory-Provided componentName="%s" 
                    className="%"  
                    of factory componentName="%s"  factory="%s"`,
                            TAG,
                            String(providedComponent?.identity?.componentName),
                            providedComponent?.identity?.clazz?.name,
                            stringifyIdentify(meta.identity),
                            stringifyIdentify(meta.identity));

                    let ret: Object;

                    const getFactoryProvidedComponent = () => {
                        const factory = ctnr.getComponent(meta.identity, scopedComponentStorage);
                        debug('%s Calling factory method="%s" of factory component="%s" factory className="%s"',
                                TAG,
                                curr.methodName,
                                stringifyIdentify(meta.identity),
                                meta?.identity?.clazz?.name);

                        /**
                         * Now we have the instance of factory component
                         * just call the method that provides this component
                         * to get the actual provided component.
                         */
                        return factory[curr.methodName]();
                    };

                    /**
                     * Depending on ComponentScope may use singlton pattern, newInstance or
                     * scopeCache pattern
                     */
                    switch (providedComponent.scope) {

                        case ComponentScope.NEWINSTANCE:
                            /**
                             * Call component getter method every time
                             */
                            ret = getFactoryProvidedComponent();
                            break;

                        case ComponentScope.SINGLETON:
                            /**
                             * Look for instance first
                             */
                            instance = instance || getFactoryProvidedComponent();
                            ret = instance;
                            break;

                        default:
                            /**
                             * Look in scopedComponentStorage that matches
                             * ComponentScope
                             *
                             * @todo Implement
                             */

                    }

                    return ret;
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

/**
 * Given array of IScopedComponentStorage
 * attempt to find storage that has same scope as component's scope
 * then attempt to find component in that scoped storage
 * If found return instance from storage
 * If not found then create new instance with all dependencies found in container
 * then add to storage and return instance
 *
 * @param container
 * @param meta
 * @param arrStorages
 */
export const getComponentFromScopedStorages =
        (container: IfIocContainer,
         meta: IfComponentDetails,
         arrStorages?: Array<IScopedComponentStorage>): Object | void => {
            let componentStorage: IComponentStorage;
            let ret: Object | undefined;

            if (arrStorages) {
                const scopedStorage = arrStorages.find(storage => storage.scope===meta.scope);
                if (scopedStorage) {
                    componentStorage = scopedStorage.storage;
                    let storedComponent = componentStorage.getComponent(meta.identity);
                    if (storedComponent) {
                        debug('Component "%s" found in componentStorage', stringifyIdentify(meta.identity));

                        ret = storedComponent;
                    }
                }
            }

            if (!ret) {
                /**
                 * Create new instance
                 */
                const constructorArgs = meta.constructorDependencies.map(
                        dependincyIdentity => container.getComponent(dependincyIdentity, arrStorages));
                const instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

                debug('%s Adding %d dependencies to NewInstance component="%s"',
                        meta.propDependencies.length,
                        stringifyIdentify(meta.identity));

                ret = meta.propDependencies.reduce(
                        (prev, curr) => {
                            prev[curr.propertyName] = container.getComponent(curr.dependency, arrStorages);

                            return prev;

                        }, instance);


                /**
                 * Now add ret to componentStorage and also return it
                 */
                componentStorage.setComponent(meta.identity, ret);
            }

            return ret;

        };

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

    const getter = (container: IfIocContainer, arrStorages?: Array<IScopedComponentStorage>) => {

        return getComponentFromScopedStorages(container, meta, arrStorages);
    };

    const component = {
        ...meta,
        get: getter,
    };

    container.addComponent(component);

    return undefined;
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
                depIdentity => ctnr.getComponent(depIdentity, scopedComponentStorage));
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

    const scope = meta?.scope || container.defaultScope;

    if (scope===ComponentScope.SINGLETON) {
        return addSingletonComponent(container, meta);
    } else if (scope===ComponentScope.NEWINSTANCE) {
        return addPrototypeComponent(container, meta);
    } else if (scope) {
        return addScopedComponent(container, meta);
    } else {
        throw new TypeError(`UNSUPPORTED_SCOPE_ERROR. Unable to add component. ${meta && stringifyIdentify(meta.identity)} with scope=${String(scope)}`);
    }
}



