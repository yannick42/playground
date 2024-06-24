
import { setUpCanvas, drawPointAt, drawLine, drawLineThroughPoints } from '../common/canvas.helper.js';
import { choice, printVar } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const epsilonEl = document.querySelector("#epsilon");
const hideOriginalEl = document.querySelector("#hide_original");

let isSimplified = false;
let hideOriginal = false;

// 
// shapes
//
const heart = {
    name: 'heart',
    pointSize: 3,
    path: [[242,380],[231,368],[212,347],[201,331],[187,314],[171,294],[162,281],[153,269],[147,255],[143,241],[141,228],[141,213],[142,199],[150,186],[163,174],[175,167],[192,163],[222,166],[236,172],[249,187],[257,204],[260,215],[262,222],[269,220],[289,214],[306,204],[328,197],[349,197],[369,207],[387,225],[394,243],[389,266],[374,289],[348,324],[332,339],[310,359],[281,372],[260,381],[244,385]]
};
const star = {
    name: 'star',
    pointSize: 3,
    path: [[83,209],[88,209],[98,206],[109,203],[119,199],[128,199],[141,197],[151,196],[165,195],[173,193],[182,192],[189,190],[192,190],[195,180],[196,168],[197,157],[199,146],[203,134],[208,122],[214,108],[220,95],[227,85],[233,75],[238,65],[239,66],[243,83],[244,95],[248,107],[252,119],[261,137],[265,151],[267,162],[268,172],[270,185],[272,189],[273,193],[280,194],[292,195],[312,200],[317,200],[328,203],[339,205],[351,208],[363,214],[377,219],[385,224],[394,226],[385,238],[368,249],[354,256],[342,259],[329,263],[313,267],[300,272],[289,274],[278,278],[271,284],[282,303],[297,322],[305,338],[307,352],[310,367],[314,378],[317,393],[317,400],[290,386],[285,379],[278,371],[271,363],[258,351],[243,334],[239,330],[230,317],[224,312],[219,307],[207,306],[193,321],[179,340],[157,355],[144,366],[128,377],[115,384],[104,389],[103,389],[117,359],[126,345],[132,332],[137,321],[145,307],[151,295],[153,291],[156,284],[166,267],[168,261],[167,258],[155,248],[140,238],[126,230],[112,221],[98,211],[88,207]]
};






async function getSVGFileContent(filePath) {
    const svgResponse = await fetch(filePath);
    const svgText = await svgResponse.text();
    return svgText;
}

console.time("load_and_parse_svg");
const svgText = await getSVGFileContent("./Global_European_Union.svg"); // 5.9 MB
//printVar({ svgText }, 'warn');
const parser = new DOMParser();
const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
console.timeEnd("load_and_parse_svg");








