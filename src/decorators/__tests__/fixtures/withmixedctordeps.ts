import { Component } from '../../component';
import Client from './client';
import { Inject } from '../../inject';

@Component
export default class ComponentWithDeps2 {
  private message: string = 'hello';

  constructor(@Inject('greeter') public greeter, public client: Client) {}

  get hello() {
    return this.message;
  }
}
