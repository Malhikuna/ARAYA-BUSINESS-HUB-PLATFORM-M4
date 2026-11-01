import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openapiSpec } from '../src/lib/docs/openapi-spec';
import { generateSwaggerHtml } from '../src/lib/docs/swagger-html';
import { isPublicPath } from '../src/lib/auth/rbac';
import { GET as getDocsHtml } from '../src/app/docs/route';
import { GET as getApiDocsHtml } from '../src/app/api-docs/route';
import { GET as getOpenApiJson } from '../src/app/api/v1/openapi.json/route';
import { GET as getOpenApiRoute } from '../src/app/api/v1/openapi/route';

describe('Swagger UI & OpenAPI Documentation Test Suite', () => {
  describe('1. OpenAPI Specification Structure', () => {
    it('harus memiliki metadata OpenAPI 3.0 yang valid', () => {
      assert.equal(openapiSpec.openapi, '3.0.3');
      assert.ok(openapiSpec.info.title.includes('Modul 4'));
      assert.ok(openapiSpec.info.version);
    });

    it('harus mendefinisikan seluruh endpoint utama lintas modul', () => {
      const paths = Object.keys(openapiSpec.paths);
      assert.ok(paths.includes('/checkouts'));
      assert.ok(paths.includes('/invoices/{invoice_id}/payments'));
      assert.ok(paths.includes('/webhooks/payments/midtrans'));
      assert.ok(paths.includes('/orders/{id}/status'));
      assert.ok(paths.includes('/products'));
      assert.ok(paths.includes('/customers'));
      assert.ok(paths.includes('/quotations'));
      assert.ok(paths.includes('/quotations/{id}/convert'));
    });

    it('harus mendefinisikan skema autentikasi BearerAuth dan format error seragam', () => {
      assert.ok(openapiSpec.components.securitySchemes.BearerAuth);
      assert.ok(openapiSpec.components.schemas.ErrorResponse);
      assert.ok(openapiSpec.components.schemas.CheckoutRequest);
      assert.ok(openapiSpec.components.schemas.InvoicePaidEvent);
    });
  });

  describe('2. Public Path RBAC Verification', () => {
    it('harus mengizinkan endpoint /api/v1/openapi.json dan /api/v1/openapi tanpa Bearer token', () => {
      assert.equal(isPublicPath('/api/v1/openapi.json'), true);
      assert.equal(isPublicPath('/api/v1/openapi'), true);
      assert.equal(isPublicPath('/api/v1/products'), false);
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
    it('GET /docs harus mengembalikan respons HTML dengan status 200', async () => {
      const res = await getDocsHtml();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
      const text = await res.text();
      assert.ok(text.includes('id="swagger-ui"'));
    });

    it('GET /api-docs harus mengembalikan respons HTML dengan status 200', async () => {
      const res = await getApiDocsHtml();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
    });

    it('GET /api/v1/openapi.json harus mengembalikan spesifikasi dalam format JSON', async () => {
      const res = await getOpenApiJson();
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('application/json'));
      const json = await res.json();
      assert.equal(json.openapi, '3.0.3');
      assert.ok(json.paths['/checkouts']);
    });

    it('GET /api/v1/openapi harus mengembalikan spesifikasi yang sama', async () => {
      const res = await getOpenApiRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.openapi, '3.0.3');
    });
  });
});
