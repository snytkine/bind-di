import {
    IfComponentIdentity,
    IfIocComponent,
    IfIocContainer,
    IfComponentPropDependency,
    IScopedComponentStorage,
    IfComponentDetails,

} from '../../definitions';
import { ComponentScope } from '../../enums';
import {
    RESERVED_COMPONENT_NAMES,
} from '../../consts';

import { stringifyIdentify } from './containerutils';
import {
    initIterator,
    sortComponents,
} from './initializer';
import { FrameworkError } from '../../exceptions';
import { isSameIdentity } from '../../metadata';
import { jsonStringify } from '../lib';

const debug = require('debug')('bind:container');

const TAG = 'Container';


/**
 * Check that all components have a corresponding component available
 * for all its' dependencies
 *
 * @param IfIocContainer<T>
 */
const checkDependencies = (container: IfIocContainer) => {

    const components = container.components;

    debug('%s entered checkDependencies', TAG);
    components.forEach((component, i, arr) => {

        /**
         * Check constructor dependencies
         */
        component.constructorDependencies.forEach((dep: IfComponentIdentity, index) => {

            let found: IfComponentDetails;
            try {
                found = container.getComponentDetails(dep);
            } catch (e) {
                throw new FrameworkError(`Component ${stringifyIdentify(component.identity)} 
                has unsatisfied constructor dependency for argument "${i}" on dependency ${stringifyIdentify(dep)}`, e);
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new FrameworkError(`Component "${stringifyIdentify(component.identity)}" 
                has a scope ${ComponentScope[component.scope]} but has constructor 
                dependency on component "${stringifyIdentify(found.identity)}" 
                with a smaller scope "${ComponentScope[found.scope]}"`);
            }

            /**
             * @todo validate dependency class reference
             */
        });


        /**
         * Check property dependencies
         */
        component.propDependencies.forEach((dep: IfComponentPropDependency) => {
            let found: IfComponentDetails;
            try {
                found = container.getComponentDetails(dep.dependency);
            } catch (e) {
                debug('%s Container error propDependency Exception %o', TAG, e);
            }

            if (!found) {

                throw new FrameworkError(`Component "${String(component.identity.componentName)} 
                className=${component.identity?.clazz?.name}" has unsatisfied property dependency 
                for propertyName="${String(dep.propertyName)}" 
                dependency="${String(dep.dependency.componentName)}" 
                dependency className=${dep.dependency?.clazz?.name}`);
            }

            /**
             * Validate found dependency must match class
             * @todo right now only matching by class name, not by
             * class reference. Should match be done by class reference?
             *
             * @todo use an option in container settings to enable/disable this validation
             */
            if (dep.dependency?.clazz?.name &&
                    found?.identity?.clazz?.name &&
                    !RESERVED_COMPONENT_NAMES.includes(dep.dependency?.clazz?.name) &&
                    found?.identity?.clazz?.name!==dep.dependency?.clazz?.name) {
                throw new FrameworkError(`Component "${String(component.identity.componentName)}" 
                has property dependency "${String(dep.dependency.componentName)}:${dep.dependency?.clazz?.name}" 
                for propertyName="${String(dep.propertyName)}" but dependency component 
                has className="${found?.identity?.clazz?.name}"`);
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                const err = `Component ${stringifyIdentify(component.identity)}
                 has a scope "${ComponentScope[component.scope]}"
                 but has property dependency for
                 propertyName="${String(dep.propertyName)}" on component 
                 "${stringifyIdentify(found.identity)}" with a smaller scope
                "${ComponentScope[found.scope]}"`;
                throw new FrameworkError(err);
            }
        });

    });
};


/**
 * Check that component does not have a chain of dependencies that loop back to self
 * An example of a loop: A depends on B, B depends on C, C depends on A
 * This type of loop cannot be allowed
 *
 *
 * @todo this is old implementation, uses component names.
 * Should instead use Identify and equals method of Identify class
 */
