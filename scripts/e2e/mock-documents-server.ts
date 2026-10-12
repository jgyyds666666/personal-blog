import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PrivateDocument } from '../../src/lib/document-types';

const documents = new Map<string, PrivateDocument>();
const files = new Map<string, { buffer: Buffer; contentType: string }>();

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  return Buffer.concat(chunks);
}

function json(response: ServerResponse, value: unknown, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

async function handle(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url || '/', 'http://127.0.0.1:54329');
  const path = decodeURIComponent(url.pathname);
  if (path === '/health') return json(response, { ok: true });
  if (path.startsWith('/rest/v1/')) {
    if (path.endsWith('/posts')) return json(response, []);
    if (!path.endsWith('/private_documents')) return json(response, {}, 404);
    if (request.headers.apikey !== 'test-service-role-key') return json(response, { message: 'Forbidden' }, 403);
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (request.method === 'POST') {
      const body = JSON.parse((await readBody(request)).toString()) as Omit<PrivateDocument, 'created_at' | 'updated_at'>;
      const now = new Date().toISOString();
      const document: PrivateDocument = { ...body, created_at: now, updated_at: now };
      documents.set(document.id, document);
      return json(response, document, 201);
    }
    if (request.method === 'PATCH') {
      const body = JSON.parse((await readBody(request)).toString()) as { title: string; updated_at: string };
      const document = id ? documents.get(id) : undefined;
      if (document) documents.set(document.id, { ...document, ...body });
      return json(response, null);
    }
    if (request.method === 'DELETE') {
      if (id) documents.delete(id);
      return json(response, null);
    }
    let rows = id ? (documents.has(id) ? [documents.get(id)!] : []) : [...documents.values()];
    const select = url.searchParams.get('select');
    if (select && select !== '*') {
      const projected = rows.map((row) => Object.fromEntries(select.split(',').map((key) => [key, row[key as keyof PrivateDocument]])));
      return json(response, projected);
    }
    rows = rows.sort((left, right) => right.created_at.localeCompare(left.created_at));
    return json(response, rows);
  }
  if (path === '/storage/v1/bucket/private-documents') return json(response, { id: 'private-documents', name: 'private-documents', public: false });
  const objectPath = path.match(/^\/storage\/v1\/object\/(?:authenticated\/)?private-documents\/(.+)$/);
  if (objectPath) {
    if (request.headers.apikey !== 'test-service-role-key') return json(response, { message: 'Forbidden' }, 403);
    const key = objectPath[1];
    if (request.method === 'POST') {
      files.set(key, { buffer: await readBody(request), contentType: request.headers['content-type'] || 'application/octet-stream' });
      return json(response, { Key: `private-documents/${key}` });
    }
    const file = files.get(key);
    if (!file) return json(response, { message: 'Not found' }, 404);
    response.writeHead(200, { 'Content-Type': file.contentType });
    return response.end(file.buffer);
  }
  if (path === '/storage/v1/object/private-documents' && request.method === 'DELETE') {
    const body = JSON.parse((await readBody(request)).toString()) as { prefixes: string[] };
    body.prefixes.forEach((key) => files.delete(key));
    return json(response, body.prefixes.map((name) => ({ name })));
  }
  return json(response, { message: `Mock route missing: ${request.method} ${path}` }, 404);
}

createServer((request, response) => { void handle(request, response).catch((error: unknown) => { console.error(error); json(response, { message: 'Mock error' }, 500); }); })
  .listen(54329, '127.0.0.1', () => console.log('Document mock Supabase ready on 54329'));
