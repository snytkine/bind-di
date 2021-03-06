import 'reflect-metadata';
import {
  COMPONENT_IDENTITY,
  CONSTRUCTOR_DEPENDENCIES,
  DEFAULT_SCOPE,
  PARAM_TYPES,
  RETURN_TYPE,
  UNNAMED_COMPONENT,
} from '../consts';

import { ComponentScope, TargetStereoType } from '../enums';
import { DecoratorError } from '../exceptions';

import {
  IfComponentFactoryMethod,
  IfConstructorDependency,
  Maybe,
  StringOrSymbol,
} from '../definitions';
import { Identity } from '../framework/identity';
import getClassName from '../metadata/getclassname';
import getComponentIdentity from '../metadata/getcomponentidentity';
import setComponentIdentity from '../metadata/setcomponentidentity';
import defineMetadata from '../metadata/definemetadata';
import getComponentName from '../metadata/getcomponentname';
import assertNotReservedType from '../framework/lib/assertnotreserved';
import getTargetStereotype from '../framework/lib/gettargetstereotype';
import isStringOrSymbol from '../framework/lib/isstringorsymbol';
import { ComponentIdentity } from '../utils/componentidentity';
import { Target } from '../definitions/target';

const debug = require('debug')('bind:decorate:component');

const TAG = '@Component';

/**
 * Factory method to create IfConstructorDependency object
 * @param parameterIndex
 * @param dependency
 * @constructor
 */
export const ConstructorDependency = (
  parameterIndex: number,
  dep: ComponentIdentity,
): IfConstructorDependency => {
  return {
    parameterIndex,
    dependency: dep,
  };
};

/**
 * Look in Object constructor function to determine
 * its constructor parameter types.
 *
 * Look at existing constructor dependencies that may have been set
 * by @Inject decorators on constructor parameters
 *
 * Fill missing dependencies (for example of constructor has 3 parameters but
 * only param 2 was decorated with @Inject then set the missing 1st and 3rd param.
 *
 * Check that parameter types are not reserved types
 * (must not be build in class, no String, Number, Object)
 *
 * @param target
 */
const setConstructorDependencies = (componentName: StringOrSymbol, target: Object): void => {
  debug('%s Entered setConstructorDependencies for component="%s"', TAG, String(componentName));

  /**
   * constructorParamTypes is array of constructor property param types
   */
  const constructorParamTypes = Reflect.getMetadata(PARAM_TYPES, target);

  /**
   * constructorParamTypes may be undefined or may be array with undefined as value
   * for example [undefined]
   */

  /**
   * Get possibly already defined constructor dependencies
   * Some may have been defined using @Inject directly on
   * constructor parameters.
   */
  const existingCtorDeps: Array<IfConstructorDependency> =
    Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target) || [];

  debug(
    '%s existingCtorDeps for component="%s" "%o"',
    TAG,
    String(componentName),
    existingCtorDeps,
  );

  debug(
    '%s constructorParamTypes for component="%s" "%o"',
    TAG,
    String(componentName),
    constructorParamTypes,
  );

  /**
   * constructorParamTypes array has all constructor parameters.
   * existingCtopDeps has array of dependencies
   * If any of the ctor dependency properties were not
   * decorated with @Inject then getConstructorDependencies would throw
   * because it would detect a gap in array.
   * We would not have a change to fill the missing elements.
   *
   * We need a function to get raw ctor dependencies.
   *
   * Loop over them and check that
   */

  if (
    constructorParamTypes &&
    Array.isArray(constructorParamTypes) &&
    existingCtorDeps.length !== constructorParamTypes.length
  ) {
    const targetClassName = getClassName(target);

    debug(
      `%s setConstructorDependencies 
        Adding additional constructor dependencies to component "%s" class="%s"`,
      TAG,
      String(componentName),
      targetClassName,
    );

    const updatedCtorDependencies: Array<IfConstructorDependency> = constructorParamTypes.map(
      (dep, i) => {
        let res = existingCtorDeps.find(existingDep => existingDep.parameterIndex === i);

        if (!res) {
          /**
           * Do not have existing constructor dependency for this
           * constructor argument
           * Attempt to get it by using paramType we got for this argument
           * but must check that it's not undefined and not a reserved class
           *
           */
          if (!dep) {
            throw new DecoratorError(`Cannot determine constructor dependency for arg ${i}
            for class ${targetClassName}
            Either the dependency is not a user-defined class or there may be a
            circular import. Possible solutions are: 
            - use named components as constructor dependencies 
            - use user-defined classes as constructor dependencies but make sure there are
            no circular imports`);
          }
        }
        res = res || ConstructorDependency(i, getComponentIdentity(dep));
        /**
         * @todo
         * For UNNAMED dependency do not allow generic return types
         */
        try {
          assertNotReservedType(res.dependency.componentName, res.dependency.clazz);
        } catch (e) {
          throw new DecoratorError(`Failed to add dependency for constructor argument="${i}" 
                      for class "${targetClassName}"
                      Error=${e.message}`);
        }

        return res;
      },
    );

    /**
     * Now set updated constructor dependencies as metadata for constructor
     */
    debug(
      `%s setConstructorDependencies updated "%s" constructor dependencies=%o`,
      targetClassName,
      updatedCtorDependencies,
    );

    Reflect.defineMetadata(CONSTRUCTOR_DEPENDENCIES, updatedCtorDependencies, target);
  }
};

