import app, { type WorkerEnvironment } from "core/entry";
import { RouteUtils } from "utils/route";

import ApiRootHandler from "./root";
import ApiApplyHandler, { type ApiApplyArguments } from "./apply";
import ApiQueryHandler, {type ApiQueryInterface } from "./query";

RouteUtils.Initialize<WorkerEnvironment>(app)
  .RegisterInterface<{}>(ApiRootHandler, undefined, [])
  .RegisterInterface<ApiApplyArguments>(ApiApplyHandler, "apply", [
    ["name", "String"],
    ["mail", "String"],
    ["link", "String"],
  ]).RegisterInterface<ApiQueryInterface>(ApiQueryHandler, "query", [
    ["page", "Number", true],
    ["________________ciallo________________", "String", true],
  ]);
