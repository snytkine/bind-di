import { Target } from '../../definitions';
import { TargetStereoType } from '../../consts/targettype';

export const getTargetStereotype = (target: Target): TargetStereoType => {

    let ret = TargetStereoType.UNKNOWN;

    if (target) {
        if (target.prototype && typeof target=='function') {
            ret = TargetStereoType.CONSTRUCTOR;
        } else if (target.constructor && target.constructor.length) {
            ret = TargetStereoType.PROTOTYPE;
        }

    }

    return ret;
};
