import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RedisService } from "./redis.service";
import { OPTIONAL_JWT } from "./decorator/optional-jwt.decorator";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly firebaseService: FirebaseService;
  private redisService: RedisService;

  constructor(private reflector: Reflector) {
    this.firebaseService = new FirebaseService();
    this.redisService = new RedisService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let isOptional = false;
    if (this.reflector) {
      isOptional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_JWT, [
        context.getHandler(),
        context.getClass(),
      ]);
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader?.startsWith("Bearer "))
      throw new UnauthorizedException("Missing or invalid token");

    const token = authHeader.split("Bearer ")[1];
    const user = await this.firebaseService.getAuth().verifyIdToken(token);
    if (!user) {
      if (isOptional) return true;
      throw new UnauthorizedException("Invalid or missing auth");
    }

    // Get user data from Redis using user.sub
    const userData = await this.redisService.getUserData(user.uid);
    if (userData) {
      if (userData.isActive === false) {
        if (isOptional) return true;
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
        ...((userData.userType === "ADMIN" ||
          userData.userType === "RETAILER") && {
          permission: userData.permission,
        }),
      };
    } else {
      // If no Redis data found, throw an error
      throw new UnauthorizedException("No active login session found");
    }

    return true;
  }
}
