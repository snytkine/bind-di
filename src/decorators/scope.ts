import {
    _COMPONENT_SCOPE_,
    _DEFAULT_SCOPE_,
    defineMetadataUnique,
    defineMetadata,
    getComponentName,
    IocComponentScope,
    StringOrSymbol
} from "../";
import {
    getComponentIdentity
} from "../metadata/index";

const debug = require('debug')('bind:decorator:scope');
const TAG = '@Scope';

export function Scope(scope: IocComponentScope) {

    /**
     * @todo allow adding scope on Factory-Provided components
     * for that need to also add propertyKey
     */
    return function (target: Object, propertyKey?: StringOrSymbol) {
        debug(`Adding ${TAG} to component ${String(getComponentName(target))}`);
        defineMetadata(_COMPONENT_SCOPE_, scope, target, propertyKey);
    }
}

export const Singleton = Scope(IocComponentScope.SINGLETON);
export const NewInstance = Scope(IocComponentScope.NEWINSTANCE);
export const ContextScope = Scope(IocComponentScope.CONTEXT);

export function getScope(target: Object, propertyKey?: StringOrSymbol): IocComponentScope {


    const cid = getComponentIdentity(target, propertyKey);
    const cName = String(cid.componentName);
    const className = cid.className;


    let scope = Reflect.getMetadata(_COMPONENT_SCOPE_, target, propertyKey);

    debug(`${TAG} getScope for componentName "${cName}" className="${className}" ${String(scope)}, propertyKey=${String(propertyKey)}`);

    if (!scope) {

        scope = Reflect.getMetadata(_DEFAULT_SCOPE_, target, propertyKey);
        scope && debug(`Scope not found but found Default Scope="${IocComponentScope[scope]}" for "${String(cName)}" propertyKey=${String(propertyKey)}`)
    }

    return scope;
}
