import {
    Target,
    LifecycleCallback,
    defineMetadata,
    _INIT_METHOD_,
    _DESTRUCTOR_
} from "../";
import {getComponentName} from "../index";

const debug = require("debug")("bind:decorator:lifecycle");


export function PostConstruct(target: Target, propertyKey: string,
                              descriptor: TypedPropertyDescriptor<LifecycleCallback>) {

    //console.log(`Adding PostConstruct decorator to ?? for method ${propertyKey}`);

    console.log("BOO!!!!!");
    //exit(1)

    // Object.defineProperty(target, propertyKey, {
    //     enumerable: true
    // });

    defineMetadata(_INIT_METHOD_, propertyKey, target.constructor)();

}


export function PreDestroy(target: Target, propertyKey: string,
                           descriptor: TypedPropertyDescriptor<LifecycleCallback>) {
    debug(`Adding @PreDestroy decorator to ${target.name} for method ${propertyKey}`);
    defineMetadata(_DESTRUCTOR_, propertyKey, target)();
    /**
     * target is a prototype of class in this case
     * we also need to define this on constructor method
     * to be able to get the value of this meta by passing just a class
     * (in which case it actually is passing a constructor)
     */
    //defineMetadata(_DESTRUCTOR_, propertyKey, target.constructor);

}


export function getPredestroy(target: Target): string {


    return Reflect.getMetadata(_DESTRUCTOR_, target);
}

/**
 * @todo will not be able to get metadata that was defined on a property
 * from a target!
 *
 * @param {Target} target
 * @returns {string}
 */
export function getPostConstruct(target: Target): string {

    const cName = String(getComponentName(target));

    debug("Entered getPostConstruct for target=", cName);

    const ret = Reflect.getMetadata(_INIT_METHOD_, target);

    if (ret) {
        debug("Found method of postConstruct on ", cName, "method=", ret);

        return ret;
    }


    const a = Object.getOwnPropertyNames(target);
    debug("Property names of ", cName, "are=", JSON.stringify(a));

    for (const p in target.prototype) {

        console.log("Checking postConstruct of ", cName + "." + p);
        if (Reflect.hasMetadata(_INIT_METHOD_, target.prototype, p)) {
            //throw new Error("");
            //debug("FOUND postConstruct=", p);
            console.log("############### p #############");
            return p;
        }
    }

    return "";
    //return Reflect.getMetadata(_INIT_METHOD_, target);
}
