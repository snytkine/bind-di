import {Try, StringOrSymbol, IfComponentIdentity} from "../";
import {IfComponentDetails} from "./component";

export type IocComponentGetter<T> = (ctx?: T) => any

/**
 * Lifecycle callbacks are made by container after
 * the new component is constructed or before container shuts down
 * These callbacks are used by components that need to perform some type
 * of asynchronous operations like connecting to database
 * These methods don't take any arguments must return a Promise<Boolean>
 */
export type LifecycleCallback = () => Promise<Boolean>


/**
 * APPLICATION (aka singleton) component created only the first time they requested
 * INSTANCE component is created using new keyword every time its requested
 * REQUEST one per request
 * SESSION one per http session
 *
 *
 * @important value must be in ORDER from smallest to largest lifecycle
 * This will be used in validation of dependency injection where
 * component with smaller lifecycle in not allowed to be injected
 * into component with larger lifecycle.
 *
 */
export enum IocComponentScope {
    PROTOTYPE = 1,
    REQUEST,
    SESSION,
    SINGLETON
}


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
export interface IfIocComponent<T> extends IfComponentDetails<T> {

    /**
     * Main function to call to get
     * instance of requested component
     */
    get: IocComponentGetter<T>

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
export interface IfIocContainer<T> {

    /**
     * Check to see if container contains component by specific name
     * @param name
     * @returns boolean
     */
    has(name: string): boolean

    /**
     * Get a record for the component by name
     * The result is NOT a component, but a component details like scope,
     * constructorDependencies, provides, as well as component getter function
     *
     * @param ctx
     * @param name
     * @returns any
     */
    getComponentDetails(name: string): IfIocComponent<T>

    /**
     * Result of finding component and calling component getter
     *
     * @param ctx
     * @param name
     * @returns any
     */
    getComponent(name:string, ctx?:T):any

    /**
     * Adds component to container
     * @param cClass component class
     * @returns string name of added component
     */
    addComponent(component: IfIocComponent<T>): boolean

    /**
     * Get array of all components in this container
     */
    readonly components: Array<IfIocComponent<T>>


    initialize(): Promise<IfIocContainer<T>>

    cleanup(): Promise<boolean>

}
