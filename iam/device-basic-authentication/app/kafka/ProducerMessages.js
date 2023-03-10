const {
  ConfigManager: { getConfig },
  Kafka: { Producer },
  Logger,
} = require('@dojot/microservice-sdk');
const { killApplication } = require('../Utils');

const logger = new Logger('basic-auth:Producer');

const {
  sdkproducer: configSDK,
  producer: configProducer,
  topic: configTopic,
  messenger: configMessenger,
  healthchecker: configHealthChecker,
} = getConfig('BASIC_AUTH');

/**
 * Class representing an Producer
 *
 * @class
 */
class ProducerMessages {
  /**
   * @constructor
   *
   * @param {an instance of @dojot/microservice-sdk.ServiceStateManager
   *          with register service 'basic-auth-producer'} serviceState
   *          Manages the services' states, providing health check and shutdown utilities.
   */
  constructor(serviceState) {
    this.producer = null;
    this.serviceState = serviceState;
    this.isReady = false;
  }

  /**
   *  Init new Producer instance
   */
  async init() {
    try {
      this.producer = new Producer({
        ...configSDK,
        'kafka.producer': configProducer,
        'kafka.topic': configTopic,
      });
      logger.info('Initializing Kafka Producer...');
      await this.producer.connect();
      this.createHealthChecker();
      this.registerShutdown();
      logger.info('... Kafka Producer was initialized');
    } catch (error) {
      logger.error(
        'An error occurred while initializing the Kafka Producer. Bailing out!',
      );
      logger.error(error.stack || error);
      killApplication();
    }
  }

  /**
   *  Publish message
   */
  async send(message, tenant, deviceId) {
    const topicSuffix = configMessenger['produce.topic.suffix'];
    try {
      // publish
      const kafkaTopic = `${tenant}.${topicSuffix}`;
      const stringMessage = JSON.stringify(message);
      const messageKey = `${tenant}:${deviceId}`;

      logger.debug(`Trying to send message to kafka topic ${kafkaTopic}...`);

      await this.producer.produce(kafkaTopic, stringMessage, messageKey);

      logger.debug(`Successfully sent message to Kafka in ${kafkaTopic}`);
      logger.debug(
        `Published message ${stringMessage} to ${tenant}/${topicSuffix}`,
      );
      return;
    } catch (error) {
      logger.error(
        `Failed to publish message to ${tenant}/${topicSuffix} (${error}).`,
      );
    }
  }

  /**
   * Create a 'healthCheck' for Producer
   */
  createHealthChecker() {
    const healthChecker = async (signalReady, signalNotReady) => {
      if (this.producer) {
        try {
          const status = await this.producer.getStatus();
          if (status.connected && !this.isReady) {
            signalReady();
            this.isReady = true;
          } else if (!status.connected && this.isReady) {
            signalNotReady();
            this.isReady = false;
          }
        } catch (error) {
          signalNotReady();
        }
      } else {
        signalNotReady();
      }
    };
    this.serviceState.addHealthChecker(
      'basic-auth-producer',
      healthChecker,
      configHealthChecker['kafka.interval.ms'],
    );
  }

  /**
   *  Register 'shutdown' for Producer
   */
  registerShutdown() {
    this.serviceState.registerShutdownHandler(() => {
      logger.warn('Shutting down Kafka connection...');
      return this.producer.disconnect();
    });
  }
}

module.exports = ProducerMessages;
