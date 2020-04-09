import { Component } from '../../component';

export default class BadComponent1 {

  private message: string = 'HELLO';

  @Component('message')
  get myComponent(){
    return this.message
  }
}
