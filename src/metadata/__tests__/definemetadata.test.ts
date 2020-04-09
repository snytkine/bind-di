import { defineMetadata } from '../index';
import { FrameworkError } from '../../exceptions';

class MyClass {
  private message = 'HELLO';

  getMessage() {
    return this.message;
  }
}

const MY_METADATA_KEY = 'META_TEST';

describe('Test of defineMetadata method', () => {
  beforeEach(() => {
    Reflect.deleteMetadata(MY_METADATA_KEY, MyClass);
    Reflect.deleteMetadata(MY_METADATA_KEY, MyClass, 'getMessage');
  });

  test('defineMetadata should set metadata on class level', () => {
    defineMetadata(MY_METADATA_KEY, 1, MyClass)();

    const res = Reflect.getMetadata(MY_METADATA_KEY, MyClass);

    expect(res).toEqual(1);
  });

  test('defineMetadata multiple times should set metadata from last call on class level', () => {
    defineMetadata(MY_METADATA_KEY, 1, MyClass)();
    defineMetadata(MY_METADATA_KEY, 2, MyClass)();

    const res = Reflect.getMetadata(MY_METADATA_KEY, MyClass);

    expect(res).toEqual(2);
  });

  test('defineMetadata multiple times on property should set metadata from last call on class level', () => {
    defineMetadata(MY_METADATA_KEY, 1, MyClass, 'getMessage')();
    defineMetadata(MY_METADATA_KEY, 2, MyClass, 'getMessage')();

    const res = Reflect.getMetadata(MY_METADATA_KEY, MyClass, 'getMessage');

    expect(res).toEqual(2);
  });

  test('defineMetadata unique multiple times should throw error', () => {
    let error;
    try {
      defineMetadata(MY_METADATA_KEY, 1, MyClass)();
      defineMetadata(MY_METADATA_KEY, 2, MyClass)(true);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('defineMetadata unique multiple times on same property should throw error', () => {
    let error;
    try {
      defineMetadata(MY_METADATA_KEY, 1, MyClass, 'getMessage')();
      defineMetadata(MY_METADATA_KEY, 2, MyClass, 'getMessage')(true);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('defineMetadata unique multiple times on different properties should NOT throw error', () => {
    defineMetadata(MY_METADATA_KEY, 1, MyClass, 'getMessage')(true);
    defineMetadata(MY_METADATA_KEY, 2, MyClass, 'getMessage2')(true);

    const res = Reflect.getMetadata(MY_METADATA_KEY, MyClass, 'getMessage2');

    expect(res).toEqual(2);
  });

  test('calling defineMetadata unique multiple times on property should throw error', () => {
    let error;
    try {
      defineMetadata(MY_METADATA_KEY, 1, MyClass, 'getMessage')();
      defineMetadata(MY_METADATA_KEY, 2, MyClass, 'getMessage')(true);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });
});
