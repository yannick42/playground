import { HitRecord } from './hit-record.js';
import { Interval } from './interval.js';
import { Ray } from './ray.js';
import { Vec3 } from './vec3.js';
import { degToRad, round } from '../common/math.helper.js';
import { randFloat } from '../common/common.helper.js';

const debugEl = document.getElementById("debug");

function randomInUnitDisk() {
    while (true) {
        const p = new Vec3(randFloat(-1, 1), randFloat(-1, 1), 0);
        if (p.lengthSquared() < 1) {
            return p;
        }
    }
}

export class Camera {

    aspectRatio;
    imageWidth;
    samplesPerPixel;
    maxDepth;
    backgroundColor;
    vFOV;
    lookFrom;
    lookAt;
    vUp;
    defocusAngle;
    focusDistance;

    constructor(options) {

        this.aspectRatio = options.aspectRatio ?? 1.0;
        this.imageWidth = options.imageWidth ?? 400;
        this.samplesPerPixel = options.samplesPerPixel ?? 10;
        this.maxDepth = options.maxDepth ?? 40;
        this.backgroundColor = new Vec3(1, 1, 1);
    
        this.vFOV = options.vFOV ?? 40;
        this.lookFrom = options.lookFrom ?? new Vec3(0, 0, 0);
        this.lookAt = options.lookAt ?? new Vec3(0, 0, -1);
        this.vUp = options.vUp ?? new Vec3(0, 1, 0);
    
        this.defocusAngle = options.defocusAngle ?? 0;
        this.focusDistance = options.focusDistance ?? 10;
    
    }

    initialize(canvas) {
        // compute image height
        this.imageHeight = Math.floor(this.imageWidth / this.aspectRatio);
        this.imageHeight = this.imageHeight < 1 ? 1 : this.imageHeight;

        console.log(`image size: ${this.imageWidth} x ${this.imageHeight}`)

        canvas.width = this.imageWidth;
        canvas.height = this.imageHeight;

        this.pixelSamplesScale = 1 / this.samplesPerPixel;

        this.center = this.lookFrom;

        const focusLength = (this.lookFrom.sub(this.lookAt)).length();

        const theta = degToRad(this.vFOV);
        const h = Math.tan(theta/2);

        const viewportHeight = 2 * h * this.focusDistance; // focusLength;
        const viewportWidth = viewportHeight * this.imageWidth / this.imageHeight;

        const w = this.lookFrom.sub(this.lookAt).unit();
        const u = this.vUp.cross(w).unit();
        const v = w.cross(u);
        
        const viewportU = u.mul(viewportWidth);
        const viewportV = v.mul(-viewportHeight);

        this.pixelDeltaU = viewportU.mul(1 / this.imageWidth);
        this.pixelDeltaV = viewportV.mul(1 / this.imageHeight);

        const viewportUpperLeft = this.center
            .sub(w.mul(this.focusDistance)) // focusLength
            .sub(viewportU.mul(0.5))
            .sub(viewportV.mul(0.5));
        
        this.pixel00Loc = viewportUpperLeft.add(this.pixelDeltaU.add(this.pixelDeltaV).mul(0.5));

        // calculate the camera defocus disk basis vectors.
        const defocusRadius = this.focusDistance * Math.tan(degToRad(this.defocusAngle / 2));
        this.defocusDiskU = u.mul(defocusRadius);
        this.defocusDiskV = v.mul(defocusRadius);
    }

    /**
     * Construct a camera ray originating from the origin and directed at randomly sampled
     * point around the pixel location i, j.
     */
    getRay(i, j) {

        function sampleSquare() {
            return new Vec3(Math.random() - 0.5, Math.random() - 0.5, 0);
        }

        const defocusDiskSample = () => {
            // Returns a random point in the camera defocus disk.
            const p = randomInUnitDisk();
            return this.center.add(this.defocusDiskU.mul(p.x)).add(this.defocusDiskV.mul(p.y));
        }
    
        const rayOrigin = this.defocusAngle <= 0 ? this.center : defocusDiskSample();

        const offset = sampleSquare(); // Returns the vector to a random point in the [-.5,-.5]-[+.5,+.5] unit square.

        const pixelSample = this.pixel00Loc.add(
            this.pixelDeltaU.mul(i + offset.x)
        ).add(
            this.pixelDeltaV.mul(j + offset.y)
        );

        const rayDirection = pixelSample.sub(rayOrigin);

        return new Ray(rayOrigin, rayDirection);
    }

