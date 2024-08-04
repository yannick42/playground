
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt, randFloat } from '../common/common.helper.js';

import { Camera } from './camera.js';
import { HittableList } from './hittable-list.js'; // World scene
// materials
import { Dielectric } from './materials/dielectric.js';
import { Lambertian } from './materials/lambertian.js';
import { Metal } from './materials/metal.js';

import { Sphere } from './sphere.js';
import { Vec3 } from './vec3.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let imageWidth = 160,
    samplesPerPixel = 5,
    maxDepth = 5;

//
// Camera
//
const lookFrom = new Vec3(13, 2, 3);
const lookAt = new Vec3(0, 0, 0);
console.log("look from:", lookFrom, "look at:", lookAt)

const camera = new Camera({
    imageWidth,
    aspectRatio: 16 / 9,
    vFOV: 20, // in degrees
    samplesPerPixel, // 500 = high-quality ?
    maxDepth, // default = 40
    lookFrom,
    lookAt,
    // Large aperture ?
    defocusAngle: 0.6,
    focusDistance: 10,
});

const timings = [{
    width: 100,
    samplesPerPixel: 5,
    maxDepth: 5,
    duration: 2.5
},{
    width: 200,
    samplesPerPixel: 10,
    maxDepth: 10,
    duration: 15
},{
    width: 450,
    samplesPerPixel: 20,
    maxDepth: 25,
    duration: 137
},{
    width: 500,
    samplesPerPixel: 50,
    maxDepth: 25,
    duration: 347       // 5 min. ?
},{
    width: 800,
    samplesPerPixel: 100,
    maxDepth: 50,
    duration: 1627      // 27 minutes
}];

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw(imageWidth, samplesPerPixel, maxDepth));

    timings.forEach((timing, i) => {
        document.querySelector("#timings").innerHTML += `<li id="timing_${i+1}">${timing.width} x ${Math.floor(timing.width / camera.aspectRatio)} pixels, ${timing.samplesPerPixel} samples per pixel, max depth=${timing.maxDepth} : <b>~${timing.duration} sec.</b></li>`;
    });

    timings.forEach((timing, i) => {
        document.getElementById(`timing_${i+1}`).addEventListener('click', (e) => {
            console.log(">", timing);
            imageWidth = timing.width;
            samplesPerPixel = timing.samplesPerPixel;
            maxDepth = timing.maxDepth;
            redraw(timing.width, timing.samplesPerPixel, timing.maxDepth);
        });
    })

    redraw(imageWidth, samplesPerPixel, maxDepth);
}

function createWorld() {

    const world = new HittableList();

    const materialGround = new Lambertian(new Vec3(0.5, 0.5, 0.5)); // soil
    world.add(new Sphere(new Vec3(0, -1000, 0), 1000, materialGround)); // soil


    const N = 11;

    for (let a = -N; a < N; a++) {
        for (let b = -N; b < N; b++) {
            const chooseMat = Math.random();

            const center = new Vec3(a + 0.9*Math.random(), 0.2, b + 0.9*Math.random());

            if (center.sub(new Vec3(4, 0.2, 0)).length() > 0.9) {
                let sphereMaterial;
                if (chooseMat < 0.8) { // Diffuse
                    const albedo = (new Vec3(
                        Math.random(),
                        Math.random(),
                        Math.random()
                    )).mult(new Vec3(
                        Math.random(),
                        Math.random(),
                        Math.random()
                    ));
                    world.add(new Sphere(center, 0.2, new Lambertian(albedo)));
                } else if (chooseMat < 0.95) { // Metal
                    const albedo = new Vec3(
                        randFloat(0.5, 1),
                        randFloat(0.5, 1),
                        randFloat(0.5, 1)
                    );
                    //auto fuzz = randomFloat(0, 0.5);
                    world.add(new Sphere(center, 0.2, new Metal(albedo)));
                } else { // Glass
                    world.add(new Sphere(center, 0.2, new Dielectric(1.5)));
                }
            }
        }
    }

    // 3 big spheres
    world.add(new Sphere(new Vec3(0, 1, 0),     1.0,    new Dielectric(1.5))); // 1 / 1.33 => air bubble in water ?
    world.add(new Sphere(new Vec3(-4, 1, 0),    1.0,    new Lambertian(new Vec3(0.4, 0.2, 0.1))));
    world.add(new Sphere(new Vec3(4, 1, 0),     1.0,    new Metal(new Vec3(0.7, 0.6, 0.5), 0)));
    
    return world;
}

function redraw(imageWidth = 150, samplesPerPixel = 1, maxDepth = 5) {

    const world = createWorld();

    camera.imageWidth = imageWidth;
    camera.samplesPerPixel = samplesPerPixel;
    camera.maxDepth = maxDepth;

    document.getElementById("options").innerHTML = `
        - <b>${camera.imageWidth} x ${Math.floor(camera.imageWidth / camera.aspectRatio)} = ${Math.ceil(camera.imageWidth * camera.imageWidth / camera.aspectRatio)} px</b> to render<br/>
        - Field of view : ${camera.vFOV}°<br/>
        - Samples per pixel : ${camera.samplesPerPixel}<br/>
        - Max depth (rays) : ${camera.maxDepth}<br/>
    `;

    camera.render(world, canvas);
}

main();
