import {
    _COMPONENT_SCOPE_,
    _DEFAULT_SCOPE_,
    defineMetadataUnique,
    getComponentName,
    IocComponentScope,
} from "../";

const debug = require('debug')('bind:decorator:scope');
const TAG = '@Scope';

export function Scope(scope: IocComponentScope) {

    return function (target: Object) {
        debug(`Adding ${TAG} to component ${getComponentName(target)}`);
        defineMetadataUnique(_COMPONENT_SCOPE_, scope, target);
    }
}


export function getScope(target: Object, propertyKey = undefined): IocComponentScope {

    const cName = getComponentName(target);
    let scope = Reflect.getMetadata(_COMPONENT_SCOPE_, target, propertyKey);

    debug(`${TAG} for component "${cName}"=${scope}`);
    if (!scope) {
        scope = Reflect.getMetadata(_DEFAULT_SCOPE_, target, propertyKey);
        debug(`Using Default Scope="${IocComponentScope[scope]}" for "${cName}"`)
    }

    return scope;
}