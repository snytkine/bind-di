"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var consts_1 = require("../definitions/consts");
var debug = require('debug')('bind:decorator:inject');
var TAG = "@Inject";
function Inject(nameOrTarget, propertyKey, parameterIndex) {
    var name;
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
                throw new TypeError(TAG + " can only be applied to constructor function of class property. Was applied to method " + name + "." + propertyKey + " index " + parameterIndex);
            }
            debug(TAG + " called on \"" + name + "." + propertyKey + "\"");
            var rt = Reflect.getMetadata(consts_1.DESIGN_TYPE, nameOrTarget, propertyKey); // rt is class Classname{}
            debug(TAG, "rt=", rt);
            /**
             * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
             * and it must be an object that is itself a component
             * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
             * But it may be non an annotated component in case if this component is not a regular class
             * but a component that is produced by a factory, in which case it does not have decorator at all
             *
             */
            var injectName = rt && _1.getComponentName(rt);
            var injectClassName = rt && _1.getClassName(rt);
            debug(TAG + " DESIGN_TYPE of property \"" + name + "." + propertyKey + "\" is " + injectName);
            if (!rt) {
                throw new TypeError("Could not determine the dependency name for injected component \"" + name + "." + propertyKey + "\". Consider using named dependency using @Inject(\"some_name\") instead of just @Inject");
            }
            if (_1.INVALID_COMPONENT_NAMES.includes(injectName)) {
                throw new TypeError("Dependency name for property \"" + name + "." + propertyKey + "\"  is not an allowed name for dependency component: \"" + injectName + "\"");
            }
            /**
             * If return type was not provided (same case when only Interface was provided)
             * then injectName will be 'Object'
             * This is not allowed.
             */
            debug("Adding " + TAG + " metadata for propertyKey=\"" + propertyKey + "\" dependencyName=\"" + injectName + "\" for target=\"" + name + "\"");
            _1.defineMetadataUnique(_1._PROP_DEPENDENCY_, _1.Identity(injectName, injectClassName), nameOrTarget, propertyKey);
            /**
             * The actual target object may not have this property defined because typesceipt compiler will not
             * add a property if it does not have a value.
             */
            if (!nameOrTarget.hasOwnProperty(propertyKey)) {
                Object.defineProperty(nameOrTarget, propertyKey, { value: void 0 });
                debug(TAG + " added property " + propertyKey + " to prototype of " + name);
            }
        }
        else {
            // No propertyKey. In this case must have parameterIndex
            if (parameterIndex !== 0 && !parameterIndex) {
                throw new TypeError(TAG + " is applied to constructor of " + name + " but parameterIndex is not passed");
            }
            /**
             *
             * Applied to constructor function
             * In this case nameOrTarget is class (has .constructor and .constructor.name)
             * propertyKey is undefined
             * has parameterIndex
             */
            var pt = Reflect.getMetadata(_1.PARAM_TYPES, nameOrTarget); // rt is class Classname{}
            if (!pt[parameterIndex] || !pt[parameterIndex].name) {
                throw new TypeError("Error adding " + TAG + " to \"" + _1.getComponentName(nameOrTarget) + "\" Type of parameter for constructor function is not available for parameterIndex " + parameterIndex);
            }
            /**
             * pt is array [0 => class Person, 1=> String] objects have .name string has .name == String
             * for undeclared type it will be Object with .name === "Object"
             * can also be "Number" and "Boolean" for primitives like :number or :boolean
             */
            if (_1.INVALID_COMPONENT_NAMES.includes(pt[parameterIndex].name)) {
                throw new TypeError("Injected parameter at index " + parameterIndex + " in constructor function is not an allowed name for constructor injection component: \"" + pt[parameterIndex].name + "\"");
            }
            debug(TAG, "pt=", pt);
            var compName = _1.getComponentName(pt[parameterIndex]);
            debug(TAG, "got component name", compName);
            addConstructorDependency(nameOrTarget, _1.Identity(compName, compName), parameterIndex);
        }
    }
    else {
        var injectName_1 = nameOrTarget;
        return function (target, propertyKey, parameterIndex) {
            // targetName is name of component
            var targetName = _1.getComponentName(target);
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
                    throw new TypeError(TAG + " can only be applied to constructor function of class property. Was applied to method \"" + targetName + "." + propertyKey + "\" index " + parameterIndex);
                }
                debug(TAG + " called with dependency name=\"" + nameOrTarget + "\" on \"" + targetName + "." + propertyKey + "\"");
                var rt = Reflect.getMetadata(consts_1.DESIGN_TYPE, target, propertyKey); // rt is class Classname{}
                debug(TAG, "rt=", rt);
                if (!rt) {
                    debug(TAG, "Failed to get return type of propertyKey=\"" + propertyKey + "\" of target=\"" + targetName + "\"");
                }
                /**
                 * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
                 * and it must be an object that is itself a component
                 * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
                 * But it may be non an annotated component in case if this component is not a regular class
                 * but a component that is produced by a factory, in which case it does not have decorator at all
                 *
                 */
                var className = rt && _1.getClassName(rt);
                debug(TAG + " className of injected property \"" + targetName + "." + propertyKey + "\" is \"" + className + "\"");
                /**
                 * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
                 * and it must be an object that is itself a component
                 * If its a decorated component then it will have a _COMPONENT_IDENTITY_ metadata
                 * But it may be non an annotated component in case if this component is not a regular class
                 * but a component that is produced by a factory, in which case it does not have decorator at all
                 *
                 */
                _1.defineMetadataUnique(_1._PROP_DEPENDENCY_, _1.Identity(injectName_1, className), target, propertyKey);
                /**
                 * The actual target object may not have this property defined because typesceipt compiler will not
                 * add a property if it does not have a value.
                 * So we must add property to prototype manually, setting the undefined as a value
                 *
                 * MUST must make this property writable explicitly otherwise the default readonly type is used
                 * and then injector will not be able to set the injected value
                 */
                if (!target.hasOwnProperty(propertyKey)) {
                    Object.defineProperty(target, propertyKey, { value: void 0, writable: true });
                    debug(TAG + " added property " + propertyKey + " to prototype of " + targetName);
                }
            }
            else {
                // No propertyKey
                if (parameterIndex !== 0 && !parameterIndex) {
                    throw new TypeError(TAG + " is applied to constructor of \"" + _1.getComponentName(target) + "\" but parameterIndex is not passed [ERROR INJECT-129]");
                }
                var pt = Reflect.getMetadata(_1.PARAM_TYPES, target); // rt is class Classname{}
                if (!pt[parameterIndex] || !pt[parameterIndex].name) {
                    throw new TypeError("Error adding " + TAG + " to \"" + _1.getComponentName(nameOrTarget) + "\" Type of parameter for constructor function is not available for parameterIndex " + parameterIndex);
                }
                var className = _1.getClassName(pt[parameterIndex]);
                debug(TAG + " inferred className=\"" + className + "\" for constructor dependency name \"" + injectName_1 + "\" at index \"" + parameterIndex + "\"");
                /**
                 *
                 * Applied to constructor function
                 * In this case nameOrTarget is class (has .constructor and .constructor.name)
                 * propertyKey is undefined
                 * has parameterIndex
                 */
                addConstructorDependency(target, _1.Identity(injectName_1, className), parameterIndex);
            }
        };
    }
}
exports.Inject = Inject;
function addConstructorDependency(target, dependency, parameterIndex) {
    var deps = Reflect.getMetadata(_1._CTOR_DEPENDENCIES_, target) || [];
    var name = _1.getComponentName(target);
    debug("Adding Constructor dependency  \"" + dependency + "\" for component=\"" + name + "\". Existing dependencies=" + JSON.stringify(deps));
    deps.push({
        parameterIndex: parameterIndex,
        dependency: dependency
    });
    Reflect.defineMetadata(_1._CTOR_DEPENDENCIES_, deps, target);
    /**
     * Do we need to also add same meta to prototype?
     * Right now I don't see a need for it.
     */
}
exports.addConstructorDependency = addConstructorDependency;
function getConstructorDependencies(target) {
    var ret = Reflect.getMetadata(_1._CTOR_DEPENDENCIES_, target);
    if (ret) {
        debug("Found component _CTOR_DEPENDENCIES_ from metadata: ", ret);
        var sorted = [];
        var _loop_1 = function (i) {
            sorted.push(ret.find(function (_) { return _.parameterIndex === i; }));
            if (!sorted[i]) {
                throw new TypeError("Constructor is missing @Inject decorator for parameter " + i + " for component " + target.name);
            }
        };
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
        for (var i = 0; i < ret.length; i += 1) {
            _loop_1(i);
        }
        return sorted;
    }
    else {
        debug("NOT FOUND constructor dependencies for component " + _1.getComponentName(target));
        return [];
    }
}
exports.getConstructorDependencies = getConstructorDependencies;
function getPropDependencies(target) {
    //let x = Reflect.Metadata.get(target);
    var methods = Object.getOwnPropertyNames(target.prototype);
    var cName = _1.getComponentName(target);
    debug(TAG + " property names of target \"" + cName + "\"", methods);
    var dependencies = methods.filter(function (p) { return Reflect.hasMetadata(_1._PROP_DEPENDENCY_, target, p); }).map(function (p) {
        return { propertyName: p, dependency: Reflect.getMetadata(_1._PROP_DEPENDENCY_, target, p) };
    });
    debug(TAG + " returning prop dependencies for \"" + cName + "\"=", dependencies);
    return dependencies;
}
exports.getPropDependencies = getPropDependencies;
