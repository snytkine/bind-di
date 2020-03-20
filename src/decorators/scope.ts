import { COMPONENT_SCOPE, DEFAULT_SCOPE } from '../consts';

import { ComponentScope } from '../enums';
import { StringOrSymbol, Target } from '../definitions';
import getComponentName from '../metadata/getcomponentname';
import getClassName from '../metadata/getclassname';
import defineMetadata from '../metadata/definemetadata';
import getComponentIdentity from '../metadata/getcomponentidentity';

const debug = require('debug')('bind:decorator:scope');

const TAG = '@Scope';

export function Scope(scope: ComponentScope) {
  /**
   * Allow adding scope on Factory-Provided components
   * for that need to also add propertyKey
   */
  return (target: Target, propertyKey?: StringOrSymbol) => {
    debug(
      '%s Adding scope %s to component "%s" className="%s"',
      TAG,
      scope,
      String(getComponentName(target)),
      getClassName(target),
    );

    defineMetadata(COMPONENT_SCOPE, scope, target, propertyKey)();
  };
}

export const Singleton = Scope(ComponentScope.SINGLETON);
export const NewInstance = Scope(ComponentScope.NEWINSTANCE);

export function getScope(target: Object, propertyKey?: StringOrSymbol): ComponentScope {
  const cid = getComponentIdentity(target, propertyKey);
  const cName = String(cid.componentName);
  const className = cid?.clazz?.name;

  let scope = Reflect.getMetadata(COMPONENT_SCOPE, target, propertyKey);

  debug(
    '%s getScope for componentName "%s" className="%s" scope="%s", propertyKey="%s"',
    TAG,
    cName,
    className,
    String(scope),
    String(propertyKey),
  );

  if (!scope) {
    scope = Reflect.getMetadata(DEFAULT_SCOPE, target, propertyKey);

    if (scope) {
      debug(
        '%s Scope not found but found Default Scope="%s" for "%s" propertyKey="%s"',
        TAG,
        ComponentScope[scope],
        String(cName),
        String(propertyKey),
      );
    }
  }

  return scope;
}
