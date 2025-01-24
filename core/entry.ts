import { Hono } from "hono";

import { showRoutes } from "hono/dev";
import type { D1Database } from "@cloudflare/workers-types";


export type WorkerEnvironment = {
  Bindings: {
    Blogrolls: D1Database;
  };
};

const app = new Hono<WorkerEnvironment>();

showRoutes(app, {
  verbose: true
})
export default app;

import("./routes");

