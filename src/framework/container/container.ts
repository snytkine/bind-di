import {
    Try,
    TryCatch,
    Target,
    IfComponentDetails,
    IfIocComponent,
    IfIocContainer,
    getScope,
    getComponentIdentity,
    getPropDependencies,
    getConstructorDependencies,
    getFactoryMethods,
    _COMPONENT_TYPE_,
    _COMPONENT_META_TYPE_
} from "../../";

const debug = require('debug')('bind:ioc');

export const TAG = "Container";
//export const DEFAULT_COMPONENT_META = Symbol("ioc:component:meta:default");

const getComponentMetaData = (clazz: Target): IfComponentDetails => {

    return {
        id: getComponentIdentity(clazz),
        componentType: Reflect.getMetadata(_COMPONENT_TYPE_, clazz),
        componentMeta: Reflect.getMetadata(_COMPONENT_META_TYPE_, clazz),
        scope: getScope(clazz),
        propDeps: getPropDependencies(clazz),
        ctorDeps: getConstructorDependencies(clazz),
        provides: getFactoryMethods(clazz)
    }
};

export class Container<T> implements IfIocContainer<T> {

    private readonly store_: Map<string, IfIocComponent<T>>;
    private initialized = false;


    constructor() {
        this.store_ = new Map<string, IfIocComponent<T>>();
    }


    has(name: string) {
        return this.store_.has(name);
    }

    get (name: string, ctx ?: T): Try<any, Error> {

        debug(TAG, "Entered Container.get Requesting ", name, " with context=", !!(ctx)
        )
        ;

        const o = this.store_.get(name);

        if (!o) {

            return {
                Success: null,
                Failure: new ReferenceError(`Component '${name}' not found in container`)
            }

        }


        return TryCatch(() => {

            debug(TAG, "Calling get() on Component '{name}'", " with context=", !!ctx);

            return o.get(ctx);

        })

    }


    addComponent(component: Target){

    }

}