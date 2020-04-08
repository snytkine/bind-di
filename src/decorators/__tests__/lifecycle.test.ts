import { getPostConstruct, getPredestroy, PostConstruct, PreDestroy } from '../lifecycle';
import Factory from './fixtures/factory';
import { FrameworkError } from '../../exceptions';
import { INIT_METHOD, PRE_DESTROY } from '../../consts';

describe('Test of component lifecicle decorators', () => {
  test('Should return name of INIT lifecycle method', () => {
    const myInit = getPostConstruct(Factory);
    /**
     * Factory is constructor method
     * the PostConstruct defined the value on constructor
     * and on prototype
     * Also should be defined on prototype
     */
    const myProtoInit = getPostConstruct(Factory.prototype);
    expect(myInit).toEqual('setup');
    expect(myProtoInit).toEqual('setup');
  });

  test('Should throw FrameworkError when trying to add PostConstruct twice', () => {
    let error;
    try {
      PostConstruct(Factory.prototype, 'setup', { value: () => undefined });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('Should throw FrameworkError when trying to add PreDestroy twice', () => {
    let error;
    try {
      PreDestroy(Factory.prototype, 'onexit', { value: () => undefined });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('Should return name of PRE_DESTROY lifecycle method', () => {
    const myInit = getPredestroy(Factory);
    const myProtoPreDestroy = getPredestroy(Factory.prototype);
    expect(myInit).toEqual('exit');
    expect(myProtoPreDestroy).toEqual('exit');
  });

  test('getPredestroy Should return undefined if PRE_DESTROY not set', () => {
    Reflect.deleteMetadata(PRE_DESTROY, Factory);
    const myProtoPreDestroy = getPredestroy(Factory);
    expect(myProtoPreDestroy).toBeUndefined();
  });

  test('getPostconstruct Should return undefined if PRE_DESTROY not set', () => {
    Reflect.deleteMetadata(INIT_METHOD, Factory);
    const myPostconstruct = getPostConstruct(Factory);
    expect(myPostconstruct).toBeUndefined();
  });
});
