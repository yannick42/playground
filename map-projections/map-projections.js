
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt, loadHeightMap } from '../common/common.helper.js';
import { degToRad } from '../common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const czPosValueEl = document.getElementById('czpos_value');
const ezPosValueEl = document.getElementById('ezpos_value');
const lat0ValueEl = document.getElementById('lat_0');
const lng0ValueEl = document.getElementById('lng_0');

const EARTH_RADIUS = 6371; // km

let CZPOS = -10_000,
    EZPOS = 75,
    LAT_0 = 0,
    LNG_0 = 0;

function main() {
    document.querySelector("#czpos").addEventListener('change', (e) => {
        CZPOS = e.target.value;
        czPosValueEl.innerText = CZPOS;
        draw3DSphere();
    });
    document.querySelector("#ezpos").addEventListener('change', (e) => {
        EZPOS = e.target.value;
        ezPosValueEl.innerText = EZPOS;
        draw3DSphere();
    });
    document.querySelector("#lat_0").addEventListener('input', (e) => {
        LAT_0 = e.target.value;
        draw3DSphere();
    });
    document.querySelector("#lng_0").addEventListener('input', (e) => {
        LNG_0 = e.target.value;
        draw3DSphere();
    });

    czPosValueEl.innerText = CZPOS;
    ezPosValueEl.innerText = EZPOS;
    lat0ValueEl.value = LAT_0;
    lng0ValueEl.value = LNG_0;

    redraw();
}


// (later) create an Ellipsoid class ? (inheriting from Sphere class ?)
class Sphere {

    // indexes: parallel (=lat), then meridian (=long)
    surface = []; // ???? to store the pixel colors projected from the planar map

    // earth radius :  6,371 km ?

    constructor(radius, lambda_0=0) { // 0 = left most meridian on the heightmap ?
        this.radius = radius;
        this.lambda_0 = lambda_0; // arbitrary "central" meridian (GMT+0 / Greenwich ?) in radian

        // init surface 3D points ?
        const nbOfParallels = 360;
        const nbOfPointsPerMeridian = 180;
        // -> 64 800 points

        // init surface points
        for(let i = 0; i < nbOfParallels; i++) {
            this.surface.push(new Array(nbOfPointsPerMeridian)); // "undefined" values ?
        }
    }

    setSurfaceElement(lat, lng) {
        this.surface[lat]
    }

}





//
// project from orthographic projection to 2D-plane
// 
function reverseOrthographicProjection(lat, lng) {
    const lambda_0 = 10 * Math.PI / 180; // long (=x)
    const phi_0 = 45 * Math.PI / 180; // lat (=y)
    const x = EARTH_RADIUS * Math.cos(phi) * Math.sin(lambda - lambda_0);
    const y = EARTH_RADIUS * (Math.cos(phi_0) * Math.sin(phi) - Math.sin(phi_0) * Math.cos(phi) * Math.cos(lambda - lambda_0));
    return [x, y];
}

//
// https://en.wikipedia.org/wiki/Orthographic_map_projection
//
function orthographicProjection(x, y, atLat=45, atLng=10) {
    const lambda_0 = atLng * Math.PI / 180; // long (=x)
    const phi_0 = atLat * Math.PI / 180; // lat (=y)
    
    const rho = Math.sqrt(x*x + y*y);
    const c = Math.asin(rho / EARTH_RADIUS); // if -pi/2 < c < pi/2 -> OK

    const lat = Math.asin(
        Math.cos(c) * Math.sin(phi_0) + y * Math.sin(c) * Math.cos(phi_0) / rho
    );
    const lng = lambda_0 + Math.atan(x * Math.sin(c) / (rho * Math.cos(c) * Math.cos(phi_0) - y * Math.sin(c) * Math.sin(phi_0)))
    // TODO: use atan2(y, x) ? (to ensure that the sign is correct in all quadrant ?)
    // https://en.wikipedia.org/wiki/Atan2

    return [lat, lng];
}





















function redraw() {

    // 
    // wrap an heightmap around a cylinder (tangential at the equator)
    // 
    const heightMap = loadHeightMap("../heightmap/world-heightmap-smaller.jpg", function(heightmap, image) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height); // display heightmap in the current canvas

        test(heightmap);
    });
};

