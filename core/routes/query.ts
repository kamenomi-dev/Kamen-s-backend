import type { Context } from "hono";
import { getConnInfo } from "hono/cloudflare-workers";

import axios from "axios";

import { type WorkerEnvironment } from "core/entry";
import {
  FormatJsonErrorResponse,
  FormatJsonNormalResponse,
} from "core/utils/formatter";

export interface ApiQueryInterface {
  page?: number;
  ________________ciallo________________?: string;
}

type LocationInfo = {
  ip: string;
  countryCode: string;
  countryName: string;
  isInEuropeanUnion: boolean;
  regionName: string;
  regionCode: string;
  city: string;
  zipCode: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  metroCode: number;
  organisation: string;
  flagUrl: string;
  emojiFlag: string;
  currencySymbol: string;
  currency: string;
  callingCode: string;
  countryCapital: string;
} & {
  isProxy: boolean;
  isTorNode: boolean;
  isSpam: boolean;
  isSuspicious: boolean;
};

export default async function (
  context: Context<WorkerEnvironment>,
  args: ApiQueryInterface
) {
  const { page = 0, ________________ciallo________________ } = args;

  const clientIP = getConnInfo(context).remote.address || "127.0.0.1";
  const locationInfo = await axios.get<LocationInfo>(
    `https://ip-api.io/json?ip=${clientIP}`
  );

  const skipUnsuited = locationInfo?.data?.countryCode === "CN";
  const isListAll = ________________ciallo________________ === "ciallo~";

  const optionalCondition =
    (!isListAll ? "is_apply = 1 AND " : "") +
    (skipUnsuited && !isListAll ? "is_unsuited = 1" : "");

  const blogrollCountResult = await context.env.Blogrolls.prepare(
    /* sql */ `
      SELECT count(*) AS count 
      FROM blogroll 
      ${optionalCondition ? "WHERE " + optionalCondition : ""}
    `
  ).run();

  const blogrollCount = blogrollCountResult.results[0]["count"] as number;

  const startIndex = page * 20;
  const blogrollFilterResult = await context.env.Blogrolls.prepare(
    /* sql */ `
      SELECT * 
      FROM blogroll 
      WHERE ? < idx AND idx <= ? 
      ${optionalCondition ? "AND " + optionalCondition : ""}
    `
  )
    .bind(startIndex, startIndex + 20)
    .run();

  if (blogrollCountResult.error || blogrollFilterResult.error) {
    return FormatJsonErrorResponse(context, 500, "Internal Error.");
  }

  return FormatJsonNormalResponse(context, 200, {
    counts: {
      all: blogrollCount,
      current: {
        page: startIndex / 20,
        size: blogrollFilterResult.results.length,
      },
    },
    results: blogrollFilterResult.results,
  });
}
