const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const client = createClient({ url: redisUrl });

client.on("error", (err) => {
  // Only log once per error type, not thousands of times
  if (!client._lastErrCode || client._lastErrCode !== err.code) {
    console.error("❌ Redis Client Error", err.code || err.message);
    client._lastErrCode = err.code;
  }
});
client.on("connect", () => console.log("🔌 Redis Client connecting..."));
client.on("ready", () => {
  console.log("✅ Redis Client Ready — switching to Redis session store.");
  client._lastErrCode = null;
});

let isConnected = false;

// ─── In-memory fallback store (used when Redis is not available) ─────────────
// This ensures the AI interview always works locally, even without Docker Redis.
const memStore = new Map();
const memTtls  = new Map();

function memSet(key, obj) {
  memStore.set(key, obj);
}

function memGet(key) {
  return memStore.get(key) || null;
}

function memDel(key) {
  memStore.delete(key);
  if (memTtls.has(key)) {
    clearTimeout(memTtls.get(key));
    memTtls.delete(key);
  }
}

function memExpire(key, ttlSeconds) {
  if (memTtls.has(key)) clearTimeout(memTtls.get(key));
  const t = setTimeout(() => memDel(key), ttlSeconds * 1000);
  memTtls.set(key, t);
}

async function connectRedis() {
  if (isConnected) return true;
  try {
    await client.connect();
    isConnected = true;
    return true;
  } catch (err) {
    // Expected when Redis isn't running — silently use in-memory fallback
    return false;
  }
}

// Try to connect on startup (non-blocking)
connectRedis();

module.exports = {
  client,
  connectRedis,

  // Helper to store session objects
  async setHash(key, obj, ttl = 7200) {
    // Always write to memory first (instant, always works)
    memSet(key, obj);
    memExpire(key, ttl);

    // Also try Redis if available
    if (isConnected) {
      try {
        const stringified = {};
        for (const [k, v] of Object.entries(obj)) {
          stringified[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
        }
        if (Object.keys(stringified).length > 0) {
          await client.hSet(key, stringified);
          await client.expire(key, ttl);
        }
      } catch (err) {
        // Redis write failed — in-memory already saved, no issue
        console.warn(`[Redis] hSet failed for ${key}, using in-memory: ${err.message}`);
      }
    }
  },

  // Helper to retrieve session objects
  async getHash(key) {
    // Try Redis first (needed for multi-instance scaling)
    if (isConnected) {
      try {
        const data = await client.hGetAll(key);
        if (data && Object.keys(data).length > 0) {
          const parsed = {};
          for (const [k, v] of Object.entries(data)) {
            try { parsed[k] = JSON.parse(v); } catch (_) { parsed[k] = v; }
          }
          // Sync back to mem for next time
          memSet(key, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn(`[Redis] hGetAll failed for ${key}, using in-memory: ${err.message}`);
      }
    }
    // Fallback to in-memory store
    return memGet(key);
  },

  // Delete key from both stores
  async deleteKey(key) {
    memDel(key);
    if (isConnected) {
      try { await client.del(key); } catch (err) {
        console.warn(`[Redis] del failed for ${key}: ${err.message}`);
      }
    }
  }
};
