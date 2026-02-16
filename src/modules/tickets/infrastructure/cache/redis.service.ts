import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    const url = process.env.REDIS_URL ?? 'redis://redis:6379';
    this.client = new Redis(url);
    this.logger.log(`Connected to Redis at ${url}`);
  }

  onModuleDestroy() {
    try {
      this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (err) {
      this.logger.error('Error closing Redis', err as any);
    }
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: string, ttlMs?: number) {
    if (ttlMs) {
      await this.client.set(key, value, 'PX', ttlMs);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async del(key: string) {
    return await this.client.del(key);
  }
}
