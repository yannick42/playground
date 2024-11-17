
export class Node {
    // public fields
    key;
    value;
    // child nodes
    left;
    right;

    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.left = null;
        this.right = null;
    }
}


/**
 * most operation are O(log n)
 */
export class BST {

    counter;
    lastDeletedNode;

    constructor() {
        this.root = null;
        this.counter = 0;
        this.lastDeletedNode = null;
    }

    isEmpty() {
        return this.counter <= 0;
    }

    insert(key, value) {
        const newNode = new Node(key, value);

        if(this.root === null) {
            this.root = newNode;
        } else {
            this._insertNode(this.root, newNode); // start at root
        }

        this.counter++; // insertion done..
    }

    _insertNode(node, newNode) {
        if(newNode.key < node.key) {
            if(node.left === null) {
                node.left = newNode;
            } else {
                this._insertNode(node.left, newNode);
            }
        } else if (newNode.key > node.key) {
            if(node.right === null) {
                node.right = newNode;
            } else {
                this._insertNode(node.right, newNode);
            }
        } else {
            // merge properties...
            console.log("merge properties:", newNode.value, "into", node.value, "key=",node.key)
            Object.keys(newNode.value).forEach((key) => { // foreach named values of the new node
                
                if(key == "segments") {
                    console.log("key = segments", node.value[key])
                    if(node.value[key]) {
                        // replace "color" ...
                        node.value[key] = node.value[key].filter(seg => seg[2] !== newNode.value[key][2]);

                        console.log("add:", newNode.value[key], "to", node.value[key]);
                        node.value[key] = [...node.value[key], ...newNode.value[key]];
                    } else {
                        console.log(">", newNode.value[key]);
                        node.value[key] = [...newNode.value[key]]
                    }
                } else {
                    //if (node.value[key]) {
                    //    console.log(">>>>>", node.value, key);
                    //    node.value[key].push(newNode.value[key]);
                    //} else {
                        node.value[key] = newNode.value[key];
                    //}
                }
            });
        }
    }

    delete(key) {

        if(key === undefined) {
            throw "You should pass a 'key' to this delete function";
        }

        if(this.root) {
            this.lastDeletedNode = null;

            this.root = this._deleteNode(this.root, key)

            if(this.lastDeletedNode !== null) {
                this.counter--; // ??? if found !
            }

            return this.lastDeletedNode;
        } else {
            return this.root;
        }
    }

    /**
     * delete the key "node" & return the new root
     */
    _deleteNode(node, key) {

        if(node == null) {
            return node;
        }

        if(key < node.key) {
            // the key to delete lies in the left subtree
            const n = this._deleteNode(node.left, key);
            node.left = n;
        } else if (key > node.key) {
            // the key to delete lies in the right subtree
            const n = this._deleteNode(node.right, key);
            node.right = n;
        } else {
            // this is the node to delete <---

            this.lastDeletedNode = structuredClone(node);
            //console.error(`key=${node.key} to delete !`, this.lastDeletedNode);

            // one child or no child ? -> Easy
            if(node.left == null && node.right) {
                return node.right;
            } else if (node.right == null && node.left) {
                return node.left;
            } else if(node.left && node.right) {

                //
                // two children nodes
                //

                // get in-order successor (=smallest in the RIGHT subtree)
                const minValue = this.min(node.right);
                node.key = minValue; // change its key with this
                node.right = this._deleteNode(node.right, minValue);
            } else {
                // no child ?
                return null;
            }
        }

        return node;
    }

    get(key) {
        return this._get(this.root, key);
    }

    _get(node, key) {

        if(node == null) return;

        if(key < node.key) {
            return node.left ? this._get(node.left, key) : null;
        } else if (key > node.key) {
            return node.right ? this._get(node.right, key) : null;
        } else {
            return node; // found !
        }
    }

    minNode(node) {
        console.log("min of node:", node)
        let minValue = node.key;
        while(node.left != null) {
            node = node.left;
            minValue = node.key;
        }
        return minValue;
    }

    maxNode(node) {
        let maxValue = node.key;
        while(node.right != null) {
            node = node.right;
            maxValue = node.key;
        }
        return maxValue;
    }

    /**
     * absolute max ?
     */
    max() {
        let node = this.root;
        while(node?.right) {
            node = node.right;
        }
        return node;
    }

    min() {
        let node = this.root;
        while(node?.left) {
            node = node.left;
        }
        return node;
    }

    isEmpty() {
        return this.root == null;
    }


    getPredecessorOf(key) {
        let node = this.get(key);

        //console.log(">pred of", node)

        if(node == null) return;

        // 1. node has a left subtree
        if(node.left) {
            const n = this.get(this.maxNode(node.left));
            //console.warn("n:", n)
            return n?.key;
        }

        // 2. go up the nearest ancestor with a right subtree
        let root = this.root;
        let predecessor;
        while(root) {
            if(key > root.key) {
                predecessor = root.key;
                root = root.right
            } else if (key < root.key) {
                root = root.left;
            } else {
                break; // found
            }
        }
        return predecessor; // = a key
    }

    getSuccessorOf(key) {
        let node = this.get(key);

        //console.log(">succ:", node)

        if(node == null) return;

        // 1. node has a left righttree
        if(node.right) {
            const n = this.get(this.minNode(node.right));
            //console.warn("n:", n)
            return n?.key;
        }

        // 2. go up the nearest ancestor with a left? subtree
        let ancestor = this.root;
        let successor = null;
        while(ancestor) {
            if(key < ancestor.key) {
                successor = ancestor.key;
                ancestor = ancestor.left
            } else {
                ancestor = ancestor.right;
            }
        }
        return successor; // = a key
    }



    //
    // tree traversals (DFS: in/pre/post-orders ?)
    //

    // eg. to evaluate arithmetic expressions stored in expression trees
    // - order used when deleting
    printInOrder(node, output) {
        if(node?.left) this.printInOrder(node.left, output);
        if(node) {
            output.push([node.key, node.value]);
        }
        if(node?.right) this.printInOrder(node.right, output);
    }

    // eg. to create a copy of the tree
    printPreOrder(node, output) {
        if(node) {
            output.push([node.key, node.value]);
        }
        if(node?.left) this.printPreOrder(node.left, output);
        if(node?.right) this.printPreOrder(node.right, output);
    }

    // eg. to delete the tree? / garbage collection algorithms ?
    printPostOrder(node, output) {
        if(node?.left) this.printPreOrder(node.left, output);
        if(node?.right) this.printPreOrder(node.right, output);
        if(node) {
            output.push([node.key, node.value])
        }
    }

}

// TODO... AVL/red-black ?
export class BalancedBST extends BST {



}


/*
const bst = new BST();

const keys = [1, 100, 2, 20, 75, 50];
const values = ['one', 'one hundred', 'two', 'twenty', 'seventy five', 'fifty'];

keys.forEach((key, i) => {
    console.log("adding:", key, "(value =", values[i], ")")
    bst.insert(key, values[i]);
})

const   inOrder = [],
        preOrder = [],
        postOrder = [];

bst.printInOrder(bst.root, inOrder);
console.log("In-order:", inOrder);

bst.printPreOrder(bst.root, preOrder);
console.log("Pre-order:", preOrder);

bst.printPostOrder(bst.root, postOrder);
console.log("Post-order:", postOrder);

console.log("delete key=2")
bst.delete(2);

const newInOrder = []
bst.printInOrder(bst.root, newInOrder);
console.log("In-order:", newInOrder);
*/

