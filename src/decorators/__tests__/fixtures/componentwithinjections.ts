import { Inject } from '../../inject';
import Client from './client';
import Component2 from './component2';

export default class API {
  private conn: string;
  private requestLogger;

  constructor(@Inject('conn-string') connection: string) {
    this.conn = connection;
  }

  @Inject('api-client')
  public client: Client;

  public test1;

  @Inject
  public test2: Component2;

  @Inject('logger')
  set logger(loggerObj){
    this.requestLogger = loggerObj;
  }
}
