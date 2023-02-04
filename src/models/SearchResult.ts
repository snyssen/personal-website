import type { Index } from "lunr";

export interface SearchResult {
    hit: Index.Result;
    doc: SearchResultDoc;
}

export interface SearchResultDoc {
    canonicalUrl: string;
    content: string;
    description: string;
    id: string;
    tag: string;
    title: string;
}