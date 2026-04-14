import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Mount all @convex-dev/auth HTTP routes (token exchange, JWKS, OAuth callbacks)
auth.addHttpRoutes(http);

export default http;
