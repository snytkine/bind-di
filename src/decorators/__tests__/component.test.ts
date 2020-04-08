import FactoryComponent from './fixtures/factorycomponent';
import { Component } from '../component';
import { ComponentIdentity } from '../../utils';
import { COMPONENT_IDENTITY } from '../../consts';

describe('Component decorator test', () => {
  beforeEach(() => {
    Reflect.deleteMetadata(COMPONENT_IDENTITY, FactoryComponent);
  });

  test('should add Identity to component', () => {
    Component(FactoryComponent);
    const identity = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, FactoryComponent);
    expect(identity.clazz).toStrictEqual(FactoryComponent);
  });
});
