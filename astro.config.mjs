import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  site: process.env.WEBSITE_URI ?? "http://localhost:4321",
  integrations: [expressiveCode(), mdx(), sitemap(), tailwind(), preact()],
  image: {
    domains: ["httpgoats.com"],
  },
});
