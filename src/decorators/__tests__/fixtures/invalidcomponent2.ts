import { Component } from '../../component';

export default class BadComponent2 {
  private message: string = 'HELLO';

  @Component
  myComponent() {
    return this.message;
  }
}
