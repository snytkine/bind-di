import { Maybe, StringOrSymbol, StringToAny } from './types';
import { ComponentScope } from '../enums';
import { ComponentIdentity } from '../utils/componentidentity';

/**
 * A Component may be a named component or
 * the name may be inferred from className
 *
 * In case of a named component a
 * componentName is (usually) different from a class name
 * In case of inferred name the componentName is the same as className
 *
 * In case of generic class the name of type T is not used, only the className
 * is used for value of className
 */

export interface IContainerConfig {
  envFilterName: string;
}

export interface IfComponentDetails {
  /**
   * Component Unique Identifier (component name)
   */
  identity: ComponentIdentity;

  /**
   * Component lifecycle
   */
  scope: ComponentScope;

  /**
   * Property dependencies
   */
  propDependencies: Array<IfComponentPropDependency>;

  /**
   * Constructor dependencies
   */
  constructorDependencies: Array<ComponentIdentity>;

  /**
   * Component may require other components to be
   * available at runtime. These may not be strictly
   * dependencies - they may not be added via @Inject of any kind
   * but are still expected to be available. The consumer
   * of this framework may have some requirements that
   * this framework cannot possibly know.
   * For example a controller may depend on middleware component
   * and that middleware is not added to controller via @Inject
   * but instead may use different decorator like @Middlewares
   * For this purpose we need a way to indicate that certain
   * extraDependencies are required so that in the initialization phase
   * the init logic can validate all dependencies.
   */
  extraDependencies: Array<ComponentIdentity>;

  /**
   * @todo
   * add methodArgumentDependencies?
   * the array of dependencies for methodArguments
   * only when @Inject is supported in the method argument
   *
   *
   * like getUser(@PathParam username, @Inject requestLogger: RequestLogger)
   */

  /**
   * Array of componentIDs that this
   * component provides
   * Factory may provide
   * multiple components
   */
  provides?: Array<IfComponentFactoryMethod>;

  /**
   * Optional name of method function to call after
   * constructing component
   */
  postConstruct?: string;

  /**
   * Optional name of method function to call
   * on component when container is shutting down
   */
  preDestroy?: string;

  /**
   * Optional field may be used by consumer of this framework
   * to add extra info to component.
   * Example is to add a hint that component is a Middleware or Controller, or RequestFilter
   * or any other info that consuming framework may need to set
   *
   * Default value is DEFAULT_COMPONENT_META
   *
   */
  componentMetaData?: StringToAny;
}

/**
 * A Context will be an example of component store
 * you will be able to get component by ID from context.
 * What should it return - a component or a component getter function?
 */
export interface IComponentStorage {
  getComponent(id: ComponentIdentity): Maybe<Object>;

  setComponent(id: ComponentIdentity, component: any): void;
}

export interface IScopedComponentStorage extends IComponentStorage {
  /**
   * @todo should scope be an array of scopes?
   * can an object like
   * "Context" implement both RequestScopeStorage
   * and SessionScopeStorage?
   * Answer is - probably not but Context object
   * can have references to both RequestScopeStorage
   * and SessionScopeStorage
   */
  scope: ComponentScope;
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
export type IocComponentGetter<T = any> = (
  scopedComponentStorage?: Array<IScopedComponentStorage>,
) => T;

export type ComponentGetterFactory = (container: IfIocContainer) => IocComponentGetter;

/**
 * Lifecycle callbacks are made by container after
 * the new component is constructed or before container shuts down
 * These callbacks are used by components that need to perform some type
 * of asynchronous operations like connecting to database
 * These methods don't take any arguments must return a Promise<Boolean>
 */
export type LifecycleCallback = () => Promise<boolean>;

export interface IfComponentFactoryMethod {
  methodName: string;
  providesComponent: ComponentIdentity;
}

export interface IfConstructorDependency {
  parameterIndex: number;
  dependency: ComponentIdentity;
}

/**
 * Object of this interface identifies that component
 * has dependency on another component identified by ComponentID
 * This is for property based dependency injection
 */
export interface IfComponentPropDependency {
  propertyName: StringOrSymbol;
  dependency: ComponentIdentity;
}

/**
 * Interface of a Component stored in container
 */
export interface IfIocComponent<T = any> extends IfComponentDetails {
  /**
   * Main function to call to get
   * instance of requested component
   */
  get: IocComponentGetter<T>;
}

/* export interface Newable<T> {
  new (): T;

  name?: string;
} */

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
  has(name: ComponentIdentity): boolean;

  /**
   * Get a record for the component by identity
   * The result is NOT a component, but a component details like scope,
   * constructorDependencies, provides, as well as component getter function
   * @todo Would it be better to not throw exception if component not found?
   * I think it will be better for types definition to return either IfIocComponent
   * of FrameworkError
   *
   * @param ctx
   * @param name
   * @returns any
   * @throws FrameworkError if Component not found
   */
  getComponentDetails(id: ComponentIdentity): IfIocComponent;

  /**
   * Result of finding component and calling component getter
   *
   * @todo instead of throwing FrameworkError return Object | FrameworkError
   * Then it will be most strongly typed.
   * Downside of that change would be that consumer must check result of calling this function
   * to make sure it's not instance of FrameworkError
   * A More consumer-friendly way would be to return Promise<Component>
   *   that way it would be more natural to use .catch block to deal with
   *   potential not found errors.
   *   Also returning Promise may become more useful for future versions when
   *   container returns actual Promise for all components.
   *
   * @param id
   * @param scopedStorage
   * @returns any
   * @throws FrameworkError if component not found
   */
  getComponent(id: ComponentIdentity, scopedStorage?: Array<IScopedComponentStorage>): any;

  /**
   * Adds component to container
   * @param component component class
   * @returns string name of added component
   */
  addComponent(component: IfIocComponent): boolean;

  /**
   * @todo how can this even be used?
   * The scope is added to component when class is loaded, before
   * it is even aware of this container.
   * Both scope and default_scope meta is added as metadata to component
   *
   */
  defaultScope: ComponentScope;

  /**
   * Get array of all components in this container
   */
  readonly components: Array<IfIocComponent>;

  initialize(components?: Array<IfIocComponent>): Promise<Array<IfIocComponent>>;

  cleanup(): Promise<boolean>;
}
