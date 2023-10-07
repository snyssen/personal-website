import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import astroLunr from "@siverv/astro-lunr/plugin.mjs";
import preact from "@astrojs/preact";

export default defineConfig({
  site: process.env.WEBSITE_URI ?? "http://localhost:4321",
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
    astroLunr({
      subDir: "lunr",
      initialize: (builder, lunr) => {
        builder.field("title", {
          boost: 10,
        });
        builder.field("description", {
          boost: 5,
        });
        builder.field("tag", {
          boost: 8,
        });
        builder.field("content", {
          boost: 1,
        });
      },
    }),
    preact(),
  ],
});
