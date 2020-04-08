import { Component1, SYM_KEY } from './fixtures/component1';
import Component2 from './fixtures/component2';
import { EnvOverride } from '../index';

describe('test of EnvOverride decorator', () => {
  beforeEach(() => {
    delete process.env.myport;
  });

  test('EnvOverride should have no effect when process.env does not have the set key', () => {
    const o = new Component1();
    expect(o.myhost).toEqual('localhost');
  });

  test('Proxy object should pass constructor arguments to parent unchanged', () => {
    const o = new Component1('abcd1234');
    expect(o.myprop).toEqual('abcd1234');
  });

  test('EnvOverride should override value of port is it is set in process.env.port', () => {
    process.env.myport = 'test123';
    const o = new Component1();
    expect(o.myport).toEqual('test123');
  });

  test('EnvOverride should return value for object key of type Symbol', () => {
    process.env.myport = 'test123';
    const o = new Component1();
    expect(o[SYM_KEY]).toEqual('test-test');
  });

  // getOwnPropertyDescriptor
  test('getOwnPropertyDescriptor should return result from host object', () => {
    // const o = new Component2();
    const Proxied = EnvOverride(Component2);
    const obj = new Component2();
    const oProxied = new Proxied();
    expect(obj === oProxied).toEqual(false);
    expect(Object.getOwnPropertyNames(obj)).toEqual(Object.getOwnPropertyNames(oProxied));
  });
});
