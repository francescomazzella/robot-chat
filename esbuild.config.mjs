import * as esbuild from 'esbuild';
import copy from 'esbuild-plugin-copy';

/** @type {esbuild.BuildOptions} */
const buildOptions = {
  entryPoints: [
    'src/main.ts',
  ],
  bundle: true,
  outdir: 'dist',
  plugins: [
    copy({
      assets: [{
        from: ['src/**/*.html', 'src/**/*.png', 'src/**/*.css'],
        to: './',
      }, {
        from: ['assets/**/*'],
        to: './',
      }],
    })
  ],
  platform: 'node',
  target: ['node20'],
  loader: {
    '.ts': 'ts',
    '.js': 'js',
    '.png': 'copy',
    '.html': 'copy',
    '.json': 'copy',
    '.css': 'copy',
  },
  tsconfig: 'tsconfig.json',
  sourcemap: true,
  color: true,
  external: ['sqlite3'],
};


const ctx = await esbuild.context(buildOptions);

const args = process.argv.slice(2);

if (args.includes('--watch')) {
  await ctx.watch();
  console.log('Watching for changes...');

} else {
  await ctx.rebuild();
  console.log('Build succeeded');
  ctx.dispose();
}
