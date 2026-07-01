import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '../../packages/utils/assets/*',
          dest: 'assets'
        }
      ]
    }),
    {
      name: 'serve-shared-assets-dev',
      configureServer(server) {
        server.middlewares.use('/assets', (req, res, next) => {
          const filePath = path.resolve(
            __dirname,
            '../../packages/utils/assets',
            req.url?.replace(/^\//, '') ?? ''
          )
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type',
              filePath.endsWith('.geojson') ? 'application/json' :
              filePath.endsWith('.csv') ? 'text/csv' :
              'application/octet-stream'
            )
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      }
    }
  ],
  server: { port: 5173 },
})