/**
 * Actual function that will set component metadata on component
 * @param componentName
 */
export const applyComponentDecorator = (componentName: StringOrSymbol) => (
  target: Target,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<Object>,
): void => {
  const targetStereoType = getTargetStereotype(target);
  if (targetStereoType === TargetStereoType.CONSTRUCTOR && !propertyKey) {
    /**
     * Applying decorator to class
     */
    debug(`Defining ${TAG}('${String(componentName)}') for class ${getClassName(target)}`);

    setComponentIdentity(Identity(componentName, target), target);
    setConstructorDependencies(componentName, target);
  } else if (targetStereoType === TargetStereoType.PROTOTYPE) {
    const factoryClassName = target?.constructor?.name;
    debug(
      `Defining  ${TAG}('${String(componentName)}') for class method "${String(
        factoryClassName,
      )}.${propertyKey}"`,
    );

    /**
     * Applying decorator to method of the class
     * In this case the target is a prototype of the class for instance member
     * or constructor function for a static member.
     *
     * We should not allow Component decorator on a static member.
     *
     * not allowing @Component decorator on member property?
     *
     * Problem is that initially the property will not be defined
     * and then it will not be include in compiled JS class and that means
     * that we will not be able to get its type. The function is always defined
     * We may allow getter functions to be decorated at component but that will essentially
     * be same as decorating methods.
     *
     * Also decorating a method makes it possible to do something like
     * return new MyClass(somePropSetFromInit)
     */
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new DecoratorError(
        `Only class or class method can have a '${TAG}'decorator. ${target.constructor.name}.${propertyKey} decorated with ${TAG} is NOT a class or method`,
      );
    }

    /**
     * Decorating method with @Component but now need to extract component name based on return type.
     * If return type is not declared in typescript then we cannot proceed.
     *
     * If unnamed @Component is applied to class method
     * that class method must declared return type like this:
     * getMyComponent(): MyComponent
     *
     * Here the @Component was applied to accessor method without providing component name
     * so we must extract component name from return type.
     * @Component
     * getCollection(): Collection {
     *  //return a collection instance.
     * }
     *
     */
    const rettype = Reflect.getMetadata(RETURN_TYPE, target, propertyKey);
    const RT = typeof rettype;

    if (componentName === UNNAMED_COMPONENT && (RT !== 'function' || !rettype.name)) {
      throw new DecoratorError(
        `Cannot add ${TAG} to property ${propertyKey}. 
        ${TAG} decorator was used without a name and type is not an object: "${RT}"`,
      );
    }

    /**
     *
     * Make sure that return type is user-defined class and not a build-in like String, Object, etc.
     * but only in case of UNNAMED_COMPONENT
     *
     */
    assertNotReservedType(
      componentName,
      rettype,
      `
        ${TAG} Return type of method "${target.constructor.name}.${propertyKey}" 
                is not a valid name for a component: "${rettype && rettype.name}". 
                Possibly return type was not explicitly defined or the 
                Interface name was used for return type instead of class name`,
    );

    /**
     * the rettype is actually a class that if usually declared in different file
     * (not same file as factory class)
     * And also that class itself does not have @Component decorator.
     */
    setComponentIdentity(Identity(componentName, rettype), target, propertyKey);
    /**
     * Also set metadata on prototype because in this case the target stereotype is
     * PROTOTYPE not CONSTRUCTOR
     */
    setComponentIdentity(Identity(componentName, rettype), target.constructor, propertyKey);

    /**
     * @todo allow setting scope to provided component
     * Scope cannot be larger than factory scope
     */

    /**
     * Components created by functions of factory have default scope SINGLETON
     * In this case it makes sense to set DEFAULT_SCOPE to be SINGLETON for this component
     *
     * In this block the target is PROTOTYPE so metadata DEFAULT_SCOPE
     * must be defined on target.constructor in this case, otherwise when we looking
     * for this metadata and providing the class/propertyKey pair we will not find it
     *
     *
     */
    defineMetadata(DEFAULT_SCOPE, ComponentScope.SINGLETON, target, propertyKey)(true);
    /**
     * Also set DEFAULT_SCOPE metadata on target.prototype
     */
    defineMetadata(DEFAULT_SCOPE, ComponentScope.SINGLETON, target.constructor, propertyKey)(true);
  } else {
    throw new DecoratorError(
      `Cannot apply ${TAG} decorator because could not determine target stereotype`,
    );
  }
};

