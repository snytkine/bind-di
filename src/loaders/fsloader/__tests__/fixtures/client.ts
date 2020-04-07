import { Component } from '../../../../decorators/component';

@Component
export class Client {
  private message = 'hello';

  constructor() {}

  echo() {
    return this.message;
  }
}
