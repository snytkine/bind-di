import { IfComponentDetails } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';
import stringifyIdentify from './stringifyidentity';

export default function assertNoPreDestroy(meta: IfComponentDetails): void {
  if (meta.preDestroy) {
    throw new FrameworkError(`Only Singleton Component can have preDestroy method. 
    Component "${stringifyIdentify(meta.identity)} has scope=${meta.scope}`);
  }
}
