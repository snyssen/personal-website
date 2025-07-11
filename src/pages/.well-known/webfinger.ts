import { WebFingerLink, WebFingerObject } from "../../models/WebFingerObject"

export const prerender = false;

const searchDomains = [
    "social.snyssen.be"
];
const authIssuers = [
    {
        allowedDomains: ["snyssen.be"],
        url: "https://auth.snyssen.be"
    }
]
const supportedDomains = searchDomains.concat(authIssuers.flatMap(x => x.allowedDomains));

export async function GET({ request, redirect }) {
    const url = new URL(request.url);
    const resource = url.searchParams.get("resource");

    if (!resource) return new Response("Bad request", { status: 400 });

    // Retrieve "username" and domain part of email
    const matches = resource.match(/acct:([\w\.]+)@([\w\.]+)/);
    // Should have 3 matches: global match + username and domain
    if (!matches || matches.length !== 3) return new Response("Bad request", { status: 400 });;
    const username = matches[1];
    const domain = matches[2];

    if (!supportedDomains.includes(domain)) return new Response("Not found", { status: 404 });

    // search for resource on search domains
    const searchResults: WebFingerObject[] = [];
    for (const searchDomain of searchDomains) {
        const searchParams = new URLSearchParams({ resource: `${username}@${searchDomain}` })
        const searchResponse = await fetch(`https://${searchDomain}/.well-known/webfinger?${searchParams}`)
        if (!searchResponse.ok) continue;

        const searchJson = await searchResponse.json();
        if (searchJson) searchResults.push(searchJson);
    }

    // Get auth issuers for domain
    const authIssuersLinks: WebFingerLink[] = [];
    for (const authIssuer of authIssuers) {
        if (!authIssuer.allowedDomains.includes(domain)) continue;
        authIssuersLinks.push({
            rel: "http://openid.net/specs/connect/1.0/issuer",
            href: authIssuer.url
        });
    }

    // Build response
    const aliases = searchResults.filter(x => x.aliases && x.aliases.length > 0).flatMap(x => x.aliases!)
    const searchLinks = searchResults.filter(x => x.links && x.links.length > 0).flatMap(x => x.links);
    const webFingerResponse: WebFingerObject = {
        subject: `acct:${username}@${domain}`,
        aliases: aliases,
        links: searchLinks.concat(authIssuersLinks)
    }
    // If we do not have any link, then it's not a match
    if (webFingerResponse.links.length <= 0) return new Response("Not found", { status: 404 });

    return new Response(JSON.stringify(webFingerResponse), {
        headers: {
            "Content-Type": "application/activity+json",
        },
    });
}
