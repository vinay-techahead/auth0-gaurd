import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { getEnv } from "./env";

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const internalSecret = getEnv("INTERNAL_API_SECRET");

    if (req.headers["x-internal-secret"] !== internalSecret) {
      throw new UnauthorizedException("Invalid internal secret");
    }

    return true;
  }
}
