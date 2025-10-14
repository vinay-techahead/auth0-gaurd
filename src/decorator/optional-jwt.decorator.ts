import { SetMetadata } from "@nestjs/common";

export const OPTIONAL_JWT = "optional-jwt";
export const OptionalJwt = () => SetMetadata(OPTIONAL_JWT, true);
