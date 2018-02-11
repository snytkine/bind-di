"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var debug = require('debug')('bind:decorator:scope');
var TAG = '@Scope';
function Scope(scope) {
    return function (target) {
        debug("Adding " + TAG + " to component " + _1.getComponentName(target));
        _1.defineMetadataUnique(_1._COMPONENT_SCOPE_, scope, target);
    };
}
exports.Scope = Scope;
function getScope(target, propertyKey) {
    if (propertyKey === void 0) { propertyKey = undefined; }
    var cName = _1.getComponentName(target);
    var scope = Reflect.getMetadata(_1._COMPONENT_SCOPE_, target, propertyKey);
    debug(TAG + " for component \"" + cName + "\"=" + scope);
    if (!scope) {
        scope = Reflect.getMetadata(_1._DEFAULT_SCOPE_, target, propertyKey);
        debug("Using Default Scope=\"" + _1.IocComponentScope[scope] + "\" for \"" + cName + "\"");
    }
    return scope;
}
exports.getScope = getScope;
