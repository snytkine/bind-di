import {
    Target,
    PARAM_TYPES,
    _CTOR_DEPENDENCIES_,
    _PROP_DEPENDENCY_,
    getComponentName,
    IfComponentPropDependency,
    getClassName,
    defineMetadata,
    IfCtorInject,
    IfComponentIdentity, stringifyIdentify,

} from '../';
import { getComponentMeta } from '../framework/container/getcomponentmeta';
import { INVALID_COMPONENT_NAMES } from '../consts/invalidcomponentnames';
import { DESIGN_TYPE } from '../definitions/consts';
import { getComponentIdentity } from '../metadata/index';
import { Identity } from '../framework/lib/identity';


const debug = require('debug')('bind:decorator:inject');
const TAG = '@Inject';


/**
 * Named inject: has unique component name
 * In this case may omit the type, and then the target will be 'object'
 * So for named inject we need to check the className of injected type.... but cannot
 * rely on them for anything.
 * Better to not use componentName and clazz at all for named injects.
 *
 */


/**
 * @Inject decorator can be applied to class property or to constructor parameter
 *
 */

/**
 * @Inject can be applied to class
 * in which case should add constructor dependencies
 * for all constructor args but only
 * if all args are components. Cannot have some constructor
 * args as non-components like string, number, etc
 * Cannot have optional components like arg1?: Something
 * and cannot have arguments with default values like arg2 = 'Something Default'
 * @param target
 * @constructor
 */
export function Inject(target: Target): void

export function Inject(target: Target, propertyKey: string, parameterIndex?: number): void

export function Inject<T>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<T>): void
/**
 * Named Inject
 * @param {string} name
 * @returns {(target: Target, propertyKey?: string, parameterIndex?: number) => void}
 * @constructor
 */
export function Inject<T>(name: string): (target: Target, propertyKey?: string,
                                          parameterIndex?: number | TypedPropertyDescriptor<T>) => void

/**
 * Implementation
 * @param nameOrTarget
 * @param propertyKey
 * @param parameterIndex
 * @constructor
 */
