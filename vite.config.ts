import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	server: {
		// Disable HMR WebSocket — fixes connection failures in Tauri webview and some network setups.
		// Use full page refresh (F5) during development instead of hot reload.
		hmr: false
	}
});
