import { Component } from '../../../decorators';
import DB1 from './dbcomponent';
import DB2 from './db2';

export default class FactoryComponent {
  private message: string = 'hello';

  constructor(public db: DB1) {}

  @Component('db-connection')
  connection(): DB2 {
    return this.db;
  }

  get hello() {
    return this.message;
  }
}
