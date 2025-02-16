// adds the provided newKey into the min-heap named "heap"
export function heappush(heap, newObject, key){
    // push the new key at the end of the array representing the heap
    heap.push(newObject);
  
    // get the current index of pushed key
    let curr = heap.length-1;
  
    // keep comparing till root is reached or we terminate in middle
    while(curr > 0){
        let parent = Math.floor((curr-1)/2) // formula to find parent
        if( heap[curr][key] < heap[parent][key] ){ // if less than its parent
            // quick swap
            [ heap[curr], heap[parent] ] = [ heap[parent], heap[curr] ]
            // update the index of newKey
            curr = parent
        } else {
            // if no swap, break, since we heap is stable now
            break
        }
    }
}
  
// removes the smallest key from the min-heap named "heap"
export function heappop(heap, key) {
    // swap root with last node
    const n = heap.length;
    [ heap[0], heap[n-1] ] = [ heap[n-1], heap[0] ];
  
    // remove the root i.e. the last item (because of swap)
    const removedKey = heap.pop();
  
    let curr = 0;
  
    // keep going till atleast left child is possible for current node
    while(2*curr + 1 < heap.length){
        const leftIndex = 2*curr+1; 
        const rightIndex = 2*curr+2;
        const minChildIndex = (rightIndex < heap.length && heap[rightIndex][key] < heap[leftIndex][key] ) ? rightIndex : leftIndex;
      
        if(heap[minChildIndex][key] < heap[curr][key]) {
            // quick swap, if smaller of two children is smaller than the parent (min-heap)
            [heap[minChildIndex], heap[curr]] = [heap[curr], heap[minChildIndex]]
            curr = minChildIndex
        } else {
            break
        }
    }
  
    // finally return the removed key
    return removedKey;
}
  