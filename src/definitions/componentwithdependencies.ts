import { IfComponentDetails, IfComponentIdentity, IfIocComponent } from './container';

export interface IfValidateScopeCheck {
  component: IfComponentDetails
  dependency: IfComponentDetails
}

export interface IfComponentWithDependencies {
  visited: boolean;
  identity: IfComponentIdentity;
  dependencies: Array<IfComponentIdentity>;
}
