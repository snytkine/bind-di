import { IfComponentDetails } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';

export default function assertNoProvides(meta: IfComponentDetails): void {
  if (meta.provides && Array.isArray(meta.provides) && meta.provides.length > 0) {
    throw new FrameworkError(`Only Singleton Component can provide other components. 
    Component "${meta.identity.toString()} has scope=${meta.scope}`);
  }
}
