import { IfComponentPropDependency, IfConstructorDependency, StringOrSymbol } from '../definitions';
import {
  DESIGN_TYPE,
  UNNAMED_COMPONENT,
  RESERVED_COMPONENT_NAMES,
  PROP_DEPENDENCY,
  CONSTRUCTOR_DEPENDENCIES,
  PARAM_TYPES,
} from '../consts';
import FrameworkError from '../exceptions/frameworkerror';
import { DependencyType, TargetStereoType } from '../enums';
import getComponentName from '../metadata/getcomponentname';
import getClassName from '../metadata/getclassname';
import getComponentIdentity from '../metadata/getcomponentidentity';
import defineMetadata from '../metadata/definemetadata';
import getTargetStereotype from '../framework/lib/gettargetstereotype';
import { Identity } from '../framework/identity';
import isStringOrSymbol from '../framework/lib/isstringorsymbol';
import { ComponentIdentity } from '../utils/componentidentity';
import { Target } from '../definitions/target';

const debug = require('debug')('bind:decorate:inject');

const TAG = '@Inject';

export type NumberOrPropertyDescriptor = number | PropertyDescriptor;
export type StringOrTarget = string | Target;

/**
 * @todo deal with inheritance. If parent already has ctor dependencies
 * a child can have co-variant types for same dependencies
 *
 * @param {Target} target
 * @param {ComponentIdentity} dependency
 * @param {number} parameterIndex
 */
