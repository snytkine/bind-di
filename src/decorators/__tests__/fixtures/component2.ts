import { SYM_KEY } from './component1';

export default class Component2 {
  public myport: string = '8080';

  public myhost = 'localhost';

  constructor(public myprop = 'val123') {}

  public [SYM_KEY] = 'test-test';
}
