import { Component } from '../../component';
import DB1 from './dbcontainer';
import Client from './client';

export default class FactoryComponent {
  private message: string = 'hello';

  constructor(public db: DB1, public client: Client) {}

  @Component('db-connection')
  connection() {
    return this.db.connection;
  }

  get hello() {
    return this.message;
  }
}
