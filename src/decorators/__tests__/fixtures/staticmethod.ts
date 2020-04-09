import { Component } from '../../component';

export default class StaticMethod {

  private message: string = 'HELLO';

  @Component('message')
  static myComponent(){
    return 'OK'
  }
}
