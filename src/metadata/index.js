"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var _1 = require("../");
var debug = require('debug')('bind:decorator');
exports.INVALID_COMPONENT_NAMES = ["Object", "String", "Number", "Boolean"];
function Identity(componentName, className) {
    return { componentName: componentName, className: className };
}
exports.Identity = Identity;
function defineMetadataUnique(metadataKey, metadataValue, target, propertyKey) {
    // Need for prototype decorating class and for properties on class instances
    if (Reflect.hasMetadata(metadataKey, target, propertyKey)) {
        var className = getClassName(target);
        throw new TypeError("Target " + className + " already has metadata with metadataKey=\"" + metadataKey.toString() + "\" for propertyKey=\"" + propertyKey + "\"");
    }
    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
    // Need for decorating instances on classes
    if (target['prototype']) {
        Reflect.defineMetadata(metadataKey, metadataValue, target['prototype'], propertyKey);
    }
    else if (target.constructor) {
        // Need for decorating properties on properties of a prototype
        Reflect.defineMetadata(metadataKey, metadataValue, target.constructor, propertyKey);
    }
}
exports.defineMetadataUnique = defineMetadataUnique;
function setComponentIdentity(identity, target, propertyKey) {
    return defineMetadataUnique(_1._COMPONENT_IDENTITY_, identity, target, propertyKey);
}
exports.setComponentIdentity = setComponentIdentity;
function getComponentIdentity(target) {
    var ret = Reflect.getMetadata(_1._COMPONENT_IDENTITY_, target);
    if (ret) {
        debug("Found className from _COMPONENT_IDENTITY_ metadata ", ret);
        return ret;
    }
    else {
        return void 0;
    }
}
exports.getComponentIdentity = getComponentIdentity;
/**
 * Get the name of component from class or instance
 * use metadata value if available, otherwise use the .name of class or .name of constructor.prototype
 * @param {Object} component
 * @returns {string}
 */
function getComponentName(target) {
    if (target) {
        var ret = Reflect.getMetadata(_1._COMPONENT_IDENTITY_, target);
        if (ret) {
            debug("Found component name from _COMPONENT_IDENTITY_ metadata ", ret);
            return ret.componentName;
        }
        else if (target['name']) {
            debug("Found component name in .name property \"" + target['name'] + "\"");
            return target['name'];
        }
        else if (target.constructor && target.constructor.name) {
            debug("Found component name in constructor.name \"" + target.constructor.name + "\"");
            return target.constructor.name;
        }
    }
}
exports.getComponentName = getComponentName;
function getClassName(target) {
    if (target) {
        var ret = Reflect.getMetadata(_1._COMPONENT_IDENTITY_, target);
        if (ret) {
            debug("Found className from _COMPONENT_IDENTITY_ metadata ", ret);
            return ret.className;
        }
        else if (target['name']) {
            debug("Found className in .name property \"" + target['name'] + "\"");
            return target['name'];
        }
        else if (target.constructor && target.constructor.name) {
            debug("Found className in constructor.name \"" + target.constructor.name + "\"");
            return target.constructor.name;
        }
    }
}
exports.getClassName = getClassName;
