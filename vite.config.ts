import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	server: {
		hmr: {
			// Use 127.0.0.1 to avoid IPv6/IPv4 localhost resolution mismatches that break WebSocket
			host: '127.0.0.1',
			protocol: 'ws'
		}
	}
});
