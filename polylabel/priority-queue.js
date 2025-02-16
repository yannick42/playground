import { heappush, heappop } from './heap.js';

export class PriorityQueue {

    constructor() {
        this.data = [];
    }

    enqueue(item, priority) {
        // item Insertion
        heappush(this.data, item, priority);
    }

    dequeue() {
        return heappop(this.data)
    }

    peek() {
        return this.data[0];
    }

    count() {
        return this.data.length;
    }

}