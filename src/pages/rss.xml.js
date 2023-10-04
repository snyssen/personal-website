import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { BlogUtils } from "../utils/blog-utils.astro";

import { SITE_TITLE, SITE_DESCRIPTION } from "../config";

export const GET = async (context) =>
  rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: (await BlogUtils.getPostsOrderedByDateDesc()).map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      // Compute RSS link from post `slug`
      // This example assumes all posts are rendered as `/blog/[slug]` routes
      link: `/${post.collection}/${post.slug}/`,
    })),
  });
