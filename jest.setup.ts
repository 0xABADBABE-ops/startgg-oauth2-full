import { webcrypto as nodeWebcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'node:util';

// WebCrypto
// @ts-ignore
if (!global.crypto) global.crypto = nodeWebcrypto as unknown as Crypto;

// TextEncoder/Decoder
// @ts-ignore
if (!global.TextEncoder) global.TextEncoder = TextEncoder as any;
// @ts-ignore
if (!global.TextDecoder) global.TextDecoder = TextDecoder as any;

// Response/Headers/Request (Node)
// @ts-ignore
if (typeof Response === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Response, Headers, Request } = require('node-fetch');
  // @ts-ignore
  global.Response = Response;
  // @ts-ignore
  global.Headers = Headers;
  // @ts-ignore
  global.Request = Request;
}

// Default fetch mock (tests override per suite)
// @ts-ignore
if (!global.fetch) global.fetch = jest.fn();