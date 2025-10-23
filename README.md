# auth0-guard

A reusable NestJS Auth0 guard for validating JWT tokens locally or trusting API Gateway headers in production. This guard automatically switches behavior based on the `NODE_ENV` environment variable.

---

## 📦 Features

- ✅ Auth0 JWT validation when running locally
- ✅ API Gateway passthrough validation in production (via trusted headers)
- ✅ Works with Bearer tokens
- ✅ Lightweight and configurable
- ✅ Built for microservice environments

---

## 🚀 Installation

### 1. Install the package

```bash
npm install auth0-guard
```

### 2. Install required peer dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/passport passport passport-jwt ioredis
```

---

## 🔐 Required Environment Variables

| Key              | Example Value           | Required | Description                           |
| ---------------- | ----------------------- | -------- | ------------------------------------- | --- |
| `NODE_ENV`       | `local` or `production` | ✅       | Used to switch between local and prod |     |
| `REDIS_HOST`     | `localhost`             | ✅       | Redis host (defaults to localhost)    |
| `REDIS_PORT`     | `6379`                  | ✅       | Redis port (defaults to 6379)         |
| `REDIS_PASSWORD` | `your-password`         | ❌       | Redis password (optional)             |
| `REDIS_DB`       | `0`                     | ✅       | Redis database index (defaults to 0)  |
| `REDIS_USERNAME` | `your-username`         | ❌       | Redis username (optional)             |

Add these in your `.env` file:

```env
NODE_ENV=local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password  # Optional
REDIS_DB=0  # Optional: database index
REDIS_USERNAME=your-username # Optional

```

> 🔁 In production, you can set `NODE_ENV=production` and pass user info via `x-user` header.

---

## 🧪 Usage in a NestJS Service

### 1. Enable `.env` loading

In `app.module.ts` of your NestJS service:

```ts
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class AppModule {}
```

---

### 2. Protect a route using the guard

```ts
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "nest-auth0-guard";

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  @Get()
  getProfile(@Req() req) {
    return req.user; // decoded token or forwarded user info
  }
}
```

---

## 🛡 How It Works

| `NODE_ENV`   | Behavior                                   |
| ------------ | ------------------------------------------ |
| `local`      | Validates JWT from `Authorization: Bearer` |
| `production` | Reads user from `x-user` header            |

### Redis Integration

The guard automatically fetches additional user data from Redis using the `user.sub` field as the key. If Redis data is found, it merges with the authenticated user object. The Redis key format is `user:{user.sub}`.

**Example Redis data structure:**

```json
{
  "user:auth0|123456789": {
    "preferences": { "theme": "dark" },
    "profile": { "avatar": "https://example.com/avatar.jpg" },
    "settings": { "notifications": true }
  }
}
```
