export type StringOrSymbol = string | symbol;
export type StringToString = { [key: string]: string };
export type StringToAny = { [key: string]: any };

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
