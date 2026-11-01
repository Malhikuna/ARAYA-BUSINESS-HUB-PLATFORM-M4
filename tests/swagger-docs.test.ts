import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openapiSpec } from '../src/lib/docs/openapi-spec';
import { generateSwaggerHtml } from '../src/lib/docs/swagger-html';
import { isPublicPath } from '../src/lib/auth/rbac';
import { GET as getDocsHtml } from '../src/app/docs/route';
import { GET as getApiDocsHtml } from '../src/app/api-docs/route';
import { GET as getM4DocsHtml } from '../src/app/api/m4/v1/docs/route';
import { GET as getM4OpenApiJson } from '../src/app/api/m4/v1/openapi.json/route';
import { GET as getOpenApiJson } from '../src/app/api/v1/openapi.json/route';

describe('Swagger UI & OpenAPI Documentation Test Suite (Panduan Integrasi v1.0)', () => {
  describe('1. OpenAPI Specification Structure', () => {
    it('harus memiliki metadata OpenAPI 3.0.3 yang valid', () => {
      assert.equal(openapiSpec.openapi, '3.0.3');
      assert.ok(openapiSpec.info.title.includes('M4'));
      assert.ok(openapiSpec.info.version);
      assert.ok(openapiSpec.servers.some((s) => s.url.includes('/api/m4/v1')));
    });

    it('harus mendefinisikan seluruh endpoint utama sesuai tabel Panduan API Bersama', () => {
      const paths = Object.keys(openapiSpec.paths);
      assert.ok(paths.includes('/orders'), 'Kontrak K-04 /orders harus terdefinisi');
      assert.ok(paths.includes('/products'), 'Kontrak K-05 /products harus terdefinisi');
      assert.ok(paths.includes('/dashboard-summary'), 'Kontrak K-03 /dashboard-summary harus terdefinisi');
      assert.ok(paths.includes('/quotations'), '/quotations harus terdefinisi');
      assert.ok(paths.includes('/quotations/{id}/convert'), '/quotations/{id}/convert harus terdefinisi');
      assert.ok(paths.includes('/invoices/{invoice_id}/payments'), '/invoices/{invoice_id}/payments harus terdefinisi');
      assert.ok(paths.includes('/webhooks/payments/midtrans'), 'webhook midtrans harus terdefinisi');
      assert.ok(paths.includes('/customers'), '/customers harus terdefinisi');
      assert.ok(paths.includes('/events'), 'Kontrak K-09 /events harus terdefinisi');
    });

    it('harus mendefinisikan skema autentikasi bearerAuth, serviceKey, dan Error amplop', () => {
      assert.ok(openapiSpec.components.securitySchemes.bearerAuth);
      assert.ok(openapiSpec.components.securitySchemes.serviceKey);
      assert.ok(openapiSpec.components.schemas.Error);
      assert.ok(openapiSpec.components.schemas.OrderResponse);
      assert.ok(openapiSpec.components.schemas.EventPayload);
    });
  });

  describe('2. Public Path RBAC Verification', () => {
    it('harus mengizinkan endpoint dokumentasi dan webhook tanpa Bearer token', () => {
      assert.equal(isPublicPath('/api/m4/v1/docs'), true);
      assert.equal(isPublicPath('/api/m4/v1/openapi.json'), true);
      assert.equal(isPublicPath('/api/m4/v1/openapi'), true);
      assert.equal(isPublicPath('/api/m4/v1/webhooks/payments/midtrans'), true);
      assert.equal(isPublicPath('/docs'), true);
      assert.equal(isPublicPath('/api/v1/openapi.json'), true);
      assert.equal(isPublicPath('/api/m4/v1/orders'), false);
    });
  });

  describe('3. Swagger UI HTML Generator', () => {
    it('harus menghasilkan dokumen HTML lengkap dengan script SwaggerUIBundle', () => {
      const html = generateSwaggerHtml();
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('swagger-ui-bundle.js'));
      assert.ok(html.includes('SwaggerUIBundle({'));
      assert.ok(html.includes('Araya Business Hub'));
      assert.ok(html.includes('id="swagger-ui"'));
    });
  });

  describe('4. Route Handlers Response', () => {
    it('GET /api/m4/v1/docs harus mengembalikan respons HTML dengan status 200', async () => {
      const res = await getM4DocsHtml();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
      const text = await res.text();
      assert.ok(text.includes('id="swagger-ui"'));
    });

    it('GET /docs harus mengembalikan respons HTML dengan status 200', async () => {
      const res = await getDocsHtml();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
    });

    it('GET /api-docs harus mengembalikan respons HTML dengan status 200', async () => {
      const res = await getApiDocsHtml();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
    });

    it('GET /api/m4/v1/openapi.json harus mengembalikan spesifikasi dalam format JSON', async () => {
      const res = await getM4OpenApiJson();
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('application/json'));
      const json = await res.json();
      assert.equal(json.openapi, '3.0.3');
      assert.ok(json.paths['/orders']);
    });

    it('GET /api/v1/openapi.json harus mengembalikan spesifikasi yang sama (kompatibilitas)', async () => {
      const res = await getOpenApiJson();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.openapi, '3.0.3');
    });
  });
});
