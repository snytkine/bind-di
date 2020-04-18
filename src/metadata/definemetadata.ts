import { StringOrSymbol } from '../definitions';
import FrameworkError from '../exceptions/frameworkerror';
import getClassName from './getclassname';

const defineMetadata = (
  metadataKey: any,
  metadataValue: any,
  target: Object,
  propertyKey?: StringOrSymbol,
) => (isUnique: boolean = false) => {
  const className = getClassName(target);
  if (isUnique && Reflect.hasMetadata(metadataKey, target, propertyKey)) {
    const err = `Target ${className} already has metadata with metadataKey="${metadataKey.toString()}" for propertyKey="${String(
      propertyKey,
    )}"`;
    throw new FrameworkError(err);
  }

  try {
    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
  } catch (e) {
    throw new FrameworkError(
      `Exception in defineMetadata for ${className}.${String(propertyKey)} error=${e.message}`,
      e,
    );
  }

  // Need for decorating instances on classes?
  // Why were these prototype and constructor things here?
  // Why adding metadata of prototype of constructor?
  // Has something to do with factory component? When commented these out got
  // exception Factory component componentName ... is not providing any components
  // if (target['prototype']) {
  // Reflect.defineMetadata(metadataKey, metadataValue, target["prototype"], propertyKey);
  // } else if (target.constructor) {
  // Need for decorating properties on properties of a prototype
  // without adding metadata on target.constructor getting this exception
  // exception Factory component componentName ... is not providing any components
  // this is because in case of decorator applied to class properties and methods
  // the target is a prototype and not a constructor like in case of decorating class
  // Reflect.defineMetadata(metadataKey, metadataValue, target.constructor, propertyKey);
  // }
};

export default defineMetadata;
