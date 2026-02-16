import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from './redis.service';

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);

  constructor(private readonly redisService: RedisService) {}

  private lockKey(key: string) {
    return `lock:${key}`;
  }

  async acquire(
    key: string,
    ttl = 5000,
    retryDelay = 100,
    retries = 3,
  ): Promise<string | null> {
    const token = uuidv4();
    const redis = this.redisService.getClient();

    for (let attempt = 0; attempt <= retries; attempt++) {
      const ok = await redis.set(this.lockKey(key), token, 'PX', ttl, 'NX');
      if (ok) {
        this.logger.debug(`Acquired lock ${key} token=${token}`);
        return token;
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelay));
        retryDelay = Math.min(1000, retryDelay * 2);
      }
    }

    this.logger.debug(`Failed to acquire lock ${key}`);
    return null;
  }

  async release(key: string, token: string): Promise<boolean> {
    const redis = this.redisService.getClient();
    const script = `if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`;
    try {
      const res = await redis.eval(script, 1, this.lockKey(key), token);
      const ok = res === 1 || res === '1';
      if (ok) this.logger.debug(`Released lock ${key}`);
      return ok;
    } catch (err) {
      this.logger.error('Error releasing lock', err as any);
      return false;
    }
  }
}
