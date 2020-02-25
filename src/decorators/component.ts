import 'reflect-metadata';
import {
    Target,
    COMPONENT_IDENTITY,
    UNNAMED_COMPONENT,
    DEFAULT_SCOPE,
    RETURN_TYPE,
    IfComponentFactoryMethod,
    PARAM_TYPES,
    getComponentMeta,
    IfConstructorDependency,
    CONSTRUCTOR_DEPENDENCIES,
    StringOrSymbol, getClassName, IfComponentIdentity, getComponentIdentity,
} from '../';

import { ComponentScope } from '../enums/componentscope';

import {
    defineMetadata,
    setComponentIdentity,
} from '../metadata/index';
import { getComponentName } from '../index';
import { Identity } from '../framework/lib/identity';
import { DecoratorError } from '../exceptions/decoratorerror';
import { isStringOrSymbol } from '../framework/lib/isstringorsymbol';
import { assertNotReservedType } from '../framework/lib/assertnotreservedtype';

const debug = require('debug')('bind:decorate:component');
const TAG = '@Component';

/**
 * Factory method to create IfConstructorDependency object
 * @param parameterIndex
 * @param dependency
 * @constructor
 */
export const ConstructorDependency = (parameterIndex: number,
                                      dependency: IfComponentIdentity): IfConstructorDependency => {
    return {
        parameterIndex,
        dependency,
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
     * Get possibly already defined constructor dependencies
     * Some may have been defined using @Inject directly on
     * constructor parameters.
     */
    const existingCtorDeps: Array<IfConstructorDependency> = Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target) || [];

    console.log(componentName, '!!!!!!!!!!!!');
    console.log(getClassName(target));
    console.dir(existingCtorDeps);
    console.log(componentName, '??????????????');
    console.dir(constructorParamTypes);

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

    if (constructorParamTypes && Array.isArray(constructorParamTypes) &&
            existingCtorDeps.length!==constructorParamTypes.length) {
        const targetClassName = getClassName(target);

        debug(`%s setConstructorDependencies 
        Adding additional constructor dependencies to component "%s" class="%s"`,
                TAG,
                String(componentName),
                targetClassName);

        const updatedCtorDependencies: Array<IfConstructorDependency> = constructorParamTypes.map(
                (dep, i) => {
                    let res = existingCtorDeps.find(dep => dep.parameterIndex===i);

                    res = res || ConstructorDependency(i, getComponentIdentity(dep));
                    /**
                     * @todo
                     * For UNNAMED dependency do not allow generic return types
                     */
                    assertNotReservedType(res.dependency.componentName, res.dependency.clazz);

                    return res;
                });

        /**
         * Now set updated constructor dependencies as metadata for constructor
         */
        debug(`%s setConstructorDependencies updated "%s" constructor dependencies=%o`,
                targetClassName,
                updatedCtorDependencies);

        Reflect.defineMetadata(CONSTRUCTOR_DEPENDENCIES, updatedCtorDependencies, target);
    }

};

/**
 * Actual function that will set component metadata on component
 * @param componentName
 */
export const applyComponentDecorator = (componentName: StringOrSymbol) => (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Object>): void => {

    if (typeof target==='function' && !propertyKey && target.prototype) {
        /**
         * Applying decorator to class
         */
        debug(`Defining ${TAG}('${String(componentName)}') for class ${target.name}`);

        setComponentIdentity(Identity(componentName, target), target);
        setConstructorDependencies(componentName, target);

    } else {

        const factoryClassName = target?.constructor?.name;
        debug(`Defining named ${TAG}('${String(componentName)}') for class method "${String(factoryClassName)}.${propertyKey}"`);

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
        if (!descriptor || typeof descriptor.value!=='function') {
            throw new DecoratorError(`Only class or class method can have a '${TAG}'decorator. ${target.constructor.name}.${propertyKey} decorated with ${TAG} is NOT a class or method`);
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

        if (componentName===UNNAMED_COMPONENT && (RT!='function' || !rettype.name)) {
            throw new DecoratorError(`Cannot add ${TAG} to property ${propertyKey}. ${TAG} decorator was used without a name and type is not an object: "${RT}"`);
        }

        /**
         *
         * Make sure that return type is user-defined class and not a build-in like String, Object, etc.
         * but only in case of UNNAMED_COMPONENT
         *
         */
        assertNotReservedType(componentName, rettype, `
        ${TAG} Return type of method "${target.constructor.name}.${propertyKey}" 
                is not a valid name for a component: "${rettype.name}". 
                Possibly return type was not explicitly defined or the 
                Interface name was used for return type instead of class name`);


        /**
         * the rettype is actually a class that if usually declared in different file
         * (not same file as factory class)
         * And also that class itself does not have @Component decorator.
         */
        setComponentIdentity(Identity(componentName, rettype), target, propertyKey);

        /**
         * Components created by functions of factory have default scope SINGLETON
         * In this case it makes sense to set DEFAULT_SCOPE to be SINGLETON for this component
         */
        defineMetadata(DEFAULT_SCOPE, ComponentScope.SINGLETON, target, propertyKey)(true);

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
export function Component(target: Target): void

export function Component(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Object>): void

export function Component(name: StringOrSymbol): (target: any, propertyKey?: string,
                                                  descriptor?: TypedPropertyDescriptor<Object>) => void

export function Component(nameOrTarget: StringOrSymbol | Target, propertyKey?: string,
                          descriptor?: TypedPropertyDescriptor<Object>) {

    if (isStringOrSymbol(nameOrTarget)) {
        return applyComponentDecorator(<StringOrSymbol>nameOrTarget);
    } else {
        applyComponentDecorator(UNNAMED_COMPONENT)(nameOrTarget, propertyKey, descriptor);
    }
}

// Example how to create custom component decorator
/*
 const MyFactory = (target: Target): void => {
 Component(target);
 // Here define additional metadata using Reflect.defineMetadata
 };*/


/**
 * @todo will the getOwnPropertyNames be a problem in case of inheritance?
 * If factory class extends another class then method of parent class will not be considered?
 *
 * @param {Target} target
 * @returns {Array<IfComponentFactoryMethod>}
 */
export function getFactoryMethods(target: Target): Array<IfComponentFactoryMethod> {

    /**
     * use target.prototype because target is just a constructor function
     * we need to access to object's properties and for that we need
     * to get the prototype
     *
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
        return [];
    }

    /**
     * @todo
     * get rid of getOwnPropertyNames because it will cause problem
     * with inheritance.
     *
     * @type {string[]}
     */
    let methods = Object.getOwnPropertyNames(target.prototype);

    const cName = String(getComponentName(target));


    debug(`${TAG} property names of target "${cName}"`, methods);

    let factoryMethods = methods.filter(m => Reflect.hasMetadata(COMPONENT_IDENTITY, target.prototype, m)).map(m => {
        return { 'methodName': m, 'providesComponent': Reflect.getMetadata(COMPONENT_IDENTITY, target.prototype, m) };
    });

    debug(`${TAG} factory methods of "${cName}"=`, factoryMethods);

    return factoryMethods;
}

