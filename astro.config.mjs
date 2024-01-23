import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import expressiveCode from "astro-expressive-code";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeExternalLinks from "rehype-external-links";
import remarkCapitalizeHeadings from "remark-capitalize-headings";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
export default defineConfig({
  site: process.env.WEBSITE_URI ?? "http://localhost:4321",
  integrations: [
    expressiveCode(),
    mdx({ rehypePlugins: [] }),
    sitemap(),
    tailwind(),
    preact(),
  ],
  image: {
    domains: ["httpgoats.com"],
  },
  markdown: {
    remarkPlugins: [remarkCapitalizeHeadings],
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeExternalLinks,
        {
          content: {
            type: "raw",
            value:
              ' <i class="las la-external-link-alt text-sm" aria-hidden="true"></i>',
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          content: {
            type: "raw",
            value:
              ' <i class="las la-anchor hover:scale-125" aria-hidden="true"></i>',
          },
        },
      ],
    ],
  },
});
