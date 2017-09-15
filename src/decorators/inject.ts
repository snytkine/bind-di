import {
    Target,
    DESIGN_TYPE,
    PARAM_TYPES,
    _CTOR_DEPENDENCIES_,
    _PROP_DEPENDENCY_,
    INVALID_COMPONENT_NAMES,
    getComponentName,
    IfComponentPropDependency,
    getClassName,
    Identity,
    defineMetadataUnique,
    IfCtorInject,
    IfComponentIdentity

} from "../"

const debug = require('debug')('bind:decorator:inject');
const TAG = "@Inject";


/**
 * @Inject decorator can be applied to class property or to constructor parameter
 * or to constructor method itself.
 *
 * If applied to constructor method itself then every parameter in constructor will be
 * injected
 */


export function Inject(target: Target): void

export function Inject(target: Target, propertyKey: string, parameterIndex?: number): void

export function Inject(name: string): (target: any, propertyKey?: string, parameterIndex?: number) => void

export function Inject(nameOrTarget: string | Target, propertyKey?: string, parameterIndex?: number) {
    let name: string;
    if (typeof nameOrTarget !== 'string') {
        // unnamed inject

        if (propertyKey) {
            name = nameOrTarget.constructor.name;
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
            if (parameterIndex !== undefined) {
                throw new TypeError(`${TAG} can only be applied to constructor function of class property. Was applied to method ${name}.${propertyKey} index ${parameterIndex}`)
            }

            debug(`${TAG} called on "${name}.${propertyKey}"`);
            const rt = Reflect.getMetadata(DESIGN_TYPE, nameOrTarget, propertyKey); // rt is class Classname{}
            debug(TAG, "rt=", rt);

            /**
             * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
             * and it must be an object that is itself a component
             * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
             * But it may be non an annotated component in case if this component is not a regular class
             * but a component that is produced by a factory, in which case it does not have decorator at all
             *
             */
            let injectName = getComponentName(rt);
            let injectClassName = getClassName(rt);
            debug(`${TAG} DESIGN_TYPE of property "${name}.${propertyKey}" is ${injectName}`);

            if (INVALID_COMPONENT_NAMES.includes(injectName)) {

                throw new TypeError(`Dependency name for property "${name}.${propertyKey}"  is not an allowed name for dependency component: "${injectName}"`)
            }

            /**
             * If return type was not provided (same case when only Interface was provided)
             * then injectName will be 'Object'
             * This is not allowed.
             */
            debug(`Adding ${TAG} metadata for propertyKey="${propertyKey}" dependencyName="${injectName}" for target="${name}"`);
            defineMetadataUnique(_PROP_DEPENDENCY_, Identity(injectName, injectClassName), nameOrTarget, propertyKey);
            /**
             * The actual target object may not have this property defined because typesceipt compiler will not
             * add a property if it does not have a value.
             */
            if(!nameOrTarget.hasOwnProperty(propertyKey)){
                Object.defineProperty(nameOrTarget, propertyKey, {value: void 0});
                debug(`${TAG} added property ${propertyKey} to prototype of ${name}`);
            }
        } else {
            // No propertyKey. In this case must have parameterIndex
            if (parameterIndex !== 0 && !parameterIndex) {
                throw new TypeError(`${TAG} is applied to constructor of ${name} but parameterIndex is not passed`);
            }

            /**
             *
             * Applied to constructor function
             * In this case nameOrTarget is class (has .constructor and .constructor.name)
             * propertyKey is undefined
             * has parameterIndex
             */
            const pt = Reflect.getMetadata(PARAM_TYPES, nameOrTarget); // rt is class Classname{}
            if (!pt[parameterIndex] || !pt[parameterIndex].name) {
                throw new TypeError(`Error adding ${TAG} to "${getComponentName(nameOrTarget)}" Type of parameter for constructor function is not available for parameterIndex ${parameterIndex}`)
            }

            /**
             * pt is array [0 => class Person, 1=> String] objects have .name string has .name == String
             * for undeclared type it will be Object with .name === "Object"
             * can also be "Number" and "Boolean" for primitives like :number or :boolean
             */
            if (INVALID_COMPONENT_NAMES.includes(pt[parameterIndex].name)) {

                throw new TypeError(`Injected parameter at index ${parameterIndex} in constructor function is not an allowed name for constructor injection component: "${pt[parameterIndex].name}"`)
            }


            debug(TAG, "pt=", pt);
            let compName = getComponentName(pt[parameterIndex]);

            debug(TAG, "got component name", compName);
            addConstructorDependency(nameOrTarget, Identity(compName, compName), parameterIndex)
        }


    } else {


        let injectName = nameOrTarget;

        return function (target: Target, propertyKey?: string, parameterIndex?: number) {


            // targetName is name of component
            let targetName = getComponentName(target);

            if (propertyKey) {

                /**
                 * Called on propertyKey of a class
                 * Must have .constructor because the nameOrTarget must be a class in this case
                 * parameterIndex must be undefined
                 * @type {string}
                 *
                 * If applied to class method but NOT to a constructor:
                 * nameOrTarget is an Object (has .constructor and .constructor.name
                 * .propertyKey is the name of method
                 * has parameterIndex
                 */
                if (parameterIndex !== undefined) {

                    throw new TypeError(`${TAG} can only be applied to constructor function of class property. Was applied to method "${targetName}.${propertyKey}" index ${parameterIndex}`)
                }

                debug(`${TAG} called with dependency name="${nameOrTarget}" on "${targetName}.${propertyKey}"`);

                const rt = Reflect.getMetadata(DESIGN_TYPE, target, propertyKey); // rt is class Classname{}
                debug(TAG, "rt=", rt);

                /**
                 * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
                 * and it must be an object that is itself a component
                 * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
                 * But it may be non an annotated component in case if this component is not a regular class
                 * but a component that is produced by a factory, in which case it does not have decorator at all
                 *
                 */
                let className = getClassName(rt);
                debug(`${TAG} className of injected property "${targetName}.${propertyKey}" is "${className}"`);

                /**
                 * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
                 * and it must be an object that is itself a component
                 * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
                 * But it may be non an annotated component in case if this component is not a regular class
                 * but a component that is produced by a factory, in which case it does not have decorator at all
                 *
                 */
                defineMetadataUnique(_PROP_DEPENDENCY_, Identity(injectName, className), target, propertyKey);
                /**
                 * The actual target object may not have this property defined because typesceipt compiler will not
                 * add a property if it does not have a value.
                 */
                if(!target.hasOwnProperty(propertyKey)){
                    Object.defineProperty(target, propertyKey, {value: void 0});
                    debug(`${TAG} added property ${propertyKey} to prototype of ${targetName}`);
                }
            } else {
                // No propertyKey

                if (parameterIndex !== 0 && !parameterIndex) {
                    throw new TypeError(`${TAG} is applied to constructor of "${getComponentName(target)}" but parameterIndex is not passed [ERROR INJECT-129]`);
                }


                const pt = Reflect.getMetadata(PARAM_TYPES, target); // rt is class Classname{}
                if (!pt[parameterIndex] || !pt[parameterIndex].name) {
                    throw new TypeError(`Error adding ${TAG} to "${getComponentName(nameOrTarget)}" Type of parameter for constructor function is not available for parameterIndex ${parameterIndex}`)
                }

                let className = getClassName(pt[parameterIndex]);
                debug(`${TAG} inferred className="${className}" for constructor dependency name "${injectName}" at index "${parameterIndex}"`);

                /**
                 *
                 * Applied to constructor function
                 * In this case nameOrTarget is class (has .constructor and .constructor.name)
                 * propertyKey is undefined
                 * has parameterIndex
                 */
                addConstructorDependency(target, Identity(injectName, className), parameterIndex)
            }
        }
    }
}


