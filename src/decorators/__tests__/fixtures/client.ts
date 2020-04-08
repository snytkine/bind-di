import { Component } from '../../component';

@Component
export default class Client {
  private data = ['a', 'b'];

  getData() {
    return this.data;
  }
}
