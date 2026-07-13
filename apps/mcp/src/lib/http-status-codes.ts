export interface HttpStatusCode {
  code: number;
  phrase: string;
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
  description: string;
}

export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  { code: 100, phrase: 'Continue', category: '1xx', description: 'The initial part of the request has been received and the client should continue with the rest of it.' },
  { code: 101, phrase: 'Switching Protocols', category: '1xx', description: 'The server is switching protocols as requested by the client (e.g. to WebSocket).' },
  { code: 200, phrase: 'OK', category: '2xx', description: 'The request succeeded.' },
  { code: 201, phrase: 'Created', category: '2xx', description: 'The request succeeded and a new resource was created.' },
  { code: 202, phrase: 'Accepted', category: '2xx', description: 'The request has been received but not yet acted upon.' },
  { code: 204, phrase: 'No Content', category: '2xx', description: 'There is no content to send, but the headers are useful.' },
  { code: 206, phrase: 'Partial Content', category: '2xx', description: 'Used with range requests to deliver only part of a resource.' },
  { code: 301, phrase: 'Moved Permanently', category: '3xx', description: 'The resource has permanently moved to the URL in the Location header.' },
  { code: 302, phrase: 'Found', category: '3xx', description: 'The requested resource resides temporarily under a different URL.' },
  { code: 304, phrase: 'Not Modified', category: '3xx', description: 'The response has not been modified since last requested (caching).' },
  { code: 307, phrase: 'Temporary Redirect', category: '3xx', description: 'Same as 302, but the client must reuse the original HTTP method.' },
  { code: 308, phrase: 'Permanent Redirect', category: '3xx', description: 'Same as 301, but the client must reuse the original HTTP method.' },
  { code: 400, phrase: 'Bad Request', category: '4xx', description: 'The server cannot process the request due to a client error.' },
  { code: 401, phrase: 'Unauthorized', category: '4xx', description: 'The client must authenticate itself to get the requested response.' },
  { code: 403, phrase: 'Forbidden', category: '4xx', description: 'The client does not have access rights to the content.' },
  { code: 404, phrase: 'Not Found', category: '4xx', description: 'The server cannot find the requested resource.' },
  { code: 405, phrase: 'Method Not Allowed', category: '4xx', description: 'The request method is not supported for the target resource.' },
  { code: 409, phrase: 'Conflict', category: '4xx', description: 'The request conflicts with the current state of the target resource.' },
  { code: 410, phrase: 'Gone', category: '4xx', description: 'The requested content has been permanently deleted, with no forwarding address.' },
  { code: 422, phrase: 'Unprocessable Entity', category: '4xx', description: 'The request was well-formed but contains semantic errors.' },
  { code: 429, phrase: 'Too Many Requests', category: '4xx', description: 'The user has sent too many requests in a given amount of time (rate limiting).' },
  { code: 500, phrase: 'Internal Server Error', category: '5xx', description: 'The server encountered an unexpected condition.' },
  { code: 501, phrase: 'Not Implemented', category: '5xx', description: 'The request method is not supported by the server.' },
  { code: 502, phrase: 'Bad Gateway', category: '5xx', description: 'The server, acting as a gateway, received an invalid response from an upstream server.' },
  { code: 503, phrase: 'Service Unavailable', category: '5xx', description: 'The server is not ready to handle the request (maintenance/overload).' },
  { code: 504, phrase: 'Gateway Timeout', category: '5xx', description: 'The server, acting as a gateway, did not get a response in time from an upstream server.' },
];

export function lookupHttpStatusCode(code: number): HttpStatusCode | undefined {
  return HTTP_STATUS_CODES.find((c) => c.code === code);
}

export function searchHttpStatusCodes(query: string): HttpStatusCode[] {
  const q = query.toLowerCase();
  return HTTP_STATUS_CODES.filter((c) => String(c.code).includes(q) || c.phrase.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
}
