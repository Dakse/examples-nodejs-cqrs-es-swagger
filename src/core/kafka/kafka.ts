import {
  Injectable,
  Inject,
  OnModuleDestroy,
  OnModuleInit
} from "@nestjs/common";
import { IEventPublisher } from "@nestjs/cqrs/dist/interfaces/events/event-publisher.interface";
import { IMessageSource } from "@nestjs/cqrs/dist/interfaces/events/message-source.interface";
import { IEvent } from "@nestjs/cqrs/dist/interfaces/events/event.interface";
import { Subject, fromEvent } from "rxjs";
import * as xml2js from "xml2js";
import * as http from "http";
import { config } from "../../../config";
import Kafka from "kafkajs";
const kafka = new Kafka({
  clientId: config.KAFKA_STORE_SETTINGS.clientId,
  brokers: config.KAFKA_STORE_SETTINGS.brokers
});

/**
 * @class EventStore
 * @description The EventStore.org bridge. By design, the domain category
 * (i.e. user) events are being subscribed to. Upon events being received,
 * internal event handlers are responsible for the handling of events.
 */
@Injectable()
export class Kafka implements IEventPublisher, IMessageSource {
  private kafka: any;
  private eventHandlers: object;
  private category: string;

  constructor(@Inject("KAFKA_PROVIDER") eventStore: any) {
    this.category = "users";
    this.kafka = kafka;
    // this.eventStore.connect({
    //   hostname: config.EVENT_STORE_SETTINGS.hostname,
    //   port: config.EVENT_STORE_SETTINGS.tcpPort,
    //   credentials: config.EVENT_STORE_SETTINGS.credentials,
    //   poolOptions: config.EVENT_STORE_SETTINGS.poolOptions,
    // });
  }

  async publish<T extends IEvent>(event: T) {
    const producer = kafka.producer();
    await producer.connect();
    await this.__app.producer.send({
      topic: event.constructor.name,
      messages: [
        {
          value: JSON.parse(JSON.stringify(event)),
          partition: 0
        }
      ]
    });
    await producer.disconnect();
    // const message = JSON.parse(JSON.stringify(event));
    // const userId = message.userId || message.userDto.userId;
    // const streamName = `${this.category}-${userId}`;
    // const type = event.constructor.name;
    // try {
    //   await this.eventStore.client.writeEvent(streamName, type, event);
    // } catch (err) {
    //   console.trace(err);
    // }
  }

  /**
   * @description Event Store bridge subscribes to domain category stream
   * @param subject
   */
  async bridgeEventsTo<T extends IEvent>(subject: Subject<T>) {
    const streamName = `$ce-${this.category}`;

    const onEvent = async event => {
      const eventUrl =
        eventStoreHostUrl + `${event.metadata.$o}/${event.data.split("@")[0]}`;
      http.get(eventUrl, res => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", chunk => {
          rawData += chunk;
        });
        res.on("end", () => {
          xml2js.parseString(rawData, (err, result) => {
            if (err) {
              console.trace(err);
              return;
            }
            const content = result["atom:entry"]["atom:content"][0];
            const eventType = content.eventType[0];
            const data = content.data[0];
            event = this.eventHandlers[eventType](...Object.values(data));
            subject.next(event);
          });
        });
      });
    };

    const onDropped = (subscription, reason, error) => {
      console.trace(subscription, reason, error);
    };

    try {
      await this.eventStore.client.subscribeToStream(
        streamName,
        onEvent,
        onDropped,
        false
      );
    } catch (err) {
      console.trace(err);
    }
  }

  setEventHandlers(eventHandlers) {
    this.eventHandlers = eventHandlers;
  }
}
