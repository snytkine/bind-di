export type StringOrSymbol = string | symbol;
export type StringToString = { [key: string]: string };
export type StringToAny = { [key: string]: any };

/**
 * @todo add | void | never to possible types
 * T | void | never | undefined
 *
 * But then a bunch of functions will have to be rewritten
 * for example getComponentDetails, getComponent, isSameIdentity etc...
 *
 * Adding void to possible types will allow using type maybe as returnType of
 * functions that return some value or nothing.
 * for example
 * (val) => {
 *   if(val){
 *     return 'something'
 *   }
 * }
 *
 * This function returns string or undefined but as far as typescript is concerned
 * it returns string | void
 *
 */
export type Maybe<T> = T | undefined;

export function isDefined<T>(x: Maybe<T>): x is T {
  return x !== undefined && x !== null;
}

export function getOrElse<T>(x: Maybe<T>, defaultValue: T): T {
  return isDefined(x) ? x : defaultValue;
}

export type Constructor<T> = new (...args: any[]) => T;

export type ClassPrototype = {
  constructor: Function;
};

export type ComponentClassDecorator<T> = (target: Constructor<T>) => void;

export type ClassOrMethodDecorator<T> = (
  target: ClassPrototype | Constructor<any>,
  propertyKey?: string,
  descriptor?: TypedPropertyDescriptor<T>,
) => void;
