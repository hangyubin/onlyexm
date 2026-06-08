import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client: RedisClientType = createClient({
  url: redisUrl,
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

export async function connectRedis() {
  if (!client.isReady) {
    await client.connect();
    console.log('Connected to Redis successfully');
  }
}

export async function getCache(key: string): Promise<string | null> {
  try {
    await connectRedis();
    return await client.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: string, ttl?: number): Promise<void> {
  try {
    await connectRedis();
    if (ttl) {
      await client.set(key, value, { EX: ttl });
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await connectRedis();
    await client.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

export async function getJsonCache<T>(key: string): Promise<T | null> {
  const value = await getCache(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setJsonCache<T>(key: string, value: T, ttl?: number): Promise<void> {
  const jsonValue = JSON.stringify(value);
  await setCache(key, jsonValue, ttl);
}