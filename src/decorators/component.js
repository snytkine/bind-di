"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var _1 = require("../");
var index_1 = require("../metadata/index");
/**
 * When @Component or @Factory is added to class
 * Component name is added to class as a hidden non-enumerable property (with Symbol as name)
 * Component scope is added to class as hidden non-enumerable property (with Symbol as name)
 * Component type (Component or ComponentFactory is added to class as hidden non-enumerable hidded property (with Symbol as name)
 * A Scope property must NOT be added ONLY if explicitly set with @Scope or @Singleton decorator, cannot be set
 * to initial default value.
 * But what about decorating controller? Controller in not Singleton by default but generic component IS singleton!
 * A component must also have _DEFAULT_SCOPE_
 * This way when a new component type needs to add component meta data (like controller) it must call
 * the addComponentDecoration with own _DEFAULT_SCOPE_ value.
 *
 *
 * When @Component is added to method or get accessor:
 *
 *
 * @type {debug.IDebugger | any}
 */
var debug = require('debug')('bind:decorator:component');
var TAG = '@Component';
function Component(nameOrTarget, propertyKey, descriptor) {
    var componentName;
    var className;
    if (typeof nameOrTarget !== 'string') {
        componentName = className = nameOrTarget['name'];
        debug("Entered @Component for unnamed component propertyKey=\"" + propertyKey + "\"");
        if (typeof nameOrTarget === "function" && !propertyKey && componentName && nameOrTarget['prototype']) {
            /**
             * Applying decorator to class
             */
            debug("Defining unnamed " + TAG + " for class " + componentName);
            index_1.setComponentIdentity({ componentName: componentName, className: className }, nameOrTarget);
            _1.defineMetadataUnique(_1._COMPONENT_TYPE_, _1.IocComponentType.COMPONENT, nameOrTarget);
            _1.defineMetadataUnique(_1._DEFAULT_SCOPE_, _1.IocComponentScope.SINGLETON, nameOrTarget);
        }
        else {
            debug("Defining unnamed " + TAG + " for property " + propertyKey + " of class " + nameOrTarget['name']);
            /**
             * Applying decorator to method of the class
             * In this case the target is a prototype of the class for instance member
             * or constructor function for a static member.
             *
             * We should not allow Component decorator on a static member.
             */
            if (!descriptor || typeof descriptor.value !== 'function') {
                throw new TypeError("Only class or class method can have a '" + TAG + "'decorator. " + nameOrTarget.constructor.name + "." + propertyKey + " decorated with " + TAG + " is NOT a class or method");
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
            var rettype = Reflect.getMetadata(_1.RETURN_TYPE, nameOrTarget, propertyKey);
            var RT = typeof rettype;
            if (RT != "function" || !rettype.name) {
                throw new TypeError("Cannot add " + TAG + " to property " + propertyKey + ". " + TAG + " decorator was used without a name and rettype is not an object: " + RT);
            }
            /**
             * @todo
             * Make sure that returntype is user-defined class and not a build-in like String, Object, etc.
             */
            if (_1.INVALID_COMPONENT_NAMES.includes(rettype.name)) {
                throw new TypeError(TAG + " Return type of method \"" + nameOrTarget.constructor.name + "." + propertyKey + "\" \n                is not a valid name for a component: \"" + rettype.name + "\". \n                Possibly return type was not explicitly defined or the Interface name was used for return type instead of class name");
            }
            componentName = className = rettype.name;
            index_1.setComponentIdentity({ componentName: componentName, className: className }, nameOrTarget, propertyKey);
            _1.defineMetadataUnique(_1._COMPONENT_TYPE_, _1.IocComponentType.COMPONENT, nameOrTarget, propertyKey);
            _1.defineMetadataUnique(_1._DEFAULT_SCOPE_, _1.IocComponentScope.SINGLETON, nameOrTarget, propertyKey);
        }
    }
    else {
        debug(TAG + " decorator Called with component name=\"" + nameOrTarget + "\"");
        componentName = nameOrTarget;
        return function (target, propertyKey, descriptor) {
            if (typeof target === "function" && !propertyKey) {
                className = target.name;
                debug("Defining named " + TAG + " '" + componentName + "' for class " + target.name);
                // Applying to target (without .prototype fails to get meta for the instance)
                //defineMetadataUnique(_COMPONENT_IDENTITY_, name, target);
                index_1.setComponentIdentity({ componentName: componentName, className: className }, target);
                _1.defineMetadataUnique(_1._COMPONENT_TYPE_, _1.IocComponentType.COMPONENT, target);
                _1.defineMetadataUnique(_1._DEFAULT_SCOPE_, _1.IocComponentScope.SINGLETON, target);
            }
            else {
                /**
                 * This is a named component applied to method.
                 */
                var factoryClassName = target.constructor && target.constructor.name;
                if (typeof descriptor.value !== 'function') {
                    throw new TypeError("Only class or class method can have a '" + TAG + "' decorator. " + target.constructor.name + "." + propertyKey + " decorated with " + TAG + "('" + componentName + "') is NOT a class or method");
                }
                debug("Defining named " + TAG + " \"" + componentName + "\" for class method \"" + factoryClassName + "." + propertyKey + "\"");
                /**
                 * Get return type of component getter method
                 */
                var rettype = Reflect.getMetadata(_1.RETURN_TYPE, target, propertyKey);
                className = rettype && rettype.name;
                index_1.setComponentIdentity({ componentName: componentName, className: className }, target, propertyKey);
                _1.defineMetadataUnique(_1._COMPONENT_TYPE_, _1.IocComponentType.COMPONENT, target, propertyKey);
                _1.defineMetadataUnique(_1._DEFAULT_SCOPE_, _1.IocComponentScope.SINGLETON, target, propertyKey);
            }
        };
    }
}
exports.Component = Component;
