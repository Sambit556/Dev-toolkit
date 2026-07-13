export interface HttpStatusCode {
  code: number;
  phrase: string;
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
  description: string;
}

export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  { code: 100, phrase: 'Continue', category: '1xx', description: 'The initial part of the request has been received and the client should continue with the rest of it.' },
  { code: 101, phrase: 'Switching Protocols', category: '1xx', description: 'The server is switching protocols as requested by the client (e.g. to WebSocket) via the Upgrade header.' },
  { code: 102, phrase: 'Processing', category: '1xx', description: 'The server has received and is processing the request, but no response is available yet (WebDAV).' },
  { code: 103, phrase: 'Early Hints', category: '1xx', description: 'Used to return some response headers before the final HTTP message, e.g. for resource preloading.' },

  { code: 200, phrase: 'OK', category: '2xx', description: 'The request succeeded. The result meaning depends on the HTTP method used.' },
  { code: 201, phrase: 'Created', category: '2xx', description: 'The request succeeded and a new resource was created as a result, typically after POST or PUT.' },
  { code: 202, phrase: 'Accepted', category: '2xx', description: 'The request has been received but not yet acted upon; processing may not have started.' },
  { code: 203, phrase: 'Non-Authoritative Information', category: '2xx', description: 'The returned metadata is not exactly the same as from the origin server, but from a local/third-party copy.' },
  { code: 204, phrase: 'No Content', category: '2xx', description: 'There is no content to send, but the headers are useful. The client may update its cached headers.' },
  { code: 205, phrase: 'Reset Content', category: '2xx', description: 'Tells the client to reset the document that sent this request, e.g. clear a form.' },
  { code: 206, phrase: 'Partial Content', category: '2xx', description: 'Used with range requests to deliver only part of a resource.' },

  { code: 300, phrase: 'Multiple Choices', category: '3xx', description: 'The request has more than one possible response; the client should choose one of them.' },
  { code: 301, phrase: 'Moved Permanently', category: '3xx', description: 'The URL of the requested resource has been permanently changed to the one in the Location header.' },
  { code: 302, phrase: 'Found', category: '3xx', description: 'The requested resource resides temporarily under a different URL.' },
  { code: 303, phrase: 'See Other', category: '3xx', description: 'The client should GET the resource at another URL using a GET request, regardless of the original method.' },
  { code: 304, phrase: 'Not Modified', category: '3xx', description: 'Used for caching purposes: tells the client the response has not been modified since last requested.' },
  { code: 307, phrase: 'Temporary Redirect', category: '3xx', description: 'Same as 302, but the client must reuse the same HTTP method for the new request.' },
  { code: 308, phrase: 'Permanent Redirect', category: '3xx', description: 'Same as 301, but the client must reuse the same HTTP method for the new request.' },

  { code: 400, phrase: 'Bad Request', category: '4xx', description: 'The server cannot process the request due to a client error (malformed syntax, invalid request message framing, etc).' },
  { code: 401, phrase: 'Unauthorized', category: '4xx', description: 'The client must authenticate itself to get the requested response.' },
  { code: 402, phrase: 'Payment Required', category: '4xx', description: 'Reserved for future use, originally intended for digital payment systems.' },
  { code: 403, phrase: 'Forbidden', category: '4xx', description: 'The client does not have access rights to the content; unlike 401, re-authenticating will not help.' },
  { code: 404, phrase: 'Not Found', category: '4xx', description: 'The server cannot find the requested resource.' },
  { code: 405, phrase: 'Method Not Allowed', category: '4xx', description: 'The request method is known by the server but is not supported for the target resource.' },
  { code: 406, phrase: 'Not Acceptable', category: '4xx', description: 'The server cannot produce a response matching the list of acceptable values from the request headers.' },
  { code: 407, phrase: 'Proxy Authentication Required', category: '4xx', description: 'Similar to 401 but authentication is needed to be done by a proxy.' },
  { code: 408, phrase: 'Request Timeout', category: '4xx', description: 'The server timed out waiting for the request from the client.' },
  { code: 409, phrase: 'Conflict', category: '4xx', description: 'The request conflicts with the current state of the target resource.' },
  { code: 410, phrase: 'Gone', category: '4xx', description: 'The requested content has been permanently deleted from the server, with no forwarding address.' },
  { code: 411, phrase: 'Length Required', category: '4xx', description: 'The server refuses to accept the request without a defined Content-Length header.' },
  { code: 412, phrase: 'Precondition Failed', category: '4xx', description: 'One or more conditions in the request headers evaluated to false.' },
  { code: 413, phrase: 'Payload Too Large', category: '4xx', description: 'The request entity is larger than limits defined by the server.' },
  { code: 414, phrase: 'URI Too Long', category: '4xx', description: 'The URI requested by the client is longer than the server is willing to interpret.' },
  { code: 415, phrase: 'Unsupported Media Type', category: '4xx', description: 'The media format of the requested data is not supported by the server.' },
  { code: 416, phrase: 'Range Not Satisfiable', category: '4xx', description: 'The range specified by the Range header cannot be fulfilled.' },
  { code: 417, phrase: 'Expectation Failed', category: '4xx', description: 'The expectation given in the Expect request header could not be met.' },
  { code: 418, phrase: "I'm a teapot", category: '4xx', description: 'A humorous status code from the April Fools RFC 2324, sometimes used by servers refusing to brew coffee.' },
  { code: 422, phrase: 'Unprocessable Entity', category: '4xx', description: 'The request was well-formed but contains semantic errors (WebDAV, widely used by JSON APIs).' },
  { code: 423, phrase: 'Locked', category: '4xx', description: 'The resource being accessed is locked (WebDAV).' },
  { code: 425, phrase: 'Too Early', category: '4xx', description: 'The server is unwilling to risk processing a request that might be replayed.' },
  { code: 426, phrase: 'Upgrade Required', category: '4xx', description: 'The server refuses to perform the request using the current protocol.' },
  { code: 428, phrase: 'Precondition Required', category: '4xx', description: 'The origin server requires the request to be conditional to avoid lost update conflicts.' },
  { code: 429, phrase: 'Too Many Requests', category: '4xx', description: 'The user has sent too many requests in a given amount of time (rate limiting).' },
  { code: 431, phrase: 'Request Header Fields Too Large', category: '4xx', description: 'The server refuses to process the request because header fields are too large.' },
  { code: 451, phrase: 'Unavailable For Legal Reasons', category: '4xx', description: 'The user requested a resource that is unavailable for legal reasons (e.g. censorship).' },

  { code: 500, phrase: 'Internal Server Error', category: '5xx', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.' },
  { code: 501, phrase: 'Not Implemented', category: '5xx', description: 'The request method is not supported by the server and cannot be handled.' },
  { code: 502, phrase: 'Bad Gateway', category: '5xx', description: 'The server, while acting as a gateway or proxy, received an invalid response from the upstream server.' },
  { code: 503, phrase: 'Service Unavailable', category: '5xx', description: 'The server is not ready to handle the request, often due to maintenance or overload.' },
  { code: 504, phrase: 'Gateway Timeout', category: '5xx', description: 'The server, while acting as a gateway or proxy, did not get a response in time from the upstream server.' },
  { code: 505, phrase: 'HTTP Version Not Supported', category: '5xx', description: 'The HTTP version used in the request is not supported by the server.' },
  { code: 507, phrase: 'Insufficient Storage', category: '5xx', description: 'The server is unable to store the representation needed to complete the request (WebDAV).' },
  { code: 508, phrase: 'Loop Detected', category: '5xx', description: 'The server detected an infinite loop while processing the request (WebDAV).' },
  { code: 510, phrase: 'Not Extended', category: '5xx', description: 'Further extensions to the request are required for the server to fulfill it.' },
  { code: 511, phrase: 'Network Authentication Required', category: '5xx', description: 'The client needs to authenticate to gain network access, e.g. captive portals.' },
];
