import { IfComponentDetails } from '../../definitions';
import { FrameworkError } from '../../exceptions';
import stringifyIdentify from './stringifyidentity';

export default function assertNoPostConstruct(meta: IfComponentDetails): void {
  if (meta.postConstruct) {
    throw new FrameworkError(`Only Singleton Component can have postConstruct method. 
    Component "${stringifyIdentify(meta.identity)} has scope=${meta.scope}`);
  }
}
