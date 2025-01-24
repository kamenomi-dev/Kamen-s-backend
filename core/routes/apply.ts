import type { Context } from "hono";

import type { WorkerEnvironment } from "core/entry";
import {
  FormatJsonErrorResponse,
  FormatJsonNormalResponse,
} from "utils/formatter";
import { ValidateEmailString, ValidateURLString } from "utils/regex";

// const createBlogrolls = (context: Context) =>
//   context.env.Blogrolls.prepare(/*sql*/`
// CREATE TABLE IF NOT EXISTS "blogroll" (
//   "idx"	INTEGER NOT NULL UNIQUE,
//   "mail"	TEXT NOT NULL DEFAULT '' UNIQUE,
//   "name"	TEXT NOT NULL DEFAULT ''
//   "link"	TEXT NOT NULL DEFAULT '' UNIQUE,
//   "is_apply"	INTEGER NOT NULL DEFAULT '0',
//   "is_unsuited"	INTEGER NOT NULL DEFAULT '0',
//   PRIMARY KEY("index" AUTOINCREMENT)
// )`);

export interface ApiApplyArguments {
  mail: string;
  name: string;
  link: string;
}
export default async function (context: Context<WorkerEnvironment>, args: ApiApplyArguments) {
  const { name, mail, link } = args;

  // Anti bot.
  if (!ValidateURLString(link) && !ValidateEmailString(mail)) {
    return FormatJsonNormalResponse(context, 200, "success");
  }

  const applyBlogroll = context.env.Blogrolls.prepare(/*sql*/ `
    INSERT INTO blogroll (mail, name, link, is_apply, is_unsuited)
    VALUES (?, ?, ?, 0, 0)
  `);

  try {
    await applyBlogroll.bind(mail, name, link).run();
  } catch (error) {
    return HandleDatabaseError(error as Error, context, args);
  }

  return FormatJsonNormalResponse(context, 200, {
    content:
      "You have applied for blogroll! Please look out for our email response in the next few days.",
  });
}

function HandleDatabaseError(
  error: Error,
  context: Context,
  args: ApiApplyArguments
) {
  const errorSummary = error.toString();

  const isUniquenessConflict = errorSummary.includes("SQLITE_CONSTRAINT");
  if (isUniquenessConflict) {
    const conflictKey = errorSummary.split(": ")[3];

    if (conflictKey.includes("blogroll.link")) {
      return FormatJsonNormalResponse(context, 403, {
        conflict: {
          link: args.link,
        },
        content:
          "You had applied for blogroll already! Please look out for our email response in the next few days.",
      });
    }

    if (conflictKey.includes("blogroll.mail")) {
      return FormatJsonNormalResponse(context, 403, {
        conflict: {
          mail: args.mail,
        },
        content:
          "You had applied therebefore! Please look out for our email response in the next few days.",
      });
    }
  }

  console.log(error);
  return FormatJsonErrorResponse(context, 500, "Internal Error!");
}
