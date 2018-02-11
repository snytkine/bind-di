"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var debug = require('debug')('bind:decorator:scope');
var TAG = '@Singleton';
function Singleton(target) {
    debug("Adding " + TAG + " to component " + _1.getComponentName(target));
    _1.defineMetadataUnique(_1._COMPONENT_SCOPE_, _1.IocComponentScope.SINGLETON, target);
}
exports.Singleton = Singleton;
