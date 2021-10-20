import { TCPClient, EventFactory} from 'geteventstore-promise';

/**
 * @class EventStore
 * @description EventStore.org
 */
export class Kafka {
  [x: string]: any;

  /**
   * @constructor
   */
  constructor() {
    this.type = 'kafka';
    this.eventFactory = new EventFactory();
  }

  connect(config) {
    this.client = new TCPClient(config);
    return this;
  }

  getClient() {
    return this.client;
  }

  newEvent(name, payload) {
    return this.eventFactory.newEvent(name, payload);
  }

  close() {
    this.client.close();
    return this;
  }
}
