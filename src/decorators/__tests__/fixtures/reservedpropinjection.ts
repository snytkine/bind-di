import { Inject } from '../../inject';

export default class PropInjection2 {

  @Inject
  public service: Promise<string>
}
