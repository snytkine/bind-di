import { envFilter } from '../loadcomponentsfromfs';
import { COMPONENT_ENV } from '../../../consts';

describe('Test of envFilter function', () => {
  test('should return false when compClass is not passed', () => {
    expect(envFilter('abc')(undefined)).toEqual(false);
  });

  test('should return false when compClass does not have .prototype', () => {
    expect(envFilter()(1)).toEqual(false);
  });

  test('should return false when compClass is arrow function', () => {
    expect(envFilter()(() => true)).toEqual(false);
  });

  test('should return false when compClass has prototype but no constructor', () => {

    class MyClass {
      public message = 'OK';
    }

    expect(envFilter('')(MyClass.prototype)).toEqual(false);
  });


  test('should return false when @Environment decorator does not match env var', () => {

    class MyClass {
      public message = 'OK';
    }

    Reflect.defineMetadata(COMPONENT_ENV, ['TEST1'], MyClass);
    expect(envFilter()(MyClass)).toEqual(false);
  });


  test('should return false when @Environment decorator does not match env var', () => {

    class MyClass {
      public message = 'OK';
    }

    process.env.ENV_TEST = 'TEST1';

    Reflect.defineMetadata(COMPONENT_ENV, ['DEV', 'TEST'], MyClass);
    expect(envFilter('ENV_TEST')(MyClass)).toEqual(false);
  });


  test('should return true when NO @Environment decorator on class', () => {

    process.env.NODE_TEST_ENV = 'TEST1';

    class MyClass {
      public message = 'OK';
    }
    expect(envFilter('NODE_TEST_ENV')(MyClass)).toEqual(true);
  });

  test('should return true when @Environment decorator match env var', () => {

    class MyClass {
      public message = 'OK';
    }

    process.env.ENV_TEST_TEST = 'TEST1';

    Reflect.defineMetadata(COMPONENT_ENV, ['DEV', 'PROD', 'TEST1'], MyClass);
    expect(envFilter('ENV_TEST_TEST')(MyClass)).toEqual(true);
  });
});
