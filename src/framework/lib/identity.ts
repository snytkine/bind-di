import { UNNAMED_COMPONENT,
    IfComponentIdentity,
    StringOrSymbol,
    Target } from '../../definitions';
import { IfIdentityCtorArgs } from '../../metadata';


/**
 * Factory function to create IfComponentIdentity
 * Overloaded function signature
 * Can be called with single param Target
 * or with first param StringOrSymbol and optional second param Target
 *
 * @param componentName
 * @param clazz
 * @constructor
 */
export function Identity(component: Target): IfComponentIdentity
export function Identity(component: StringOrSymbol, clazz?: Target): IfComponentIdentity

/**
 * Implementation
 *
 * @param component
 * @param clazz
 * @constructor
 */
export function Identity(component: Target | StringOrSymbol, clazz?:Target): IfComponentIdentity {
    const cType = typeof component;

    if(cType === 'string' || cType === 'symbol'){
        if(component === UNNAMED_COMPONENT && !clazz){
            throw new Error('Identity factory. cannot create Identity for UNNAMED COMPONENT without clazz');
        }

        return {
            componentName: <StringOrSymbol>component,
            clazz,
        };
    }

    /**
     * called with single param Target.
     */
    return {
        componentName: UNNAMED_COMPONENT,
        clazz: component
    }
}

/**
 * @todo Delete it, no longer user, using Identity factory instead
 *
 * @param componentName
 * @param clazz
 * @private
 */
export function _Identity({
                             componentName,
                             clazz,
                         }: IfIdentityCtorArgs): IfComponentIdentity  {

    componentName = componentName || UNNAMED_COMPONENT;

    if(componentName === UNNAMED_COMPONENT && !clazz){
        throw new Error('cannot create Identity for UNNAMED COMPONENT without clazz');
    }

    /**
     * Assert than if componentName is not passed then clazz must be passed
     *
     */
    return {
        componentName,
        clazz,
    };
};
