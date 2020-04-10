import { Component } from '../../../../../decorators/component';

@Component('item')
export default class Item {
  @Component('id1')
  public id = 1;
}
