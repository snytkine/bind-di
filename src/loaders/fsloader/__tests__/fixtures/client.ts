import { Component } from '../../../../decorators/component';

@Component
export default class Client {
  private message = 'hello';

  echo() {
    return this.message;
  }
}
