import { IfComponentIdentity } from '../../definitions';

export default function stringifyIdentity(identity: IfComponentIdentity): string {
  return `componentName=${String(identity?.componentName)} className=${identity?.clazz?.name}`;
}
