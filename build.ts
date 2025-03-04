import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { $, build } from 'bun';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, 'dist');

/**
 * Build the application
 */
async function buildApp(dev = false) {
  try {
    const startTime = performance.now();
    console.log(`Starting ${dev ? 'development' : 'production'} build...`);

    // Ensure dist directory exists
    if (!existsSync(distDir)) {
      await mkdir(distDir, { recursive: true });
    }

    // Write index.html
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elsydeon Quote Manager</title>
  <link rel="stylesheet" href="/styles.css">
  <script src="/app.js" type="module" defer></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    await Bun.write(join(distDir, 'index.html'), html);

    // Build React app with Bun's bundler
    const jsResult = await build({
      entrypoints: [join(__dirname, 'src/web/react/App.tsx')],
      outdir: distDir,
      minify: !dev,
      sourcemap: dev ? 'inline' : 'none',
      naming: { entry: 'app.js' },
    });

    if (!jsResult.success) {
      console.error('JS build failed:', jsResult.logs);
      if (!dev) process.exit(1);
      return;
    }

    // Process CSS with Tailwind
    console.log('Processing CSS with Tailwind...');
    
    // Use separate command for dev/prod to avoid template literal issues
    const tailwindCmd = dev
      ? await $`tailwindcss -i ./src/web/styles.css -o ./dist/styles.css`
      : await $`tailwindcss -i ./src/web/styles.css -o ./dist/styles.css --minify`;
    
    if (tailwindCmd.exitCode !== 0) {
      console.error('CSS processing failed');
      if (!dev) process.exit(1);
      return;
    }

    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`✓ Build completed in ${duration}ms`);
    
  } catch (error) {
    console.error('Build error:', error);
    if (!dev) process.exit(1);
  }
}

// Main execution
const isWatchMode = process.argv.includes('-w') || process.argv.includes('--watch');

if (isWatchMode) {
  // Run in watch mode
  const { watch } = await import('node:fs');
  
  console.log('🔄 Starting build in watch mode...');
  await buildApp(true);
  
  // Watch for file changes
  const watcher = watch('src', { recursive: true }, async (_, filename) => {
    if (filename) {
      console.log(`📝 File changed: ${filename}`);
      await buildApp(true);
    }
  });
  
  // Handle termination
  process.on('SIGINT', () => {
    watcher.close();
    console.log('👋 Watch mode terminated');
    process.exit(0);
  });
  
  console.log('👀 Watching for changes...');
} else {
  // Run a single production build
  await buildApp();
}
