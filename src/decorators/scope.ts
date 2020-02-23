import {
    COMPONENT_SCOPE,
    DEFAULT_SCOPE,
    defineMetadata,
    getComponentName,
    StringOrSymbol,
} from '../';
import {
    getClassName,
    getComponentIdentity,
} from '../metadata/index';

import { ComponentScope } from '../enums/componentscope';

const debug = require('debug')('bind:decorator:scope');
const TAG = '@Scope';

export function Scope(scope: ComponentScope) {

    /**
     * @todo allow adding scope on Factory-Provided components
     * for that need to also add propertyKey
     */
    return function (target: Object, propertyKey?: StringOrSymbol) {
        debug(`Adding ${TAG} to component ${String(getComponentName(target))} className=${getClassName(target)}`);
        defineMetadata(COMPONENT_SCOPE, scope, target, propertyKey)();
    };
}

export const Singleton = Scope(ComponentScope.SINGLETON);
export const NewInstance = Scope(ComponentScope.NEWINSTANCE);
export const RequestScoped = Scope(ComponentScope.REQUEST);

export function getScope(target: Object, propertyKey?: StringOrSymbol): ComponentScope {

    const cid = getComponentIdentity(target, propertyKey);
    const cName = String(cid.componentName);
    const className = cid?.clazz?.name;

    let scope = Reflect.getMetadata(COMPONENT_SCOPE, target, propertyKey);

    debug(`${TAG} getScope for componentName "${cName}" 
    className="${className}" ${String(scope)}, 
    propertyKey=${String(propertyKey)}`);

    if (!scope) {

        scope = Reflect.getMetadata(DEFAULT_SCOPE, target, propertyKey);
        /**
         *
         */
        scope && debug(`Scope not found but found Default Scope="${ComponentScope[scope]}" 
        for "${String(cName)}" propertyKey=${String(propertyKey)}`);
    }

    return scope;
}