export function Inject(nameOrTarget: string | Target, propertyKey?: string,
                       parameterIndex?: number | TypedPropertyDescriptor<any>) {
    let name: string;
    let rt;
    console.log('ENTERED INJECT');
    debugger;
    if (typeof nameOrTarget!=='string') {
        /**
         * Unnamed @Inject
         * can be applied to
         * 1) Constructor function
         * 2) Property
         * 3) Setter
         *
         * In case of unnamed inject the class must be a valid class
         * cannot be of type any, in which case after it compiles
         * it will translate to generic "Object"
         */

        if (propertyKey) {
            name = nameOrTarget.constructor.name;

            rt = Reflect.getMetadata(DESIGN_TYPE, nameOrTarget);
            console.log('INJECT-92', name);
            console.dir(rt);
            debugger;
            /**
             * Called on propertyKey of a class
             * Must have .constructor because the nameOrTarget must be a class in this case
             * parameterIndex must be undefined
             * @type {string}
             *
             * If applied to class method but NOT to a constructor:
             * nameOrTarget is an Object (has .constructor and .constructor.name
             * .propertyKey is the name of method or property
             * has parameterIndex if applied to method parameter
             *
             * Should not have both propertyKey and parameterIndex because that would mean
             * that @Inject is added to parameter of some class method but not to constructor function
             */
            /**
             * @todo allow injecting parameter to function
             * this way can inject dependency to controller function.
             */
            if (typeof parameterIndex==='number') {
                throw new TypeError(`${TAG} can only be applied to constructor function of class property. Was applied to method ${name}.${propertyKey} index ${parameterIndex}`);
            }

            /**
             * If parameterIndex is a propertyDescriptor
             */
            if (typeof parameterIndex==='object') {
                debug(TAG, 'called for setter for component=', name, ' propertyKey=', propertyKey);
            } else {
                debug(`${TAG} called on "${name}.${propertyKey}"`);
            }

            rt = Reflect.getMetadata(DESIGN_TYPE, nameOrTarget, propertyKey); // rt is class Classname{}
            debug(TAG, '[70] rt=', rt);

            if (!rt) {
                throw new TypeError(`Could not determine the dependency name for injected component "${name}.${propertyKey}". Consider using named dependency using @Inject("some_name") instead of just @Inject`);
            }

            /**
             * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
             * and it must be an object that is itself a component
             *
             * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
             * But it may be non an annotated component in case if this component is not a regular class
             * but a component that is produced by a factory, in which case it does not have decorator at all
             *
             */
            let injectIdentity = getComponentIdentity(rt);
            let injectName = injectIdentity.componentName;
            let injectClassName = injectIdentity?.clazz?.name;

            debug(`${TAG} DESIGN_TYPE of property "${name}.${propertyKey}" is ${String(injectName)} className=${injectClassName}`);

            if (INVALID_COMPONENT_NAMES.includes(injectClassName)) {

                throw new TypeError(`Dependency name for property "${name}.${propertyKey}"  is not an allowed name for dependency component: "${String(injectName)}"`);
            }

            /**
             * If return type was not provided (same case when only Interface was provided)
             * then injectName will be 'Object'
             * This is not allowed.
             */
            debug(`Adding ${TAG} metadata for propertyKey="${propertyKey}" dependencyName="${String(injectName)}" for target="${String(name)}"`);


            /**
             * The actual target object may not have this property defined
             * because typescript compiler will not
             * add a property if it does not have a value.
             *
             * @todo whould we define property on .prototype or on .constructor instead of nameOrTarget?
             */
            if (!nameOrTarget.hasOwnProperty(propertyKey)) {
                debug(`${TAG} - defining property "${propertyKey}" for Injection on target="${name}"`);
                Object.defineProperty(nameOrTarget, propertyKey, {
                    value: void 0,
                    writable: true,
                    enumerable: true,
                });
                /**
                 * @todo check maybe need to add some default value to the property in
                 * order for property to be created?
                 */
                debug(`${TAG} added property ${propertyKey} to prototype of ${name}`);
            }

            defineMetadata(_PROP_DEPENDENCY_, injectIdentity, nameOrTarget, propertyKey)();

        } else {

            /**
             * No propertyKey.
             * @Inject applied to whole class OR to constructor parameter
             * Must extract parameterIndex for all constructor arts.
             *
             * In this case must have parameterIndex
             *
             * Check that parameterIndex is passed and IS a number
             * because it can also be propertyDescriptor
             */
            if (typeof parameterIndex==='number') {

                const ptypes = Reflect.getMetadata(PARAM_TYPES, nameOrTarget);
                /**
                 * Applied to constructor method parameter
                 * ptypes = [class Settings] or in case of 2 injections it will be array of 2 classes!
                 * nameOrTarget: class Logger
                 * propertyKey: undefined
                 * parameterIndex: 0
                 */
                //debugger;
                console.log('INJECT-92');
                /**
                 * @todo the whole if... block is for debugging.
                 * Delete it when done
                 */
                if (ptypes && Array.isArray(ptypes)) {
                    for (const p in ptypes) {
                        /**
                         * array members are objects (classes)
                         * that themselves are components
                         */
                        console.log(ptypes[p].name);
                        try {
                            const meta = getComponentMeta(ptypes[p]);
                            console.log('~~~~~~~~~~~~~~~~~');
                            console.dir(meta);
                        } catch (e) {
                            console.error('@@@@@@');
                        }

                    }
                }

                if (Array.isArray(ptypes) && ptypes.length > 0) {
                    if (ptypes[parameterIndex]) {
                        const meta = getComponentMeta(ptypes[parameterIndex]);
                        addConstructorDependency(nameOrTarget, meta.identity, parameterIndex);
                    } else {
                        throw new Error(`${TAG} array "ptypes" does not have index ${parameterIndex} target=""`);
                    }
                }

            } else {

                /**
                 * parameterIndex is a TypedPropertyDescriptor
                 * probably the case when @Inject is applied to a class method.
                 * This is not allowed
                 */
                const ex2 = `${TAG} is applied to unnamed constructor of ${getClassName(nameOrTarget)} but parameterIndex is not passed or not a number`;
                //throw new TypeError(ex2);
            }


            /**
             * @todo
             * Cover one more case where @Inject applied to class
             * in this case will not have parameterIndex at all
             * but will have Reflect.getMetadata(PARAM_TYPES, nameOrTarget);
             * Then must call addContructorDependency for each dependency
             * also the class may already have constructor dependencies defined
             * in case the @Inject was already applied to individual constructor arguments
             * but these arguments will be the same anyway, so it's safe to add constructo dependencies
             * again here.
             */

            /**
             *
             * Applied to constructor function
             * In this case nameOrTarget is class (has .constructor and .constructor.name)
             * propertyKey is undefined
             * has parameterIndex but 0 is valid parameterIndex
             */
            const pt = Reflect.getMetadata(PARAM_TYPES, nameOrTarget);
            /*if (!pt[parameterIndex] || !pt[parameterIndex].name) {
             throw new TypeError(`Error adding ${TAG} to "${getClassName(nameOrTarget)}" Type of parameter for constructor function is not available for parameterIndex ${parameterIndex}`);
             }*/

            debug(TAG, '[INJECT-161]=', pt);

            /**
             * pt is array [0 => class Person, 1=> String] objects have .name string has .name == String
             * for undeclared type it will be Object with .name === "Object"
             * can also be "Number" and "Boolean" for primitives like :number or :boolean
             */
            /* if (INVALID_COMPONENT_NAMES.includes(pt[parameterIndex].name)) {

             throw new TypeError(`Injected parameter "${pt[parameterIndex].name}" at index ${parameterIndex} in constructor of "${getClassName(nameOrTarget)}"  is not an allowed name for constructor injection component`);
             }

             let compIdentity = getComponentIdentity({ target: pt[parameterIndex] });
             let compName = compIdentity.componentName;
             let className = compIdentity.className;*/

            //debug(TAG, 'got component name', String(compName), ' className=', className);
            //addConstructorDependency(nameOrTarget, compIdentity, parameterIndex);
        }


    } else {

        /**
         * Named @Inject
         *
         */
        let injectName = nameOrTarget;

        return function (target: Target, propertyKey?: string, parameterIndex?: number | TypedPropertyDescriptor<any>) {


            // targetName is name of component
            let targetName = getComponentName(target);

            if (propertyKey) {

                /**
                 * Called on propertyKey of a class OR on property setter of a class
                 * Must have .constructor because the target must be a class in this case
                 * parameterIndex must NOT be a number (can be a property descriptor object in case of property setter)
                 *
                 */
                if (typeof parameterIndex==='number') {
                    throw new TypeError(`${TAG} can only be applied to constructor function or a class property. Was applied to method "${String(targetName)}.${propertyKey}" index ${parameterIndex}`);
                } else if (typeof parameterIndex==='object') {
                    debug(`${TAG} called with dependency name="${nameOrTarget}" on setter for "${String(targetName)}.${propertyKey}"`);
                } else {
                    debug(`${TAG} called with dependency name="${nameOrTarget}" on "${String(targetName)}.${propertyKey}"`);
                }


                const rt = Reflect.getMetadata(DESIGN_TYPE, target, propertyKey); // rt is class Classname{}
                debug(TAG, 'rt=', rt);
                if (!rt) {
                    debug(TAG, `Failed to get return type of propertyKey="${propertyKey}" of target="${String(targetName)}"`);
                }

                /**
                 * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
                 * and it must be an object that is itself a component
                 * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
                 * But it may be non an annotated component in case if this component is not a regular class
                 * but a component that is produced by a factory, in which case it does not have decorator at all
                 *
                 */
                let injectIdentity = getComponentIdentity(rt);
                let injectClassName = injectIdentity?.clazz?.name;

                debug(`${TAG} injected property "${String(targetName)}.${propertyKey}" injectName="${injectName}"  injectClassName="${injectClassName}"`);

                /**
                 * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
                 * and it must be an object that is itself a component
                 * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
                 * But it may be non an annotated component in case if this component is not a regular class
                 * but a component that is produced by a factory, in which case it does not have decorator at all
                 *
                 */
                defineMetadata(_PROP_DEPENDENCY_, Identity(injectName, rt), target, propertyKey)();

                /**
                 * The actual target object may not have this property defined because typescript compiler will not
                 * add a property if it does not have a value.
                 * So we must add property to prototype manually, setting the undefined as a value
                 *
                 * Check !parameterIndex because in case of @Inject annotated setter
                 * the compiler will add property.
                 *
                 * MUST must make this property writable explicitly otherwise the default readonly type is used
                 * and then injector will not be able to set the injected value
                 *
                 * Important - must pass writable:true otherwise will not be able to set injected value at
                 * the time of injection
                 */
                if (!parameterIndex && !target.hasOwnProperty(propertyKey)) {
                    debug(`${TAG} - defining property "${propertyKey}" for Injection of "${injectName}" on target="${name}"`);
                    Object.defineProperty(target, propertyKey, {
                        value: undefined,
                        writable: true,
                    });
                    debug(`${TAG} added property ${propertyKey} to prototype of ${String(targetName)}`);
                }
            } else {
                // No propertyKey. So must be constructor argument for named inject

                /*if (typeof parameterIndex!=='number') {
                 throw new TypeError(`${TAG} is applied to constructor of "${String(getComponentName(target))}" but parameterIndex is not passed or not a number [ERROR INJECT-129]`);
                 }*/

                const pt = Reflect.getMetadata(PARAM_TYPES, target);
                debug(TAG, 'pt=', pt);
                /*if (!pt[parameterIndex] || !pt[parameterIndex].name) {
                 throw new TypeError(`Error adding ${TAG} to "${String(getComponentName(nameOrTarget))}" Type of parameter for constructor function is not available for parameterIndex ${parameterIndex}`);
                 }*/

                // let className = getClassName(pt[parameterIndex]);
                //debug(`${TAG} inferred className="${className}" for constructor dependency name "${injectName}" at index "${parameterIndex}"`);

                /**
                 *
                 * Applied to constructor function
                 * In this case nameOrTarget is class (has .constructor and .constructor.name)
                 * propertyKey is undefined
                 * has parameterIndex
                 */
                /* addConstructorDependency(target, new Identity({
                 componentName: injectName,
                 clazz: pt[parameterIndex],
                 className,
                 }), parameterIndex);*/
            }
        };
    }
}

