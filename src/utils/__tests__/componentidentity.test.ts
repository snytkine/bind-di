import { ComponentIdentity } from '../componentidentity';

class PlainClass {
  public message = 'HELLO';
}

describe('Test of ComponentIdentity class', () => {
  test('Should create new instance of ComponentIdentity', () => {
    const res = new ComponentIdentity('test', PlainClass);

    expect(res).toBeInstanceOf(ComponentIdentity);
  });

  test('Should create string representation of ComponentIdentity', () => {
    const res = new ComponentIdentity('test', PlainClass);

    expect(res.toString()).toEqual('componentName=test className=PlainClass');
  });

  test('Should create string representation of ComponentIdentity with Symbol for name', () => {
    const res = new ComponentIdentity(Symbol('id1'), PlainClass);

    expect(res.toString()).toEqual('componentName=Symbol(id1) className=PlainClass');
  });
});
