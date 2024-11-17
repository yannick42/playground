
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
}