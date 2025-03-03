// CommonJS syntax for build script
import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build React app
async function buildReactApp() {
  try {
    await build({
      entryPoints: [join(__dirname, 'src/web/react/App.tsx')],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(__dirname, 'src/web/public/app.js'),
      jsx: 'automatic',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    console.log('React app built successfully');
  } catch (error) {
    console.error('Error building React app:', error);
    process.exit(1);
  }
}

buildReactApp();