async function loadBySVGId(svgDoc, id, shapeName='?', pointSize=1) {

    /*
    TO FIND SVG PATHS : (world map ?)

    Go to : https://upload.wikimedia.org/wikipedia/commons/7/73/Global_European_Union.svg
    - find a path ...

    use this to preview a found shapes (to identify it by its shape..): https://yqnn.github.io/svg-path-editor/

    save a file containing only <svg><path d="....."></path></svg> to give to this tool :

    Send it to : (visualize and __generate points list__, save it as "shape-europe.csv", it contains decimal values)
    https://shinao.github.io/PathToPoints/


    Find min values for X (first column): --> only on int values ?
    awk -F, 'NR == 1 || $1 < min {min = $1} END {print min}' europe.csv
    -> 290

    Find min values for Y (second column):
    awk -F, 'NR == 1 || $2 < min {min = $2} END {print min}' europe.csv
    -> 591

    Shift the shape to the up and left
    awk -F, '{print int($1 - 270)*2 "," int($2 - 570)*2}' shape-europe.csv > europe.csv



    // INFO: SVG path commands :
    /!\ uppercase means absolutely positioned

    m = move to
    h = horizontal line to
    l = line to ?
    v = vertical line to
    z = end = close path -> loop ?
    c = ???

    */

    /*
    const pathElement = svgDoc.getElementById('polyF1S210P1-6');
    const d = pathElement.getAttribute('d');
    const class_ = pathElement.getAttribute('class'); // river, region, UZB, FRA, TZA, US1, USA, MDG, DN1, GRL, ...
    printVar({ d, class_ }); // "m ...", river
    */

    //
    // 942 regions
    //
    // 'region FR1 FRA' -> 18 results
    //

    //const frenchRegions = svgDoc.querySelectorAll("path[class='region FR1 FRA']");



    // TODO: see <g> with id = "gEUR" !!

    const pathElement = svgDoc.getElementById(id);
    const pathString = pathElement.getAttribute('d');
    //console.log(pathString);
    const path = pathString.split(' ');

    let paths = []; // possibly multiple arrays of "pixels"
    let pixels = [];
    let previousPixel = null;
    let minX, maxX, minY, maxY;

    let minMaxList = [];

    let skipNextH = false,
        skipNextV = false,
        skipNextC = false,
        skipNextL = false; // L : absolute coord !

    const index = 0; // path to select for display !

    path.forEach((originalCommand, lineNumber) => {
        let x, y;

        const command = originalCommand.toLowerCase();



        /*
        bug with:

        L                   
        338,678.04966       
        h                   
        -0.375              
        l                   
        -0.25,0.21875       
        ......
        */



        //console.error("starting with line:", lineNumber, "command:", originalCommand, "pts:", pixels.length, "skip[HVCL]", [skipNextH, skipNextV, skipNextC, skipNextL]);
        



        if(['m', 'z', 'l'].includes(command)) {

            if(originalCommand === 'L') { // ABSOLUTE !!
                //console.error(">", originalCommand, lineNumber);
                //console.error(">", path[lineNumber+1], lineNumber+1);
                //console.error(">", path[lineNumber+2], lineNumber+2);

                [x, y] = path[lineNumber + 1].split(',');
                pixels.push([parseFloat(x), parseFloat(y)]);

                skipNextL = true;

                // to do skip next line !!!!!!! TODO
            }

            if(command === 'l') { // back to lines... (TODO: we missing the previous point from the c curve !)
                // reset all
                skipNextC = false;
                skipNextV = false;
                skipNextH = false;
            }

            // manage "move to" commands
            if(command === 'm' && pixels.length > 0) {

                minMaxList.push([minX, maxX, minY, maxY]);

                paths.push(pixels); // save this path
                pixels = []; // create a new one
                minX = undefined;
                minY = undefined;
                maxX = undefined;
                maxY = undefined;
            }


            if(command === 'l') { // L or l
                //console.log("L-3:", path[lineNumber-3], lineNumber - 3)
                //console.log("L-2:", path[lineNumber-2], lineNumber - 2)
                //console.log("L-1:", path[lineNumber-1], lineNumber - 1)
                //console.log("L:", command, lineNumber, "previousPixel =", previousPixel)
                //console.log("L+1:", path[lineNumber+1], lineNumber+1)
            } else {
                //console.log(path[lineNumber])
                //console.log(path[lineNumber+1]);
            }
            //console.log("-----------")
        
            

            return; // skip: start, end, line To ???
        }








        if(pixels.length == 0) { // M... = start (should be found after a "m" command ?!)

            console.assert(path[lineNumber - 1].toLowerCase() === 'm', path[lineNumber - 1].toLowerCase()); // always absolute ? m=M ?

            [x, y] = command.split(',');
            x = parseFloat(x); // Absolute coord
            y = parseFloat(y); // Absolute coord

            previousPixel = [x, y];
        }
        else if (command === 'c' || skipNextC) // SKIP BEZIER CURVES
        {
            
            skipNextC = true; // until a "l" ... // TODO ...

            //console.log("Skipping a curve:", command, "at line", lineNumber);
        }
        else if (command === 'v' || skipNextV) // VERTICAL: next line will be (0, y)
        {
            if(! ['l', 'h'].includes(path[lineNumber + 1])) { // not if next line will stop this ?

                if(originalCommand === 'V') {
                    [x, y] = [
                        previousPixel[0], // keep previous "x" direction fixed
                        parseFloat(path[lineNumber + 1]),
                    ];
                } else {
                    [x, y] = [
                        previousPixel[0], // keep previous "x" direction fixed
                        previousPixel[1] + parseFloat(/*already doing a V ?*/ skipNextV ? command : path[lineNumber + 1])
                    ];
                }

                // save to array
                previousPixel = [x, y];
                
                //console.log("VERTICAL TO : ", path[lineNumber + 1], "at (next) line", lineNumber+1, "x=", x, "y=", y) // Relative coord

                skipNextV = true;
            
            } else {
                skipNextV = false; // already inserted last iteration (even if multiple ?)
            }
            

        } else if (command === 'h' || skipNextH) { // HORIZONTAL: next line will be (x, 0)

            if(! ['l', 'v'].includes(path[lineNumber + 1])) { // 

                if(originalCommand === 'H') {
                    [x, y] = [
                        parseFloat(path[lineNumber + 1]),
                        previousPixel[1]    // keep previous "y" direction fixed
                    ];
                } else {
                    [x, y] = [
                        previousPixel[0] + parseFloat(/*already doing a H ?*/ skipNextH ? command : path[lineNumber + 1]),
                        previousPixel[1]    // keep previous "y" direction fixed
                    ];
                }

                // keep track of last value..
                previousPixel = [x, y];
            
                //console.log("HORIZONTAL TO : ", path[lineNumber + 1], "at (next) line", lineNumber+1, "it gives x=", x, "y=", y); // Relative coord

                skipNextH = true;
            
            } else {
                skipNextH = false; // already inserted..
            }


        } else { // Others... (= only "line to" ? -> NO! bug!!!)



            //console.log(command, skipNext);

            if(! skipNextL && ! skipNextH && ! skipNextV && command.includes(',')) {

                //
                // Nominal case ...
                //
                [x, y] = command.split(',');
                x = previousPixel[0] + parseFloat(x); // Relative coord
                y = previousPixel[1] + parseFloat(y); // Relative coord
                previousPixel = [x, y];

            } else {
                // nothing, as this line was already processed at previous iteration (using the value at this line..)

                if(! skipNextH && ! skipNextV && !skipNextL) {
                    //console.error("line:", lineNumber,"?!", command)
                }
            }




        }



        /*
        if(
                ! skipNextH && ! skipNextV && ! skipNextC && ! skipNextL
            &&  ! ['h', 'v', 'l'].includes(command)
            &&  command.includes(',')
        ) { // TODO !!:!
        */

        if(!isNaN(x) && !isNaN(y) &&
            ! skipNextL // = && not already inserted
        ) {
            pixels.push([x, y]); // add this new point to the path !

            // check if is max/min ?
            if(minX === undefined || x < minX) minX = x;
            if(maxX === undefined || x > maxX) maxX = x;
            if(minY === undefined || y < minY) minY = y;
            if(maxY === undefined || y > maxY) maxY = y;

        } else {
            //console.error(`
            //    x:${x}, y:${y}, line = ${command}, previous line = ${path[lineNumber-1]}, prev-prev line = ${path[lineNumber-2]}
            //`);
        }

        if(skipNextL) {
            skipNextL = false; // only once: the points has been inserted at previous iter., this one was not used, but the next will be used !
        }

    })
    paths.push(pixels); // save last path
    minMaxList.push([minX, maxX, minY, maxY]);











    //
    // use only one of the SVG paths of this "region" (eg. EU = EU - Switzerland - Andorra)
    //
    pixels = paths[index];
    [minX, maxX, minY, maxY] = minMaxList[index]
    //printVar({ pixels, minX, maxX, minY, maxY });

    //
    // Convert to canvas coordinates
    //
    const newXMax = 500, newYMax = 500;
    const margin = 25;
    const Europe = {
        pointSize,
        name: shapeName,
        path: pixels.map(([x, y]) => {
            return [
                (x - minX) / (maxX - minX) * (newXMax - 2*margin) + margin, // normalized between 0 and 1, then rescaled
                (y - minY) / (maxY - minY) * (newYMax - 2*margin) + margin  // (same)
            ];
        })
    };
    //printVar({ paths, minMaxList });

    //printVar({ Europe });

    let minX_, maxX_, minY_, maxY_;
    Europe.path.forEach(([x, y]) => {
        if(minX_ === undefined || x < minX_) minX_ = x;
        if(maxX_ === undefined || x > maxX_) maxX_ = x;

        if(minY_ === undefined || y < minY_) minY_ = y;
        if(maxY_ === undefined || y > maxY_) maxY_ = y;
    });
    //console.warn("before>", minMaxList[index]);
    //console.warn(">", minX_, maxX_, minY_, maxY_);


    return Europe;
}











