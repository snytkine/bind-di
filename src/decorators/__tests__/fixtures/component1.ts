import EnvOverride from '../../envoverride';

export const SYM_KEY = Symbol('sym port');

@EnvOverride
export class Component1 {
  public myport: string = '8080';

  public myhost = 'localhost';

  constructor(public myprop = 'val123') {}

  public [SYM_KEY] = 'test-test';
}
