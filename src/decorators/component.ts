import 'reflect-metadata';
import {
    Target,
    _COMPONENT_IDENTITY_,
    _UNNAMED_COMPONENT_,
    _COMPONENT_TYPE_,
    _DEFAULT_SCOPE_,
    RETURN_TYPE,
    IocComponentType,
    IfComponentFactoryMethod,
    DESIGN_TYPE,
    PARAM_TYPES,
    getComponentMeta,
    getConstructorDependencies,
    IfCtorInject,
    _CTOR_DEPENDENCIES_,
} from '../';

import { ComponentScope } from '../enums/componentscope';
import { INVALID_COMPONENT_NAMES } from '../consts/invalidcomponentnames';

import {
    defineMetadata,
    setComponentIdentity,
} from '../metadata/index';
import { randomBytes } from 'crypto';
import { getComponentName } from '../index';
import { Identity } from '../framework/lib/identity';


/**
 * When @Component or @Factory is added to class
 * Component name is added to class as a hidden non-enumerable property (with Symbol as name)
 * Component scope is added to class as hidden non-enumerable property (with Symbol as name)
 * Component type (Component or ComponentFactory is added to class as hidden non-enumerable hidded property (with
 * Symbol as name) A Scope property must NOT be added ONLY if explicitly set with @Scope or @Singleton decorator,
 * cannot be set to initial default value. But what about decorating controller? Controller in not Singleton by default
 * but generic component IS singleton! A component must also have _DEFAULT_SCOPE_ This way when a new component type
 * needs to add component meta data (like controller) it must call the addComponentDecoration with own _DEFAULT_SCOPE_
 * value.
 *
 *
 * When @Component is added to method or get accessor:
 *
 *
 * @type {debug.IDebugger | any}
 */

const debug = require('debug')('bind:decorator:component');
const TAG = '@Component';

/**
 export type _Target = {
    new? (...args: any[]): any
    constructor: (...args: any[]) => any
    name?: string
    //constructor: any
    prototype?: any
}
 **/

/**
 * Get component metadata from class or object instance
 * @param target
 */
