import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtStrategy } from "./jwt.strategy";
import { HeaderStrategy } from "./header.strategy";
import { getEnv } from "./env";
import { RedisService } from "./redis.service";

@Injectable()
export class WebSocketGuard implements CanActivate {
  private strategy: JwtStrategy | HeaderStrategy;
  private redisService: RedisService;

  constructor() {
    const environment = getEnv("NODE_ENV");
    const isLocal = environment === "local";
    this.strategy = isLocal ? new JwtStrategy() : new HeaderStrategy();
    this.redisService = new RedisService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const user = await this.strategy.validateRequest(request, false);
      if (!user) throw new UnauthorizedException("Invalid or missing auth");

      // Get user data from Redis using user.sub
      const userData = await this.redisService.getUserData(user.sub);
      if (userData) {
        if (userData.isActive === false) {
          throw new UnauthorizedException("User is not active");
        }
        // Merge Redis user data with the authenticated user
        request.user = {
          ...user,
          userId: userData.userId,
          userType: userData.userType,
          ...(userData.userType === "RETAILER" && {
            retailerId: userData.retailerId,
          }),
        };
      } else {
        // If no Redis data found, throw an error
        throw new UnauthorizedException("No active login session found");
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
