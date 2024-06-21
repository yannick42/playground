

//
// Union Find datastructure/algo
// - https://people.orie.cornell.edu/snp32/orie_6125/data-structures/union-find.html
//

//
// Linked List for UNION-FIND
// (it could have been done with a simple array ...)
//
export class LinkedListNode { // represents a node
  constructor(value, next = null, head = null) {
    this.head = head; // link to the "representative element" for UF
    this.value = value;
    this.next = next;
  }
}


export class LinkedList { // "main" class
  
  // created empty
  constructor () {
    this.head = null
    this.tail = null
  }
  
  // NOT USED !!
  // TODO: new head for every element ?!
  prepend(value) {
    this.head = new LinkedListNode(value, this.head /* as next value */);
    if (!this.tail) this.tail = this.head; // if prepend on an empty linked list
  }
  
  //
  // merge by copying values into this linked list (at the end) 
  //    linkedList: LinkedListNode     head node of the list merged into this one
  //
  merge(linkedList) {
    while(linkedList) { // browse
      this.append(linkedList.value); // it also give the "head" to each "new" element
      linkedList = linkedList.next;
    }
  }
  
  //
  // add a value at the end of this list
  //
  append(value) {
    //console.log("appending", value, "to the list", this.head);
    
    // no "next" node
    const newNode = new LinkedListNode(value, null, this.head); // with current head if any
    
    if(!this.head) { // still empty
      // console.log("new appended:", newNode);
      this.head = newNode;
      this.tail = newNode;
      
      // TODO : WEIRD !!! or else null ... only one color ??!?
      this.head.head = this.head;
      return;
    }
    
    // add to the end of the linked list
    this.tail.next = newNode;
    this.tail = newNode;
    this.tail.head = this.head; // keep a ref to head in the new node
    
    //console.log("appended:", this);
  }
  
  // NOT USED !!
  /*
  deleteNode(nodeToRemove) {
    // empty -> nothing to remove
    if(!this.head) return this;
    
    // if the node to delete is the first
    if(this.head === nodeToRemove) {
      if(!this.head.next) { // no other nodes ?
        this.head = null;
        this.tail = null;
      } else {
        this.head = this.head.next; // the second becomes the first node
      }
    }
    
    let currentNode = this.head;
    while(currentNode.next) {
      if(currentNode.next === nodeToRemove) {
        currentNode.next = currentNode.next.next;
        break;
      }
      currentNode = currentNode.next;
    }
    
    // if we just deleted the last element :
    if (this.tail === nodeToRemove) this.tail = currentNode
    
    return this;
  }
  */
  
  // return the node found from inside a list
  // @return null|LinkedListNode
  find(value, returnRepresentativeElement = false) {
    if(!this.head) return null; // nothing in the linked list
    
    let currentNode = this.head;
    while(currentNode) {
      if(currentNode.value === value) {
        let ret = returnRepresentativeElement ?
            currentNode.head // representative of the equivalent class
          : currentNode;
        //console.log("ret:", ret, currentNode)
        return ret;
      }
      
      // go to next in the linked list
      currentNode = currentNode.next;
    }
  }
  
} // LinkedList



export class UF {
  
  lists = [];
  
  constructor() {
  }
  
  // add a singleton in the linked lists for each given element
  // @returns void
  makeSet(elements) {
    elements.forEach(e => {
      let l = new LinkedList();
      l.append(e);
      this.lists.push(l);
    });
  }
  
  // return a linked list node (representative node element) ?
  // with the 'true' it finds the representative HEAD
  find(value, repr = true) { // return a 'LinkedListNode' or undefined
    return this.lists.find(ll => {
      let found = ll.find(value, repr); // can be undefined if not found
      //console.log("found:", found);
      return found; // find first (and return "fast" ?)
    });
  }
  
  // Union two sets ?
  // @returns boolean
  //        -> `true` if both already in same set OR if done without error
  union(x, y) {
    //console.log("union of", x, "and", y)
    let rootX = this.find(x); // finds the representative of equivalence class
    let rootY = this.find(y); // same
    
    //console.log("equivalent to union of", rootX, "and", rootY)
    // nothing to merge, already in same set
    if (rootX === rootY) return true; // OK
    
    if(rootX && rootY) {
      rootX.merge(rootY.head); // merges 2 lists into 1
      
      // delete the other one ...
      let index = this.lists.indexOf(rootY);
      if (index !== -1) {
        //console.log(index, "index deleted, head value = ", rootY.head.value);
        this.lists.splice(index, 1);
      }
      return true; // OK
    } else {
       // TODO : ???
      console.log("????");
      return false;
    }
    
  }
  
  // number of components
  size() {
    return this.lists.length;
  }
  
  get count() {
    return this.lists.length;
  }
  
  printSetValues(value) {
    let list = this.find(value, false); // not only the representative one ...
    const values = [];
    let node = list.head;
    while(node) {
      values.push(node.value);
      node = node.next;
    }
    console.log("values: ", values);
  }
  
  printSet() {
    this.lists.forEach((list) => {
      const values = [];
      let node = list.head;
      while(node) {
        values.push(node.value);
        node = node.next;
      }
      console.log("values: ", values);
    })
  }
  
}

