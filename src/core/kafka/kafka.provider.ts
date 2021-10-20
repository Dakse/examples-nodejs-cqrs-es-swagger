import {config} from '../../../config';
import {Kafka} from './kafka.class';

export const kafkaProviders = [
  {
    provide: 'KAFKA_PROVIDER',
    useFactory: (
        eventStoreConfig?: any,
    ): any => {
        if (eventStoreConfig === 'KAFKA_CONFIG_USE_ENV') {
          return new Kafka();
        }
    },
    inject: ['KAFKA_CONFIG'],
  },
];