let sphere;

function test(heightMap) {

    const sphereCircumference = heightMap.width;

    console.log("height map size:", heightMap.width, "by", heightMap.height);

    // find the radius of this perfect sphere (according to the loaded height map's size in pixel ...)
    //      simply using 2*pi*r = circumference
    const sphereRadius = sphereCircumference / (2 * Math.PI);

    // create a sphere
    sphere = new Sphere(sphereRadius, degToRad(180));
    console.log("sphere:", sphere);



    // place a "sphere", and project the pixel color of the map onto the sphere (in the direction of the center..)
    // which equations ?

    // Mercator is conformal (="isotropy of scale factors") -> preserve angles, but significant distortion as we approach the poles
    // 1 / cosφ = secφ
    // k = secφ (horizontal scale factor, and "k" is the vertical one, and has the same value)

    // the radius of a parallel is R*cosφ

    // λ0 = an arbitrary central meridian (all expressed in radian)




    /*
    for(let longitude = -10; longitude <= 10; longitude++) { // lambda λ

        for(let latitude = 75; latitude > 30; latitude--) { // phi φ

            const longRad = degToRad(longitude);
            const latRad = degToRad(latitude);
            const [positionX, positionY] = computeXY(longRad, latRad);
            drawPointAt(ctx, positionX, positionY, 1, 'red');
        
        }

    }
    */

    // Points of Interest
    const Reykjavik = [64.146, -21.94, 'Reykjavik'];
    const Paris = [48.86, 2.33, 'Paris'];
    const zero = [0, 0];
    
    const testPoints = [zero, Paris, Reykjavik].forEach(([latitude, longitude, name]) => {
        const longRad = degToRad(longitude);
        const latRad = degToRad(latitude);
        const [positionX, positionY] = computeXY(longRad, latRad);
        drawPointAt(ctx, positionX, positionY, 3, 'red');

        // add label
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = 'lightgreen';
        ctx.fillText(`lat=${latitude}°, lng=${longitude}°${name ? ' (' + name + ')' : ''}`, positionX + 8, positionY - 8)
    })


    // TODO: use it to pick the color on the heightmap
    // x = R(λ - λ0)
    // y = R ln[ tan(pi/4 + φ/2) ]

    // inverse transformation (not useful yet ?)

    function computeXY(longRad, latRad) {

        // Equirectangular projection
        const x = sphereRadius * (longRad - sphere.lambda_0) * Math.cos(0); // phi_0
        const y = sphereRadius * (latRad - 0);
        
        // Mercator
        //const x = sphereRadius * (longRad - sphere.lambda_0); // Long
        //const y = sphereRadius * Math.log( Math.tan(Math.PI / 4 + latRad / 2) ); // Lat
        
        //console.log("x:", x, "y:", y);
        // x: is from -PI*R to +PI*R
        // y: is from ???? to ????

        // scale factor = ?
        //const k = 1 / Math.cos(latRad);

        /*
        // Mercator
        console.log("x (from 0 to 2pi) :", x / sphereRadius + Math.PI, "y :", y/(2*sphereRadius));
        */

        const halfWidth = heightMap.width / 2;
        const positionX = Math.round((x / sphereRadius + Math.PI) / (2*Math.PI / heightMap.width) + halfWidth);
        const positionY = Math.round(heightMap.height - (y + heightMap.height / 2));

        // 
        // lat to pixel
        // 

        /*
        const latRadMin = degToRad(-72.5), // WHY ?!
            latRadMax = degToRad(72.5);
        const y_min = sphereRadius * Math.log( Math.tan(Math.PI / 4 + latRadMin / 2) );
        const y_max = sphereRadius * Math.log( Math.tan(Math.PI / 4 + latRadMax / 2) );

        console.error(y_min, y_max);

        const y_normalized = (y - y_min) / (y_max - y_min);
        const pixelY = Math.round(heightMap.height * (1 - y_normalized));

        console.log("PIXEL Y:", pixelY);
        */

        //console.log(positionX, positionY);

        return [positionX, positionY];
    }

    //console.warn(heightMap.data);


    for(let longitude = -180; longitude < 180; longitude++) {
        for(let latitude = 90; latitude > -90; latitude--) {

            const [pixelX, pixelY] = computeXY(degToRad(longitude), degToRad(-latitude)); // "-" to flip upside down
            //console.log(latitude, longitude, "->", pixelX, pixelY);

            const offset = (pixelY * heightMap.width + pixelX) * 4; // Why first of array is "undefined"
            sphere.surface[longitude + 180][latitude + 90] = 255 - heightMap.data[offset];

            //drawPointAt(ctx, pixelX, pixelY, 3, 'red'); // drawn as a grid over the equirectangular map
        }
    };

    //console.log("sphere.surface: ", sphere.surface);s


    draw3DSphere();

}


