import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

async function FormatJsonErrorResponse(
  context: Context,
  status: StatusCode,
  reason: string,
  stack?: string
) {
  context.status(status);
  return context.json({
    status: status,
    error: {
      reason,
      stack,
    },
  });
}

async function FormatJsonNormalResponse(
  context: Context,
  status: StatusCode,
  data: any
) {
  context.status(status);
  return context.json({
    status: status,
    data,
  });
}

export { FormatJsonErrorResponse, FormatJsonNormalResponse };
