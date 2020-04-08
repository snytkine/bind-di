import { Component } from '../../component';

@Component
export default class DB1 {
  private conn = 'connection1';

  get connection() {
    return this.conn;
  }
}
