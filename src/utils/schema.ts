import {
    makeIds, 
    buildWebSite, 
    buildWebPage, 
    buildArticle, 
    buildBreadcrumbList, 
    buildSiteNavigationElement, 
    buildPiece,
    assembleGraph,
    type GraphEntity,
} from "@jdevalk/seo-graph-core";
import type { Graph } from "schema-dts";
import { type MarkdownLayoutProps } from "astro";


/*
WebSite
  ├── publisher → Person or Organization
  ├── hasPart → SiteNavigationElement
  │
  ├── Blog (optional, for sites with a blog)
  │     └── publisher → Person or Organization
  │
  └── WebPage (one per URL)
        ├── isPartOf → WebSite
        ├── breadcrumb → BreadcrumbList
        ├── primaryImage → ImageObject
        │
        ├── BlogPosting or Article (if blog post)
        │     ├── isPartOf → WebPage, Blog
        │     ├── author → Person
        │     ├── publisher → Person or Organization
        │     └── image → ImageObject
        │
        └── VideoObject (if video page)
              └── isPartOf → WebPage
*/

interface CrumbItem {
    label: string;
    path: string;
}

interface CoreMetadata {
    type: "PAGE" | "POST";
    path: string; // url path like /, /home, /about
    title: string;
    description: string;
    crumbItems: CrumbItem[];
    specifics: NonNullable<any>;
}

interface WebPageSpecifics {
    schema: "WebPage" | "ProfilePage" | "CollectionPage";
}

interface WebPageMetadata extends CoreMetadata {
    // type: "PAGE"
    specifics: WebPageSpecifics;
}

interface ArticleSpecifics {
    schema: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle" | "ScholarlyArticle" | "Report";
    author: string;
    datePublished: string;
    dateModified: string;
    category: string; // top level category; Technology, Health, Data Science
    tags: string[];    
}

interface ArticleMetadata extends CoreMetadata {
    // type: "POST"
    specifics: ArticleSpecifics;
}

function createWebPageMetadata(opts: Omit<WebPageMetadata, 'type'>): WebPageMetadata {
    return {
        type: "PAGE",
        path: opts.path,
        title: opts.title,
        description: opts.description,
        crumbItems: opts.crumbItems,
        specifics: {
            schema: opts.specifics.schema,
        }
    };
}

function createArticleMetadata(opts: Omit<ArticleMetadata, 'type'>): ArticleMetadata {
    const metadata: ArticleMetadata = {
        type: "POST",
        path: opts.path,
        title: opts.title,
        description: opts.description,
        crumbItems: opts.crumbItems,
        specifics: {
            author: opts.specifics.author,
            datePublished: opts.specifics.datePublished,
            dateModified: opts.specifics.dateModified,
            category: opts.specifics.category,
            tags: opts.specifics.tags,
            schema: opts.specifics.schema,
        }
    };
    return metadata;
}


const BASE = {
    SITE_URL: "https://example.com",
    SITE_NAME: "Website name",
    SITE_DESCRIPTION: "Website description",
    LINKS: [
        { label: "Home", path: "/" },
        { label: "Blog", path: "/blog/" },
        { label: "About", path: "/about/" },
        { label: "Book", path: "/book/" },
    ],
    COPYRIGHT: {
        YEAR: 2026,
        HOLDER: "Person Name",
        NOTICE: "© 2026 Jane Doe.",
        LICENSE_URL: "https://creativecommons.org/licenses/by/4.0/",
    },
};

const ids = makeIds({
    siteUrl: BASE.SITE_URL,
    personUrl: `${BASE.SITE_URL}/about`,
});

// building essential schema pieces
function buildCorePieces() {
    // core peices: [website + site_navigation]
    
    const webSitePiece = buildWebSite(
        {
            // Website Root URL
            url: `${BASE.SITE_URL}/`,
    
            // Global site title
            name: BASE.SITE_NAME,
    
            // Global site description
            description: BASE.SITE_DESCRIPTION,         
            
            // Publisher; could be a Person or Organization reference
            publisher: { "@id": ids.person },
            // author: { "@id": ids.person },
    
    
            // About the website
            about: { "@id": ids.person },
            inLanguage: "en-US",
    
            // Navigation Reference
            hasPart: { "@id": ids.navigation },
    
            // Optional Copright Info
            copyrightHolder: { '@id': ids.person },
            // copyrightHolder: { '@id': ids.organization('slug') },
            copyrightYear: BASE.COPYRIGHT.YEAR,
            copyrightNotice: BASE.COPYRIGHT.NOTICE,
            license: BASE.COPYRIGHT.LICENSE_URL,
    
            // Actions like Searching for sites with search
            // portentialAction: {}
    
            // ...additional schema-dts properties accepted at top level
        },
        ids,
    );

    const siteNavigationPiece = buildSiteNavigationElement(
        {   
            // Navigation Name
            name: "Main navigation",

            // Relation to WebSite
            isPartOf: { '@id': ids.website },

            // Main Navigation Links / Main Pages
            items: BASE.LINKS.map(
                (item) => ({ name: item.label, url: `${BASE.SITE_URL}${item.path}` })
            ), 
            
            // ...additional schema-dts properties accepted at top level
        },
        ids,
    );

    return [
        webSitePiece,
        siteNavigationPiece,
    ];
}

