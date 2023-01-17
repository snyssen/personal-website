import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";

// https://astro.build/config
export default defineConfig({
  site: process.env.WEBSITE_URI ?? "http://localhost:3000",
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
    image({ serviceEntryPoint: "@astrojs/image/sharp" }),
  ],
});
