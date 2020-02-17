import { Try, StringOrSymbol, IfComponentIdentity } from '../';
import { IfComponentDetails } from './component';
import { ComponentScope } from '../enums/componentscope';

/**
 * A Context will be an example of component store
 * you will be able to get component by ID from context.
 * What should it return - a component or a component getter function?
 */
export interface IComponentStorage {
    getComponent(id: IfComponentIdentity): any

    setComponent(id: IfComponentIdentity, component: any): void
}

export interface IScopedComponentStorage {
    scope: ComponentScope
    storage: IComponentStorage
}

/**
 * Component may provide own function for how to create itself
 * The function takes instance of container and context
 * using these 2 parameters the function has all it needs to
 * create instance. The function may use closure to store already
 * created instance of instantiated component and return it in case
 * when component's scope is singleton (default score)
 *
 * Framework provides these helper functions for singleton and context-scoped
 * components
 */
export type IocComponentGetter = (container: IfIocContainer, scopedComponentStorage?: Array<IScopedComponentStorage>) => any

/**
 * Lifecycle callbacks are made by container after
 * the new component is constructed or before container shuts down
 * These callbacks are used by components that need to perform some type
 * of asynchronous operations like connecting to database
 * These methods don't take any arguments must return a Promise<Boolean>
 */
export type LifecycleCallback = () => Promise<Boolean>


export enum IocComponentType {
    COMPONENT = 1,
    FACTORY
}


export interface IfComponentFactoryMethod {
    methodName: string
    providesComponent: IfComponentIdentity
}


export interface IfCtorInject {
    parameterIndex: number
    dependency: IfComponentIdentity
}

/**
 * Object of this interface identifies that component
 * has dependency on another component identified by ComponentID
 * This is for property based dependency injection
 */
export interface IfComponentPropDependency {
    propertyName: StringOrSymbol
    dependency: IfComponentIdentity
}


/**
 * Interface of a Component stored in container
 */
export interface IfIocComponent extends IfComponentDetails {

    /**
     * Main function to call to get
     * instance of requested component
     */
    get: IocComponentGetter

}


export interface Newable<T> {
    new(): T

    name?: string
}

/**
 * Inversion of control container interface
 * Container is generic for a type T which represents a type of Context Object
 * Context object is an optional parameter when getting a component from container
 *
 */
export interface IfIocContainer {

    /**
     * Check to see if container contains component by specific name
     * @param name
     * @returns boolean
     */
    has(name: IfComponentIdentity): boolean

    /**
     * Get a record for the component by name
     * The result is NOT a component, but a component details like scope,
     * constructorDependencies, provides, as well as component getter function
     *
     * @param ctx
     * @param name
     * @returns any
     */
    getComponentDetails(id: IfComponentIdentity): IfIocComponent

    /**
     * Result of finding component and calling component getter
     *
     * @param ctx
     * @param name
     * @returns any
     */
    getComponent(id: IfComponentIdentity, scopedStorage?: Array<IScopedComponentStorage>): any


    /**
     * Adds component to container
     * @param cClass component class
     * @returns string name of added component
     */
    addComponent(component: IfIocComponent): boolean


    defaultScope: ComponentScope;

    /**
     * Get array of all components in this container
     */
    readonly components: Array<IfIocComponent>


    initialize(): Promise<IfIocContainer>

    cleanup(): Promise<boolean>

}
