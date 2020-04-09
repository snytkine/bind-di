import { Component } from '../../component';

@Component('greeter')
export default class NamedComponent {

  private message = 'Hello';

  greet(name: string){
    return `${this.message} ${name}`
  }
}
