import FactoryComponent from './fixtures/factorycomponent';
import DB1 from './fixtures/dbcontainer';
import { Component, getFactoryMethods, ConstructorDependency } from '../component';
import { ComponentIdentity } from '../../utils';
import { COMPONENT_IDENTITY, UNNAMED_COMPONENT } from '../../consts';
import DecoratorError from '../../exceptions/decoratorerror';
import ComponentWithDeps from './fixtures/componentwithctordeps';
import { getConstructorDependencies } from '../inject';
import Client from './fixtures/client';
import ComponentWithDeps2 from './fixtures/withmixedctordeps';


describe('Component decorator test', () => {
  beforeEach(() => {
    Reflect.deleteMetadata(COMPONENT_IDENTITY, FactoryComponent);
  });

  test('ConstructorDependency factory should create IfConstructorDependency object', () => {
    const identity = new ComponentIdentity('test1', FactoryComponent);
    const res = ConstructorDependency(1, identity);

    expect(res.dependency).toStrictEqual(identity);

  });

  test('should add Identity to component', () => {
    Component(FactoryComponent);
    const identity = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, FactoryComponent);
    expect(identity.clazz).toStrictEqual(FactoryComponent);
  });


  test('FactoryComponent should have factory methods', () => {

    Component(FactoryComponent);
    const methods = getFactoryMethods(FactoryComponent);

    expect(methods[0]).toEqual({
      'methodName': 'connection',
      'providesComponent': {
        'name': 'db-connection',
        'targetClass': undefined,
      },
    });
  });

  test('Attempting to add unnamed @Component to factory method without return type should throw', () => {

    let error;

    try {
      require('./fixtures/invalidcomponent2');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(DecoratorError);

  });


  test('Attempting to add @Component to getter should throw', () => {

    let error;

    try {
      require('./fixtures/invalidcomponent1');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(DecoratorError);

  });


  test('Attempting to add @Component to static method should throw', () => {

    let error;

    try {
      require('./fixtures/staticmethod');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(DecoratorError);

  });

  test('getFactoryMethods on component without factory methods should return undefined', () => {

    const methods = getFactoryMethods(DB1);

    expect(methods).toBeUndefined();
  });


  test('getFactoryMethods on pure function should return undefined', () => {

    const methods = getFactoryMethods(() => true);

    expect(methods).toBeUndefined();
  });

  test('Component with Constructor dependencies should set constructor dependencies', () => {

    const ctorDeps = getConstructorDependencies(ComponentWithDeps);

    expect(ctorDeps).toEqual([
      {
        'name': UNNAMED_COMPONENT,
        'targetClass': DB1,
      },
      {
        'name': UNNAMED_COMPONENT,
        'targetClass': Client,
      }],
    );
  });

  test(`Component with implicit and explicit Constructor dependencies 
  should set constructor dependencies`, () => {

    const ctorDeps = getConstructorDependencies(ComponentWithDeps2);

    expect(ctorDeps).toEqual([
      {
        'name': 'greeter',
        'targetClass': Object,
      },
      {
        'name': UNNAMED_COMPONENT,
        'targetClass': Client,
      }],
    );
  });


  test(`Component with Constructor dependencies should throw 
  when unnamed constructor dependency uses reserved type (string)`, () => {

    let error;

    try {
      require('./fixtures/withreservedctordeps');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(DecoratorError);
    expect(error.message.includes('String')).toBeTruthy();

  });

});
