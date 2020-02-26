import {
    IfIocComponent,
    IfIocContainer,
    IfConstructorDependency,
    IfComponentPropDependency, IScopedComponentStorage, IfComponentDetails,

} from '../../';
import { ComponentScope } from '../../enums/componentscope';
import { StringOrSymbol } from '../../definitions/types';

import { IfComponentIdentity } from '../../definitions/component';
import { RESERVED_COMPONENT_NAMES } from '../../consts/reservedcomponentnames';
import { UNNAMED_COMPONENT } from '../../definitions/symbols';
import { stringifyIdentify } from './containerutils';
import {
    initIterator,
    sortComponents,
} from './initializer';



const debug = require('debug')('bind:container');

export const TAG = 'Container';


/**
 * Check that all components have a corresponding component available
 * for all its' dependencies
 *
 * @param IfIocContainer<T>
 */
const checkDependencies = (container: IfIocContainer) => {

    const components = container.components;

    debug(TAG, 'entered checkDependencies');
    components.forEach((component, i, arr) => {

        /**
         * Check constructor dependencies
         */
        component.constructorDependencies.forEach((dep: IfComponentIdentity) => {

            let found;
            try {
                found = container.getComponentDetails(dep);
            } catch (e) {
                throw new ReferenceError(`Component ${stringifyIdentify(component.identity)} has unsatisfied constructor dependency on dependency ${stringifyIdentify(dep)}`);
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new ReferenceError(`Component "${stringifyIdentify(component.identity)}" has a scope ${ComponentScope[component.scope]} but has constructor dependency on component "${String(found.identity.componentName)}" className=${found.identity.className} with a smaller scope "${ComponentScope[found.scope]}"`);
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
                console.error('Container error63', e);

            }

            if (!found) {

                throw new ReferenceError(`Component "${String(component.identity.componentName)} 
                className=${component.identity?.clazz?.name}" has unsatisfied property dependency for propertyName="${String(dep.propertyName)}" 
                dependency="${String(dep.dependency.componentName)}" 
                className=${dep.dependency?.clazz?.name}`);
            }

            if (dep.dependency?.clazz?.name && !RESERVED_COMPONENT_NAMES.includes(dep.dependency?.clazz?.name) && found.identity.className!==dep.dependency?.clazz?.name) {
                throw new ReferenceError(`Component "${String(component.identity.componentName)}" has property dependency "${String(dep.dependency.componentName)}:${dep.dependency?.clazz?.name}" for propertyName="${String(dep.propertyName)}" but dependency component has className="${found.identity.className}"`);
            }

            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                const err = `Component ${stringifyIdentify(component.identity)}
                 has a scope "${ComponentScope[component.scope]}"
                 but has property dependency for
                 propertyName="${String(dep.propertyName)}" on component "${String(found.identity.componentName)} className="${found.identity.className}" with a smaller scope
                "${ComponentScope[found.scope]}"`;
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
 *
 * @todo this is old implementation, uses component names.
 * Should instead use Identify and equals method of Identify class
 */
const checkDependencyLoop = (container: IfIocContainer) => {

    const TAG = 'checkDependencyLoop';
    debug(TAG, 'Entered checkDependencyLoop');

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
    const namedComponents = components.map(_ => {
        return {
            name: _.identity.componentName,
            dependencies: _.constructorDependencies.concat(_.propDependencies.map(pd => pd.dependency)),
            visited: false,
        };
    });

    debug(TAG, `namedComponents: ${JSON.stringify(namedComponents)}`);

    let check = (component, parents: string[] = []) => {

        debug(TAG, `Entered ${TAG}.check with component ${component.name}`);
        if (component.visited) {
            debug(TAG, `Component ${component.name} already visited`);
            return;
        }


        /**
         * @todo should not be checking by name, should instead check by Identity
         */
        if (parents.includes(component.name)) {
            throw new ReferenceError(`Dependency Loop detected for component "${String(component.name)}". Loop: ${parents.join(' -> ')} -> ${String(component.name)}`);
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

    private readonly store_: Array<IfIocComponent>;
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
        if(!Symbol){
            throw new Error('Symbol not defined. Most likely you are using an old version on Node.js')
        }
        if(!Symbol.asyncIterator){
            Reflect.set(Symbol, 'asyncIterator', Symbol.for('Symbol.asyncIterator'))
        }
        //(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator');
        this.store_ = [];
    }

    get components(): Array<IfIocComponent> {
        return Array.from(this.store_); //? was it causing any problems?
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
    getComponentDetails(id: IfComponentIdentity): IfIocComponent {

        let ret;

        debug(TAG, 'Entered Container.getComponentDetails Requesting componentName=', String(id.componentName), ' className=', id?.clazz?.name);

        /**
         * For a named component a match is by name
         * For unnamed component a match is by clazz
         *
         */
        if (id.componentName!==UNNAMED_COMPONENT) {
            ret = this.store_.find(_ => _.identity.componentName===id.componentName);
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
                    (component: IfComponentDetails) => {
                        return component.identity.componentName===UNNAMED_COMPONENT &&
                                component.identity.clazz===id.clazz;
                    });

        }


        if (!ret) {
            throw new ReferenceError(`Container Component Not found by name="${String(id.componentName)}" (className=${id?.clazz?.name})`);
        }

        return ret;
    }

    getComponent(id: IfComponentIdentity, scopedStorage?: Array<IScopedComponentStorage>): any {

        debug(TAG, 'Entered Container.getComponent Requesting component=', String(id.componentName), 'className=', id?.clazz?.name, ' With scopedStorage=', !!scopedStorage);

        return this.getComponentDetails(id)
                .get(this, scopedStorage);
    }


    addComponent(component: IfIocComponent): boolean {

        const name = String(component.identity.componentName);

        debug(TAG, 'Entered Container.addComponent with component name=', name, ' className=', component.identity?.clazz?.name);
        if (this.has(component.identity)) {
            throw new ReferenceError(`Container already has component with name="${name}" className=${component.identity?.clazz?.name}`);
        }

        /**
         * Update default scope
         * Unannotated component will not have any scope set, not even DEFAULT_SCOPE
         * because it Component function was never applied to that component class, so
         * it does not have any metadata at all.
         */
        if (!component.scope) {
            debug(TAG, 'Component className=', component.identity?.clazz?.name, ' componentName=', name, ' Does not have defined scope. Setting default scope=', ComponentScope[this.defaultScope]);
            component.scope = this.defaultScope;
        }

        this.store_.push(component);

        return true;
    }

    async initialize(): Promise<IfIocContainer> {

        const that = this;

        debug(TAG, 'Entered initialize. components=', JSON.stringify(this.components, null, 2));

        checkDependencies(this);

        const { sorted, unsorted } = sortComponents({
            unsorted: this.components,
            sorted: [],
        });

        if (unsorted.length > 0) {
            const error = `
                    Dependency sorting error. Following components have unresolved dependencies.
                    Check dependency loop.
                    ${unsorted.map(_ => stringifyIdentify(_.identity))
                    .join(',')}
                    `;

            debug(TAG, error);

            throw new Error(error);
        }

        debug(TAG, 'sorted=', JSON.stringify(sorted, null, 2));

        /**
         * Now initialize components that have initializer
         */
        const initializable = sorted.filter(_ => _.postConstruct);
        if (initializable.length > 0) {
            debug(TAG, 'HAS initializable components', initializable.length);

            for await(const initialized of initIterator(this, initializable)) {
                debug(TAG, 'Initialized component', initialized);
            }

        } else {
            debug(TAG, 'NO initilizable components');
        }

        return this;

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