    rayColor(ray, depth, world) {

        if(depth <= 0) {
            //console.count("nb_max_depth_rays"); // 133 / 160 000 ?
            return new Vec3(0, 0, 0);
        }

         // 0.001 = hack to prevent shadow acne (due to float precision rounding)
        const [hit, record] = world.hit(ray, new Interval(0.001, Infinity), new HitRecord());
        //console.log(record)
        
        if(! hit) {
            //console.count("nb_no_hit_rays"); // 159 874 / 160 000 x bounce depth... 
            //return this.backgroundColor;
            const unitDirection = ray.direction.unit();
            const a = 0.5 * (unitDirection.y + 1.0);
            const color = (new Vec3(1, 1, 1)).mul(1 - a).add((new Vec3(0.5, 0.7, 1)).mul(a));
            //console.warn(color);
            return color; // linear blend
        } else {
            //console.count("nb_hit_rays"); // 166 394
        }

        let [scatter, attenuation, scatteredRay] = record.material.scatter(ray, record)
        if (scatter) {
            // attenuation = color of the lambertian material ?
            //console.log(`Has scattered at depth=${depth}`);
            //console.log(`Ray origin [${scatteredRay.origin.x},${scatteredRay.origin.y},${scatteredRay.origin.z}]`)
            //console.log(`Ray direction [${scatteredRay.direction.x},${scatteredRay.direction.y},${scatteredRay.direction.z}]`)
            const color = this.rayColor(scatteredRay, depth - 1, world).mult(attenuation); // color from scatter ray

            if(Math.random() < 0.1) {
                //console.log(color) // ALWAYS Vec(0, 0, 0)
            }
            return color;
        }
        else
        {
            // NEVER !

            
        }
    }

    render(world, canvas) {
        this.initialize(canvas);

        const ctx = canvas.getContext('2d');
        //ctx.scale(2, 2)

        debugEl.innerHTML = "rendering...";

        const startTime = window.performance.now();

        /*
        const myWorker = new SharedWorker("shared-worker.js", { type: 'module' });

        // can't send camera/this (methods disappear on serialization: getRay, ...)
        //const myWorker = new Worker("worker.js", { type: 'module' });
        
        // when pixel computation finished
        myWorker.port.addEventListener('message', (event) => {
            //console.log("data sent from worker:", event);
            //console.log(event.data);

            const pixelColor = event.data.pixelColor;
            const i = event.data.i;
            const j = event.data.j;
            
            //
            // colorize image pixel
            //
            this.fillPixel(ctx, i, j, pixelColor);
        });
        myWorker.port.addEventListener('connect', (e) => {
            console.log("connect:", e)
        });
        myWorker.port.start(); // trigger the onconnect event on the webworker
        console.log("shared worker:", myWorker)
        */
        
        setTimeout(() => {
            for(let j = 0; j < this.imageHeight; j++) { // scan lines
                for(let i = 0; i < this.imageWidth; i++) {

                    // send message to the worker
                    //myWorker.port.postMessage({i, j, camera: this, world});

                    ///*
                    setTimeout(() => {
                        const pixelColor = this.processPixel(i, j, world)
                        this.fillPixel(ctx, i, j, pixelColor);

                        if(i == 0) {
                            debugEl.innerHTML = `Completion: <b>${round(j / this.imageHeight * 100, 2)} % (elapsed time : ${round((window.performance.now() - startTime) / 1000)} sec.)</b>`;
                        }

                        if(i == this.imageWidth - 1 && j == this.imageHeight - 1) {
                            debugEl.innerHTML = `Done in <b>${round((window.performance.now() - startTime) / 1000)} seconds</b>`;
                        }
                    })
                    //*/
                }
            }
            //myWorker.terminate(); // stops too soon...
        })
    }

    fillPixel(ctx, i, j, pixelColor) {
        ctx.fillStyle = `rgba(${Math.floor(pixelColor.x*256)}, ${Math.floor(pixelColor.y*256)}, ${Math.floor(pixelColor.z*256)}, 1)`;
        ctx.fillRect(i, j, 1, 1);
    }

    processPixel(i, j, world) {

        let pixelColor = new Vec3(0, 0, 0); // black

        for(let sample = 0; sample < this.samplesPerPixel; sample++) {
            const ray = this.getRay(i, j);
            const color = this.rayColor(ray, this.maxDepth, world);
            // accumulate color for this pixel ?
            pixelColor = pixelColor.add(
                color
            );
        }

        // rescale this pixel's color
        pixelColor = pixelColor.mul(this.pixelSamplesScale);

        // Gamma correction
        pixelColor = new Vec3(
            pixelColor.x > 0 ? Math.sqrt(pixelColor.x) : 0,
            pixelColor.y > 0 ? Math.sqrt(pixelColor.y) : 0,
            pixelColor.z > 0 ? Math.sqrt(pixelColor.z) : 0
        );

        return pixelColor;
    }
}
