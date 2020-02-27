import {
    IfComponentIdentity,
    StringOrSymbol,
    Target,
} from '../../definitions';
import { FrameworkError } from '../../exceptions';
import { UNNAMED_COMPONENT } from '../../consts';
import { isStringOrSymbol } from './isstringorsymbol';


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
export function Identity(component: Target | StringOrSymbol, clazz?: Target): IfComponentIdentity {

    if (isStringOrSymbol(component)) {
        if (component===UNNAMED_COMPONENT && !clazz) {
            throw new FrameworkError(`Cannot create Identity for UNNAMED_COMPONENT without clazz`);
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
        clazz: component,
    };
}
