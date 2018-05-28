import {IfIocComponent} from "../..";
import {IfComponentDetails} from "../../definitions/component";
import {
    IfComponentIdentity,
    IfIocContainer,
    IocComponentType
} from "../../definitions";
import {stringifyIdentify} from "./containerutils";
import {IocComponentScope} from "../../definitions/container";

const debug = require("debug")("bind:container");

export const TAG = "Initializer";

/**
 * The reason for async is to return a promise
 * the reason for a promise so that this function can be chained
 * with other loader functions like initializer
 *
 * @param {Array<IfIocComponent<T>>} components
 * @returns {Promise<Array<IfIocComponent<T>>>}
 */
export const sortdependencies = async <T>(components: Array<IfIocComponent<T>>): Promise<Array<IfIocComponent<T>>> => {


    return components;
};


export type unsorted_sorted<T> = {
    unsorted: Array<IfComponentDetails<T>>,
    sorted: Array<IfComponentDetails<T>>
}


const depsResolved = <T>(component: IfComponentDetails<T>, aComponents: Array<IfComponentDetails<T>>): boolean => {

    debug(TAG, "entered depsResolved for component=", stringifyIdentify(component.identity));
    /**
     * Every propDependency and every Constructor Dependency must be provided by
     * components in the aComponents
     */
    const ctorDepsresolved = component.constructorDependencies.map(dep => {

        return aComponents.findIndex(_ => {
            return _.identity.equals(dep) || _.provides.findIndex(x => {
                return x.providesComponent.equals(dep);
            }) > -1;
        });
    });


    const propDepsresolved = component.propDependencies.map(dep => {

        return aComponents.findIndex(_ => {
            return _.identity.equals(dep.dependency) || _.provides.findIndex(x => {
                return x.providesComponent.equals(dep.dependency);
            }) > -1;
        });
    });

    debug(TAG, "deps for component,", stringifyIdentify(component.identity), " ctorDepsresolved=", ctorDepsresolved, "propDepsresolved=", propDepsresolved);

    return !propDepsresolved.includes(-1) && !ctorDepsresolved.includes(-1);
};


export const initIterator = async function* <T>(container: IfIocContainer<T>,
                                                components: Array<IfComponentDetails<T>>): AsyncIterableIterator<boolean> {

    for (const comp of components) {
        /**
         * Only Singleton can have initializer functions
         * Factory components are the ones that mostly use initializers
         * but in general any singleton component can have initializer
         * Only singletons are allowed to have initializers because
         * the initialization function is only called once during container
         * initialization.
         * Non-singleton components cannot have initializer called
         * because initializer returns a promise but container must return
         * instance, it cannot return a Promise of component.
         */
        if (comp.scope === IocComponentScope.SINGLETON && comp.postConstruct) {

            const o = container.getComponent(comp.identity);

            yield o[comp.postConstruct]()
            .then(_ => stringifyIdentify(comp.identity));
        }
    }
};

/**
 * Sort components in order of dependencies resolved
 * where first element will be component with no dependecies,
 * second will be either no dependencies or with dependencies resolved
 * by first component, thirds is component with no dependencies or dependencies resolved
 * by first 2, etc...
 *
 * If return object from this function has .unsorted array length > 0
 * this means that not all dependencies can be resolved. It may also mean a dependency loop
 *
 *
 * @param {unsorted_sorted<T>} input
 * @returns {unsorted_sorted<T>}
 */
export const sortComponents = <T>(input: unsorted_sorted<T>): unsorted_sorted<T> => {

    let resolvedOne = false;
    if (input.unsorted.length === 0) {
        return input;
    }

    const ret: unsorted_sorted<T> = {
        unsorted: [],
        sorted:   input.sorted
    };

    for (const component of input.unsorted) {
        if (depsResolved(component, input.sorted)) {
            ret.sorted.push(component);
            resolvedOne = true;
        } else {
            ret.unsorted.push(component);
        }
    }


    if (!resolvedOne) {

        debug(TAG, `Dependencies not satisfied. 
        Check the following components for missing or circular dependencies `);

        return ret;
    }


    return sortComponents(ret);

};
