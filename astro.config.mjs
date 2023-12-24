import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";

export default defineConfig({
  site: process.env.WEBSITE_URI ?? "http://localhost:4321",
  integrations: [mdx(), sitemap(), tailwind(), preact()],
});
