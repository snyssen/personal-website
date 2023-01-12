import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.WEBSITE_URI ?? 'https://snyssen.be',
  integrations: [mdx(), sitemap(), tailwind()]
});