function draw3DSphere() {
    
    // 
    // use those grey values map onto a sphere ! (more points at the poles)
    // 

    const newCanvas = document.getElementById('new_canvas');
    const newCtx = newCanvas.getContext("2d");
    setUpCanvas(newCtx, newCanvas.width, newCanvas.height, 'black')

    /* // DEBUGGING image
    const data = new Uint8ClampedArray(360 * 180 * 4);

    sphere.surface.forEach((long, x) => {
        long.forEach((value, y) => {
            const idx = y * 360 + x;
            const offset = idx * 4;

            data[offset] = value;
            data[offset+1] = value;
            data[offset+2] = value;
            data[offset+3] = 255;
        })
    })

    const imageData = new ImageData(data, 360, 180);
    newCtx.putImageData(imageData, 0, 0);
    */

    const projectedPoints = [];
    sphere.surface.forEach((ls, long) => {
        ls.forEach((color, lat) => {

            lat = (lat + LAT_0 + 180) % 180 - 90; // shift from 0-180 to -90/90 ...
            long = (long + LNG_0 + 360) % 360;
            
            // x = longitude angle°
            // y = lat. angle°

            const x = EARTH_RADIUS * Math.cos(degToRad(lat)) * Math.cos(degToRad(long));
            const y = EARTH_RADIUS * Math.cos(degToRad(lat)) * Math.sin(degToRad(long));
            const z = EARTH_RADIUS * Math.sin(degToRad(lat));

            if(z < 0) return; // hide half (hidden) hemisphere
            const pt = [x, y, z];
            //console.log(x,y,z)

            //
            // to control the behavior of the perspective
            //
            const cameraPosition = [0, 0, CZPOS]; // C (= origin)

            // roll, pitch, yaw (TODO: get "rotate" function !!!)
            const cameraOrientation = [0, 0, 0]; // Tait-Bryan angles (Euler angles)

            const displaySurfacePosition = [0, 0, EZPOS]; // E = display surface relative to C

            // position with respect to the coordinate system defined by the camera
            // d =  Rx * Ry * Rz (A - C)
            // A = the 3D point to project onto a 2D plane !
            const D = //rotate( // 3D ! -> use z ..
                //'X',
                //rotate(
                    //'Y',
                    //rotate(
                        //'Z',
                        [
                            pt[0] - cameraPosition[0],
                            pt[1] - cameraPosition[1],
                            pt[2] - cameraPosition[2],
                        ]//, // TODO: vector substraction function (in 3D..)
                        //cameraOrientation[2]
                    //),
                    //cameraOrientation[1]
                //),
                //cameraOrientation[0]
            //);

            // TODO: use matrix form... (homogeneous coordinates = ?)
            const projectedPt = [
                displaySurfacePosition[2] / D[2] * D[0] + displaySurfacePosition[0],
                displaySurfacePosition[2] / D[2] * D[1] + displaySurfacePosition[1]
            ];

            // 3D to 2D
            projectedPoints.push([projectedPt[0], projectedPt[1], color]); // add color to this...

        });
    });

    console.log("Number of points:", projectedPoints.length);

    projectedPoints.forEach(pt => {
        // pt[2] can be null/undefined ?
        const color = `#${pt[2].toString(16)}${pt[2].toString(16)}${pt[2].toString(16)}`;
        // center sphere
        drawPointAt(newCtx, pt[0] + newCanvas.width/2, pt[1] + newCanvas.height/2, 0.5, color);
    });





    








    //
    // show tissot's indicatrix
    //


}

main();