function buildItemBreadcrumbPiece(itemData: WebPageMetadata) {
    const breadcrumbPiece = buildBreadcrumbList({
            // Page/Post that this belongs to
            url: `${BASE.SITE_URL}${itemData.path}`,
    
            // Ordered Root First
            items: itemData.crumbItems.map(
                    (item) => ({ name: item.label, url: `${BASE.SITE_URL}${item.path}` })
            ),
            
            // ...additional schema-dts properties accepted at top level
        }, 
        ids,
    );
    return breadcrumbPiece;
}

interface WebPagePieceOpts {
    data: WebPageMetadata;
    includeBreadcrumb?: boolean;
}

function buildTillWebPagePiece(
    { data, includeBreadcrumb = true }: WebPagePieceOpts
) {
    // web-page pieces: [website + site_navigation] + web-page piece + breadcrumb piece for web-page
    
    const corePieces = buildCorePieces();
    const webPagePiece = buildWebPage(
        {   
            // Canonical URL of current page (becomes @id)
            url: `${BASE.SITE_URL}${data.path}`,
            
            // WebPage Title & Description
            name: `${data.title}`,
            description: `${data.description}`,
    
            // Relation to WebSite
            isPartOf: { "@id": ids.website },
    
            // Breacrumb reference for the current page
            breadcrumb: { "@id": ids.breadcrumb(`${BASE.SITE_URL}${data.path}`) },
    
            // For ProfilePage/homepage
            about: { '@id': ids.person }, 
            
            // Language
            inLanguage: "en-US",
            
            // Optional Dates emitted as ISO string
            // ...( webPageData.datePublished && {datePublished: new Date(webPageData.datePublished)} ),
            // ...( webPageData.dateModified && {dateModified: new Date(webPageData.dateModified)} ),
    
            // Optional Main Image Object reference
            // primaryImage: { "@id": ids.primaryImage(currentURL) },
                        
            // isAccessibleForFree: true, // optional
            // potentialAction: [], // optional — defaults to ReadAction
            
            // ...additional schema-dts properties accepted at top level
        },
        ids,
        // third param: 'WebPage' | 'ProfilePage' | 'CollectionPage'
        data.specifics.schema,
    );

    if (includeBreadcrumb) {
        const breadcrumbPiece = buildItemBreadcrumbPiece(data);
        return [
            ...corePieces,
            webPagePiece,
            breadcrumbPiece,
        ];
    }

    return [
        ...corePieces,
        webPagePiece,
    ];
}

interface ArticlePieceOpts {
    data: ArticleMetadata,
    includeBreadcrumb?: boolean;
}

function buildTillArticlePiece(
    { data, includeBreadcrumb = true }: ArticlePieceOpts
) {
    // article pieces: [website + site_navigation + web-page piece] + article piece + breadcrumb for article piece
    
    const correspondingWebPageData: WebPageMetadata = {
        type: "PAGE",
        path: data.path,
        title: data.title,
        description: data.description,
        crumbItems: data.crumbItems,
        specifics: {
            schema: "WebPage",
        }
    };

    const webPagePieces = buildTillWebPagePiece({ data: correspondingWebPageData });
    
    const articlePiece = buildArticle(
        {   
            // Current Canonical URL
            url: `${BASE.SITE_URL}${data.path}`,
    
            // Relation to WebPage
            isPartOf: { "@id": ids.webPage(`${BASE.SITE_URL}${data.path}`) },
    
            author: { "@id": ids.person }, // Person ref
            publisher: { "@id": ids.person }, // Person or Organization ref
            about: { '@id': ids.person }, // optional — what this article is about
            
            // Title & description for Article/Post
            headline: `${data.title}`,
            description: `${data.description}`,
            inLanguage: "en-US", // optional
            
            // Dates: Published date is required
            datePublished: new Date(data.specifics.datePublished),
            
            // Optional Dates: Modified date
            ...( data.specifics.dateModified && {dateModified: new Date(data.specifics.dateModified)} ),
    
            // Optional Image Reference
            // image: { '@id': ids.primaryImage(currentURL) },
    
            // Optional Top Level Category
            ...( (data.specifics.category) && {articleSection: data.specifics.category} ),
    
            // Optional Word Count
            // wordCount: 700,
    
            // Optional Whole Content In Plain Text (max ~10K chars)
            // articleBody: "Entire body of the text in plain text...", 
            
            // ...additional schema-dts properties accepted at top level
        },
        ids,
        // Schema Type: Defaults to 'Article'. Use 'BlogPosting' for blog posts, 'NewsArticle' for journalism, 'TechArticle' for technical docs, 'ScholarlyArticle' for academic papers, or 'Report' for data/research reports.
        data.specifics.schema,
    );

    if (includeBreadcrumb) {
        const breadcrumbPiece = buildItemBreadcrumbPiece(correspondingWebPageData);
        return [
            ...webPagePieces,
            articlePiece,
            breadcrumbPiece,
        ]
    }

    return [
        ...webPagePieces,
        articlePiece,
    ];
}


