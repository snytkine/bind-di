import 'reflect-metadata';
import { Component1 } from './fixtures/component1';
import { COMPONENT_ENV } from '../../consts';
import Environment from '../environment';
import FrameworkError from '../../exceptions/frameworkerror';

describe('Environment decorator test', () => {

  beforeAll(() => {
    Environment('ENV1', 'ENV2')(Component1);
  });

  test('should add 2 environments to component', () => {

    const envs = Reflect.getMetadata(COMPONENT_ENV, Component1);
    expect(envs).toEqual(['ENV1', 'ENV2']);
  });

  test('should throw FrameworkError when trying to add Environment again', () => {
    let error;
    try{
      Environment('ENV3')(Component1);
    } catch(e){
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });
});
