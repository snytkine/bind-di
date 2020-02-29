import { IfComponentIdentity } from '../definitions';
import { COMPONENT_IDENTITY } from '../consts';
import defineMetadata from './definemetadata';

export default function setComponentIdentity(
  identity: IfComponentIdentity,
  target: Object,
  propertyKey?: string,
): void {
  return defineMetadata(COMPONENT_IDENTITY, identity, target, propertyKey)(); // used to be true but was causing
  // problems when component extended
  // another decorated component
}
