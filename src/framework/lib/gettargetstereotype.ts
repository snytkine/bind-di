import { Target } from '../../definitions/container';
import { TargetStereoType } from '../../enums';

export default function getTargetStereotype(target: Target): TargetStereoType {
  let ret = TargetStereoType.UNKNOWN;
  /**
   * Bug to check target.constructor.length because it can be 0
   * instead must check hasOwnProperty
   */
  if (target) {
    if (target.prototype && typeof target === 'function') {
      ret = TargetStereoType.CONSTRUCTOR;
    } else if (
      target.constructor &&
      Object.prototype.hasOwnProperty.call(target.constructor, 'length')
    ) {
      ret = TargetStereoType.PROTOTYPE;
    }
  }

  return ret;
}
