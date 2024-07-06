
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

    constructor() {
        this.root = null;
    }

    insert(key, value) {
        const newNode = new Node(key, value);

        if(this.root === null) {
            this.root = newNode;
        } else {
            this._insertNode(this.root, newNode); // start at root
        }
    }

    _insertNode(node, newNode) {
        if(newNode.key < node.key) {
            // 
            if(node.left === null) {
                node.left = newNode;
            } else {
                this._insertNode(node.left, newNode);
            }
        } else {
            if(node.right === null) {
                node.right = newNode;
            } else {
                this._insertNode(node.right, newNode);
            }
        }
    }

    delete(key) {
        if(this.root) {
            this._deleteNode(this.root, key)
        } else {
            return this.root;
        }
    }

    _deleteNode(node, key) {

        if(node == null) {
            return node;
        }

        if(key < node.key) {
            // the key to delete lies in the left subtree
            node.left = this._deleteNode(node.left, key);
        } else if (key > node.key) {
            // thje key to delete lies in the right subtree
            node.right = this._deleteNode(node.right, key);
        } else {
            // this is the node to delete

            // one child or no child ?
            if(node.left == null) {
                return node.right;
            } else if (node.right == null) {
                return node.left;
            }

            // two children nodes ?

            // get in-order successor (=smallest in the right subtree)
            const min = this.min(node.right);

            node.key = min;
            node.right = this._deleteNode(node.right, min);
        }

        return node;
    }

    min(node) {
        let minValue = node.key;
        while(node.left != null) {
            node = node.left;
            minValue = node.key;
        }
        return minValue;
    }

    isEmpty() {
        return this.root == null;
    }

    //
    // tree traversals (DFS: in/pre/post-orders ?)
    //

    // eg. to evaluate arithmetic expressions stored in expression trees
    // - order used when deleting
    printInOrder(node, output) {
        if(node.left) this.printInOrder(node.left, output);
        output.push([node.key, node.value]);
        if(node.right) this.printInOrder(node.right, output);
    }

    // eg. to create a copy of the tree
    printPreOrder(node, output) {
        output.push([node.key, node.value]);
        if(node.left) this.printPreOrder(node.left, output);
        if(node.right) this.printPreOrder(node.right, output);
    }

    // eg. to delete the tree? / garbage collection algorithms ?
    printPostOrder(node, output) {
        if(node.left) this.printPreOrder(node.left, output);
        if(node.right) this.printPreOrder(node.right, output);
        output.push([node.key, node.value])
    }

}

// TODO... AVL/red-black ?
export class BalancedBST extends BST {



}