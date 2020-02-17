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
import {StringOrSymbol} from "../../definitions/types";

export interface IfGetComponentMetaArg {
    clazz: Target
    filePath: string
    propertyKey?: StringOrSymbol
}
export const getComponentMeta = ({clazz, filePath, propertyKey}: IfGetComponentMetaArg): IfComponentDetails => {

    return {
        identity: getComponentIdentity({ target: clazz, propertyKey, filePath}),
        componentType: Reflect.getMetadata(_COMPONENT_TYPE_, clazz, propertyKey),
        filePath,
        componentMetaData: Reflect.getMetadata(_COMPONENT_META_TYPE_, clazz, propertyKey),
        scope: getScope(clazz, propertyKey),
        propDependencies: getPropDependencies(clazz),
        constructorDependencies: getConstructorDependencies(clazz),
        provides: getFactoryMethods(clazz),
        preDestroy: getPredestroy(clazz),
        postConstruct: getPostConstruct(clazz)
    }
};
