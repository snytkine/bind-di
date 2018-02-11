"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var debug = require('debug')('bind:decorator:factory');
var TAG = '@Factory';
/**
 * Factory decorator can be applied only to class
 * Factory cannot be a named component. Name is always inferred from class name
 *
 * @param target class
 * @constructor
 */
function Factory(target) {
    var componentName, className;
    /**
     * Since factory components are not names expliciely, the componentName and className are the same,
     * the name of the class is used
     */
    componentName = className = _1.getComponentName(target);
    debug("Defining unnamed " + TAG + " for class \"" + componentName + "\"");
    _1.setComponentIdentity({ componentName: componentName, className: className }, target);
    _1.defineMetadataUnique(_1._COMPONENT_TYPE_, _1.IocComponentType.FACTORY, target);
    _1.defineMetadataUnique(_1._DEFAULT_SCOPE_, _1.IocComponentScope.SINGLETON, target);
    /**
     * Must also define _SCOPE_ with value of SINGLETON because Factory must always be singleton
     * component. Defining this score now will prevent adding @Scope annotation on Factory component
     */
    _1.defineMetadataUnique(_1._COMPONENT_SCOPE_, _1.IocComponentScope.SINGLETON, target);
}
exports.Factory = Factory;
function getFactoryMethods(target) {
    var methods = Object.getOwnPropertyNames(target.prototype);
    var cName = _1.getComponentName(target);
    debug(TAG + " property names of target \"" + cName + "\"", methods);
    var factoryMethods = methods.filter(function (m) { return Reflect.hasMetadata(_1._COMPONENT_IDENTITY_, target, m); }).map(function (m) {
        return { "methodName": m, "providesComponent": Reflect.getMetadata(_1._COMPONENT_IDENTITY_, target, m) };
    });
    debug(TAG + " factory methods of \"" + cName + "\"=", factoryMethods);
    return factoryMethods;
}
exports.getFactoryMethods = getFactoryMethods;
