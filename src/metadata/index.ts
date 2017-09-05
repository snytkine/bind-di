import "reflect-metadata";
import {IfComponentPropDependency} from "../"
import {IfConstructorDependency} from "../definitions/container";

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

/**
 * For constructor inject we don't care about instance prototype
 * we only need to add decorator to a class (only to Constructor)
 * Once instance has been created we don't care what constructor dependencies it had
 *
 * @param {Object} target
 * @param {IfConstructorDependency} injectMeta
 */
export function defineConstructorDependency(target: Object, injectMeta: IfConstructorDependency): void {

}

/**
 * Property dependency
 * We need to add this meta to a class prototype
 *
 * @param {Object} target
 * @param {IfComponentPropDependency} injectMeta
 */
export function definePropertyDependency(target: Object, injectMeta: IfComponentPropDependency): void {

}
