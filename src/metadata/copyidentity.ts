import 'reflect-metadata';
import { Identity } from '../framework/identity';
import { ComponentIdentity } from '../utils/componentidentity';

const copyIdentity = (identity: ComponentIdentity): ComponentIdentity => {
  return Identity(identity.componentName, identity.clazz);
};

export default copyIdentity;
