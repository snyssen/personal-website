export interface WebFingerObject {
    subject: string;
    links: WebFingerLink[];
    aliases?: string[];
}

export interface WebFingerLink {
    rel: string;
    type?: string;
    href?: string;
    template?: string;
}
