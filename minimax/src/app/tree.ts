
/**
 * https://www.30secondsofcode.org/js/s/data-structures-tree/
 */

export class TreeNode {
	
	key: string;
	value: any;
	children: TreeNode[];
	parent: TreeNode|null;
	
  constructor(key: string, value=key, parent: TreeNode|null =null) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.children = [];
  }

  get isLeaf() {
    return this.children.length === 0;
  }

  get hasChildren() {
    return !this.isLeaf;
  }
}


export class Tree {

	root: TreeNode;

  constructor(key: string, value = key) {
    this.root = new TreeNode(key, value);
  }

  *preOrderTraversal(node = this.root): Iterable<TreeNode> {
    yield node;
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.preOrderTraversal(child);
      }
    }
  }

  *postOrderTraversal(node = this.root): Iterable<TreeNode> {
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.postOrderTraversal(child);
      }
    }
    yield node;
  }

  insert(parentNodeKey: string, key: string, value = key) {
    for (let node of this.preOrderTraversal()) {
      if (node.key === parentNodeKey) {
        node.children.push(new TreeNode(key, value, node));
        return true;
      }
    }
    return false;
  }

  remove(key: string) {
    for (let node of this.preOrderTraversal()) {
      const filtered = node.children.filter((c: TreeNode) => c.key !== key);
      if (filtered.length !== node.children.length) {
        node.children = filtered;
        return true;
      }
    }
    return false;
  }

  find(key: string) {
    for (let node of this.preOrderTraversal()) {
      if (node.key === key) return node;
    }
    return undefined;
  }
}