/**
 * Component decorator can be a factory - like @Component("my_stuff")
 * or Decorator function - simply a @Component
 * It can be applied to class or class method
 *
 * @param {Target} target
 * @constructor
 */
export function Component(target: Target): void;

export function Component(
  target: Target,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<Object>,
): void;

export function Component(
  name: StringOrSymbol,
): (target: any, propertyKey?: string, descriptor?: TypedPropertyDescriptor<Object>) => void;

export function Component(
  nameOrTarget: StringOrSymbol | Target,
  propertyKey?: string,
  descriptor?: TypedPropertyDescriptor<Object>,
) {
  if (isStringOrSymbol(nameOrTarget)) {
    return applyComponentDecorator(<StringOrSymbol>nameOrTarget);
  }
  applyComponentDecorator(UNNAMED_COMPONENT)(nameOrTarget, propertyKey, descriptor);
}

// Example how to create custom component decorator
/*
 const MyFactory = (target: Target): void => {
 Component(target);
 // Here define additional metadata using Reflect.defineMetadata
 }; */

/**
 * @todo will the getOwnPropertyNames be a problem in case of inheritance?
 * If factory class extends another class then method of parent class will not be considered?
 *
 * @param {Target} target
 * @returns {Array<IfComponentFactoryMethod>}
 */
export function getFactoryMethods(target: Target): Maybe<Array<IfComponentFactoryMethod>> {
  /**
   * use target.prototype because target is just a constructor function
   * we need to access to object's properties and for that we need
   * to get the prototype
   *
   * @type {string[]}
   */
  /**
   * Take care of case when target has no .prototype
   * this is the case when attempting to add a pure function to container, which does not make sense
   * but could happen when loading ALL exported variables from file, in which case a pure function
   * can be imported
   */
  if (!target.prototype) {
    return undefined;
  }

  /**
   * @todo
   * get rid of getOwnPropertyNames because it will cause problem
   * with inheritance.
   *
   * @type {string[]}
   */
  const methods = Object.getOwnPropertyNames(target.prototype);

  const cName = String(getComponentName(target));

  debug('%s property names of target "%s" "%o"', TAG, cName, methods);

  const factoryMethods = methods
    .filter(m => Reflect.hasMetadata(COMPONENT_IDENTITY, target.prototype, m))
    .map(m => {
      return {
        methodName: m,
        providesComponent: Reflect.getMetadata(COMPONENT_IDENTITY, target.prototype, m),
      };
    });

  debug('%s factory methods of componentName="%s" "%o"', TAG, cName, factoryMethods);

  if (Array.isArray(factoryMethods) && factoryMethods.length > 0) {
    return factoryMethods;
  }

  return undefined;
}
