import {
    IfComponentIdentity,
    IfComponentPropDependency,
    IfConstructorDependency,
    StringOrSymbol,
    Target,
} from '../definitions';
import {
    DESIGN_TYPE,
    UNNAMED_COMPONENT,
    RESERVED_COMPONENT_NAMES,
    DependencyType,
    TargetStereoType, PROP_DEPENDENCY, CONSTRUCTOR_DEPENDENCIES, PARAM_TYPES,
} from '../consts';
import {
    defineMetadata,
    getClassName,
    getComponentIdentity,
    getComponentName
} from '../metadata';
import {
    Identity,
    isStringOrSymbol,
    getTargetStereotype
} from '../framework/lib';
import { FrameworkError } from '../exceptions';


const debug = require('debug')('bind:decorate:inject');
const TAG = '@Inject';

export type NumberOrPropertyDescriptor = number | PropertyDescriptor;
export type StringOrTarget = string | Target;

const getInjectionType = (target: Target,
                          propertyKey?: string,
                          parameterIndex?: NumberOrPropertyDescriptor): DependencyType => {


    let ret: DependencyType = DependencyType.UNKNOWN;
    const targetStereoType: TargetStereoType = getTargetStereotype(target);

    if (TargetStereoType.PROTOTYPE===targetStereoType &&
            propertyKey &&
            typeof propertyKey==='string' &&
            parameterIndex===undefined) {

        ret = DependencyType.PROPERTY;

    } else if (TargetStereoType.CONSTRUCTOR===targetStereoType &&
            propertyKey===undefined &&
            typeof parameterIndex==='number'
    ) {

        ret = DependencyType.CONSTRUCTOR_PARAMETER;

    } else if (TargetStereoType.PROTOTYPE===targetStereoType &&
            typeof propertyKey==='string' &&
            typeof parameterIndex==='object' &&
            parameterIndex.set &&
            typeof parameterIndex.set==='function'
    ) {
        ret = DependencyType.SETTER;
    }

    return ret;
};

const applyInjectToProperty = (dependencyName: StringOrSymbol,
                               target: Target,
                               propertyKey: string): void => {

    debug('%s Entered applyInjectToProperty dependencyName="%s" target="%s" propertyKey="%s"', TAG, dependencyName, String(getComponentName(target)), propertyKey);
    const name = String(getComponentName(target));
    const rt = Reflect.getMetadata(DESIGN_TYPE, target, propertyKey);
    debug('%s applyInjectToProperty::rt=%o', TAG, rt);
    let injectName: StringOrSymbol;
    let injectIdentity: IfComponentIdentity;
    let injectClassName: string;

    /**
     * Different logic for named or unnamed dependencies
     *
     * 1. Named dependencies allowed not to have DESIGN_TYPE at all.
     *    also allowed to have generic DESIGN_TYPE
     *
     * 2. UNNAMED dependencies MUST have valid DESIGN_TYPE
     */
    if (dependencyName!==UNNAMED_COMPONENT) {
        injectName = dependencyName;
        injectIdentity = Identity(injectName, target);

    } else {

        if (!rt) {
            throw new FrameworkError(`applyInjectToProperty could not determine the dependency name for injected component propertyKey "${propertyKey}". Consider using named dependency using @Inject("some_name") instead of just @Inject`);
        }

        /**
         * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
         * and it must be an object that is itself a component
         *
         * If its a decorated component then it will have a COMPONENT_IDENTITY metadata
         * But it may be non an annotated component in case if this component is not a regular class
         * but a component that is produced by a factory, in which case it does not have decorator at all
         *
         */
        injectIdentity = getComponentIdentity(rt);
        injectName = injectIdentity.componentName;
        injectClassName = injectIdentity?.clazz?.name;

        debug('%s DESIGN_TYPE of property "%s.%s" is "%s" className="%s"', TAG, name, propertyKey, String(injectName), injectClassName);

        if (!injectClassName) {
            throw new FrameworkError(`${TAG} Failed to get class name 
            of injected component for "${name}.${propertyKey}"
            Consider using named dependency or more specific class type for this component`);
        }

        /**
         * If return type was not provided (same case when only Interface was provided)
         * then injectName will be 'Object'
         * This is not allowed.
         */
        if (RESERVED_COMPONENT_NAMES.includes(injectClassName)) {

            throw new TypeError(`Dependency class ${injectClassName} 
            for property "${name}.${propertyKey}"  is not an allowed as dependency component. 
            Consider using named dependency or more specific class type for this component`);
        }
    }

    debug('Adding %s metadata for propertyKey="%s" dependencyName="%s" for target="%s"', TAG, propertyKey, String(injectName), name);

    /**
     * The actual target object may not have this property defined
     * because typescript compiler will not
     * add a property if it does not have a value.
     */
    if (!target.hasOwnProperty(propertyKey)) {
        debug(`${TAG} - defining property "${propertyKey}" for Injection on target="${name}"`);
        Object.defineProperty(target, propertyKey, {
            value: void 0,
            writable: true,
            enumerable: true,
        });

        debug('%s added property "%s" to prototype of "%s"', TAG, propertyKey, name);
    }

    defineMetadata(PROP_DEPENDENCY, injectIdentity, target, propertyKey)();
};