const checkDependencyLoop = (container: IfIocContainer) => {

    const FUNC_NAME = 'checkDependencyLoop';
    debug('%s Entered checkDependencyLoop', FUNC_NAME);

    let components: Array<IfIocComponent> = container.components;


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
    const namedComponents = components.map(component => {
        return {
            name: component.identity.componentName,
            dependencies: component.constructorDependencies.concat(component.propDependencies.map(pd => pd.dependency)),
            visited: false,
        };
    });

    debug('%s namedComponents: %o', TAG, namedComponents);

    let check = (component, parents: string[] = []) => {

        debug('Entered %s.check with component "%s"', FUNC_NAME, component.name);
        if (component.visited) {
            debug('%s Component "%s" already visited', TAG, component.name);
            return;
        }


        /**
         * @todo should not be checking by name, should instead check by Identity
         */
        if (parents.includes(component.name)) {
            throw new FrameworkError(`Dependency Loop detected for component "${String(component.name)}". Loop: ${parents.join(' -> ')} -> ${String(component.name)}`);
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
                .map(cname => namedComponents.find(_ => _.name===cname))
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


export class Container implements IfIocContainer {

    private readonly componentsStore: Array<IfIocComponent>;
    /**
     * @todo this will be configurable by passing options to constructor
     * @type {ComponentScope}
     */
    public readonly defaultScope: ComponentScope = ComponentScope.SINGLETON;


    constructor() {
        /**
         * Polyfill Symbol.asyncIterator
         * @type {any | symbol}
         */
        if (!Symbol) {
            throw new FrameworkError('Symbol not defined. Most likely you are using an old version on Node.js');
        }
        if (!Symbol.asyncIterator) {
            Reflect.set(Symbol, 'asyncIterator', Symbol.for('Symbol.asyncIterator'));
        }
        //(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator');
        this.componentsStore = [];
    }

    get components(): Array<IfIocComponent> {
        return Array.from(this.componentsStore);
    }


    /**
     *
     * @todo consider not throwing exception but instead return something like a Try object
     * where it may have value or Error.
     *
     * 2 named components can have same clazz and className
     * example: 2 different mongo Collection instances will both have same className and class
     * or 2 or more instances of same object produced by component factory always have same className and class
     *
     * If looking for unnamed component we can allow finding a named one
     * only if named component is the only one with same class
     *
     * @param {IfComponentIdentity} id
     * @returns {IfIocComponent<T>}
     * @throws FrameworkError if component is not found by id
     */
    getComponentDetails(id: IfComponentIdentity): IfIocComponent {

        let ret: IfIocComponent;

        debug('%s Entered Container.getComponentDetails Requesting component="%s"',
                TAG,
                stringifyIdentify(id));

        /**
         * For a named component a match is by name
         * For unnamed component a match is by clazz
         * @todo use isSameIdentity instead.
         */

        ret = this.componentsStore.find(
                component => isSameIdentity(id, component.identity),
        );

        if (!ret) {
            throw new FrameworkError(`Container Component Not found by name="${stringifyIdentify(id)}"`);
        }

        return ret;
    }

    getComponent(id: IfComponentIdentity, scopedStorage?: Array<IScopedComponentStorage>): any {

        debug('%s Entered Container.getComponent Requesting component="%s" With scopedStorage="%s"', TAG, stringifyIdentify(id), !!scopedStorage);

        return this.getComponentDetails(id).get(this, scopedStorage);
    }


    addComponent(component: IfIocComponent): boolean {

        const name = String(component.identity.componentName);

        debug('%s Entered Container.addComponent with component="%s"', stringifyIdentify(component.identity));
        if (this.has(component.identity)) {
            throw new FrameworkError(`Container already has component "${stringifyIdentify(component.identity)}"`);
        }

        /**
         * Update default scope
         * Unannotated component will not have any scope set, not even DEFAULT_SCOPE
         * because it Component function was never applied to that component class, so
         * it does not have any metadata at all.
         */
        if (!component.scope) {

            debug('%s Component "%s" Does not have defined scope. Setting default scope="%s"',
                    TAG,
                    stringifyIdentify(component.identity),
                    ComponentScope[this.defaultScope],
            );

            component.scope = this.defaultScope;
        }

        this.componentsStore.push(component);

        return true;
    }

    async initialize(): Promise<IfIocContainer> {

        const that = this;

        debug('%s Entered initialize. components="%s"', TAG, jsonStringify(this.components));

        checkDependencies(this);

        const { sorted, unsorted } = sortComponents<IfIocComponent>({
            unsorted: this.components,
            sorted: [],
        });

        if (unsorted.length > 0) {
            const error = `
                    Dependency sorting error. Following components have unresolved dependencies.
                    Check dependency loop.
                    ${unsorted.map(component => stringifyIdentify(component.identity))
                    .join(',')}
                    `;

            throw new FrameworkError(error);
        }

        debug('%s initialize sorted="%s"', TAG, jsonStringify(sorted));

        /**
         * Now initialize components that have initializer
         */
        const initializable = sorted.filter(component => !!component.postConstruct);
        if (initializable.length > 0) {
            debug('%s has %d initializable components', TAG, initializable.length);

            for await(const initialized of initIterator(this, initializable)) {
                debug('%s Initialized component %s', TAG, initialized);
            }

        } else {
            debug('%s has no initializable components', TAG);
        }

        return this;

    }


    cleanup(): Promise<boolean> {

        const a: Array<Promise<Boolean>> = this.components
                .filter(component => !!component.preDestroy)
                .map(component => {
                    const obj = component.get(this);
                    const methodName = component.preDestroy;

                    return obj[methodName]();
                });

        return Promise.all(a).then(() => true);
    }


    has(id: IfComponentIdentity): boolean {
        try {
            return !!this.getComponentDetails(id);
        } catch (e) {
            return false;
        }
    }

}
