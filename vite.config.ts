import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'tensorflow': ['@tensorflow/tfjs', '@tensorflow-models/mobilenet'],
              'charts': ['chart.js', 'react-chartjs-2'],
              'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              'vendor': ['react', 'react-dom']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      optimizeDeps: {
        include: ['@tensorflow/tfjs', '@tensorflow-models/mobilenet']
      }
    };
});
