import { IfComponentDetails } from '../../definitions';
import FrameworkError from '../../exceptions/frameworkerror';
import stringifyIdentify from './stringifyidentity';

export default function assertNoProvides(meta: IfComponentDetails): void {
  if (meta.provides && meta.provides.length > 0) {
    throw new FrameworkError(`Only Singleton Component can provide other components. 
    Component "${stringifyIdentify(meta.identity)} has scope=${meta.scope}`);
  }
}
