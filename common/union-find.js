import { LinkedList } from './linked-list.js';

//
// Union Find datastructure/algo
// - https://people.orie.cornell.edu/snp32/orie_6125/data-structures/union-find.html
//


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

