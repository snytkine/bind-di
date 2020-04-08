import { PostConstruct, PreDestroy } from '../../lifecycle';

export default class Factory {
  private message: string = 'Hello';

  private readonly result = true;

  @PostConstruct
  setup(): Promise<boolean> {
    return Promise.resolve(this.result);
  }

  @PreDestroy
  exit(): Promise<boolean> {
    return Promise.resolve(this.result);
  }
}
