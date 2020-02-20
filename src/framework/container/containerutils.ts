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

export const stringifyIdentify = (identity: IfComponentIdentity): string => {
    return `componentName=${String(identity.componentName)} className=${identity?.clazz?.name}`;
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
     * @todo test this: will the instance set by one getter
     * be available from another component's getter since they both
     * were created using this same function? Or will the 2 components
     * get their own version of this addSingletonComponent?
     */
    let instance: any;

    /**
     * Getter of Singleton component
     * does not take context as second param
     */
    const getter = function (ctnr: IfIocContainer) {
        debug(TAG, 'Getter called for Singleton componentName=', name, 'className=', className);

        if (instance) {
            debug(TAG, 'Returning same instance of componentName=', name, 'className=', className);
            return instance;
        }

        debug(TAG, 'Creating new instance of Singleton componentName=', name, ' className=', className, ' with constructor args', meta.constructorDependencies);
        const constructorArgs = meta.constructorDependencies.map(
                _ => ctnr.getComponent(_));

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

    const component = {
        ...meta,
        get: getter,
    };

    container.addComponent(component);
}


export function addScopedComponent(container: IfIocContainer, meta: IfComponentDetails): void {

    debug('%s Adding scoped component="%s" scope="%s"', TAG, meta.identity.componentName, meta.scope);
    const name = String(meta.identity.componentName);
    const getter = function (ctnr: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>) {

        let componentStorage: IComponentStorage;
        /**
         * @todo check if scopedComponentStorage is passed
         * then find the one with .scope === meta.scope
         * otherwise create new one using deps from ctnr
         * and set result in that scopedComponentStorage using .setComponent on it.
         * and also return component of cause
         */
        if(scopedComponentStorage){
            const scopedStorage = scopedComponentStorage.find(_ => _.scope === meta.scope)
            if(scopedStorage){
                componentStorage = scopedStorage.storage;
                let storedComponent = componentStorage.getComponent(meta.identity);
                if(storedComponent){
                    debug('Component "%s" found in componentStorage', meta.identity.componentName);
                    return storedComponent
                }
            }
        }



        /**
         * Create new instance
         */
        const constructorArgs = meta.constructorDependencies.map(
                _ => ctnr.getComponent(_, scopedComponentStorage));
        const instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

        debug(TAG, 'Adding dependencies to NewInstance componentName=\'', name, '\' className=', meta.identity?.clazz?.name, '\' ', meta.propDependencies);
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
                debug(name, 'Instance component already has own property', curr.propertyName);
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
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
export function addFactoryComponent(container: IfIocContainer, componentMeta: IfComponentDetails): void {

    /**
     * Then create a component for every factory method,
     * create getter function for it
     * and add it to container
     */

    debug(TAG, 'Adding Factory componentName=', stringifyIdentify(componentMeta.identity));


    /**
     * First add the factory component itself to container
     */
    if (componentMeta.provides.length===0) {
        throw new TypeError(`Factory component componentName=${String(componentMeta.identity.componentName)} className=${componentMeta?.identity?.clazz?.name} is not providing any components`);
    }

    addSingletonComponent(container, componentMeta);


    componentMeta.provides.reduce((prev: IfIocContainer, curr: IfComponentFactoryMethod) => {

        let instance: any;

        const providedComponent: IfComponentDetails = {
            identity: curr.providesComponent,
            componentType: IocComponentType.COMPONENT,
            scope: getScope(componentMeta.identity.clazz, curr.methodName),
            propDependencies: [],
            constructorDependencies: [],
            provides: [],
        };


        const getter = function (ctnr: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>) {
            debug(TAG, 'Getter called on Factory-Provided componentName=', String(providedComponent?.identity?.componentName), ' className=', providedComponent?.identity?.clazz?.name, ' of factory componentName=', String(componentMeta?.identity?.componentName), ' factory className=', componentMeta?.identity?.clazz?.name);
            if (instance) {
                debug(TAG, 'Factory-Provided componentName=', providedComponent.identity.componentName, ' className=', providedComponent?.identity?.clazz?.name, ' already created. Returning same instance');

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
            const factory = ctnr.getComponent(componentMeta.identity, scopedComponentStorage);
            debug(TAG, 'Calling factory method=', curr.methodName, ' of factory componentName=', componentMeta.identity.componentName, ' factory className=', componentMeta?.identity?.clazz?.name);
            instance = factory[curr.methodName]();

            return instance;

        };

        //}(componentMeta.identity, curr.methodName, curr.providesComponent);

        const component = {
            ...providedComponent,
            get: getter,
        };

        debug(TAG, 'Adding factory-provided componentName=', String(component.identity.componentName), ' className=', component.identity.componentName, ' scope=', component.scope);

        prev.addComponent(component);

        return prev;

    }, container);

}

/*export interface IfAddComponentArg {
    container: IfIocContainer
    clazz: Target
}*/
/**
 *
 * @param container
 * @param clazz Expected to be a Class of component
 * @param file string a full path to a file containing the class.
 * Multiple classes can share the same file because its allowed to declare more than
 * one component in a file
 */
export function addComponent(container: IfIocContainer, clazz: Target): void {

    /**
     * @todo
     * The second param can be an object holding {filePath, clazz}
     * The we can add filePath as metadata on class, using Reflect.defineMetadata
     * Then all our components will have this meta data and can be used for creating a unique
     * identifier. This will be useful when the component does not have own unique name
     * Using just class name is not reliable because 2 classes in different directories
     * can have same class name
     */
    const meta = getComponentMeta(clazz);

    meta.scope = meta.scope || container.defaultScope;

    if (meta.componentType===IocComponentType.FACTORY) {
        return addFactoryComponent(container, meta);
    } else if (meta.scope===ComponentScope.SINGLETON) {
        return addSingletonComponent(container, meta);
    } else if (meta.scope===ComponentScope.NEWINSTANCE) {
        return addPrototypeComponent(container, meta);
    } else if (meta.scope) {
        return addScopedComponent(container, meta);
    } else {
        throw new TypeError(`Unable to add component. ${JSON.stringify(meta)} with scope=${String(meta.scope)}`);
    }
}



