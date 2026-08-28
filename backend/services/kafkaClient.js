const { Kafka, Partitioners } = require("kafkajs");

const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
  clientId: "hiresense-core-backend",
  brokers: [kafkaBroker],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

let isProducerConnected = false;

async function connectProducer() {
  if (isProducerConnected) return producer;
  try {
    await producer.connect();
    isProducerConnected = true;
    console.log("✅ Kafka Core Producer Connected");
  } catch (err) {
    console.error("❌ Kafka Core Producer Connection Failed:", err.message);
  }
  return producer;
}

module.exports = {
  kafka,
  connectProducer,
  
  // Publish a payload to a specific Kafka topic
  async publishMessage(topic, payload) {
    try {
      const prod = await connectProducer();
      await prod.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }]
      });
      console.log(`📤 [Kafka Core] Message published to topic: ${topic}`);
    } catch (err) {
      console.error(`❌ [Kafka Core] Failed to publish message to ${topic}:`, err.message);
    }
  },

  // Start a consumer for a specific topic
  async startConsumer(topic, groupId, onMessage) {
    const consumer = kafka.consumer({ groupId });
    try {
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`📥 [Kafka Core] Consumer subscribed to topic: ${topic} (Group: ${groupId})`);

      await consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const rawValue = message.value.toString();
            const parsed = JSON.parse(rawValue);
            await onMessage(parsed);
          } catch (err) {
            console.error(`❌ [Kafka Core] Error processing message on ${topic}:`, err.message);
          }
        }
      });
    } catch (err) {
      console.error(`❌ [Kafka Core] Consumer setup failed for ${topic}:`, err.message);
    }
    return consumer;
  }
};