//export function getComponentMeta(target: any): IfComponentDetails {
//
//}

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

    let componentName: string;
    let className: string;


    if (typeof nameOrTarget!=='string') {

        className = nameOrTarget.name;

        /**
         * @todo do we need this random bytes in component name?
         * What's the purpose of this?
         * Just use className for componentName and we not going
         * to use className since we passing clazz
         */
        //componentName = className + '.' + randomBytes(36).toString('hex');

        debug(`Entered @Component for unnamed component propertyKey="${propertyKey}"`);

        if (typeof nameOrTarget==='function' && !propertyKey && nameOrTarget['prototype']) {
            /**
             * Applying decorator to class
             */

            debug(`Defining unnamed ${TAG} for class ${className}`);
            const ptypes = Reflect.getMetadata(PARAM_TYPES, nameOrTarget);

            const rt = Reflect.getMetadata(DESIGN_TYPE, nameOrTarget);


            debugger;

            setComponentIdentity(Identity(_UNNAMED_COMPONENT_, nameOrTarget), nameOrTarget);
            /**
             * @todo stop using this COMPONENT_TYPE, type not important for anything
             * COMPONENT_META object may be used for marking special components like "Controllers" etc.
             *
             */
            defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, nameOrTarget)(); // used to be true
            /**
             * @todo what's the purpose of adding _DEFAULT_SCOPE_ if container
             * has a property defaultScope and will use its own default if scope is not
             * resolved?
             * the function getScope uses this _DEFAULT_SCOPE_ if SCOPE is not defined.
             * this means that scope will always be resolved to at least the default scope
             * and container will not have a chance to use own default scope.
             *
             * This concept of _DEFAULT_SCOPE_ on component was designed for Controller or Middleware
             * component. The idea was that _DEFAULT_SCOPE_ would be set by @Controller decorator
             * but could be overwritten by @Singleton decorator
             * in that case the value of scope is computer value - SCOPE || DEFAULT_SCOPE
             * But for regular component we should never set _DEFAULT_SCOPE_ otherwise
             * the container's own defaultScope can never be used.
             */


        } else {

            debug(`Defining unnamed ${TAG} for property ${propertyKey} of class ${nameOrTarget['name']}`);

            /**
             * Applying decorator to method of the class
             * In this case the target is a prototype of the class for instance member
             * or constructor function for a static member.
             *
             * We should not allow Component decorator on a static member.
             */
            if (!descriptor || typeof descriptor.value!=='function') {
                const ex1 = `Only class or class method can have a '${TAG}'decorator. ${nameOrTarget.constructor.name}.${propertyKey} decorated with ${TAG} is NOT a class or method`;
                throw new TypeError(ex1);
            }

            /**
             * Decorating method with @Component but now need to extract component name based on return type.
             * If return type is not declared in typescript then we cannot proceed.
             *
             * If @Component is applied to class method that class method must declared return type like this:
             * Here the @Component was applied to accessor method without providing component name
             * so we must extract component name from return type.
             *
             * getCollection(): Collection {
             *  //return a collection instance.
             * }
             *
             */
            const rettype = Reflect.getMetadata(RETURN_TYPE, nameOrTarget, propertyKey);
            const RT = typeof rettype;

            if (RT!='function' || !rettype.name) {
                throw new TypeError(`Cannot add ${TAG} to property ${propertyKey}. ${TAG} decorator was used without a name and rettype is not an object: ${RT}`);
            }

            /**
             *
             * Make sure that return type is user-defined class and not a build-in like String, Object, etc.
             */
            if (INVALID_COMPONENT_NAMES.includes(rettype.name)) {
                throw new TypeError(`${TAG} Return type of method "${nameOrTarget.constructor.name}.${propertyKey}" 
                is not a valid name for a component: "${rettype.name}". 
                Possibly return type was not explicitly defined or the Interface name was used for return type instead of class name`);
            }

            className = rettype.name;
            /**
             * the rettype is actually a class that if usually declared in different file
             * (not same file as factory class)
             * And also that class itself does not have @Component decorator.
             * So how can we get the file path of that file?
             *
             */
            setComponentIdentity(Identity(_UNNAMED_COMPONENT_, rettype), nameOrTarget, propertyKey);

            defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, nameOrTarget, propertyKey)(); // used to be true
            /**
             * Components created by functions of factory have default scope SINGLETON
             * In this case it makes sense to set DEFAULT_SCOPE to be SINGLETON for this component
             */
            defineMetadata(_DEFAULT_SCOPE_, ComponentScope.SINGLETON, nameOrTarget, propertyKey)(true);

        }


    } else {
        /**
         * Named component
         */
        debug(`${TAG} decorator Called with component name="${nameOrTarget}"`);
        componentName = nameOrTarget;
        return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {

            if (typeof target==='function' && !propertyKey) {
                /**
                 * Named component applied at class level
                 *
                 */
                className = target.name;

                debug(`Defining named ${TAG} '${componentName}' for class ${target.name}`);
                /**
                 * ptypes is array of constructor property param types
                 */
                const ptypes = Reflect.getMetadata(PARAM_TYPES, target);

                /**
                 * Get possibly already defined constructor dependencies
                 * Some may have been defined using @Inject directly on
                 * constructor parameters.
                 */
                //const existingCtorDeps = getConstructorDependencies(target);
                const existingCtorDeps: Array<IfCtorInject> | undefined = Reflect.getMetadata(_CTOR_DEPENDENCIES_, target);
                console.log(componentName, '!!!!!!!!!!!!')
                console.dir(existingCtorDeps);
                console.log(componentName, '??????????????')
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
                debugger;
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


                // Applying to target (without .prototype fails to get meta for the instance)
                //defineMetadataUnique(_COMPONENT_IDENTITY_, name, target);

                setComponentIdentity(Identity(componentName, target), target);
                defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target)(); // used to be true

            } else {
                /**
                 * This is a named component applied to method.
                 */
                const factoryClassName = target.constructor && target.constructor.name;

                if (typeof descriptor.value!=='function') {
                    throw new TypeError(`Only class or class method can have a '${TAG}' decorator. ${target.constructor.name}.${propertyKey} decorated with ${TAG}('${componentName}') is NOT a class or method`);
                }

                debug(`Defining named ${TAG} "${componentName}" for class method "${factoryClassName}.${propertyKey}"`);

                /**
                 * Get return type of component getter method
                 */
                const rettype = Reflect.getMetadata(RETURN_TYPE, target, propertyKey);

                className = rettype && rettype.name;

                setComponentIdentity(Identity(componentName, rettype), target, propertyKey);
                defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target, propertyKey)(); // used to be true
                /**
                 * Method component are components generated by factory
                 * these components are always Singleton?
                 */
                defineMetadata(_DEFAULT_SCOPE_, ComponentScope.SINGLETON, target, propertyKey)(true);

            }

        };
    }
}


/**
 * @todo
 * Functions to create Component annotations
 * For example it will be possible to create
 * Controller annotation by calling
 * Controller = ComponentDecorator(_CONTROLLER_TYPE_) and it will return
 * Component function with value for _COMPONENT_TYPE_
 *
 * Then it can be used like this: Normally Component("myservice")
 * @makeComponentDecorator(_SPECIAL_TYPE_, ComponentScope.SINGLETON)("myservice")
 * or
 * @makeComponentDecorator(_SPECIAL_TYPE_, ComponentScope.SINGLETON)  for unnamed component
 */
//const componentDecorator = (cType: IocComponentType, cMeta: Symbol):

export const Factory = (target: Target): void => {
    Component(target);
    Reflect.defineMetadata(_COMPONENT_TYPE_, IocComponentType.FACTORY, target);
};


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

    let factoryMethods = methods.filter(m => Reflect.hasMetadata(_COMPONENT_IDENTITY_, target.prototype, m)).map(m => {
        return { 'methodName': m, 'providesComponent': Reflect.getMetadata(_COMPONENT_IDENTITY_, target.prototype, m) };
    });

    debug(`${TAG} factory methods of "${cName}"=`, factoryMethods);

    return factoryMethods;
}

