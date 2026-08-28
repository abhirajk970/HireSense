const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const client = createClient({ url: redisUrl });

client.on("error", (err) => console.error("❌ Redis Core Client Error", err));
client.on("connect", () => console.log("🔌 Redis Core Client connecting..."));
client.on("ready", () => console.log("✅ Redis Core Client Ready"));

let isConnected = false;

async function connectRedis() {
  if (isConnected) return;
  try {
    await client.connect();
    isConnected = true;
  } catch (err) {
    console.error("❌ Failed to connect to Redis Core:", err.message);
  }
}

// Connect immediately
connectRedis();

module.exports = {
  client,
  connectRedis,
  
  // Set value with optional TTL (seconds)
  async set(key, value, ttl = 3600) {
    try {
      await connectRedis();
      const stringified = typeof value === "object" ? JSON.stringify(value) : String(value);
      await client.set(key, stringified, { EX: ttl });
    } catch (err) {
      console.error(`[Redis Core] Error setting key ${key}:`, err.message);
    }
  },

  // Get value
  async get(key) {
    try {
      await connectRedis();
      const val = await client.get(key);
      if (!val) return null;
      try {
        return JSON.parse(val);
      } catch (_) {
        return val;
      }
    } catch (err) {
      console.error(`[Redis Core] Error getting key ${key}:`, err.message);
      return null;
    }
  },

  // Delete key
  async del(key) {
    try {
      await connectRedis();
      await client.del(key);
    } catch (err) {
      console.error(`[Redis Core] Error deleting key ${key}:`, err.message);
    }
  }
};
