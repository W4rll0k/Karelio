import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss(), {
    name: 'karelio-license-notices',
    generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_NOTICES.txt', source: readFileSync(new URL('./THIRD_PARTY_NOTICES.txt', import.meta.url), 'utf8') });
    },
}], base: './' });
