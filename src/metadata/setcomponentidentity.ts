import { COMPONENT_IDENTITY } from '../consts';
import defineMetadata from './definemetadata';
import { ComponentIdentity } from '../utils/componentidentity';

export default function setComponentIdentity(
  identity: ComponentIdentity,
  target: Object,
  propertyKey?: string,
): void {
  return defineMetadata(COMPONENT_IDENTITY, identity, target, propertyKey)(); // used to be true but was causing
  // problems when component extended
  // another decorated component
}