const Europe = await loadBySVGId(svgDoc, 'polyF1S162P4', 'Europe', 2);
const SwedenAndFinland = await loadBySVGId(svgDoc, 'polyF1S70P8', 'Sweden & Finland', 2);
const Cyprus = await loadBySVGId(svgDoc, 'polyF1S55P1-9', 'Cyprus', 2);

// available shapes
const shapes = [heart, star, Europe, SwedenAndFinland, Cyprus];

let shape = choice(shapes);
let points = shape.path;
console.log("Initial number of points :", points.length);


function main() {

    //
    // UI Event listeners
    //
    document.querySelector("#clear").addEventListener('click', (e) => {    
        hideOriginal = false;
        hideOriginalEl.checked = false;
        
        shape = null;
        points = [];
        clear();
    });
    document.querySelector("#simplify").addEventListener('click', (e) => simplify());
    epsilonEl.addEventListener('change', (e) => {
        if(isSimplified) {
            clear();
            if(! hideOriginal) {
                redraw();
            }
            simplify();
        }
    });

    hideOriginalEl.addEventListener('click', (e) => {
        hideOriginal = e.target.checked;
        console.log(">>hideOriginal:", hideOriginal);
        clear();
        if(! hideOriginal) {
            redraw();
        }
        simplify(); // redraw only simplified lines/points
    });

    document.querySelector("#random").addEventListener('click', (e) => {
        clear();
        hideOriginal = false;
        hideOriginalEl.checked = false;


        let newShape = choice(shapes);
        while(newShape == shape) {
            //console.log("same :", shape.name, '-', newShape.name);
            newShape = choice(shapes);
        }

        shape = newShape; // do the change
        console.log(`shape ${shape.name} loaded`);

        points = shape.path;
        redraw();
    });

    canvas.addEventListener('click', (e) => {
        const point = [e.offsetX, e.offsetY];
        drawPointAt(ctx, point[0], point[1], shape?.pointSize ?? 4, 'black');

        if(points.length > 0) { // a previous point is present
            const prevPoint = points[points.length - 1  ];
            drawLine(ctx, prevPoint[0], prevPoint[1], point[0], point[1], 2, 'black');
        }

        points.push(point);

        //console.log(points);
    })

    clear();
    redraw();
}

