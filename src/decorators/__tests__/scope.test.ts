import 'reflect-metadata';
import { Component1 } from './fixtures/component1';
import { ComponentScope } from '../../enums';
import { getScope, NewInstance, Scope, Singleton } from '../scope';
import { COMPONENT_SCOPE, DEFAULT_SCOPE } from '../../consts';

describe('Test Scope decorator', () => {
  beforeEach(() => {
    Reflect.deleteMetadata(COMPONENT_SCOPE, Component1);
  });

  test('should add scope with @Scope decorator', () => {
    Scope(ComponentScope.SESSION)(Component1);
    const myScope = Reflect.getMetadata(COMPONENT_SCOPE, Component1);
    expect(myScope).toEqual(ComponentScope.SESSION);
  });

  test('should define scope with Singleton decorator', () => {
    Singleton(Component1);
    const myScope = Reflect.getMetadata(COMPONENT_SCOPE, Component1);
    expect(myScope).toEqual(ComponentScope.SINGLETON);
  });

  test('should define scope with NewInstance decorator', () => {
    NewInstance(Component1);
    const myScope = Reflect.getMetadata(COMPONENT_SCOPE, Component1);
    expect(myScope).toEqual(ComponentScope.NEWINSTANCE);
  });

  test('getScope() should return scope', () => {
    NewInstance(Component1);
    const myScope = getScope(Component1);
    expect(myScope).toEqual(ComponentScope.NEWINSTANCE);
  });

  test('getScope() should return undefined if COMPONENT_SCOPE and DEFAULT_SCOPE not defined', () => {
    const myScope = getScope(Component1);
    expect(myScope).toBeUndefined();
  });

  test('getScope() should return DEFAULT_SCOPE if COMPONENT_SCOPE not defined', () => {
    Reflect.defineMetadata(DEFAULT_SCOPE, ComponentScope.REQUEST, Component1);
    const myScope = getScope(Component1);
    expect(myScope).toEqual(ComponentScope.REQUEST);
  });
});
