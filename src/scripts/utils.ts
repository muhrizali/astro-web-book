import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { sortBy } from "es-toolkit";
// import { sum } from "es-toolkit";

interface BookData {
    index: string,
    type: "PAGE" | "CHAPTER" | "PART";
    title: string;
    isDraft: boolean;
    chapterNum?: number;
    partNum?: number;
}

interface BookUnitItem {
    id: string;
    data: BookData;
}

interface BlogData {
    title: string;
    description: string;
    author: string;
    category: string;
    tags: string[];
    datePublished: string;
    dateModified: string;
    isDraft: boolean;
}

interface BlogItem {
    id: string;
    data: BlogData;
}

type CollectionType = "UNITS" | "BLOGS";


// utilities about DATA

class Node<T> {
    public value: T;
    public leftNode: Node<T> | null;
    public rightNode: Node<T> | null;

    constructor(value: T) {
        this.value = value;
        this.leftNode = null;
        this.rightNode = null;
    }
}

function getNodesFrom<T>(items: T[]) {
    const nodes: Node<T>[] = items.map((item) => new Node(item));
    for (let i = 0; i < nodes.length; i++) {
        if (i === 0) {
            nodes[i].rightNode = nodes[i + 1];
            continue;
        }
        if (i === (nodes.length - 1)) {
            nodes[i].leftNode = nodes[i - 1];
            continue;
        }
        nodes[i].leftNode = nodes[i - 1];
        nodes[i].rightNode = nodes[i + 1];
    }
    return nodes;
}

function getFilteredCollection(collection: any[]) {;
    return collection.filter((item: any) => !(item.data["isDraft"]));
}

async function getOurCollectionItem(collection: CollectionType, ID: string) {
    return await getEntry(collection, ID);
}

async function getUnitCollection(): Promise<CollectionEntry<'UNITS'>[]> {
    let collection: CollectionEntry<'UNITS'>[] = await getCollection("UNITS");
    collection = getFilteredCollection(collection);
    collection = sortBy(collection, [(item: any) => item.data["index"]]);
    return collection;
}

async function getUnitCollectionItem(itemID: string): Promise<CollectionEntry<'UNITS'>> {
    const collection = await getUnitCollection();
    const item = collection.find((entry) => entry.id === itemID);
    if (!item) {
        throw new Error("Book Collection Item Not Found");
    }
    return item;
}

async function getUnitNodesCollection() {
    const collection = await getUnitCollection();
    return getNodesFrom(collection);
}

async function getUnitNodesCollectionItem(itemID: string) {
    const nodesCollection = await getUnitNodesCollection();
    return nodesCollection.find((item) => item.value.id === itemID);
}

async function getBlogCollection() {
    let collection: CollectionEntry<'BLOGS'>[] = await getCollection("BLOGS");
    collection = getFilteredCollection(collection);
    collection = sortBy(collection, [(item: any) => item.data["datePublished"]]);
    return collection;
}

async function getBlogCollectionItem(itemID: string) {
    const collection = await getBlogCollection();
    const entry = collection.find((item) => item.id === itemID);
    if (!entry) {
        throw new Error("Blog Collection Item Not Found")
    }
    return entry;
}

// METADATA UTILITIES

export {
    getUnitCollection,
    getUnitNodesCollection,
    getUnitCollectionItem,
    getUnitNodesCollectionItem,
    getNodesFrom,
    getBlogCollection,
    getBlogCollectionItem,
    Node,
};