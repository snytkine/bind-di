import DB1 from './dbcontainer';
import { Inject } from '../../inject';

export default class CtorDeps2 {
  private message: string = 'hello';

  constructor(
    @Inject('dep1') public db: DB1,
    public client: string,
    @Inject('dep3') public id: string,
  ) {}

  get hello() {
    return this.message;
  }
}
