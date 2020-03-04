import { IfComponentIdentity, IfIocContainer } from '../../definitions';
import { IfComponentWithDependencies } from '../../definitions/componentwithdependencies';
import stringifyIdentify from '../lib/stringifyidentity';
import isSameIdentity from '../../metadata/issameidentity';
import FrameworkError from '../../exceptions/frameworkerror';

const debug = require('debug')('bind:init:depscheck');

const TAG = 'CHECK_DEPENDENCY_LOOP';

