import { IfComponentDetails } from '../../definitions';
import { FrameworkError } from '../../exceptions';

export default function assertNoPostConstruct(meta: IfComponentDetails): void {
  if (meta.postConstruct) {
    throw new FrameworkError(`Only Singleton Component can have postConstruct method. 
    Component "${meta.identity.toString()} has scope=${meta.scope}`);
  }
}
