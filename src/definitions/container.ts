import {Try} from "../framework";

export type IocComponentGetter<T> = (ctx?: T) => any

export type lifecycleCallback<T> = (c: IfIocContainer<T>) => Promise<IfIocContainer<T>>


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
export enum IocComponentLifecycle {
  INSTANCE,
  REQUEST,
  SESSION,
  SINGLETON
}


export enum IocComponentType {
  COMPONENT,
  COMPONENT_FACTORY
}


export interface IfComponentFactoryMethod {
  propName: string
  provides: string
}

/**
 * Object of this interface identifies that component
 * has dependency on another component identified by ComponentID
 * This is for property based dependency injection
 */
export interface IfComponentPropDependency {
  propName: string
  componentName: string
}

/**
 * Interface of a Component stored in container
 */
export interface IfIocComponent<T> {

  /**
   * Component Unique Identifier (component name)
   */
  id: string

  /**
   * Unique identifier of component type
   */
  componentType: IocComponentType


  /**
   * Optional field may be used by consumer of this framework
   * to add extra info to component.
   * Example is to add a hint that component is a Middleware or Controller, or RequestFilter
   * or any other info that consuming framework may need to set
   *
   * Default value is DEFAULT_COMPONENT_META
   *
   */
  componentMeta: Symbol

  /**
   * Main function to call to get
   * instance of requested component
   */
  get: IocComponentGetter<T>

  /**
   * Component lifecycle
   */
  lifecycle: IocComponentLifecycle

  /**
   * Property dependencies
   */
  propDeps: Array<IfComponentPropDependency>

  /**
   * Constructor dependencies
   */
  ctorDeps: Array<string>

  /**
   * Array of componentIDs that this
   * component provides
   * I Component Factory may provide
   * multiple components
   */
  provides: Array<string>

  /**
   * Optional function to call after
   * constructing component
   */
  postConstruct?: lifecycleCallback<T>

  /**
   * Optional function to call
   * on component when container is shutting down
   */
  preDestroy?: lifecycleCallback<T>

}


export interface Newable <T> {
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
   * Container knows when to return same instance, when to return new instance
   * and when to return result of calling service (in case of Service returns Promise)
   *
   * @param ctx
   * @param name
   * @returns any
   */
  get(name: string, ctx?: T): Try<any, Error>

  /**
   * Add missing properties to an object
   * when object is passed here it will get
   * the dependsOn meta and will add missing dependencies
   *
   * This is a helper method and only used for setting prop dependencies
   * constructor dependencies are not set with this method
   *
   * @param obj
   * @returns same object that was passed in with added properties
   */
  addDependencies<T>(obj: T, ctx?: T, aDeps?: Array<IfComponentPropDependency>): Try<T>

  /**
   * Adds component to container
   * @param cClass component class
   * @returns string name of added component
   */
  addComponent(cClass: Newable<any>): Try<string, Error>

  readonly components: string

  readonly ready: boolean

  initialize(): Promise<IfIocContainer<T>>

  cleanup(): Promise<boolean>

}
