import {
    IfIocComponent,
    IfIocContainer,
    IfCtorInject,
    IfComponentPropDependency,
    IocComponentScope

} from "../../";
import {StringOrSymbol} from "../../definitions/types";


const debug = require('debug')('bind:container');

export const TAG = "Container";


/**
 * Check that all components have a correcsponding component available
 * for all its' dependencies
 *
 * @param {Array<IfIocComponent<T>>} components
 */
const checkDependencies = <T>(components: Array<IfIocComponent<T>>) => {

    debug(TAG, "entered checkDependencies");
    components.forEach((component, i, arr) => {

        /**
         * Check constructor dependencies
         */
        component.constructorDependencies.forEach((dep: IfCtorInject) => {
            const found = arr.find(_ => _.identity.componentName === dep.dependency.componentName);
            if (!found) {
                throw new ReferenceError(`Component ${component.identity.componentName} has unsatisfied constructor dependency "${dep.dependency.componentName}"`)
            }

            if (dep.dependency.className && found.identity.className !== dep.dependency.className) {
                throw new ReferenceError(`Component ${component.identity.componentName} has constructor dependency "${dep.dependency.componentName}:${dep.dependency.className}" but dependency component has className="${found.identity.className}"`)
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new ReferenceError(`Component "${component.identity.componentName}" has a scope ${IocComponentScope[component.scope]} but has constructor dependency on component "${found.identity.componentName}" with a smaller scope "${IocComponentScope[found.scope]}"`)
            }
        });


        /**
         * Check property dependencies
         */
        component.propDependencies.forEach((dep: IfComponentPropDependency) => {
            const found = arr.find(_ => _.identity.componentName === dep.dependency.componentName);
            if (!found) {
                throw new ReferenceError(`Component "${component.identity.componentName}" has unsatisfied property dependency for propertyName="${dep.propertyName}" dependency="${dep.dependency.componentName}"`)
            }

            if (dep.dependency.className && found.identity.className !== dep.dependency.className) {
                throw new ReferenceError(`Component "${component.identity.componentName}" has property dependency "${dep.dependency.componentName}:${dep.dependency.className}" for propertyName="${dep.propertyName}" but dependency component has className="${found.identity.className}"`)
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new ReferenceError(`Component "${component.identity.componentName}" has a scope "${IocComponentScope[component.scope]}" but has property dependency for propertyName="${dep.propertyName}" on component "${found.identity.componentName}" with a smaller scope "${IocComponentScope[found.scope]}"`)
            }
        });

    })
};


/**
 * Check that component does not have a chain of dependencies that loop back to self
 * An example of a loop: A depends on B, B depends on C, C depends on A
 * This type of loop cannot be allowed
 *
 * @param {Array<IfIocComponent<T>>} components
 */
const checkDependencyLoop = <T>(components: Array<IfIocComponent<T>>) => {

    const TAG = 'checkDependencyLoop';
    debug(TAG, "Entered checkDependencyLoop");


    /**
     * First, convert array of components into an array of simple
     * objects {id:componentName, dependencies: string[], visited: boolean}
     * dependencies will be an array of component names (strings) of all constructor
     * dependencies and property dependencies
     * The 'visited' flag is set when a child component has been checked.
     * This will reduce number of passes
     * because otherwise in a complex dependencies graph multiple components have dependencies on same components
     * and once we already check a child component on one pass we don't have to check it if we arrived to same
     * component via different path
     *
     * @type {{name: string; dependencies: string[], visited: boolean}[]}
     */
    const namedComponents = components.map(_ => {
        return {
            name: _.identity.componentName,
            dependencies: _.constructorDependencies.map(cd => cd.dependency.componentName).concat(_.propDependencies.map(pd => pd.dependency.componentName)),
            visited: false
        }
    });

    debug(TAG, `namedComponents: ${JSON.stringify(namedComponents)}`);

    let check = (component, parents: string[] = []) => {

        debug(TAG, `Entered ${TAG}.check with component ${component.name}`);
        if (component.visited) {
            debug(TAG, `Component ${component.name} already visited`);
            return;
        }

        if (parents.includes(component.name)) {
            throw new ReferenceError(`Dependency Loop detected for component "${component.name}". Loop: ${parents.join(' -> ')} -> ${component.name}`);
        }

        /**
         * For every child component name:
         * generate an array of child components
         * then run each child component through check (recurse to this function), but append
         * the name of 'this' component to array of parents.
         * After every child component check is done set the visited = true on that child
         * When this function is run recursively with a child component it is possible that
         * that component will have own child components and recursion repeats for each or child's children, and so on,
         * until the component with no children is found, at which point the recursion will
         * start to unwind.
         */
        component.dependencies
            .map(cname => namedComponents.find(_ => _.name === cname))
            .reduce((parents, child) => {
                check(child, parents);
                child.visited = true;

                return parents;

            }, parents.concat(component.name));

    };


    for (const nc of namedComponents) {
        check(nc)
    }

};


export class Container<T> implements IfIocContainer<T> {

    private readonly store_: Map<StringOrSymbol, IfIocComponent<T>>;


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
            throw new ReferenceError(`Container Component Not found by name="${name}"`);
        }

        return ret;
    }

    getComponent(name: string, ctx?: T): any {

        debug(TAG, "Entered Container.getComponent Requesting component=", name, " With ctx=", !!ctx);

        return this.getComponentDetails(name).get(this, ctx);
    }


    addComponent(component: IfIocComponent<T>): boolean {

        const name = component.identity.componentName;

        debug(TAG, "Entered Container.addComponent with component name=", name);
        if (this.store_.has(component.identity.componentName)) {
            throw new ReferenceError(`Container already has component with name="${name}"`)
        }

        this.store_.set(name, component);

        return true;
    }

    initialize(): Promise<IfIocContainer<T>> {
        const components = this.components;
        checkDependencies(components);
        checkDependencyLoop(components);

        // @todo sort PostConstruct components in correct order and initialize them
        return Promise.resolve(this);
    }


    cleanup(): Promise<boolean> {

        const a: Array<Promise<Boolean>> = this.components
            .filter(_ => !!_.preDestroy)
            .map(_ => {
                const obj = _.get(this);
                const methodName = _.preDestroy;

                return obj[methodName]()
            });

        return Promise.all(a).then(_ => true)
    }


    has(name: string) {
        return this.store_.has(name);
    }

}
