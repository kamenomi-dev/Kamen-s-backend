import type { Context } from "hono";

import { FormatJsonErrorResponse } from "utils/formatter";

export default async function (context: Context) {
  return FormatJsonErrorResponse(
    context,
    403,
    `Premission conflict! You haven't premission to access here! `,
  );
}
