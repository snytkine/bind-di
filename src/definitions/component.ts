import {
    IfComponentFactoryMethod, IfComponentPropDependency
} from "./container";

import {ComponentScope} from '../enums/componentscope'
import { StringOrSymbol, StringToAny } from './types';

export type Target = {
    new? (...args: any[]): any
    name?: string
    constructor: Function
    prototype?: any
    length?: number
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
    clazz?: Target
}

export interface IfComponentDetails {

    /**
     * Component Unique Identifier (component name)
     */
    identity: IfComponentIdentity

    /**
     * Component lifecycle
     */
    scope: ComponentScope

    /**
     * Property dependencies
     */
    propDependencies: Array<IfComponentPropDependency>

    /**
     * Constructor dependencies
     */
    constructorDependencies: Array<IfComponentIdentity>

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
     * Optional field may be used by consumer of this framework
     * to add extra info to component.
     * Example is to add a hint that component is a Middleware or Controller, or RequestFilter
     * or any other info that consuming framework may need to set
     *
     * Default value is DEFAULT_COMPONENT_META
     *
     */
    componentMetaData?: StringToAny

}