/**
 * @param dependencyName
 * @param target target will be a Function here - a constructor
 * @param parameterIndex
 */
const applyInjectToConstructorParam = (dependencyName: StringOrSymbol,
                                       target: Target,
                                       paramIndex: NumberOrPropertyDescriptor): void => {

    if (typeof paramIndex!=='number') {
        throw new FrameworkError(`parameterIndex passed to applyInjectToConstructorParam must be a number. dependencyName=${String(dependencyName)}`);
    }

    const ptypes = Reflect.getMetadata(PARAM_TYPES, target);
    let injectIdentity: IfComponentIdentity;

    /**
     * Applied to constructor method parameter
     * ptypes = [class Settings] or in case of 2 injections it will be array of 2 classes!
     * target: class Logger
     * propertyKey: undefined
     * parameterIndex: 0
     */

    /**
     * ptypes is array of constructor parameters with types
     * it must be an array with at least one value otherwite it means
     * that constructor has no arguments which does not make sense because
     * we are processing the @Inject for constructor param here.
     * That would mean that something did not work as expected.
     */

    if (!Array.isArray(ptypes) && ptypes.length < 1) {
        throw new FrameworkError(`Failed to get constructor arguments details for class}`);
    }

    if (!ptypes[paramIndex]) {
        throw new FrameworkError(`${TAG} Cannot add dependency ${String(dependencyName)} 
        because array of constructor arguments types does not have index ${paramIndex} 
        on class ${getClassName(target)}`);
    }

    if (dependencyName===UNNAMED_COMPONENT) {
        /**
         * For unnamed @Inject get identity from ptypes[paramIndex]
         * make sure class type is not reserved type.
         */
        injectIdentity = getComponentIdentity(ptypes[paramIndex]);
        let injectClassName = injectIdentity?.clazz?.name;

        if (!injectClassName) {
            throw new FrameworkError(`${TAG} Failed to get class name 
            of injected component for "${String(target)} constructor at position ${paramIndex}"
            Consider using named dependency or more specific class type for this component`);
        }

        /**
         * If return type was not provided (same case when only Interface was provided)
         * then injectName will be 'Object'
         * This is not allowed.
         */
        if (RESERVED_COMPONENT_NAMES.includes(injectClassName)) {

            throw new TypeError(`Dependency class ${injectClassName} 
            for "${String(target)}"  constructor at position ${paramIndex} 
            is not an allowed as dependency component. 
            Consider using named dependency or more specific class type for this component`);
        }

    } else {
        /**
         * For named dependency just generate identity using dependencyName
         * and ptypes[paramIndex] for clazz
         */
        injectIdentity = Identity(dependencyName, ptypes[paramIndex]);
    }


    return addConstructorDependency(target, injectIdentity, paramIndex);
};


const applyInject = (depName: StringOrSymbol) => (target: Target,
                                                  propertyKey?: string,
                                                  paramIndex?: NumberOrPropertyDescriptor) => {

    const injectionType = getInjectionType(target, propertyKey, paramIndex);

    debug('%s applyInjectDecorator for dependencyName="%s" injectionType=%s',
            TAG,
            depName,
            injectionType);

    switch (injectionType) {

        case DependencyType.CONSTRUCTOR_PARAMETER:
            applyInjectToConstructorParam(depName, target, paramIndex);
            break;

        case DependencyType.SETTER:
            applyInjectToProperty(depName, target, propertyKey);
            break;

        case DependencyType.PROPERTY:
            applyInjectToProperty(depName, target, propertyKey);
            break;

        default:
            throw new FrameworkError(`${TAG} decorator applied in unsupported way 
            in "${getClassName(target)}" component. 
            Can only be applied to constructor parameter, property or property setter.`);

    }

    return undefined;
};


/**
 * @Inject decorator can be applied to class property, setter, or to constructor parameter
 *
 */
export function Inject(target: Target, propertyKey: string, parameterIndex?: number): void

export function Inject(target: Target, propertyKey: string, descriptor: PropertyDescriptor): void

export function Inject(name: StringOrSymbol): (target: Target,
                                               propertyKey?: string,
                                               parameterIndex?: NumberOrPropertyDescriptor) => void

/**
 * Implementation
 * @param nameOrTarget
 * @param propertyKey
 * @param parameterIndex
 * @constructor
 */