function clear() {
    console.log("clear !");
    setUpCanvas(ctx, 500, 500, '#F2F4F4');
    isSimplified = false;
}

function simplify() {
    isSimplified = true;
    //clear(); // clear canvas to initial color

    console.log("apply simplification!");
    const simplifiedPoints = douglasPeucker(points, epsilonEl.value ?? 10);
    //console.log("simplified points : ", simplifiedPoints);

    drawLineThroughPoints(ctx, simplifiedPoints, (shape?.pointSize ?? 2) * 2, 'red');
    simplifiedPoints.forEach(point => drawPointAt(ctx, point[0], point[1], (shape?.pointSize ?? 2) * 2, 'red'));

    // overlay debugging info.
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "black";

    const compressionRate = (1 - simplifiedPoints.length / points.length) * 100;

    ctx.fillText(`simplified from ${points.length} points to ${simplifiedPoints.length} (compressed by -${Math.round(compressionRate * 10)/10}%)`, 15, 25);
}

/**
 * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
 */
function perpDist(point, line) {

    const P0 = line[0],
        P1 = line[1];
    
    const num = Math.abs( (P1[1] - P0[1]) * point[0] - (P1[0] - P0[0]) * point[1] + P1[0] * P0[1] - P1[1] * P0[0])
    const den = Math.sqrt( Math.pow(P1[1] - P0[1], 2) + Math.pow(P1[0] - P0[0], 2) );

    return num / den;
}

function douglasPeucker(points, epsilon) {

    let distMax = 0; // to find the point with maximum distance
    let index = 0; // its index ?
    const size = points.length;
    const line = [points[0], points[size - 1]]; // current "line"

    for(let i = 1; i < size - 1; i++) {
        const d = perpDist(points[i], line);
        if(d > distMax) {
            index = i;
            distMax = d;
        }
    }

    // recursively simplify
    if(distMax > epsilon) {

        const segment1 = points.slice(0, index + 1);
        const segment2 = points.slice(index);
        //console.log("points:", points, "seg1:", segment1, "seg2:", segment2);

        const res1 = segment1.length > 1 ? douglasPeucker(segment1, epsilon) : segment1;
        const res2 = segment2.length > 1 ? douglasPeucker(segment2, epsilon) : segment2;

        return res1.concat(res2.slice(1));
    } else {
        return line; // simplify to a line !
    }
}

// shape only (black one)
function redraw() {
    console.log("draw original shape :", points.length, "points");
    drawLineThroughPoints(ctx, points, 1, 'black');
    points.forEach(point => drawPointAt(ctx, point[0], point[1], shape?.pointSize ?? 4, 'black'));
}

main();
