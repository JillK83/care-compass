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
        { src: '../../packages/utils/assets/zip-county-crosswalk.csv', dest: 'assets' }
      ]
    }),
    {
      name: 'serve-crosswalk-dev',
      configureServer(server) {
        server.middlewares.use('/assets/zip-county-crosswalk.csv', (_req, res, next) => {
          const filePath = path.resolve(
            __dirname,
            '../../packages/utils/assets/zip-county-crosswalk.csv'
          )
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/csv')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      }
    }
  ],
  server: { port: 5174 },
})
