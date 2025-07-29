import JwksRsa from "jwks-rsa";
import * as jwt from "jsonwebtoken";
import { getEnv } from "./env";
import { UnauthorizedException } from "@nestjs/common";

export class JwtStrategy {
  private jwksClient = JwksRsa({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
  });

  async validateRequest(req: any): Promise<any> {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let decoded: any;
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch (err) {
      console.error("JWT decode failed:", err);
      throw new UnauthorizedException("Invalid token");
    }

    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new UnauthorizedException("Invalid token header");
    }

    try {
      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      const domain = getEnv("AUTH0_DOMAIN");
      const audience = getEnv("AUTH0_AUDIENCE");

      return jwt.verify(token, signingKey, {
        algorithms: ["RS256"],
        issuer: `https://${domain}/`,
        audience: audience,
      });
    } catch (err) {
      console.error("JWT verification failed:", err);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
