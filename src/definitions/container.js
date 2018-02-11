"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * APPLICATION (aka singleton) component created only the first time they requested
 * INSTANCE component is created using new keyword every time its requested
 * REQUEST one per request
 * SESSION one per http session
 *
 *
 * @important value must be in ORDER from smallest to largest lifecycle
 * This will be used in validation of dependency injection where
 * component with smaller lifecycle in not allowed to be injected
 * into component with larger lifecycle.
 *
 */
var IocComponentScope;
(function (IocComponentScope) {
    IocComponentScope[IocComponentScope["NEWINSTANCE"] = 1] = "NEWINSTANCE";
    IocComponentScope[IocComponentScope["CONTEXT"] = 2] = "CONTEXT";
    IocComponentScope[IocComponentScope["SESSION"] = 3] = "SESSION";
    IocComponentScope[IocComponentScope["SINGLETON"] = 4] = "SINGLETON";
})(IocComponentScope = exports.IocComponentScope || (exports.IocComponentScope = {}));
var IocComponentType;
(function (IocComponentType) {
    IocComponentType[IocComponentType["COMPONENT"] = 1] = "COMPONENT";
    IocComponentType[IocComponentType["FACTORY"] = 2] = "FACTORY";
})(IocComponentType = exports.IocComponentType || (exports.IocComponentType = {}));
