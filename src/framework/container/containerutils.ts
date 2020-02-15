import {
    IfIocContainer,
    IfComponentDetails,
    IocComponentType,
    Target,
    IfComponentIdentity,
} from '../../';
import { getComponentMeta } from './getcomponentmeta';
import { IfComponentFactoryMethod } from '../../definitions/container';
import { ComponentScope } from '../../definitions/component';

import { getScope } from '../../decorators/scope';

const TAG = 'CONTAINER_UTILS';
const debug = require('debug')('bind:container');

export const stringifyIdentify = (identity: IfComponentIdentity): string => {
    return `componentName=${String(identity.componentName)} className=${identity.className}`;
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
export function addSingletonComponent<T>(container: IfIocContainer<T>, meta: IfComponentDetails<T>): void {

    debug(TAG, 'Adding singleton componentName=', stringifyIdentify(meta.identity));
    const name = meta.identity.componentName;
    const className = meta.identity.className;
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
    const getter = function (ctnr: IfIocContainer<T>) {
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


export function addContextComponent<T>(container: IfIocContainer<T>, meta: IfComponentDetails<T>): void {

    debug(TAG, 'Adding singleton component=', meta.identity.componentName);

    const getter = function (ctnr: IfIocContainer<T>, ctx: T) {

        /**
         * @todo Look in ctx first if found return it
         * otherwise create new one using deps from ctnr and ctx
         * and set result in ctx.components
         */

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
export function addPrototypeComponent<T>(container: IfIocContainer<T>, meta: IfComponentDetails<T>): void {

    debug(TAG, 'Adding prototype component=', String(meta.identity.componentName), ' className=', meta.identity.className);
    const name = String(meta.identity.componentName);
    const getter = function (ctnr: IfIocContainer<T>, ctx: T) {

        debug(TAG, 'Creating new instance of componentName=\'', name, '\' className=', meta.identity.className, ', with constructor args', meta.constructorDependencies, ' with ctx=', !!ctx);
        const constructorArgs = meta.constructorDependencies.map(
                _ => ctnr.getComponent(_, ctx));
        const instance = Reflect.construct(<ObjectConstructor>meta.identity.clazz, constructorArgs);

        debug(TAG, 'Adding dependencies to NewInstance componentName=\'', name, '\' className=', meta.identity.className, '\' ', meta.propDependencies);
        return meta.propDependencies.reduce((prev, curr) => {

            /**
             * Add prop dependency but ONLY if this property is not already set
             * It would be set if sub-class overrides parent where in parent
             * this property is auto-wired with @Inject but sub-class overrides it
             * with own value.
             */
            if (!prev[curr.propertyName]) {
                prev[curr.propertyName] = ctnr.getComponent(curr.dependency, ctx);
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
export function addFactoryComponent<T>(container: IfIocContainer<T>, componentMeta: IfComponentDetails<T>): void {

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
        throw new TypeError(`Factory component componentName=${String(componentMeta.identity.componentName)} className=${componentMeta.identity.className} is not providing any components`);
    }

    addSingletonComponent(container, componentMeta);


    componentMeta.provides.reduce((prev: IfIocContainer<T>, curr: IfComponentFactoryMethod) => {

        let instance: any;

        const providedComponent: IfComponentDetails<T> = {
            identity: curr.providesComponent,
            componentType: IocComponentType.COMPONENT,
            scope: getScope(componentMeta.identity.clazz, curr.methodName),
            propDependencies: [],
            constructorDependencies: [],
            provides: [],
        };


        const getter = function (ctnr: IfIocContainer<T>, ctx?: T) {
            debug(TAG, 'Getter called on Factory-Provided componentName=', String(providedComponent.identity.componentName), ' className=', providedComponent.identity.className, ' of factory componentName=', String(componentMeta.identity.componentName), ' factory className=', componentMeta.identity.className);
            if (instance) {
                debug(TAG, 'Factory-Provided componentName=', providedComponent.identity.componentName, ' className=', providedComponent.identity.className, ' already created. Returning same instance');

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
            const factory = ctnr.getComponent(componentMeta.identity, ctx);
            debug(TAG, 'Calling factory method=', curr.methodName, ' of factory componentName=', componentMeta.identity.componentName, ' factory className=', componentMeta.identity.className);
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


export function addComponent<T>(container: IfIocContainer<T>, clazz: Target): void {

    const meta = getComponentMeta(clazz);
    meta.scope = meta.scope || container.defaultScope;

    if (meta.componentType===IocComponentType.FACTORY) {
        return addFactoryComponent(container, meta);
    } else if (meta.scope===ComponentScope.SINGLETON) {
        return addSingletonComponent(container, meta);
    } else if (meta.scope===ComponentScope.NEWINSTANCE) {
        return addPrototypeComponent(container, meta);
    } else {
        throw new TypeError(`Unable to add component. ${JSON.stringify(meta)} with scope=${String(meta.scope)}`);
    }
}



