import "reflect-metadata";
import {
    IfComponentPropDependency,
    IfConstructorDependency,
    IfComponentIdentity,
    _COMPONENT_IDENTITY_
} from "../"

export const INVALID_COMPONENT_NAMES = ["Object", "String", "Number", "Boolean"];

export function Identity(componentName:string, className:string):IfComponentIdentity {
    return {componentName, className}
}

export function defineMetadataUnique(metadataKey: any, metadataValue: any, target: Object, propertyKey?: string | symbol): void {
    // Need for prototype decorating class and for properties on class instances
    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

    // Need for decorating instances on classes
    if (target['prototype']) {
        Reflect.defineMetadata(metadataKey, metadataValue, target['prototype'], propertyKey);
    } else if (target.constructor) {
        // Need for decorating properties on properties of a prototype
        Reflect.defineMetadata(metadataKey, metadataValue, target.constructor, propertyKey);
    }
}


export function setComponentIdentity(identity: IfComponentIdentity, target: Object, propertyKey?: string): void {
    return defineMetadataUnique(_COMPONENT_IDENTITY_, identity, target, propertyKey)
}



