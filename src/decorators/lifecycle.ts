import {
    Target,
    LifecycleCallback,
    defineMetadata,
    defineMetadataUnique,
    _INIT_METHOD_,
    _DESTRUCTOR_
} from "../";

const debug = require('debug')('bind:decorator:lifecycle');


export function PostConstruct(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<LifecycleCallback>) {
    debug(`Adding @PostConstruct decorator to ${target.name} for method ${propertyKey}`);
    defineMetadata(_INIT_METHOD_, propertyKey, target);
    /**
     * target is a prototype of class in this case
     * we also need to define this on constructor method
     * to be able to get the value of this meta by passing just a class
     * (in which case it actually is passing a constructor)
     */
    //defineMetadata(_INIT_METHOD_, propertyKey, target.constructor);

}


export function PreDestroy(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<LifecycleCallback>) {
    debug(`Adding @PreDestroy decorator to ${target.name} for method ${propertyKey}`);
    defineMetadata(_DESTRUCTOR_, propertyKey, target);
    /**
     * target is a prototype of class in this case
     * we also need to define this on constructor method
     * to be able to get the value of this meta by passing just a class
     * (in which case it actually is passing a constructor)
     */
    //defineMetadata(_DESTRUCTOR_, propertyKey, target.constructor);

}


export function getPredestroy(target: Target):string {
    return Reflect.getMetadata(_DESTRUCTOR_, target);
}


export function getPostConstruct(target: Target):string {
    return Reflect.getMetadata(_INIT_METHOD_, target);
}
