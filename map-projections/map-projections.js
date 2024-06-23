
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt, loadHeightMap } from '../common/common.helper.js';
import { degToRad } from '../common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

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

function test(heightMap) {

    const sphereCircumference = heightMap.width;

    console.log("height map size:", heightMap.width, "by", heightMap.height);

    // find the radius of this perfect sphere (according to the loaded height map's size in pixel ...)
    //      simply using 2*pi*r = circumference
    const sphereRadius = sphereCircumference / (2 * Math.PI);

    // create a sphere
    const sphere = new Sphere(sphereRadius, degToRad(180));
    console.log("sphere:", sphere);



    // place a "sphere", and project the pixel color of the map onto the sphere (in the direction of the center..)
    // which equations ?

    // Mercator is conformal (="isotropy of scale factors")
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
        const x = sphereRadius * (longRad - sphere.lambda_0); // Long
        const y = sphereRadius * Math.log( Math.tan(Math.PI / 4 + latRad / 2) ); // Lat
        console.log("x:", x, "y:", y);

        // x: is from -PI*R to +PI*R
        // y: is from ???? to ????
        console.log("x (from 0 to 2pi) :", x / sphereRadius + Math.PI, "y :", y/(2*sphereRadius));

        const halfWidth = heightMap.width / 2;

        const positionX = Math.round((x / sphereRadius + Math.PI) / (2*Math.PI / heightMap.width) + halfWidth);

        // scale factor = ?
        //const k = 1 / Math.cos(latRad);

        const positionY = Math.round(heightMap.height - (y + heightMap.height / 2));

        console.log(positionX, positionY);
        return [positionX, positionY];
    }






    // show tissot's indicatrix


}

main();
