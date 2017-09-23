import {
    _COMPONENT_META_TYPE_,
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

export const getComponentMeta = <T>(clazz: Target): IfComponentDetails<T> => {

    return {
        identity: getComponentIdentity(clazz),
        componentType: Reflect.getMetadata(_COMPONENT_TYPE_, clazz),
        componentMetaType: Reflect.getMetadata(_COMPONENT_META_TYPE_, clazz),
        scope: getScope(clazz),
        propDependencies: getPropDependencies(clazz),
        constructorDependencies: getConstructorDependencies(clazz),
        provides: getFactoryMethods(clazz),
        clazz: clazz,
        preDestroy: getPredestroy(clazz),
        postConstruct: getPostConstruct(clazz)
    }
};
