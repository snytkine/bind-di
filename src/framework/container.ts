import {IfIocComponent, IfIocContainer} from "../definitions/container";
import {Try, TryCatch} from "./try";
const debug = require('debug')('bind:ioc');

export class Container<T> implements IfIocContainer<T> {

  private readonly store_: Map<string, IfIocComponent<T>>;
  private initialized = false;

  constructor() {
    this.store_ = new Map<string, IfIocComponent<T>>();
  }


  has(name: string) {
    return this.store_.has(name);
  }

  get(name: string, ctx?: T): Try<any, Error> {

    debug(`Entered get. Requesting '${name}' with context: ${!!(ctx)}`);

    const o = this.store_.get(name);

    if (!o) {

     return {
       Success: null,
       Failure: new ReferenceError(`Component '${name}' not found in container`)
     }

    }


    return TryCatch(() => {

      debug(`Calling get() on Component ${name}`);

      return o.get(ctx);

    })

  }

}