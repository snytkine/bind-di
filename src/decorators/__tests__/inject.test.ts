import TestComponent from './fixtures/componentwithinjections';
import {
  getClassSetters,
  getConstructorDependencies,
  getPropDependencies,
  Inject,
} from '../inject';
import Client from './fixtures/client';
import Component2 from './fixtures/component2';
import CtorDeps2 from './fixtures/withctordep2';
import { FrameworkError } from '../../exceptions';
import { PROP_DEPENDENCY, UNNAMED_COMPONENT } from '../../consts';

describe('Test of @Inject decorator', () => {
  test('test of getPropDependencies', () => {
    const expected = [
      {
        propertyName: 'client',
        dependency: {
          name: 'api-client',
          targetClass: Client,
        },
      },
      {
        propertyName: 'logger',
        dependency: {
          name: 'logger',
          targetClass: Object,
        },
      },
      {
        propertyName: 'test2',
        dependency: {
          name: UNNAMED_COMPONENT,
          targetClass: Component2,
        },
      },
    ];

    const res = getPropDependencies(TestComponent);

    expect(res).toEqual(expected);
  });

  test('getClassSetters should return empty array if passed Class prototype', () => {
    const res = getClassSetters(TestComponent.prototype);

    expect(res).toEqual([]);
  });

  test('getClassSetters should return array with one element for TestComponent', () => {
    const res = getClassSetters(TestComponent);

    expect(res).toEqual(['logger']);
  });

  test('Inject should throw FrameworkError if trying to apply to Class Constructor and propKey', () => {
    let error;
    try {
      /**
       * In case of property injection
       * the first param must be prototype, not a constructor
       */
      Inject(TestComponent, 'client');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('decorator applied in unsupported way')).toEqual(true);
  });

  test(`Inject should throw FrameworkError if trying to apply to unnamed @Inject
  and cannot determine the type of injected dependency`, () => {
    let error;
    try {
      /**
       * In case of property injection
       * the first param must be prototype, not a constructor
       */
      Inject(TestComponent.prototype, 'test1');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('Cannot determine the dependency type')).toEqual(true);
  });

  test(`Applying unnamed @Inject to property with declared type`, () => {
    const dep = Reflect.getMetadata(PROP_DEPENDENCY, TestComponent.prototype, 'test2');

    expect(dep).toEqual({
      name: UNNAMED_COMPONENT,
      targetClass: Component2,
    });
  });

  test(`Inject should throw FrameworkError if trying to apply unnamed @Inject
  and type of injected dependency is among reserved types (Promise, String, Number)`, () => {
    let error;
    try {
      /**
       * In case of property injection
       * the first param must be prototype, not a constructor
       */
      // eslint-disable-next-line global-require
      require('./fixtures/reservedpropinjection');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('not allowed as dependency component')).toEqual(true);
  });

  test(`Inject should throw FrameworkError if trying to apply unnamed @Inject
  to constructor and type of injected dependency is among reserved types (String)`, () => {
    let error;
    try {
      /**
       * In case of property injection
       * the first param must be prototype, not a constructor
       */
      // eslint-disable-next-line global-require
      require('./fixtures/withreservedctordep');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('not an allowed type as dependency component')).toEqual(true);
  });

  test(`Inject should throw FrameworkError there is a missing constructor
  dependency`, () => {
    let error;
    try {
      /**
       * In case of property injection
       * the first param must be prototype, not a constructor
       */
      getConstructorDependencies(CtorDeps2);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('Constructor is missing @Inject decorator')).toEqual(true);
  });

  test(`getPropDependencies should return empty array for class without @Inject`, () => {
    class TestClass {
      prop1: string = 'ok';
    }

    Object.defineProperty(TestClass.prototype, 'prop1', {
      value: undefined,
      writable: true,
      enumerable: true,
    });

    const res = getPropDependencies(TestClass);

    expect(res).toEqual([]);
  });
});
