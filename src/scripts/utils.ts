import { getCollection, getEntry } from "astro:content";
import { sortBy } from "es-toolkit";
// import { sum } from "es-toolkit";

class Node {
    public value: any;
    public leftNode: Node | null;
    public rightNode: Node | null;

    constructor(value: any) {
        this.value = value;
        this.leftNode = null;
        this.rightNode = null;
    }
}

function getNodes(items: any[]) {
    const nodes: Node[] = items.map((item) => new Node(item));
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

type CollectionType = "UNITS";

async function getOurCollection(collection: CollectionType) {
    const items = await getCollection(collection);
    return items.filter((item: any) => !(item.data["isDraft"]));
}

async function getOurCollectionItem(collection: CollectionType, ID: string) {
    return await getEntry(collection, ID);
}

async function getUnitCollection(): Promise<Node[]> {
    let units = await getOurCollection("UNITS");
    units = sortBy(units, [(item: any) => item.data["index"]]);
    const unitNodes = getNodes(units);
    return unitNodes;
}

async function getUnitCollectionItem(itemID: string): Promise<Node> {
    const nodes = await getUnitCollection();
    const node = nodes.find((node) => node.value.id === itemID);
    if (!node) {
        throw new Error("Collection Item Not Found");
    }
    return node;
}

export {
    getUnitCollection,
    getUnitCollectionItem,
    Node,
};