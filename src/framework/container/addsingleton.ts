import {
    Target,
    IfComponentPropDependency,
    IfCtorInject,
    IfIocContainer,
    getConstructorDependencies,
    getPropDependencies
} from "../../";


const debug = require('debug')('bind:container');
export type ComponentGetter<T> = (ctx?: T) => any

export function addSingleton<T>(container: IfIocContainer<T>, clazz: Target): ComponentGetter<T> {

    let instance: any;
    let ctorDeps: Array<IfCtorInject> = getConstructorDependencies(clazz);
    let propDeps: Array<IfComponentPropDependency> = getPropDependencies(clazz);

    return function (ctx?: T) {
        if (instance) {
            return instance;
        }

        const constructorArgs = ctorDeps.map(_ => container.get(_.inject.componentName));
        instance = new clazz(...constructorArgs);

        propDeps.reduce((prev, curr) => {
            prev[curr.propertyName] = container.get(curr.dependency.componentName)
        }, instance);

        return instance;
    }
}