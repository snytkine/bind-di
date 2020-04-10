import { getComponentIdentity } from '../index';
import { FrameworkError } from '../../exceptions';
import { COMPONENT_IDENTITY, UNNAMED_COMPONENT } from '../../consts';
import { Component } from '../../decorators/component';
import FactoryComponent from './fixtures/factory';
import DB2 from './fixtures/db2';
import MyPlainClass from './fixtures/myplainclass';
import MyLogger from './fixtures/mylogger';

describe('Test of getComponentIdentity function', () => {
  beforeEach(() => {
    Reflect.deleteMetadata(COMPONENT_IDENTITY, MyPlainClass);
    Reflect.deleteMetadata(COMPONENT_IDENTITY, MyPlainClass.prototype);
  });

  test('should throw if target is not an object', () => {
    let error;
    try {
      getComponentIdentity('my string');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('should return Identity for a plain class based on class', () => {
    const res = getComponentIdentity(MyPlainClass);

    expect(res).toEqual({
      name: UNNAMED_COMPONENT,
      targetClass: MyPlainClass,
    });
  });

  test('should return Identity for sub-class of decorated class', () => {
    const res = getComponentIdentity(MyLogger);

    expect(res).toEqual({
      name: UNNAMED_COMPONENT,
      targetClass: MyLogger,
    });
  });

  test('should return Identity for a Component decorated class', () => {
    Component('my-component')(MyPlainClass);
    const res = getComponentIdentity(MyPlainClass);

    expect(res).toEqual({
      name: 'my-component',
      targetClass: MyPlainClass,
    });
  });

  test('test of factory-provided component', () => {
    const identity = getComponentIdentity(FactoryComponent, 'connection');

    expect(identity).toEqual({
      name: 'db-connection',
      targetClass: DB2,
    });
  });

  test('should return undefined for class property that is not decorated with @Component', () => {
    const identity = getComponentIdentity(MyPlainClass, 'greet');

    expect(identity).toBeUndefined();
  });
});
