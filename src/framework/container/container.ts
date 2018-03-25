import {
    IfIocComponent,
    IfIocContainer,
    IfCtorInject,
    IfComponentPropDependency,
    IocComponentScope

} from "../../";
import {StringOrSymbol} from "../../definitions/types";
import {IfComponentIdentity} from "../../definitions/component";
import {INVALID_COMPONENT_NAMES} from "../../metadata/index";
import {_UNNAMED_COMPONENT_} from "../../definitions/symbols";


const debug = require("debug")("bind:container");

export const TAG = "Container";


/**
 * Check that all components have a corresponding component available
 * for all its' dependencies
 *
 * @param IfIocContainer<T>
 */
const checkDependencies = <T>(container: IfIocContainer<T>) => {

    const components = container.components;

    debug(TAG, "entered checkDependencies");
    components.forEach((component, i, arr) => {

        /**
         * Check constructor dependencies
         */
        component.constructorDependencies.forEach((dep: IfComponentIdentity) => {

            let found;
            try {
                found = container.getComponentDetails(dep);
            } catch (e) {
                throw new ReferenceError(`Component componentName=${String(component.identity.componentName)} className=${component.identity.className} has unsatisfied constructor dependency on componentName="${String(dep.componentName)}" className=${dep.className}`);
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new ReferenceError(`Component componentName="${String(component.identity.componentName)}" className=${component.identity.className} has a scope ${IocComponentScope[component.scope]} but has constructor dependency on component "${String(found.identity.componentName)}" className=${found.identity.className} with a smaller scope "${IocComponentScope[found.scope]}"`);
            }
        });


        /**
         * Check property dependencies
         */
        component.propDependencies.forEach((dep: IfComponentPropDependency) => {
            let found;
            try {
                found = container.getComponentDetails(dep.dependency);
            } catch (e) {
                console.error("Container error63", e)

            }

            if (!found) {

                throw new ReferenceError(`Component "${String(component.identity.componentName)} className=${component.identity.className}" has unsatisfied property dependency for propertyName="${dep.propertyName}" dependency="${String(dep.dependency.componentName)}" className=${dep.dependency.className}`);
            }

            if (dep.dependency.className && !INVALID_COMPONENT_NAMES.includes(dep.dependency.className) && found.identity.className !== dep.dependency.className) {
                throw new ReferenceError(`Component "${String(component.identity.componentName)}" has property dependency "${String(dep.dependency.componentName)}:${dep.dependency.className}" for propertyName="${dep.propertyName}" but dependency component has className="${found.identity.className}"`);
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                const err = `Component componentName="${String(component.identity.componentName)}" className=${component.identity.className} 
                 has a scope "${IocComponentScope[component.scope]}"
                 but has property dependency for
                 propertyName="${dep.propertyName}" on component "${String(found.identity.componentName)} className="${found.identity.className}" with a smaller scope
                "${IocComponentScope[found.scope]}"`;
                throw new ReferenceError(err);
            }
        });

    });
};


/**
 * Check that component does not have a chain of dependencies that loop back to self
 * An example of a loop: A depends on B, B depends on C, C depends on A
 * This type of loop cannot be allowed
 *
 * @param {Array<IfIocComponent<T>>} components
 */
const checkDependencyLoop = <T>(container: IfIocContainer<T>) => {

    const TAG = "checkDependencyLoop";
    debug(TAG, "Entered checkDependencyLoop");

    let components: Array<IfIocComponent<T>> = container.components;


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
            name:         _.identity.componentName,
            dependencies: _.constructorDependencies.concat(_.propDependencies.map(pd => pd.dependency)),
            visited:      false
        };
    });

    debug(TAG, `namedComponents: ${JSON.stringify(namedComponents)}`);

    let check = (component, parents: string[] = []) => {

        debug(TAG, `Entered ${TAG}.check with component ${component.name}`);
        if (component.visited) {
            debug(TAG, `Component ${component.name} already visited`);
            return;
        }

        if (parents.includes(component.name)) {
            throw new ReferenceError(`Dependency Loop detected for component "${component.name}". Loop: ${parents.join(" -> ")} -> ${component.name}`);
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
        check(nc);
    }

};


export class Container<T> implements IfIocContainer<T> {

