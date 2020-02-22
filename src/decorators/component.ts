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
    IfCtorInject,
    CONSTRUCTOR_DEPENDENCIES, StringOrSymbol, getPropDependencies,
} from '../';

import { ComponentScope } from '../enums/componentscope';
import { INVALID_COMPONENT_NAMES } from '../consts/invalidcomponentnames';

import {
    defineMetadata,
    setComponentIdentity,
} from '../metadata/index';
import { getComponentName } from '../index';
import { Identity } from '../framework/lib/identity';
import { DecoratorError } from '../exceptions/decoratorerror';

const debug = require('debug')('bind:decorate:component');
const TAG = '@Component';

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
 * Check that parameter types are not reserved types (must not be build in class, no String, Number, Object)
 *
 * @param target
 */
const setConstructorDependencies = (componentName: StringOrSymbol, target: Object): void => {
    debug('%s Entered setConstructorDependencies for component="%s"', TAG, String(componentName));
    /**
     * ptypes is array of constructor property param types
     */
    const ptypes = Reflect.getMetadata(PARAM_TYPES, target);

    //debugger;


    /**
     * Get possibly already defined constructor dependencies
     * Some may have been defined using @Inject directly on
     * constructor parameters.
     */
    const existingCtorDeps: Array<IfCtorInject> | undefined = Reflect.getMetadata(CONSTRUCTOR_DEPENDENCIES, target);
    console.log(componentName, '!!!!!!!!!!!!');
    console.dir(existingCtorDeps);
    console.log(componentName, '??????????????');
    console.dir(ptypes);

    /**
     * ptypes array has all constructor parameters.
     * existingCtopDeps has sorted array of dependencies
     * If any of the ctor dependency properties were not
     * decorated with @Inject then getConstructorDependencies would throw
     * because it would detect a gap in array.
     * We would not have a change to fill the missing elements.
     *
     * We need a function to get raw ctor dependencies.
     *
     * Loop over them and check that
     */

    /**
     * mylogger !!!!!!!!!!!!
     [
     {
    parameterIndex: 1,
    dependency: {
      componentName: Symbol(bind:component_unnamed),
      clazz: [Function: Settings]
    }
  },
     {
    parameterIndex: 0,
    dependency: {
      componentName: Symbol(bind:component_unnamed),
      clazz: [Function: Settings]
    }
  }
     ]
     mylogger ??????????????
     [ [Function: Settings], [Function: Settings] ]
     *
     */
    //debugger;
    console.log('++++++++++++++++');
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

        /**
         * @todo what's the purpose of adding DEFAULT_SCOPE if container
         * has a property defaultScope and will use its own default if scope is not
         * resolved?
         * the function getScope uses this DEFAULT_SCOPE if SCOPE is not defined.
         * this means that scope will always be resolved to at least the default scope
         * and container will not have a chance to use own default scope.
         *
         * This concept of DEFAULT_SCOPE on component was designed for Controller or Middleware
         * component. The idea was that DEFAULT_SCOPE would be set by @Controller decorator
         * but could be overwritten by @Singleton decorator
         * in that case the value of scope is computer value - SCOPE || DEFAULT_SCOPE
         * But for regular component we should never set DEFAULT_SCOPE otherwise
         * the container's own defaultScope can never be used.
         */
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
        if (componentName===UNNAMED_COMPONENT && INVALID_COMPONENT_NAMES.includes(rettype.name)) {
            throw new DecoratorError(`${TAG} Return type of method "${target.constructor.name}.${propertyKey}" 
                is not a valid name for a component: "${rettype.name}". 
                Possibly return type was not explicitly defined or the Interface name was used for return type instead of class name`);
        }

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

export function Component(name: string): (target: any, propertyKey?: string,
                                          descriptor?: TypedPropertyDescriptor<Object>) => void

export function Component(nameOrTarget: string | Target, propertyKey?: string,
                          descriptor?: TypedPropertyDescriptor<Object>) {

    if (typeof nameOrTarget!=='string') {
        applyComponentDecorator(UNNAMED_COMPONENT)(nameOrTarget, propertyKey, descriptor);
    } else {
        return applyComponentDecorator(nameOrTarget);
    }
}

// Example how to create custom component decorator
/*
 const MyFactory = (target: Target): void => {
 Component(target);
 Reflect.defineMetadata(_COMPONENT_TYPE_, IocComponentType.FACTORY, target);
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

