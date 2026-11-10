import { openapiSpec } from './openapi-spec';

export function generateSwaggerHtml(): string {
  const specJson = JSON.stringify(openapiSpec);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Swagger UI API Documentation for Araya Business Hub - Modul 4" />
  <title>Araya Business Hub (Modul 4) — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.18.2/favicon-32x32.png" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .topbar {
      display: none !important;
    }
    .swagger-ui .info {
      margin: 28px 0 20px 0;
    }
    .swagger-ui .info .title {
      font-size: 28px;
      color: #1e293b;
    }
    .swagger-ui .scheme-container {
      background: #f1f5f9;
      box-shadow: none;
      padding: 16px 0;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function() {
      var spec = ${specJson};
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        docExpansion: 'list',
        filter: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
      });
    };
  </script>
</body>
</html>`;
}
