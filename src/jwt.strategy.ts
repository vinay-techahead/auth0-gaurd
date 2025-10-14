import JwksRsa from "jwks-rsa";
import * as jwt from "jsonwebtoken";
import { getEnv } from "./env";
import { UnauthorizedException } from "@nestjs/common";

export class JwtStrategy {
  async validateRequest(req: any, isOptional: boolean): Promise<any> {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");

    if (!token) {
      if (isOptional) return null;
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      // Verify JWT using secret from environment
      const decoded = jwt.verify(token, getEnv("JWT_SECRET"), {
        algorithms: ["HS256"], // Common for local JWTs
      });

      return decoded; // Return decoded user payload
    } catch (err) {
      console.error("JWT verification failed:", err);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
