/**
 * This decorator alters class constructor
 * to return a new class that extends target
 * the return class constructor creates a Proxy
 * object that will look for properties
 * in process.env before returning property
 * from actual object.
 *
 * @param target
 * @constructor
 *
 */
export default function EnvOverride<T extends { new (...args: any[]): {} }>(target: T): T {
  const ret = class EnvProxy extends target {
    constructor(...args: any[]) {
      super(args);

      return new Proxy(this, {
        get(obj, property) {
          if (typeof property === 'string') {
            /**
             * Convert to String because if property
             * is number it can only possibly be set as env var as a string
             */
            return process.env[property] || obj[property];
          }

          return obj[property];
        },
        has(obj, p) {
          return Reflect.has(obj, p);
        },
        ownKeys(obj) {
          return Object.getOwnPropertyNames(obj);
        },
        getOwnPropertyDescriptor(obj, p) {
          return Object.getOwnPropertyDescriptor(obj, p);
        },
      });
    }
  };

  return ret;
}
