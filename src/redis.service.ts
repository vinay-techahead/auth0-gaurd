import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis, {
  Cluster,
  ClusterNode,
  ClusterOptions,
  Redis as RedisType,
} from "ioredis";
import { getEnv } from "./env";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisType | Cluster;

  constructor() {
    const host = getEnv("REDIS_HOST") || "localhost";

    const port = Number(getEnv("REDIS_PORT") || 6379);

    const redisOptions = {
      db: Number(getEnv("REDIS_DB") || 0),
      password: getEnv("REDIS_PASSWORD") || undefined,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true,
      tls: getEnv("REDIS_TLS") ? { rejectUnauthorized: false } : undefined,
    };

    if (getEnv("REDIS_CLUSTER") === "true") {
      const nodes: ClusterNode[] = [
        {
          host,
          port,
        },
      ];

      const clusterOptions: ClusterOptions = {
        redisOptions,
      };

      this.client = new Cluster(nodes, clusterOptions);

      this.client.on("connect", () => {
        console.log("[Redis Cluster] Connected");
      });

      this.client.on("error", (err: Error) => {
        console.error("[Redis Cluster Error]:", err.message);
      });
    } else {
      this.client = new Redis({
        host: host,
        port,
        ...redisOptions,
      });

      this.client.on("connect", () => {
        console.log("[Redis] Connected");
      });

      this.client.on("error", (err: Error) => {
        console.error("[Redis Error]:", err.message);
      });
    }
  }

  async getUserData(userSub: string): Promise<any | null> {
    try {
      const userData = await this.client.get(`user:${userSub}`);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error fetching user data from Redis:", error);
      return null;
    }
  }

  async setUserData(userSub: string, userData: any): Promise<void> {
    try {
      await this.client.set(`user:${userSub}`, JSON.stringify(userData));
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
