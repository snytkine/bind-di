"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var debug = require('debug')('bind:decorator:lifecycle');
function PostConstruct(target, propertyKey, descriptor) {
    debug("Adding @PostConstruct decorator to " + target.name + " for method " + propertyKey);
    _1.defineMetadataUnique(_1._INIT_METHOD_, propertyKey, target);
    /**
     * target is a prototype of class in this case
     * we also need to define this on constructor method
     * to be able to get the value of this meta by passing just a class
     * (in which case it actually is passing a constructor)
     */
    _1.defineMetadataUnique(_1._INIT_METHOD_, propertyKey, target.constructor);
}
exports.PostConstruct = PostConstruct;
function PreDestroy(target, propertyKey, descriptor) {
    debug("Adding @PreDestroy decorator to " + target.name + " for method " + propertyKey);
    _1.defineMetadataUnique(_1._DESTRUCTOR_, propertyKey, target);
    /**
     * target is a prototype of class in this case
     * we also need to define this on constructor method
     * to be able to get the value of this meta by passing just a class
     * (in which case it actually is passing a constructor)
     */
    _1.defineMetadataUnique(_1._DESTRUCTOR_, propertyKey, target.constructor);
}
exports.PreDestroy = PreDestroy;
function getPredestroy(target) {
    return Reflect.getMetadata(_1._DESTRUCTOR_, target);
}
exports.getPredestroy = getPredestroy;
function getPostConstruct(target) {
    return Reflect.getMetadata(_1._INIT_METHOD_, target);
}
exports.getPostConstruct = getPostConstruct;
