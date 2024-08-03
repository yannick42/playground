import { HitRecord } from './hit-record.js';
import { Interval } from './interval.js';

export class HittableList {
    list = [];

    add(object) {
        this.list.push(object)
    }

    hit(ray, rayInterval, record) {
        let hitAnything = false;
        let closestSoFar = rayInterval.max;

        this.list.forEach(object => {
            //console.log("object:", object);
            let hit = false;;
            let tempRecord = new HitRecord();

            [hit, tempRecord] = object.hit(ray, new Interval(rayInterval.min, closestSoFar), tempRecord);
            
            if (hit) {
                hitAnything = true;
                closestSoFar = tempRecord.t;
                //console.log(closestSoFar, tempRecord)
                record = tempRecord;
            }
        });

        return [hitAnything, record];
    }
}
