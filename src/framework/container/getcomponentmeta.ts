import {
    COMPONENT_META_DATA,
    _COMPONENT_TYPE_,
    getComponentIdentity,
    getScope,
    getFactoryMethods,
    getConstructorDependencies,
    getPropDependencies,
    IfComponentDetails,
    getPredestroy,
    getPostConstruct,
    Target
} from "../../";
import {StringOrSymbol} from "../../definitions/types";

export const getComponentMeta = (clazz: Target, propertyKey?: StringOrSymbol): IfComponentDetails => {

    /**
     * @todo in case where propertyKey is passed
     * this function will return wrong values for provides, preDestroy, postConstruct,
     * constructorDependencies, propDependencies because it does not take into account
     * propertyKey for those method. It will return these data for factory target instead.
     * This must be fixed. At least do not return the propDependencies, constructorDependencies,
     * provides, preDestroy, postConstruct if propertyKey not provided but better try and see
     * if these property can be properly determined for provided component (the one that exists
     * as provided component as property key of factory)
     */
    return {
        identity: getComponentIdentity(clazz, propertyKey),
        componentMetaData: Reflect.getMetadata(COMPONENT_META_DATA, clazz, propertyKey),
        scope: getScope(clazz, propertyKey),
        propDependencies: getPropDependencies(clazz),
        constructorDependencies: getConstructorDependencies(clazz),
        provides: getFactoryMethods(clazz),
        preDestroy: getPredestroy(clazz),
        postConstruct: getPostConstruct(clazz)
    }
};