/**
 * @todo deal with inheritance. If parent already has ctor dependencies
 * a child can have co-variant types for same dependencies
 *
 * @param {Target} target
 * @param {IfComponentIdentity} dependency
 * @param {number} parameterIndex
 */
export function addConstructorDependency(target: Target, dependency: IfComponentIdentity, parameterIndex: number) {
    let deps = <Array<IfCtorInject>>Reflect.getMetadata(_CTOR_DEPENDENCIES_, target) || [];
    const name = String(getComponentName(target));
    debug('Adding Constructor dependency at index=', parameterIndex, ' dependency=', dependency, ` for component="${name}". className="${getClassName(target)}" Existing dependencies=${JSON.stringify(deps)}`);

    /**
     * In case of inheritance deps array may already have dependency at the same index
     * in which case need to replace element at index in deps array
     * just check if deps[parameterIndex] then replace value, else push as before.
     * Typescript compiler will allow to use only co-variant types in child constructor
     */
    let existingDepIndex: number = deps.findIndex(dep => dep.parameterIndex===parameterIndex);

    if (existingDepIndex > -1) {
        debug('%s constructor dependencies for "%s" already has dependency at index="%d"', TAG, name, existingDepIndex );
        deps.splice(existingDepIndex, 1, {
            parameterIndex,
            dependency,
        });
        debug('%s Updated deps after splice="%o"', TAG, deps);
    } else {
        deps.push({
            parameterIndex,
            dependency,
        });
    }

    Reflect.defineMetadata(_CTOR_DEPENDENCIES_, deps, target);

}


