import {StringOrSymbol as ComponentID} from "./types";

export type IocComponentGetter<T> = (ctx?: T) => any

export type lifecycleCallback<CTX> = (c: IfIocContainer<CTX>) => Promise<IfIocContainer<CTX>>

/**
 * SINGLETON component created only the first time they requested
 * INSTANCE component is created using new keyword every time its requested
 *
 * @todo may add 2 new lifecycles: Request - one per request (per req object)
 * and Session one per session.
 *
 * @important value must be in ORDER from smallest to largest lifecycle
 * This will be used in validation of dependency injection where
 * component with smaller lifecycle in not allowed to be injected
 * into component with larger lifecycle.
 *
 */
export enum IocComponentLifecycle {
  SINGLETON,
  INSTANCE
}

/**
 * Object of this interface identifies that component
 * has dependency on another component identified by ComponentID
 * This is for property based dependency injection
 */
export interface IfComponentPropDependency {
  propName: string
  componentName: ComponentID
}

/**
 * Interface of a Component stored in container
 */
export interface IfIocComponent<CTX> {

  /**
   * Component Unique Identifier
   */
  id: ComponentID

  /**
   * Main function to call to get
   * instance of requested component
   */
  get: IocComponentGetter<CTX>

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
  ctorDeps: Array<ComponentID>

  /**
   * Array of componentIDs that this
   * component provides
   * I Component Factory may provide
   * multiple components
   */
  provides: Array<ComponentID>

  /**
   * Optional function to call after
   * constructing component
   */
  postConstruct?: lifecycleCallback<CTX>

  /**
   * Optional function to call
   * on component when container is shutting down
   */
  preDestroy?: lifecycleCallback<CTX>
}


export interface Newable <T> {
  new(): T
  name?: string
}


export interface IfIocContainer<CTX> {

  hasComponent(name: ComponentID): boolean

  /**
   * Container knows when to return same instance, when to return new instance
   * and when to return result of calling service (in case of Service returns Promise)
   *
   * @param ctx
   * @param name
   * @returns any
   */
  getComponent(name: ComponentID, ctx?: CTX): any

  /**
   * Add missing properties to an object
   * when object is passed here it will get
   * the dependsOn meta and will add missing dependencies
   *
   * @param obj
   * @returns same object that was passed in with added properties
   */
  setDependencies<T>(obj: T, ctx?: CTX, aDeps?: Array<IfComponentPropDependency>): T

  /**
   * Adds component to container
   * @param cClass component class
   * @returns string name of added component
   * @throws Error if component with same name was already added
   */
  addComponent(cClass: Newable<any>): ComponentID

  readonly componentsList: string

  readonly ready: boolean

  initialize(): Promise<IfIocContainer<CTX>>

  cleanup(): Promise<boolean>

}
