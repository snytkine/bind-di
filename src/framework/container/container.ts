import {
    Try,
    TryCatch,
    Target,
    IfComponentDetails,
    IfIocComponent,
    IfIocContainer,

} from "../../";
import {IfCtorInject} from "../../definitions/container";

const debug = require('debug')('bind:container');

export const TAG = "Container";

/**
 * Check that all components have a correcsponding component available
 * for all its' dependencies
 *
 * @param {Array<IfIocComponent<T>>} components
 */
const checkDependencies = <T>(components: Array<IfIocComponent<T>>) => {
    components.forEach((component, i, arr) => {

        /**
         *
         */
        component.constructorDependencies.forEach( (dep: IfCtorInject) => {
            const found = arr.find(_ => _.identity.componentName === dep.dependency.componentName);
            if(!found) {
                throw new TypeError(`Component ${component.identity.componentName} has unsatisfied constructor dependency ${dep.dependency.componentName}`)
            }

            if(found.identity.className !== dep.dependency.className){
                throw new TypeError(`Component ${component.identity.componentName} has constructor dependency ${dep.dependency.componentName}:${dep.dependency.className} but dependant component has className="${found.identity.className}`)
            }
        })
    })
};


export class Container<T> implements IfIocContainer<T> {

    private readonly store_: Map<string, IfIocComponent<T>>;


    constructor() {
        this.store_ = new Map<string, IfIocComponent<T>>();
    }

    get components(): Array<IfIocComponent<T>> {
        return Array.from(this.store_.values());
    }

    getComponentDetails(name: string): IfIocComponent<T> {
        debug(TAG, "Entered Container.getComponentDetails Requesting component=", name);

        const ret = this.store_.get(name);

        if (!ret) {
            throw new TypeError(`Container Component Not found by name="${name}"`);
        }

        return ret;
    }

    getComponent(name: string, ctx?: T): any {

        debug(TAG, "Entered Container.getComponent Requesting component=", name, " With ctx=", !!ctx);

        return this.getComponentDetails(name).get(ctx);
    }


    addComponent(component: IfIocComponent<T>): boolean {

        const name = component.identity.componentName;

        debug(TAG, "Entered Container.addComponent with component name=", name);
        if (this.store_.has(component.identity.componentName)) {
            throw new TypeError(`Container already has component with name="${name}"`)
        }

        this.store_.set(name, component);

        return true;
    }

    initialize(): Promise<IfIocContainer<T>> {
        return undefined;
    }


    cleanup(): Promise<boolean> {

        const a: Array<Promise<Boolean>> = this.components
            .filter(_ => !!_.preDestroy)
            .map(_ => {
                const obj = _.get();
                const methodName = _.preDestroy;

                return obj[methodName]()
            });

        return Promise.all(a).then(_ => true)
    }


    has(name: string) {
        return this.store_.has(name);
    }

}