export function Inject(nameOrTarget: StringOrTarget,
                       propertyKey?: string,
                       parameterIndex?: NumberOrPropertyDescriptor) {

    debug('%s Entered Inject with', TAG);
    //debugger;
    if (isStringOrSymbol(nameOrTarget)) {
        return applyInject(<StringOrSymbol>nameOrTarget);
    } else {
        applyInject(UNNAMED_COMPONENT)(nameOrTarget, propertyKey, parameterIndex);
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
export const addConstructorDependency = (target: Target,
                                         dependency: IfComponentIdentity,
                                         parameterIndex: number): void => {
    let deps = <Array<IfConstructorDependency>>Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target) || [];
    const name = String(getComponentName(target));
    debug(`%s Adding Constructor dependency at index="%d" dependency="%o"
    for component="%s"
    className="%s"
     Existing dependencies="%o"`,
            TAG,
            parameterIndex,
            dependency,
            name,
            getClassName(target),
            deps,
    );

    /**
     * In case of inheritance deps array may already have dependency at the same index
     * in which case need to replace element at index in deps array
     * just check if deps[parameterIndex] then replace value, else push as before.
     * Typescript compiler will allow to use only co-variant types in child constructor
     */
    let existingDependencyIndex: number = deps.findIndex(dep => dep.parameterIndex===parameterIndex);

    if (existingDependencyIndex > -1) {

        debug('% class "%s" already has constructor dependency for paramIndex %d. Will reassign it',
                TAG,
                getClassName(target),
                parameterIndex,
        );

        delete (deps[existingDependencyIndex]);
    }

    deps.push({
        parameterIndex,
        dependency,
    });

    Reflect.defineMetadata(CONSTRUCTOR_DEPENDENCIES, deps, target);
};

/**
 * Returns array of IfComponentIdentity in sorted order of
 * constructor parameters.
 *
 * @param target
 * @throws if dependency is missing for constructor parameter
 */
export const getConstructorDependencies = (target: Target): Array<IfComponentIdentity> => {

    let ret: Array<IfConstructorDependency> = Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target);
    if (ret) {
        debug('%s Found component CONSTRUCTOR_DEPENDENCIES for componentName="%s" className="" deps="%o"', TAG, String(getComponentName(target)), getClassName(target), ret);
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
            sorted.push(ret.find(it => it.parameterIndex===i));
            if (!sorted[i]) {
                throw new FrameworkError(`Constructor is missing @Inject decorator 
                for parameter ${i} for component ${target.name}`);
            }
        }

        sorted = sorted.map(it => it.dependency);

        debug('%s Returning CONSTRUCTOR_DEPENDENCIES for componentName="%s" className="%s" sorted="%o"', TAG, String(getComponentName(target)), getClassName(target), sorted);

        return sorted;
    } else {
        debug('%s NOT FOUND constructor dependencies for component="%s"', TAG, String(getComponentName(target)));
        return [];
    }
};


export const getClassSetters = (target: Target): Array<string> => {
    const ret = [];
    /**
     * @todo make it work with Constructor function and with prototype
     * Right now only works with constructor.
     */
    if (!target || !target.prototype) {
        return ret;
    }
    const descriptors = Object.getOwnPropertyDescriptors(target.prototype);

    for (const k in descriptors) {
        if (descriptors[k] &&
                descriptors[k].set &&
                typeof descriptors[k].set==='function') {
            ret.push(k);
        }
    }

    return ret;
};


export function getPropDependencies(target: Target): Array<IfComponentPropDependency> {

    const cName = String(getComponentName(target));

    debug('%s Entered getPropDependencies for target="%s"', TAG, cName);

    /**
     * If class extends other class May not get props of parent class
     */
    let dependencies = [];
    let keys = [];
    if (target && target.prototype) {
        keys = Object.keys(target.prototype);
    }
    /**
     * Now look for setters properties. These do not show up in Object.keys
     * but @Inject can be applied to setters so we must look for setter props separately.
     *
     * @important this method only finds setters of own class, never of parent class
     */
    const getters = getClassSetters(target);
    keys = keys.concat(getters);

    /**
     * Child class may have dependency-injected property defined parent class
     * but redefined in child class
     *
     * Expected behavior: consider property to be an injected dependency
     * if it's annotated with @Inject in a parent class but if it's redefined
     * in child class with a different dependency then use dependency from child class
     * if child class redefined the property with no @Inject then the property should not
     * be considered a dependency
     */
    for (const p of keys) {

        debug('%s Checking for prop dependency. prop "%s.%s"', TAG, cName, p);

        /**
         * First check if class has own property p
         */
        if (Reflect.hasMetadata(PROP_DEPENDENCY, target.prototype, p)) {
            debug('%s Prop "%s.%s" has dependency', TAG, cName, p);
            /**
             * dependency may already exist for the same property key if it was
             * defined on the parent class.
             *
             */
            dependencies.push({
                propertyName: p,
                dependency: Reflect.getMetadata(PROP_DEPENDENCY, target.prototype, p),
            });
        }
    }


    debug('%s returning prop dependencies for class "%s" dependencies=%o', TAG, cName, dependencies);

    return dependencies;
}
