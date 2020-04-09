import { Component } from '../../component';
import DB1 from './dbcontainer';
import Client from './client';

@Component
export default class ComponentWithDeps {


  private message: string = 'hello';

  constructor(public db: DB1, public client: Client) {}

  get hello(){
    return this.message
  }
}

