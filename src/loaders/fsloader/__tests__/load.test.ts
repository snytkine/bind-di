import Container from '../../../framework/container/container';
import { load } from '../loadcomponentsfromfs';
import { FrameworkError } from '../../../exceptions';

describe('Testing load function', () => {
  beforeAll(() => {
    process.env.LOADER_TEST = 'TEST';
  });

  afterAll(() => {
    delete process.env.LOADER_TEST;
  });

  test('load from components dir should not throw error and load one component', () => {
    const container = new Container();
    const dirs = [`${__dirname}/fixtures/components`];
    const res = load(container, dirs);

    expect(res).toBeUndefined();
    expect(container.components.length).toEqual(1);
  });

  test('load from dir should throw if one component could not be added to container', () => {
    const container = new Container();
    const dirs = [`${__dirname}/fixtures/components2`];
    let error;
    try {
      load(container, dirs);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('Failed to add component')).toEqual(true);
  });

  test('load from dir should throw if one component could not be required', () => {
    const container = new Container();
    const dirs = [`${__dirname}/fixtures/components3`];
    let error;
    try {
      load(container, dirs);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('Failed to load components from file')).toEqual(true);
  });
});
