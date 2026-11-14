import { defineConfig } from 'electron-vite'
import { defineConfig as defineViteConfig } from 'vite'
import { resolve } from 'path'
import { readdirSync } from 'fs'
import viteChecker from 'vite-plugin-checker'
import viteCp from 'vite-plugin-cp'
import viteZipPack from 'unplugin-zip-pack/vite'
import PluginManifest from './manifest.json'
import PackageLock from './package-lock.json'

const SRC_DIR = resolve(__dirname, './src')
const OUTPUT_DIR = resolve(__dirname, './dist')
const RuntimeLicenseTargets = Object.entries(PackageLock.packages as Record<string, { dev?: boolean }>)
  .filter(([packagePath, pkg]) => packagePath && !pkg.dev)
  .flatMap(([packagePath]) => readdirSync(resolve(__dirname, packagePath))
    .filter(file => /^(?:licen[cs]e|notice|copying|copyright)/i.test(file))
    .map(file => ({
      src: `${packagePath}/${file}`,
      dest: `dist/licenses/${packagePath.replaceAll('node_modules/', '')}`
    })))

const BaseConfig = defineViteConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': SRC_DIR
    }
  }
})

const ConfigBuilder = (type: 'main' | 'preload') =>
  defineViteConfig({
    ...BaseConfig,

    plugins: [
      viteChecker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "src/**/*.{ts,js}"'
        }
      })
    ],
    build: {
      minify: true,
      outDir: resolve(OUTPUT_DIR, `./${type}`),
      lib: {
        entry: resolve(SRC_DIR, `./${type}/index.ts`),
        formats: ['cjs'],
        fileName: () => 'index.js'
      }
    }
  })

export default defineConfig({
  main: ConfigBuilder('main'),
  preload: ConfigBuilder('preload'),
  renderer: defineViteConfig({
    ...BaseConfig,

    plugins: [
      viteChecker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "src/**/*.{ts,js}"'
        }
      }),
      viteCp({
        targets: [
          { src: './manifest.json', dest: 'dist' },
          { src: './LICENSE', dest: 'dist' },
          { src: './README.md', dest: 'dist' },
          { src: './src/assets', dest: 'dist/assets' },
          ...RuntimeLicenseTargets,
          { src: './licenses/QuickJS.txt', dest: 'dist/licenses/@tootallnate/quickjs-emscripten' },
          { src: './node_modules/degenerator/README.md', dest: 'dist/licenses/degenerator' },
          { src: './node_modules/netmask/README.md', dest: 'dist/licenses/netmask' }
        ]
      }),
      viteZipPack({
        in: OUTPUT_DIR,
        out: resolve(__dirname, `./${PluginManifest.slug}.zip`)
      })
    ],
    build: {
      minify: false,
      outDir: resolve(OUTPUT_DIR, './renderer'),
      lib: {
        entry: resolve(SRC_DIR, './renderer/index.ts'),
        formats: ['es'],
        fileName: () => 'index.js'
      },
      rollupOptions: {
        input: resolve(SRC_DIR, './renderer/index.ts')
      }
    }
  })
})