export function getConstructorDependencies(target: Target): Array<IfComponentIdentity> {

    let ret: Array<IfCtorInject> = Reflect.getMetadata(_CTOR_DEPENDENCIES_, target);
    if (ret) {
        debug('%s Found component _CTOR_DEPENDENCIES_ for componentName="%s" className="" deps="%o"', TAG, String(getComponentName(target)), getClassName(target), ret);
        let sorted = [];
        /**
         * Need to perform a check to make sure that
         * there are no gaps in dependencies.
         * ret is an array like this:
         * [ { parameterIndex: 1,
         *  inject: { componentName: 'Person', className: 'Person' } },
         *{ parameterIndex: 0,
         * inject: { componentName: 'LOL', className: 'MyComponent' } } ]
         *
         * Need to turn it into  array of ordered dependency components
         */
        for (let i = 0; i < ret.length; i += 1) {
            sorted.push(ret.find(_ => _.parameterIndex===i));
            if (!sorted[i]) {
                throw new TypeError(`Constructor is missing @Inject decorator for parameter ${i} for component ${target.name}`);
            }
        }

        sorted = sorted.map(_ => _.dependency);

        debug('%s Returning _CTOR_DEPENDENCIES_ for componentName="%s" className="%s" sorted="%o"', TAG, String(getComponentName(target)), getClassName(target), sorted);

        return sorted;
    } else {
        debug('%s NOT FOUND constructor dependencies for component="%s"', TAG, String(getComponentName(target)));
        return [];
    }
}


