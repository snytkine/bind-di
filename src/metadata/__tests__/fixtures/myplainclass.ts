import User from './user';

export default class MyPlainClass {
  private readonly user: User;

  constructor() {
    this.user = new User();
  }

  greet(): User {
    return this.user;
  }
}
