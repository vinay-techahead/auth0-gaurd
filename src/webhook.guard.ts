import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { getEnv } from "./env";

@Injectable()
export class WebhookAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const webhookSecret = getEnv("WEBHOOK_SECRET");

    if (req.headers["x-internal-secret"] !== webhookSecret) {
      throw new UnauthorizedException("Invalid webhook secret");
    }

    return true;
  }
}
