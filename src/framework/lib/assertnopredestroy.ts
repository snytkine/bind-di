import { IfComponentDetails } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';

export default function assertNoPreDestroy(meta: IfComponentDetails): void {
  if (meta.preDestroy) {
    throw new FrameworkError(`Only Singleton Component can have preDestroy method. 
    Component "${meta.identity.toString()} has scope=${meta.scope}`);
  }
}
