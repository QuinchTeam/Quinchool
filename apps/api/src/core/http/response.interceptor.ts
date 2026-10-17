import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import { ApiResponse } from "./api-response";

/** Wraps every successful body in `{ data }`. A 204 route returns nothing and stays bodiless. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined) return undefined;
        if (!(value instanceof ApiResponse)) return { data: value };

        return {
          data: value.data,
          ...(value.meta && { meta: value.meta }),
          ...(value.links && { links: value.links }),
        };
      }),
    );
  }
}
