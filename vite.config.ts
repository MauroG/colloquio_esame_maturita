import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && (req.url.startsWith('/api/') || req.url.includes('/api/chat'))) {
            try {
              const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
              const pathname = urlObj.pathname;
              
              // Map to TS file in api/ directory (e.g. /api/chat -> /api/chat.ts)
              const rawModulePath = pathname.endsWith('.ts') ? pathname : `${pathname}.ts`;
              const modulePath = path.join(process.cwd(), rawModulePath);
              
              // Load TS module dynamically using Vite
              const handlerModule = await server.ssrLoadModule(modulePath);
              const handler = handlerModule.default;
              
              if (typeof handler !== 'function') {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: `Handler in ${modulePath} must export a default function` }));
                return;
              }

              // Read requested body chunks
              let rawBody = '';
              req.on('data', chunk => { rawBody += chunk; });
              req.on('end', async () => {
                let parsedBody = {};
                if (rawBody) {
                  try {
                    parsedBody = JSON.parse(rawBody);
                  } catch (e) {
                     parsedBody = rawBody;
                  }
                }
                
                const query = Object.fromEntries(urlObj.searchParams.entries());
                
                const vercelReq = Object.assign(req, {
                  body: parsedBody,
                  query: query,
                });
                
                const vercelRes = Object.assign(res, {
                  status(code: number) {
                    res.statusCode = code;
                    return vercelRes;
                  },
                  json(data: any) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return vercelRes;
                  },
                  send(data: any) {
                    res.end(data);
                    return vercelRes;
                  }
                });

                try {
                  await handler(vercelReq, vercelRes);
                } catch (err: any) {
                  console.error('API execution error:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
                }
              });
            } catch (err: any) {
              console.error('API load error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Failed to load route: ${err.message}` }));
            }
          } else {
            next();
          }
        });
      }
    },
  };
});