export function addConstructorDependency(target: Target, inject: IfComponentIdentity, parameterIndex: number) {
    let deps = Reflect.getMetadata(_CTOR_DEPENDENCIES_, target) || [];
    const name = getComponentName(target);
    debug(`Adding Constructor dependency  "${inject}" for component="${name}". Existing dependencies=${JSON.stringify(deps)}`);

    deps.push({
        parameterIndex,
        inject
    });

    Reflect.defineMetadata(_CTOR_DEPENDENCIES_, deps, target);
    /**
     * Do we need to also add same meta to prototype?
     * Right now I don't see a need for it.
     */

}


export function getConstructorDependencies(target: Target): Array<IfCtorInject> {
    let ret = Reflect.getMetadata(_CTOR_DEPENDENCIES_, target);
    if (ret) {
        debug("Found component _CTOR_DEPENDENCIES_ from metadata: ", ret);
        return ret;
    } else {
        debug(`NOT FOUND constructor dependencies for component ${getComponentName(target)}`);
        return [];
    }
}


export function getPropDependencies(target: Target): Array<IfComponentPropDependency> {

    //let x = Reflect.Metadata.get(target);
    let methods = Object.getOwnPropertyNames(target.prototype);
    const cName = getComponentName(target);
    debug(`${TAG} property names of target "${cName}"`, methods);

    let dependencies = methods.filter(p => Reflect.hasMetadata(_PROP_DEPENDENCY_, target, p)).map(p => {
        return {propertyName: p, dependency: Reflect.getMetadata(_PROP_DEPENDENCY_, target, p)}
    })

    debug(`${TAG} returning prop dependencies for "${cName}"=`, dependencies);

    return dependencies
}
