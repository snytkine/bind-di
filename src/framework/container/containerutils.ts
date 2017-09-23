import {
    IfIocContainer,
    IfComponentDetails,
    IocComponentScope,
    IocComponentType,
    Target
} from "../../";
import {getComponentMeta} from "./getcomponentmeta";


const TAG = "CONTAINER::UTIL";
const debug = require('debug')('bind:container');

/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
export function addSingletonComponent<T>(container: IfIocContainer<T>, clazz: Target): void {

    const componentMeta = getComponentMeta(clazz);
    debug(TAG, "Adding singleton component=", componentMeta.identity.componentName);

    const getter = function (c) {
        const name = componentMeta.identity.componentName;
        let instance: any;

        return function (ctx?: T) {
            debug(TAG, "Getter called for Singleton component=", name, " with ctx=", !!ctx);
            if (instance) {
                debug(TAG, "Returning same instance of component=", name);
                return instance;
            }

            debug(TAG, "Creating new instance of component' ", name, "' with constructor args", componentMeta.constructorDependencies);
            const constructorArgs = componentMeta.constructorDependencies.map(_ => container.getComponent(_.inject.componentName));
            //instance = new clazz(...constructorArgs);
            instance = Reflect.construct(<ObjectConstructor>clazz, constructorArgs);

            debug(TAG, "Adding dependencies to component' ", name, "' ", componentMeta.propDependencies);
            return componentMeta.propDependencies.reduce((prev, curr) => {
                prev[curr.propertyName] = container.getComponent(curr.dependency.componentName);

                return prev;
            }, instance);
        }
    }(container);

    const component = {...componentMeta, get: getter};

    container.addComponent(component)

}


/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
export function addPrototypeComponent<T>(container: IfIocContainer<T>, clazz: Target): void {

    const componentMeta = getComponentMeta(clazz);
    debug(TAG, "Adding prototype component=", componentMeta.identity.componentName);

    const getter = function (c) {
        const name = componentMeta.identity.componentName;


        return function (ctx?: T) {
            debug(TAG, "Getter called for Prototype component=", name, " with ctx=", !!ctx);

            debug(TAG, "Creating new instance of component' ", name, "' with constructor args", componentMeta.constructorDependencies);
            const constructorArgs = componentMeta.constructorDependencies.map(_ => container.getComponent(_.inject.componentName));
            const instance = Reflect.construct(<ObjectConstructor>clazz, constructorArgs);//new clazz(...constructorArgs);
            //const instance = new (<ObjectConstructor>clazz)(...constructorArgs);

            debug(TAG, "Adding dependencies to component' ", name, "' ", componentMeta.propDependencies);
            return componentMeta.propDependencies.reduce((prev, curr) => {
                prev[curr.propertyName] = container.getComponent(curr.dependency.componentName);

                return prev;

            }, instance);
        }
    }(container);

    const component = {...componentMeta, get: getter};

    container.addComponent(component)

}

/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
export function addFactoryComponent<T>(container: IfIocContainer<T>, clazz: Target): void {

    /**
     * Then create a component for every factory method,
     * create getter function for it
     * and add it to container
     */
    const componentMeta: IfComponentDetails<T> = getComponentMeta(clazz);

    debug(TAG, "Adding Factory component=", componentMeta.identity.componentName);

    addSingletonComponent(container, clazz);


    /**
     * First add the factory component itself to container
     */
    if (componentMeta.provides.length === 0) {
        throw new TypeError(`Factory component ${componentMeta.identity.componentName} is not providing any components`);
    }

    componentMeta.provides.reduce((prev, curr) => {

        const providedComponent: IfComponentDetails<T> = {
            identity: curr.providesComponent,
            componentType: IocComponentType.COMPONENT,
            scope: IocComponentScope.SINGLETON,
            propDependencies: [],
            constructorDependencies: [],
            provides: []
        };

        const getter = function (c: IfIocContainer<T>, factoryName: string, factoryMethodName: string, componentName: string) {

            let instance: any;

            return function (ctx?: T) {
                debug(TAG, "Getter called on Factory-Provided component=", componentName, " of factory=", factoryName);
                if (instance) {
                    debug(TAG, "Provided component=", componentName, " already created. Returning same instance");

                    return instance;
                }

                const factory = prev.getComponent(factoryName, ctx);
                debug(TAG, "Calling factory method=", factoryMethodName, " of factory=", factoryName);
                instance = factory[factoryMethodName]();

                return instance;

            }

        }(prev, componentMeta.identity.componentName, curr.methodName, curr.providesComponent.componentName);

        const component = {...providedComponent, get: getter};

        debug(TAG, "Adding factory-provided component=", component.identity.componentName);

        prev.addComponent(component);

        return prev;

    }, container)

}


export function addComponent<T>(container: IfIocContainer<T>, clazz: Target): void {

    const meta = getComponentMeta(clazz);

    if (meta.componentType === IocComponentType.FACTORY) {
        return addFactoryComponent(container, clazz)
    } else if (meta.scope === IocComponentScope.SINGLETON) {
        return addSingletonComponent(container, clazz);
    } else if (meta.scope === IocComponentScope.PROTOTYPE) {
        return addPrototypeComponent(container, clazz);
    } else {
        throw new TypeError(`Unable to add component. ${JSON.stringify(meta)}`)
    }
}
