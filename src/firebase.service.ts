import { Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import { getEnv } from "./env";

@Injectable()
export class FirebaseService {
  private firebaseApp: admin.app.App;

  constructor() {
    if (!admin.apps.length) {
      const serviceAccountString = getEnv("FIREBASE_SERVICE_ACCOUNT");

      if (!serviceAccountString) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT env variable not set");
      }

      const serviceAccount = JSON.parse(serviceAccountString);

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  getAuth() {
    return this.firebaseApp.auth();
  }
}