    private readonly store_: Array<IfIocComponent<T>>;
    /**
     * @todo this will be configurable by passing options to constructor
     * @type {IocComponentScope}
     */
    public readonly defaultScope: IocComponentScope = IocComponentScope.SINGLETON;


    constructor() {
        this.store_ = [];
    }

    get components(): Array<IfIocComponent<T>> {
        return Array.from(this.store_);
    }


    /**
     * 2 named components can have same clazz and className
     * example: 2 different mongo Collection instances will both have same className and class
     * or 2 or more instances of same object produced by component factory always have same className and class
     *
     * If looking for unnamed component we can allow finding a named one
     * only if named component is the only one with same class
     *
     * @param {IfComponentIdentity} id
     * @returns {IfIocComponent<T>}
     */
    getComponentDetails(id: IfComponentIdentity): IfIocComponent<T> {

        let ret;

        debug(TAG, "Entered Container.getComponentDetails Requesting componentName=", String(id.componentName), " className=", id.className);

        /**
         * For a named component a match is by name
         * For unnamed component a match is by clazz
         */
        if (id.componentName !== _UNNAMED_COMPONENT_) {
            ret = this.store_.find(_ => _.identity.componentName === id.componentName);
            /**
             * className check?
             * if id contains className and it's not generic Object then
             * compare className. Also provided component can in theory be a generic Object
             * which will be the case if component factory does not define a type on
             * component getter return.
             *
             * A special case may be when a component constructor returns an instance
             * of totally different object for example MyLogger component has a constructor
             * that returns instance of Winston's LoggerInstance
             * In this case provided component's className will be MyLogger but it will actually
             * be providing a LoggerInstance and another component may be injecting a LoggerInstance type
             * in case like this one there will be a mismatch of className but only because
             * developer made these decisions. If we force validation of className for named components
             * then this scenario will result in Exception.
             *
             * @todo consider validating className for named components.
             * @todo consider also validating clazz of named components.
             */
        } else {
            /**
             * Request for unnamed component
             * Currently Named components must be injected only as named injections.
             * and unnamed injection will find only unnamed components
             *
             * @todo consider allowing unnamed injection if actual
             * component is named.
             */
            ret = this.store_.find(
                _ => _.identity.componentName === _UNNAMED_COMPONENT_ && _.identity.clazz === id.clazz);

        }


        if (!ret) {
            throw new ReferenceError(`Container Component Not found by name="${String(id.componentName)}" (className=${id.className})`);
        }

        return ret;
    }

    getComponent(id: IfComponentIdentity, ctx?: T): any {

        debug(TAG, "Entered Container.getComponent Requesting component=", String(id.componentName), "className=", id.className, " With ctx=", !!ctx);

        return this.getComponentDetails(id)
        .get(this, ctx);
    }


    addComponent(component: IfIocComponent<T>): boolean {

        const name = String(component.identity.componentName);

        debug(TAG, "Entered Container.addComponent with component name=", name, " className=", component.identity.className);
        if (this.has(component.identity)) {
            throw new ReferenceError(`Container already has component with name="${name}" className=${component.identity.className}`);
        }

        /**
         * Update default scope
         * Unannotated component will not have any scope set, not even DEFAULT_SCOPE
         * because it Component function was never applied to that component class, so
         * it does not have any metadata at all.
         */
        if (!component.scope) {
            debug(TAG, "Component className=", component.identity.className, " componentName=", name, " Does not have defined scope. Setting default scope=", IocComponentScope[this.defaultScope]);
            component.scope = this.defaultScope;
        }

        this.store_.push(component);

        return true;
    }

    initialize(): Promise<IfIocContainer<T>> {
        const components = this.components;
        checkDependencies(this);
        //checkDependencyLoop(this);

        // @todo sort PostConstruct components in correct order and initialize them
        return Promise.resolve(this);
    }


    cleanup(): Promise<boolean> {

        const a: Array<Promise<Boolean>> = this.components
        .filter(_ => !!_.preDestroy)
        .map(_ => {
            const obj = _.get(this);
            const methodName = _.preDestroy;

            return obj[methodName]();
        });

        return Promise.all(a)
        .then(_ => true);
    }


    has(id: IfComponentIdentity): boolean {
        try {
            return !!this.getComponentDetails(id);
        } catch (e) {
            return false;
        }
    }

}
