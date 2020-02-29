import { IfComponentIdentity } from '../../definitions';

export default function stringifyIdentify(identity: IfComponentIdentity): string {
  return `componentName=${String(identity?.componentName)} className=${identity?.clazz?.name}`;
}
