import { Component } from '../../component';
import DB1 from './dbcontainer';

@Component
export default class ComponentWithDepsInvalid {
  private message: string = 'hello';

  constructor(public db: DB1, public client: string) {}

  get hello() {
    return this.message;
  }
}
