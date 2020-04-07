import { ComponentIdentity } from '../utils/componentidentity';

export interface IfComponentWithDependencies {
  visited: boolean;
  identity: ComponentIdentity;
  dependencies: Array<ComponentIdentity>;
}