export const addConstructorDependency = (
  target: Target,
  dependency: ComponentIdentity,
  parameterIndex: number,
): void => {
  let deps =
    <Array<IfConstructorDependency>>Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target) || [];
  const name = String(getComponentName(target));
  debug(
    `%s Adding Constructor dependency at index="%d" dependency="%o"
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
  const existingDependencyIndex: number = deps.findIndex(
    dep => dep.parameterIndex === parameterIndex,
  );

  if (existingDependencyIndex > -1) {
    debug(
      '%s class "%s" already has constructor dependency for paramIndex %d. Will reassign it',
      TAG,
      name,
      parameterIndex,
    );

    /**
     * Need to remove element from array at that index.
     * Best way to delete it is to create new deps by filtering out element
     */
    deps = deps.filter(dep => dep.parameterIndex !== parameterIndex);
    debug(
      '%s filtered out existing ctor dependency at ctor index=%d comp="%s" %o',
      TAG,
      parameterIndex,
      name,
      deps,
    );
  }

  deps.push({
    parameterIndex,
    dependency,
  });

  Reflect.defineMetadata(CONSTRUCTOR_DEPENDENCIES, deps, target);
};

const getInjectionType = (
  target: Target,
  propertyKey?: string,
  parameterIndex?: NumberOrPropertyDescriptor,
): DependencyType => {
  let ret: DependencyType = DependencyType.UNKNOWN;
  const targetStereoType: TargetStereoType = getTargetStereotype(target);

  if (
    TargetStereoType.PROTOTYPE === targetStereoType &&
    propertyKey &&
    typeof propertyKey === 'string' &&
    parameterIndex === undefined
  ) {
    ret = DependencyType.PROPERTY;
  } else if (
    TargetStereoType.CONSTRUCTOR === targetStereoType &&
    propertyKey === undefined &&
    typeof parameterIndex === 'number'
  ) {
    ret = DependencyType.CONSTRUCTOR_PARAMETER;
  } else if (
    TargetStereoType.PROTOTYPE === targetStereoType &&
    typeof propertyKey === 'string' &&
    typeof parameterIndex === 'object' &&
    parameterIndex.set &&
    typeof parameterIndex.set === 'function'
  ) {
    ret = DependencyType.SETTER;
  }

  return ret;
};

const applyInjectToProperty = (
  dependencyName: StringOrSymbol,
  target: Target,
  propertyKey: string,
  propertyDescriptor?: NumberOrPropertyDescriptor,
): void => {
  const name = String(getComponentName(target));

  debug(
    '%s Entered applyInjectToProperty dependencyName="%s" target="%s" propertyKey="%s"',
    TAG,
    dependencyName,
    name,
    propertyKey,
  );

  const rt = Reflect.getMetadata(DESIGN_TYPE, target, propertyKey);
  debug('%s applyInjectToProperty rt=%o', TAG, rt);

  let injectName: StringOrSymbol;
  let injectIdentity: ComponentIdentity;
  let injectClassName: string;

  /**
   * Different logic for named or unnamed dependencies
   *
   * 1. Named dependencies allowed not to have DESIGN_TYPE at all.
   *    also allowed to have generic DESIGN_TYPE
   *
   * 2. UNNAMED dependencies MUST have valid DESIGN_TYPE
   */
  if (dependencyName !== UNNAMED_COMPONENT) {
    injectName = dependencyName;
    /**
     * This injection is named component
     * we must use dependencyName as injectName, regardless if class rt
     * is itself a component with different named identity.
     * The value of clazz should be rt. we dont have to check
     * rt for reserved classed because it's a named component and
     * injection will be resolved by name. clazz may only be used
     * for extra validation when dependency component is found in container
     * or when dependencies are validated in the init stage of container.
     */
    injectIdentity = Identity(injectName, rt); // this is wrong target is the component, not injected class
  } else {
    if (!rt) {
      throw new FrameworkError(`
      Cannot determine the dependency type for component "${name}" propertyKey="${propertyKey}". 
            Possibly caused by circular imports or not adding
            TypeScript's type to indicate type of dependency class.
            Possible solutions are:
            - Use user-defined class as dependency component. 
              Make sure to use TypeScript's type and make sure there are no
              circular imports.
            - Use named dependency using @Inject("some_name") instead of just @Inject`);
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

    debug(
      '%s DESIGN_TYPE of property "%s.%s" is "%s" className="%s"',
      TAG,
      name,
      propertyKey,
      String(injectName),
      injectClassName,
    );

    if (!injectClassName) {
      throw new FrameworkError(`${TAG} Failed to get class name 
            of injected component for "${name}.${propertyKey}"
            Possible reason may be a dependency loop for this component dependency
            Possible remedies:
            1. Use named dependency 
            2  Use user-defined class as dependency but make sure there are no
            dependency loops`);
    }

    /**
     * If return type was not provided (same case when only Interface was provided)
     * then injectName will be 'Object'
     * This is not allowed.
     */
    if (RESERVED_COMPONENT_NAMES.includes(injectClassName)) {
      throw new FrameworkError(`Dependency class ${injectClassName} 
            for property "${name}.${propertyKey}"  is not allowed as dependency component. 
            Consider using named dependency or user-defined class as dependency`);
    }
  }

  debug(
    'Adding %s metadata for propertyKey="%s" dependencyName="%s" for target="%s"',
    TAG,
    propertyKey,
    String(injectName),
    name,
  );

  /**
   * The actual target object may not have this property defined
   * because typescript compiler will not
   * add a property if it does not have a value.
   * Even if it has a value the TS Compiled does not really add property,
   * instead it adds it to body of constructor function
   * Like this: here the 'id' is not added as property but
   * instead is initialized in constructor
   *
   * let Logger = class Logger {
    constructor(teller) {
        this.teller = teller;
        this.id = "abc";
    }
    log(message) {
        console.log(message);
    }
    }
   *
   * // target.hasOwnProperty(propertyKey)
   */
  if (!Object.getOwnPropertyNames(target).includes(propertyKey)) {
    debug('%s defining property "%s" for Injection on target="%s"', TAG, propertyKey, name);

    Object.defineProperty(target, propertyKey, {
      value: undefined,
      writable: true,
      enumerable: true,
    });

    debug('%s added property "%s" to prototype of "%s"', TAG, propertyKey, name);
  }

  if (propertyDescriptor && typeof propertyDescriptor === 'object') {
    debug('%s propertyKey %s has propertyDescriptor %o', TAG, propertyKey, propertyDescriptor);
    /**
     * Set enumerable to true so that this setter will be found as a property
     * of object in for-in loop when looking for prop dependencies with getPropDependencies()
     */

    /**
     * @todo consider consequences of making a setter an enumerable property
     * the consumer of this framework may rely on some type of for-in loop
     * or on getKeys() to get object properties and it may be an unexpected surprise
     * to find setter in the array of enumerable properties.
     *
     * A more complex work around would be to define a new hidden property
     * on the target under some symbol and make it a Set of names of setters.
     * Then in getPropDependencies also check for that property in the target prototype
     *
     * Or just define extra metadata on target like SETTER_NAMES and add a set of setter names
     */
    Reflect.set(propertyDescriptor, 'enumerable', true);
  }

  defineMetadata(PROP_DEPENDENCY, injectIdentity, target, propertyKey)();
};

/**
 * @param dependencyName
 * @param target target will be a Function here - a constructor
 * @param parameterIndex
 */
const applyInjectToConstructorParam = (
  dependencyName: StringOrSymbol,
  target: Target,
  paramIndex: NumberOrPropertyDescriptor,
): void => {
  if (typeof paramIndex !== 'number') {
    throw new FrameworkError(`parameterIndex passed to applyInjectToConstructorParam 
    must be a number. dependencyName=${String(dependencyName)}`);
  }

  const ptypes = Reflect.getMetadata(PARAM_TYPES, target);
  let injectIdentity: ComponentIdentity;

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

  if (dependencyName === UNNAMED_COMPONENT) {
    /**
     * For unnamed @Inject get identity from ptypes[paramIndex]
     * make sure class type is not reserved type.
     */
    injectIdentity = getComponentIdentity(ptypes[paramIndex]);
    const injectClassName = injectIdentity?.clazz?.name;

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
      throw new FrameworkError(`Dependency class ${injectClassName} 
            for "${String(target.name)}"  constructor at position ${paramIndex} 
            is not an allowed type as dependency component. 
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

const applyInject = (depName: StringOrSymbol) => (
  target: Target,
  propertyKey?: string,
  paramIndex?: NumberOrPropertyDescriptor,
) => {
  const injectionType = getInjectionType(target, propertyKey, paramIndex);

  debug(
    '%s applyInjectDecorator for dependencyName="%s" injectionType=%s',
    TAG,
    depName,
    injectionType,
  );

  switch (injectionType) {
    case DependencyType.CONSTRUCTOR_PARAMETER:
      applyInjectToConstructorParam(depName, target, paramIndex);
      break;

    case DependencyType.SETTER:
      applyInjectToProperty(depName, target, propertyKey, paramIndex);
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
export function Inject(target: Target, propertyKey: string, parameterIndex?: number): void;

export function Inject(target: Target, propertyKey: string, descriptor: PropertyDescriptor): void;

export function Inject(
  name: StringOrSymbol,
): (target: Target, propertyKey?: string, parameterIndex?: NumberOrPropertyDescriptor) => void;

/**
 * Implementation
 * @param nameOrTarget
 * @param propertyKey
 * @param parameterIndex
 * @constructor
 */
export function Inject(
  nameOrTarget: StringOrTarget,
  propertyKey?: string,
  parameterIndex?: NumberOrPropertyDescriptor,
) {
  debug('%s Entered Inject', TAG);
  if (isStringOrSymbol(nameOrTarget)) {
    return applyInject(<StringOrSymbol>nameOrTarget);
  }
  applyInject(UNNAMED_COMPONENT)(nameOrTarget, propertyKey, parameterIndex);
}

/**
 * Returns array of ComponentIdentity in sorted order of
 * constructor parameters.
 *
 * @param target
 * @throws if dependency is missing for constructor parameter
 */
export const getConstructorDependencies = (target: Target): Array<ComponentIdentity> => {
  const ret: Array<IfConstructorDependency> = Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target);
  if (ret) {
    debug(
      `%s Found component CONSTRUCTOR_DEPENDENCIES 
    for componentName="%s" 
    className="" deps="%o"`,
      TAG,
      String(getComponentName(target)),
      getClassName(target),
      ret,
    );

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
      sorted.push(ret.find(it => it.parameterIndex === i));
      if (!sorted[i]) {
        throw new FrameworkError(`Constructor is missing @Inject decorator 
                for parameter ${i} for component ${target.name}`);
      }
    }

    sorted = sorted.map(it => it.dependency);

    debug(
      '%s Returning CONSTRUCTOR_DEPENDENCIES for componentName="%s" className="%s" sorted="%o"',
      TAG,
      String(getComponentName(target)),
      getClassName(target),
      sorted,
    );

    return sorted;
  }
  debug(
    '%s NOT FOUND constructor dependencies for component="%s"',
    TAG,
    String(getComponentName(target)),
  );
  return [];
};

/**
 * @todo deprecate this because now PropertyDescriptor of class setter
 * decorated with @Inject are set to enumerable and are found in the
 * getPropDependencies  method just like normal property.
 *
 * @param target
 */
export const getClassSetters = (target: Target): Array<string> => {
  const ret = [];
  /**
   * @todo make it work with Constructor function and with prototype
   * Right now only works with constructor.
   */
  if (!target || !target.prototype) {
    debug('%s parameter passed to getClassSetters is not a constructor. Returning empty array');

    return ret;
  }
  // use target.__proto__.prototype to get all prop descriptors from parent class
  // if this is a normal component and not a sub-class it will have __proto__
  // but not __proto__.prototype
  // this is useful in case of Proxy class where target is Proxy class that extends actual component
  const descriptors = Object.getOwnPropertyDescriptors(target.prototype);

  for (const k in descriptors) {
    if (descriptors[k] && descriptors[k].set && typeof descriptors[k].set === 'function') {
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
  const dependencies = [];

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
  if (target && target.prototype) {
    /**
     * Here using for-in loop because we need to include
     * properties from parent classes as well as this class
     * This is required for EnvOverride decorator to work properly
     * because it creates a sub-class of actual component
     * Object.keys will not work because it returns only own properties
     */
    // eslint-disable-next-line guard-for-in
    for (const p in target.prototype) {
      debug('%s Checking for prop dependency. prop "%s.%s"', TAG, cName, p);

      /**
       * First check if class has own property p
       */
      if (Reflect.hasMetadata(PROP_DEPENDENCY, target.prototype, p)) {
        const dep = Reflect.getMetadata(PROP_DEPENDENCY, target.prototype, p);
        debug('%s Prop "%s.%s" has dependency %o', TAG, cName, p, dep);
        /**
         * @todo
         * dependency may already exist for the same property key if it was
         * defined on the parent class.
         * so before pushing to dependencies make sure same identity does not already exist
         */
        dependencies.push({
          propertyName: p,
          dependency: dep,
        });
      } else {
        debug('%s Prop "%s.%s" has NO dependency', TAG, cName, p);
      }
    }
  }

  debug('%s returning prop dependencies for class "%s" dependencies=%o', TAG, cName, dependencies);

  /**
   * Sort array by property names so that order of elements
   * is consistent, will be useful for unit testing.
   */
  dependencies.sort((a, b) => {
    if (a.propertyName === b.propertyName) {
      return 0;
    }
    if (a.propertyName > b.propertyName) {
      return 1;
    }
    return -1;
  });

  return dependencies;
}
