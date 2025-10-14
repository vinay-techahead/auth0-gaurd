import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { getEnv } from "./env";
interface RedisConfig {
  host: string;
  port: number;
  db: number;
  username?: string;
  password?: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    const config: RedisConfig = {
      host: getEnv("REDIS_HOST") || "localhost",
      port: Number(getEnv("REDIS_PORT") || 6379),
      db: Number(getEnv("REDIS_DB") || 0),
    };

    if (process.env.REDIS_USERNAME) {
      config.username = process.env.REDIS_USERNAME;
    }
    if (process.env.REDIS_PASSWORD) {
      config.password = process.env.REDIS_PASSWORD;
    }
    this.client = new Redis(config);

    this.client.on("error", (err: Error) => {
      console.error("Redis Client Error:", err);
    });
  }

  async getUserData(userSub: string): Promise<any | null> {
    try {
      const userData = await this.client.get(
        `${getEnv("NODE_ENV")}:user:${userSub}`
      );
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error fetching user data from Redis:", error);
      return null;
    }
  }

  async setUserData(userSub: string, userData: any): Promise<void> {
    try {
      await this.client.set(
        `${getEnv("NODE_ENV")}:user:${userSub}`,
        JSON.stringify(userData)
      );
    } catch (error) {
      console.error("Error setting user data in Redis:", error);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