export function getPropDependencies(target: Target): Array<IfComponentPropDependency> {
    const cName = String(getComponentName(target));

    debug('Entered getPropDependencies for target=', cName);

    /**
     * getOwnPropertyNames is a problem when components extends another component
     * in which case parent's dependencies will be missing!
     *
     * @type {string[]}
     */
    let dependencies = [];
    //let methods = Object.getOwnPropertyNames(target.prototype);//.filter(_ => _ !== 'constructor');

    //debug(`${TAG} property names of target "${String(cName)}"`, methods);

    //let dependencies = methods.filter(p => Reflect.hasMetadata(_PROP_DEPENDENCY_, target, p)).map(p => {
    //    return {propertyName: p, dependency: Reflect.getMetadata(_PROP_DEPENDENCY_, target, p)}
    //})

    /**
     * Child class may have dependency-injected property defined parent class
     * but redefined in child class
     *
     * Expected behavior: consider property to be an auto-wired dependency
     * if it's annotated with @Inject in a parent class but if it's redefined
     * in child class with a different dependency then use dependency from child class
     * if child class redefined the property with no @Inject then the property should not
     * be considered a dependency
     */
    for (const p in target.prototype) {


        debug(`Checking for prop dependency. prop ${cName}.${p} `);


        /**
         * First check if class has own property p
         */
        if (Reflect.hasMetadata(_PROP_DEPENDENCY_, target.prototype, p)) {
            debug(`Prop ${String(cName)}.${p} has dependency`);
            /**
             * dependency may already exist for the same property key if it was
             * defined on the parent class.
             *
             */
            dependencies.push({
                propertyName: p,
                dependency: Reflect.getMetadata(_PROP_DEPENDENCY_, target.prototype, p),
            });
        }
    }

    debug(`${TAG} returning prop dependencies for "${String(cName)}"=`, dependencies);

    return dependencies;
}
