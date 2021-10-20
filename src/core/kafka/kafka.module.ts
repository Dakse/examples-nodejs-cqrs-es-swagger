import { Global, Module, DynamicModule } from '@nestjs/common';
import { Kafka } from './kafka';
import { KafkaProviders } from './kafka.provider';

@Global()
@Module({
  providers: [
    ...eventStoreProviders,
    {
      provide: 'KAFKA_CONFIG',
      useValue: 'KAFKA_CONFIG_USE_ENV',
    },
  ],
  exports: [
    ...eventStoreProviders,
    {
      provide: 'KAFKA_CONFIG',
      useValue: 'KAFKA_CONFIG_USE_ENV',
    },
  ],
})
export class KafkaModule {
  static forRoot(): DynamicModule {
    return {
      module: KafkaModule,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        Kafka,
      ],
      exports: [
        Kafka,
      ],
    };
  }
}
