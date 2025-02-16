import { heappush, heappop } from './heap.js';

export class PriorityQueue {

    constructor() {
        this.data = [];
    }

    enqueue(item, priorityKey) {
        // item Insertion
        heappush(this.data, item, priorityKey, 'maxHeap');
    }

    dequeue() {
        return heappop(this.data, 'max', 'maxHeap');
    }

    peek() {
        return this.data[0];
    }

    count() {
        return this.data.length;
    }

}