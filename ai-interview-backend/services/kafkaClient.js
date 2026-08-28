const { Kafka, Partitioners } = require("kafkajs");

const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
  clientId: "hiresense-ai-interview",
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
    console.log("✅ Kafka Producer Connected");
  } catch (err) {
    console.error("❌ Kafka Producer Connection Failed:", err.message);
  }
  return producer;
}

const pendingExecutions = new Map();

// Start internal consumer for results
let isResultsConsumerStarted = false;
async function initResultsConsumer() {
  if (isResultsConsumerStarted) return;
  isResultsConsumerStarted = true;
  try {
    const consumer = kafka.consumer({ groupId: "ai-interview-reply-group-" + Math.random().toString(36).substring(7) });
    await consumer.connect();
    await consumer.subscribe({ topic: "code-execution-results", fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const parsed = JSON.parse(message.value.toString());
          const { executionId } = parsed;
          if (executionId && pendingExecutions.has(executionId)) {
            const resolve = pendingExecutions.get(executionId);
            resolve(parsed);
            pendingExecutions.delete(executionId);
          }
        } catch (e) {
          console.error("Error reading code result message:", e.message);
        }
      }
    });
    console.log("📥 [Kafka] Reply-to consumer listening for execution results");
  } catch (err) {
    console.error("Failed to start Kafka results consumer:", err.message);
  }
}

// Start immediately
initResultsConsumer();

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
      console.log(`📤 [Kafka] Message published to topic: ${topic}`);
    } catch (err) {
      console.error(`❌ [Kafka] Failed to publish message to ${topic}:`, err.message);
    }
  },

  // Start a consumer for a specific topic
  async startConsumer(topic, groupId, onMessage) {
    const consumer = kafka.consumer({ groupId });
    try {
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`📥 [Kafka] Consumer subscribed to topic: ${topic} (Group: ${groupId})`);

      await consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const rawValue = message.value.toString();
            const parsed = JSON.parse(rawValue);
            await onMessage(parsed);
          } catch (err) {
            console.error(`❌ [Kafka] Error processing message on ${topic}:`, err.message);
          }
        }
      });
    } catch (err) {
      console.error(`❌ [Kafka] Consumer setup failed for ${topic}:`, err.message);
    }
    return consumer;
  },

  // Promise-based request-reply resolver
  waitForResult(executionId, timeoutMs = 12000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (pendingExecutions.has(executionId)) {
          pendingExecutions.delete(executionId);
          resolve({ error: "Code execution timed out on the broker queue." });
        }
      }, timeoutMs);
      
      pendingExecutions.set(executionId, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }
};
