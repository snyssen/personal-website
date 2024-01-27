import type { MarkdownHeading } from "astro";

export interface HeadingsTreeNode {
  heading: MarkdownHeading;
  subHeadings: HeadingsTreeNode[];
}
