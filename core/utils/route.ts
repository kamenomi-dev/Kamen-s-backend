import type { Context, Hono } from "hono";
import type { BlankEnv, BlankSchema, Env, Schema } from "hono/types";

import { FormatJsonErrorResponse } from "utils/formatter";

type InterfaceHandler<Args> = (
  context: Context,
  args: { [T in keyof Args]: Args[T] }
) => any;

class RouteUtils<E extends Env = BlankEnv, S extends Schema = BlankSchema> {
  private readonly __hono: Hono<E, S>;

  private constructor(hono: Hono<E, S>) {
    this.__hono = hono;
  }

  private static __instance: RouteUtils<any>;
  static Initialize<E extends Env = BlankEnv, S extends Schema = BlankSchema>(
    hono: Hono<E, S>
  ): RouteUtils<E, S> {
    if (this.__instance) {
      return this.__instance;
    }
    return (this.__instance = new RouteUtils(hono));
  }

  public RegisterInterface<Args extends Record<string, any>>(
    handler: InterfaceHandler<Args>,
    api: string = "/",
    args: [keyof Args, Capitalize<string>, boolean?][], // boolean: indicates if it's optional
    path?: string | string[]
  ): this {
    const fullPath = this._BuildFullPath(api, path);

    this.__hono.get(fullPath, (context) => {
      const { missingParams, conflictParams } = this._ValidateParams(
        context.req.query(),
        args
      );

      if (missingParams.length > 0) {
        return FormatJsonErrorResponse(
          context,
          406,
          `Missing required parameters: ${missingParams.join(", ")}.`
        );
      }

      if (conflictParams.length > 0) {
        return FormatJsonErrorResponse(
          context,
          406,
          `Invalid parameter types: ${conflictParams.join(", ")}.`
        );
      }

      return handler(context, context.req.query() as Args);
    });

    return this;
  }

  private _BuildFullPath(api: string, path: string | string[] = ""): string {
    const basePath = Array.isArray(path) ? path.join("/") : path;
    return basePath.concat(api.startsWith("/") ? api : `/${api}`);
  }

  private _ValidateParams<Args extends Record<string, string>>(
    receivedParams: Record<string, string>,
    expectedArgs: [keyof Args, Capitalize<string>, boolean?][]
  ): { missingParams: string[]; conflictParams: string[] } {
    const requiredParams = expectedArgs.filter(([, , optional]) => !optional);
    const optionalParams = expectedArgs.filter(([, , optional]) => optional);

    const requiredParamNames = requiredParams.map(([name]) => name as string);
    const optionalParamNames = optionalParams.map(([name]) => name as string);

    const receivedParamNames = Object.keys(receivedParams);

    const missingParams = requiredParamNames.filter(
      (param) => !receivedParamNames.includes(param)
    );

    const conflictParams = expectedArgs
      .filter(([name, expectedType]) => {
        const paramValue = receivedParams[name as string];
        return (
          paramValue !== undefined &&
          typeof paramValue !== expectedType.toLowerCase()
        );
      })
      .map(([name]) => name as string);

    return { missingParams, conflictParams };
  }
}

export { RouteUtils };
