

import {
    IfComponentFactoryMethod, IfComponentPropDependency, IfCtorInject, IocComponentGetter, IocComponentScope,
    IocComponentType, LifecycleCallback
} from "./container";
import {StringOrSymbol} from "./types";

export type Target_ = ObjectConstructor;

export type Target = {
    new? (...args: any[]): any
    //new?(value?: any): Object;
    name?: string
    constructor: any
    prototype?: any
}

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
export interface IfComponentIdentity {
    componentName: StringOrSymbol
    clazz: any
    className?: string
    equals: (other: IfComponentIdentity) => boolean
}


export interface IfPropertyWithDescriptor {
    propertyKey: string
    descriptor: TypedPropertyDescriptor<Object>
}

export interface IfComponentDecoration {
    componentName: StringOrSymbol
    componentType: IocComponentType
    /**
     * Target should always be a Constructor function (newable) T extends {new(...args:any[]):{}}
     * @todo create separate interface for this property like ClassConstructor
     * it will have .name
     */
    target: object
    defaultScope: IocComponentScope
    componentMeta?: Symbol
    property?: IfPropertyWithDescriptor

}


export interface IfComponentDetails<T> {

    /**
     * Component Unique Identifier (component name)
     */
    identity: IfComponentIdentity

    /**
     * Component lifecycle
     */
    scope: IocComponentScope

    /**
     * Property dependencies
     */
    propDependencies: Array<IfComponentPropDependency>

    /**
     * Constructor dependencies
     */
    constructorDependencies: Array<IfComponentIdentity>

    /**
     * Array of componentIDs that this
     * component provides
     * Factory may provide
     * multiple components
     */
    provides: Array<IfComponentFactoryMethod>

    /**
     * Optional name of method function to call after
     * constructing component
     */
    postConstruct?: string

    /**
     * Optional name of method function to call
     * on component when container is shutting down
     */
    preDestroy?: string

    /**
     * Unique identifier of component type
     */
    componentType?: IocComponentType

    /**
     * Optional field may be used by consumer of this framework
     * to add extra info to component.
     * Example is to add a hint that component is a Middleware or Controller, or RequestFilter
     * or any other info that consuming framework may need to set
     *
     * Default value is DEFAULT_COMPONENT_META
     *
     */
    componentMetaType?: Symbol

}
