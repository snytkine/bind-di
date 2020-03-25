import { ComponentIdentity } from '../lib/componentidentity';

export interface IfComponentWithDependencies {
  visited: boolean;
  identity: ComponentIdentity;
  dependencies: Array<ComponentIdentity>;
}
