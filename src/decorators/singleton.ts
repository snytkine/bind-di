import {
    _COMPONENT_SCOPE_,
    defineMetadataUnique,
    getComponentName,
    IocComponentScope,
} from "../";

const debug = require('debug')('bind:decorator:scope');
const TAG = '@Singleton';

export function Singleton(target: Object) {
    debug(`Adding ${TAG} to component ${getComponentName(target)}`);
    defineMetadataUnique(_COMPONENT_SCOPE_, IocComponentScope.SINGLETON, target);
}


