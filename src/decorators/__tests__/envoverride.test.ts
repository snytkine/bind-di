import { Component1, SYM_KEY } from './fixtures/component1';

describe('test of EnvOverride decorator', () => {
  beforeEach(() => {
    delete process.env.myport;
  });

  test('EnvOverride should have no effect when process.env does not have the set key', () => {
    const o = new Component1();
    expect(o.myhost).toEqual('localhost');
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
});
