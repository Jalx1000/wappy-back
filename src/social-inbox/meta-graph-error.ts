import { BadGatewayException, Logger } from '@nestjs/common';
import axios from 'axios';

interface MetaGraphErrorBody {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
}

/**
 * Normalises an error from a Meta Graph API call into a BadGatewayException.
 *
 * Meta returns far more than a `message`: `code`, `error_subcode`, `type`,
 * `fbtrace_id` and user-facing `error_user_title/_msg`. Those are what tell a
 * "(#3) Application does not have the capability" apart from a closed 24h
 * window or a bad token, so we log the whole thing while still surfacing Meta's
 * message to the caller.
 */
export function metaGraphError(
  logger: Logger,
  err: unknown,
  fallback: string,
): BadGatewayException {
  if (err instanceof BadGatewayException) return err;

  if (axios.isAxiosError(err)) {
    const meta = (err.response?.data as { error?: MetaGraphErrorBody })?.error;
    const message = meta?.message ?? err.message ?? fallback;

    if (meta) {
      const detail =
        `code=${meta.code ?? '?'} subcode=${meta.error_subcode ?? '-'} ` +
        `type=${meta.type ?? '-'} fbtrace=${meta.fbtrace_id ?? '-'}`;
      const userMsg =
        meta.error_user_title || meta.error_user_msg
          ? ` — ${meta.error_user_title ?? ''}: ${meta.error_user_msg ?? ''}`
          : '';
      logger.warn(`${fallback}: ${message} [${detail}]${userMsg}`);
    } else {
      logger.warn(`${fallback}: ${message}`);
    }

    return new BadGatewayException(message);
  }

  logger.warn(`${fallback}: unknown error`);
  return new BadGatewayException(fallback);
}
