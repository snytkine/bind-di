import { IfComponentIdentity } from './container';

export interface IfComponentWithDependencies {
  visited: boolean;
  identity: IfComponentIdentity;
  dependencies: Array<IfComponentIdentity>;
}
