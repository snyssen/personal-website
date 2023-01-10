/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			backgroundSize: {
				'150%': '150%',
				'200%': '200%',
				'250%': '250%',
				'300%': '300%',
				'350%': '350%',
				'400%': '400%',
			},
			keyframes: {
				'gradient-slide-left-right': {
					'0%': { 'background-position': '0% 50%' },
					'100%': { 'background-position': '100% 50%' }
				}
			},
			animation: {
				'gradient-pulse-once': 'gradient-slide-left-right 2s ease-in-out infinite alternate'
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
