import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta?: any;
  pagination?: any;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data) => {
        if (!data || typeof data !== 'object') {
          return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
          };
        }

        // Support both 'meta' and 'pagination' conventions consistently
        const pagination = data.meta || data.pagination;
        const items = data.data !== undefined ? data.data : data.items;

        if (items !== undefined && pagination !== undefined) {
          return {
            success: true,
            data: items,
            pagination,
            meta: pagination,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
