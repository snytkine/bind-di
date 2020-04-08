import 'reflect-metadata';
import { Component1 } from './fixtures/component1';
import { ComponentScope } from '../../enums';
import { NewInstance, Scope, Singleton } from '../scope';
import { COMPONENT_SCOPE } from '../../consts';

describe('Test Scope decorator', () => {
  test('should add scope with @Scope decorator', () => {
    Scope(ComponentScope.SESSION)(Component1);
    const myScope = Reflect.getMetadata(COMPONENT_SCOPE, Component1);
    expect(myScope).toEqual(ComponentScope.SESSION);
  });

  test('should define scope with Singleton decorator', () => {
    Singleton(Component1);
    const myScope = Reflect.getMetadata(COMPONENT_SCOPE, Component1);
    expect(myScope).toEqual(ComponentScope.SINGLETON);
  })

  test('should define scope with NewInstance decorator', () => {
    NewInstance(Component1);
    const myScope = Reflect.getMetadata(COMPONENT_SCOPE, Component1);
    expect(myScope).toEqual(ComponentScope.NEWINSTANCE);
  })
});
