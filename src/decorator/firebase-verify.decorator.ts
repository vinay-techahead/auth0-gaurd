import { SetMetadata } from "@nestjs/common";

export const FIREBASE_JWT = "firebase-jwt";
export const FirebaseJwt = () => SetMetadata(FIREBASE_JWT, true);
