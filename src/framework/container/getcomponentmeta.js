"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../../");
exports.getComponentMeta = function (clazz) {
    return {
        identity: _1.getComponentIdentity(clazz),
        componentType: Reflect.getMetadata(_1._COMPONENT_TYPE_, clazz),
        componentMetaType: Reflect.getMetadata(_1._COMPONENT_META_TYPE_, clazz),
        scope: _1.getScope(clazz),
        propDependencies: _1.getPropDependencies(clazz),
        constructorDependencies: _1.getConstructorDependencies(clazz),
        provides: _1.getFactoryMethods(clazz),
        clazz: clazz,
        preDestroy: _1.getPredestroy(clazz),
        postConstruct: _1.getPostConstruct(clazz)
    };
};
