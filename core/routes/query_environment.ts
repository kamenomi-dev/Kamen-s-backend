import type { Context } from "hono";
import { env } from "hono/adapter";
import { FormatJsonErrorResponse, FormatJsonNormalResponse } from "utils/formatter";

export default async function (context: Context) {
  const token = context.req.query("token");

  if (token !== "123456")
    return FormatJsonErrorResponse(
      context,
      200,
      "Premission conflict! You haven't premission to access here! "
    );

  return FormatJsonNormalResponse(context, 200, env(context));
}
