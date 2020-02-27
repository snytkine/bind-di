import {
    IComponentStorage,
    IfComponentDetails,
    IfComponentIdentity,
    IfIocContainer,
    IocComponentGetter,
    IScopedComponentStorage,
    Target,
    IfComponentFactoryMethod,
} from '../../definitions';

import { getComponentMeta } from './getcomponentmeta';
import { ComponentScope } from '../../enums/componentscope';

import { getScope } from '../../decorators/scope';
import { UNNAMED_COMPONENT } from '../../consts';

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


const getComponentNameFromIdentity = (identity: IfComponentIdentity): string => {
    if (identity.componentName!==UNNAMED_COMPONENT) {
        return String(identity.componentName);
    }

    if (identity.clazz) {

        if (identity.clazz.name) {
            return identity.clazz.name;
        }

        if (identity.constructor && identity.constructor.name) {
            return identity.constructor.name;
        }
    }

    return String(UNNAMED_COMPONENT);
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

    const name = getComponentNameFromIdentity(meta.identity);
    debug('%s addSingletonComponent "%s"', TAG, stringifyIdentify(meta.identity));

    /**
     * Getter of Singleton component
     * does not take context as second param
     */
    const getter = function () {

        let instance: any;

        return function (ctnr: IfIocContainer) {
            debug('%s Getter called for Singleton componentName="%s"', TAG, name);

            if (instance) {
                debug('%s Returning same instance of componentName="%s"', TAG, name);

                return instance;
            }

            debug(`%s Creating new instance of Singleton componentName="%s" with constructor args="%o"`,
                    TAG,
                    name,
                    meta.constructorDependencies);

            const constructorArgs = meta.constructorDependencies.map(dependency => {
                return ctnr.getComponent(dependency);
            });

            instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

            debug('%s Adding dependencies to Singleton component "%s", dependencies="%o"',
                    TAG,
                    name,
                    meta.propDependencies);

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
                            debug('%s Singleton component "%s" already has property="%s"', TAG, name, curr.propertyName);
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
     * This singleton component may also have component getters
     */
    addFactoryProvidedComponents(meta, container);
}


const addFactoryProvidedComponents = (factoryComponentMeta: IfComponentDetails,
                                      container: IfIocContainer): void => {
    if (factoryComponentMeta.provides.length > 0) {
        debug('%s Singleton component "%s" provides "%d" components. Adding them',
                TAG,
                getComponentNameFromIdentity(factoryComponentMeta.identity),
                factoryComponentMeta.provides.length);

        factoryComponentMeta.provides.reduce((prev: IfIocContainer, curr: IfComponentFactoryMethod) => {
            /**
             * Provided component is returned from a factory
             * component's method, so it's factory component's job
             * to instantiate the provided component and return it.
             * This means that factory provided component cannot have own
             * dependencies
             */
            const providedComponent: IfComponentDetails = {
                identity: curr.providesComponent,
                scope: getScope(factoryComponentMeta.identity.clazz, curr.methodName),
                propDependencies: [],
                constructorDependencies: [],
                provides: [],
            };


            const getFactoryProvidedComponent = (container: IfIocContainer) => {
                /**
                 * Utilize the getter of factory component
                 * That getter function is in scope so can be used here
                 */
                const factory = container.getComponent(factoryComponentMeta.identity);
                debug('%s Calling factory method="%s" of factory component="%s"',
                        TAG,
                        curr.methodName,
                        getComponentNameFromIdentity(factoryComponentMeta.identity),
                );

                /**
                 * Now we have the instance of factory component
                 * just call the method that provides this component
                 * to get the actual provided component.
                 */
                return factory[curr.methodName]();
            };

            let providedComponentGetter: IocComponentGetter;

            /**
             * providedComponentGetter function
             * will be different depending on
             * provided component's scope
             */
            switch (providedComponent.scope) {
                case ComponentScope.NEWINSTANCE:
                    providedComponentGetter = (container: IfIocContainer) => {
                        return getFactoryProvidedComponent(container);
                    };
                    break;

                case ComponentScope.SINGLETON:
                    providedComponentGetter = function () {
                        let instance: Object;

                        return (container: IfIocContainer) => {
                            instance = instance || getFactoryProvidedComponent(container);
                            return instance;
                        };
                    }();
                    break;

                default:
                    /**
                     * Look in scopedComponentStorage that matches
                     * ComponentScope
                     */
                    providedComponentGetter = function (componentDetails) {

                        return (container: IfIocContainer,
                                arrStorages?: Array<IScopedComponentStorage>) => {
                            return getComponentFromScopedStorages(container,
                                    componentDetails,
                                    arrStorages);
                        };
                    }(providedComponent);

            }

            const component = {
                ...providedComponent,
                get: providedComponentGetter,
            };

            debug('%s Adding factory-provided component="%s" scope="%s"',
                    TAG,
                    stringifyIdentify(component.identity),
                    component.scope);

            prev.addComponent(component);

            return prev;

        }, container);

    }
};

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
                        debug('%s Component "%s" found in componentStorage',
                                TAG,
                                stringifyIdentify(meta.identity));

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
                        TAG,
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

    debug('%s Adding scoped component="%s" scope="%s"',
            TAG,
            stringifyIdentify(meta.identity),
            meta.scope);

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

    debug('%s Adding prototype component="%s" className="%s"',
            TAG,
            String(meta.identity.componentName),
            meta.identity?.clazz?.name,
    );

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
                debug('%s Instance component "%s" already has own property "%s"',
                        TAG,
                        name,
                        curr.propertyName,
                );
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