// function buildTillCustomPiece() {
    // Custom Generic Typed Schema Builder
    // const customPiece = buildPiece<SchemaType>()
// }


function buildGraph(pieces: GraphEntity[]) {
    return assembleGraph(pieces);
}

// MARKDOWN

// type for markdown properties
type MarkdownPageProps = {
    title: string;
    description: string;
    path: string;
    crumbItems: { label: string, path: string }[];
    specifics: { schema: "WebPage" | "ProfilePage" | "CollectionPage" };
};

// markdown properties validation
function validatePageFrontmatter(frontmatter: MarkdownPageProps) {

    // all proper properties presence check
    // if (!('title' in frontmatter) || !('description' in frontmatter) || !(''))

    // all properties empty, null or undefined check
    for (const [property, value] of Object.entries(frontmatter)) {
        
        if ((property === 'file') || (property === 'url')) {
            continue;
        }

        if (!(['title', 'description', 'path', 'crumbItems', 'specifics'].includes(property))) {
            throw new Error(`Found Extra Properties: ${JSON.stringify(frontmatter)}`)
        }


        if (!value) {
            throw new Error(`Invalid Property Found: Requires value of "${property}"`);
        }
    }

    // 'path' property start-slash check
    if (!(frontmatter.path.startsWith("/"))) {
        throw new Error(`Invalid Path: Must always start with "/" found "${frontmatter.path}"`);
    }

    // crumb items 'label' and 'path' presence check
    for (const item of frontmatter.crumbItems) {
        if (!("label" in item)) {
            throw new Error(`Invalid Breadcrumb Item: Expected "label", found ${JSON.stringify(item)}`);
        }
        if (!("path" in item)) {
            throw new Error(`Invalid Breadcrumb Item: Expected "path", found ${JSON.stringify(item)}`);
        }
    }

    // crumb items 'label': null check + 'path': null and start-slash check 
    for (const {label, path} of (frontmatter.crumbItems)) {
        if ((!label)) {
            throw new Error(`Invalid Breadcrumb Label: Expected non-empty, non-null and non-undefined value, found "${label}"`);
        }
        if ((!path) || !(path.startsWith("/"))) {
            throw new Error(`Invalid Breadcrumb Path: Expected starting with '/', non-empty, non-null and non-undefined value, found "${path}"`);
        }
    }

    // schema type check: 
    if (!(["WebPage", "ProfilePage", "CollectionPage"].includes(frontmatter.specifics.schema))) {
        throw new Error(`Invalid Schema: Expected one of ["WebPage", "ProfilePage", "CollectionPage"], found "${frontmatter.specifics.schema}"`);
    }
}

// turn MD page frontmatter into metadata object
function toPageMetadata(frontmatter: MarkdownPageProps): WebPageMetadata {
    validatePageFrontmatter(frontmatter);
    return createWebPageMetadata({
        title: frontmatter.title,
        description: frontmatter.description,
        path: frontmatter.path,
        crumbItems: frontmatter.crumbItems,
        specifics: {
            schema: frontmatter.specifics.schema,
        }
    });
}

// turn collection item metadata into metadata object

// turn book MD frontmatter into metadata object
function fromBookToPageMetadata(item: any) {
    return createWebPageMetadata({
        title: item.data.title,
        description: `Book Page: ${item.data.title}`,
        path: `/book/${item.id}`,
        specifics: {
            schema: "WebPage"
        },
        crumbItems: [
            { label: "Home", path: "/" },
            { label: "Book", path: "/book" },
            { label: `${item.data.title}`, path: `/book/${item.id}` },
        ],
    })
}

export {
    BASE,
    type WebPageMetadata,
    type ArticleMetadata,
    type CoreMetadata,
    type MarkdownPageProps,
    buildTillWebPagePiece,
    buildTillArticlePiece,
    buildGraph,
    createWebPageMetadata,
    createArticleMetadata,
    validatePageFrontmatter,
    toPageMetadata,
    fromBookToPageMetadata
}

