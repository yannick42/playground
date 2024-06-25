
import { setUpCanvas, drawPointAt, drawLine, drawLineThroughPoints } from '../common/canvas.helper.js';
import { choice, printVar } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const epsilonEl = document.getElementById('epsilon');
const hideOriginalEl = document.getElementById('hide_original');
const svgPathsEl = document.getElementById('svg_paths');
const regionSelectionEl = document.getElementById('region_selection');
const countRandomShapesEl = document.getElementById('count_random_shapes');
const countPathLinesEl = document.getElementById('count_path_lines');

let isSimplified = false;
let hideOriginal = false;


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



// find BBox of a path of [x,y] points
function checkBBox(path) {
    let minX, maxX, minY, maxY;
    path.forEach(([x, y]) => {
        if(minX === undefined || x < minX) minX = x;
        if(maxX === undefined || x > maxX) maxX = x;

        if(minY === undefined || y < minY) minY = y;
        if(maxY === undefined || y > maxY) maxY = y;
    });
    return [minX, maxX, minY, maxY];
}






async function loadBySVGId(svgDoc, id, options) {

    options = Object.assign({}, {
        name: '?',
        pointSize: 2,
        lineWidth: 1,
        color: 'black',
    }, options);


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

    //let minMaxList = [];

    let skipNextH = false,
        skipNextV = false,
        skipNextC = false,
        skipNextL = false; // L : absolute coord !

    /**
     * TODO: find a way to simply keep track of the current command (and its mode : absolute/relative)
     */
    path.forEach((originalCommand, lineNumber) => {

        let x, y; // will be add to `pixels` if necessary

        // TODO: remove this ?!
        const command = originalCommand.toLowerCase();


        // DEBUG
        //console.error("starting with line:", lineNumber, "command:", originalCommand, "pts:", pixels.length, "skip[HVCL]", [skipNextH, skipNextV, skipNextC, skipNextL]);
        

        if(['m', 'z', 'l'].includes(command)) {

            if(originalCommand === 'L') { // Absolute Position !

                [x, y] = path[lineNumber + 1].split(','); // get the position from the next line
                pixels.push([parseFloat(x), parseFloat(y)]);

                // will skip next line only !
                skipNextL = true;
            }

            if(command === 'l') { // back to "line to" mode
                // reset all
                skipNextC = false; // TODO: we missing the previous point from the c curve !
                skipNextV = false;
                skipNextH = false;
            }

            // manage "move to" commands
            if(command === 'm' && pixels.length > 0) {
                //minMaxList.push([minX, maxX, minY, maxY]); // save (to compute boundaries)

                paths.push(pixels); // save this new path
                pixels = []; // create a new one

                console.error(command, path[lineNumber + 1], path[lineNumber + 2]);

                //minX = undefined;
                //minY = undefined;
                //maxX = undefined;
                //maxY = undefined;
            }

            // end of forEach...
        } else {



            // TODO: differentiate M and m (relative? => TODO!)
            //
            // command should be a "M/m" ? => start (should be found after a "m" command ?)
            if(pixels.length == 0)
                {
        
                    console.assert(path[lineNumber - 1].toLowerCase() === 'm', path[lineNumber - 1].toLowerCase()); // always absolute ? m=M ?
        
                    // BUGGY: those SVG paths always start with a "m" ?!
                    if(path[lineNumber - 1] == 'M' || paths.length == 0) { // Absolute coordinates
                        console.warn("absolute ("+path[lineNumber-1]+") -> ", originalCommand);

                        [x, y] = command.split(',');
                        x = parseFloat(x); // absolute
                        y = parseFloat(y); // absolute
                    } else { // m = relative

                        console.warn("relative ("+path[lineNumber-1]+") -> ", originalCommand);

                        [x, y] = command.split(',');
                        const lastPath = paths[paths.length - 1];
                        x = lastPath[lastPath.length - 1][0] + parseFloat(x);
                        y = lastPath[lastPath.length - 1][1] + parseFloat(y);
                    }    
                    previousPixel = [x, y];
                }
                else if (command === 'c' || skipNextC) // SKIP BEZIER CURVES (TODO: same with Q,...)
                {
                    skipNextC = true; // until a "l" ?
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
                    
                }
                else if (command === 'h' || skipNextH) // HORIZONTAL: next line will be (x, 0)
                {
        
                    if(! ['l', 'v'].includes(path[lineNumber + 1])) {
        
                        if(originalCommand === 'H') { // Absolute position
                            [x, y] = [
                                parseFloat(path[lineNumber + 1]),
                                previousPixel[1]    // keep previous "y" direction fixed
                            ];
                        } else { // Relative position (delta)
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
                        // __Nominal case__ ... (= draw line to ...)
                        //
                        [x, y] = command.split(',');
                        x = previousPixel[0] + parseFloat(x); // Relative coord
                        y = previousPixel[1] + parseFloat(y); // Relative coord
                        previousPixel = [x, y];
        
                    } else {
                        // nothing, as this line was already processed at previous iteration (but using the value at this line...)
        
                        if(! skipNextH && ! skipNextV && !skipNextL) {
                            //console.error("line:", lineNumber,"?!", command)
                        }
        
                        if(skipNextL) {
                            console.log(`previous line were a ${path[lineNumber - 1]} so we skip this one : ${command}`);
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
    

        }

    });


    // End this path (TODO: no need to close the loop ?)
    paths.push(pixels); // save last path
    //minMaxList.push([minX, maxX, minY, maxY]); // same with boundaries



    






    //printVar({ pixels, minX, maxX, minY, maxY });

    const pointsPaths = [];

    //
    // Convert to canvas coordinates (shift & "normalize")
    // TODO: conserve aspect ratio
    //
    const newXMax = 500, newYMax = 500;
    const margin = 25;
    const originalAspectRatio = (maxX - minX) / (maxY - minY); // width / height

    console.log(options.name);
    printVar({originalAspectRatio});

    paths.forEach(path => {

        let pointsPath = [];
        if(originalAspectRatio <= 1) {
            // less wide than high
            const shiftRightBy = (newXMax - (maxX - minX)) / 2;
            printVar({shiftRightBy})

            pointsPath = path.map(([x, y]) => {
                return [
                    ((x - minX) / (maxX - minX) * (newXMax - 2*margin) + margin + shiftRightBy) * originalAspectRatio, // normalized between 0 and 1, then rescaled
                    ((y - minY) / (maxY - minY) * (newYMax - 2*margin) + margin)  // (same)
                ];
            });
        } else {
            // wider than high
            const shiftDownBy = ((newYMax - (maxY - minY))) / 2 / originalAspectRatio;
            printVar({shiftDownBy})

            pointsPath = path.map(([x, y]) => {
                return [
                    ((x - minX) / (maxX - minX) * (newXMax - 2*margin) + margin), // normalized between 0 and 1, then rescaled
                    ((y - minY) / (maxY - minY) * (newYMax - 2*margin) + margin + shiftDownBy) / originalAspectRatio  // (same)
                ];
            });
        }

        pointsPaths.push(pointsPath);
    });


    const shape = {
        name: options.name,
        paths: pointsPaths,
        pointSize: options.pointSize,
        lineWidth: options.lineWidth,
        color: options.color,
        info: {
            line_count: paths.length,
        }
    };
    //printVar({ paths, minMaxList });

    printVar({ shape });

    return shape;
}




function getRegionPaths(region='FRA', minPoints=0) {

    // 
    // path -> 5710
    // path[class='region'] -> 942 (region only !)
    // path[class~='region'] -> 3071 (it includes previous example)
    // path[class~='region'][class~='USA'] -> 274 (region AND usa...)
    // path[class~='region'][class~='FRA'] -> 18


    const allPaths = svgDoc.querySelectorAll("path[class~='region'][class~='"+region+"']");
    console.log(`${allPaths.length} regions found with '${region}'`);

    svgPathsEl.length = 0; // empty the list ?!
    const emptyOption = document.createElement("option");
    emptyOption.value = '';
    emptyOption.text = '-';
    svgPathsEl.add(emptyOption)

    allPaths.forEach(path => {
        const d = path.getAttribute('d');
        //console.log(d, d.length, '>?', minPoints * 10);

        if(d.length > minPoints * 15) {
            const option = document.createElement("option");
            option.value = path.id;
            option.text = path.id;
            
            svgPathsEl.add(option);
        } else {
            // skipped (not enough points)
        }

    });
    console.log(`But only ${svgPathsEl.length - 1} regions kept for '${region}'`);
    return allPaths;
}





//
// initial list from the region selected in the HTML
//
let allPaths = getRegionPaths(regionSelectionEl.value, 50 /* path with all least X points */);

//
// Load SVG paths from the given svg file!
//
const Europe = await loadBySVGId(svgDoc, 'polyF1S162P4', { name: 'Europe', pointSize: 0.75, lineWidth: 0.2, color: 'blue' });
const SwedenAndFinland = await loadBySVGId(svgDoc, 'polyF1S70P8', { name: 'Sweden & Finland', pointSize: 0.75, lineWidth: 0.2 });
const heart = {
    name: 'a heart symbol',
    color: 'red',
    pointSize: 3,
    paths: [[[242,380],[231,368],[212,347],[201,331],[187,314],[171,294],[162,281],[153,269],[147,255],[143,241],[141,228],[141,213],[142,199],[150,186],[163,174],[175,167],[192,163],[222,166],[236,172],[249,187],[257,204],[260,215],[262,222],[269,220],[289,214],[306,204],[328,197],[349,197],[369,207],[387,225],[394,243],[389,266],[374,289],[348,324],[332,339],[310,359],[281,372],[260,381],[244,385]]]
};
const star = {
    name: 'a star',
    color: '#CCCC00',
    pointSize: 3,
    paths: [[[83,209],[88,209],[98,206],[109,203],[119,199],[128,199],[141,197],[151,196],[165,195],[173,193],[182,192],[189,190],[192,190],[195,180],[196,168],[197,157],[199,146],[203,134],[208,122],[214,108],[220,95],[227,85],[233,75],[238,65],[239,66],[243,83],[244,95],[248,107],[252,119],[261,137],[265,151],[267,162],[268,172],[270,185],[272,189],[273,193],[280,194],[292,195],[312,200],[317,200],[328,203],[339,205],[351,208],[363,214],[377,219],[385,224],[394,226],[385,238],[368,249],[354,256],[342,259],[329,263],[313,267],[300,272],[289,274],[278,278],[271,284],[282,303],[297,322],[305,338],[307,352],[310,367],[314,378],[317,393],[317,400],[290,386],[285,379],[278,371],[271,363],[258,351],[243,334],[239,330],[230,317],[224,312],[219,307],[207,306],[193,321],[179,340],[157,355],[144,366],[128,377],[115,384],[104,389],[103,389],[117,359],[126,345],[132,332],[137,321],[145,307],[151,295],[153,291],[156,284],[166,267],[168,261],[167,258],[155,248],[140,238],[126,230],[112,221],[98,211],[88,207]]]
};

// list of availables shapes to pick from
const shapes = [heart, star, Europe, SwedenAndFinland];



let shape, points; // either a given shape, or handwritten points .....









function clearCanvas() {
    console.log("clear !");
    setUpCanvas(ctx, 500, 500, '#F2F4F4');
    //isSimplified = false;
}





//
// TODO: for each lines in the path !!!
//
function refresh(hideOriginal, doSimplify) {
    clearCanvas();
    if(! hideOriginal) {
        redraw(shape); // redraw it doing it for each of its paths!
    }
    if(doSimplify || isSimplified) {
        if(shape) {
            // for each paths!
            shape.paths?.forEach((path, idx) => simplify(path, idx * 15)); // redraw only the simplified lines&points
        } else {
            simplify(points);
        }
    }
}





function main()
{
    //
    // UI Event listeners
    //

    //
    // Erase everything !
    //
    document.querySelector("#clear").addEventListener('click', (e) => {

        // uncheck "Hide original"
        hideOriginal = false;
        hideOriginalEl.checked = false;
        
        // remove shape & points (whatever was used..)
        shape = null;
        points = [];

        displayShapeName('');
        clearCanvas();
        isSimplified = false;
    });

    //
    // Simplify ! (-> calls the DP algorithm)
    //
    document.querySelector("#simplify").addEventListener('click', (e) => refresh(hideOriginal, true /* doSimplify */)); // /* do not clearCanvas() */));
    
    //
    // UI: edit tolerance parameter
    // & refresh with new value, if we already show the simplified path
    //
    epsilonEl.addEventListener('change', (e) => isSimplified && refresh(hideOriginal));

    //
    // toggle: view/hide original shape
    //
    hideOriginalEl.addEventListener('click', (e) => {
        hideOriginal = e.target.checked;
        refresh(hideOriginal);
    });

    //
    // Pick a random shape from the predefined list
    //
    document.querySelector("#random").addEventListener('click', (e) => {
        hideOriginal = false;
        hideOriginalEl.checked = false;

        isSimplified = false;

        let newShape = choice(shapes);
        while(newShape == shape) {
            //console.log("same :", shape.name, '-', newShape.name);
            newShape = choice(shapes);
        }

        shape = newShape; // do the change
        console.log(`shape ${shape.name} loaded`);

        refresh(hideOriginal);
    });

    //
    // add a new point to path
    //
    canvas.addEventListener('click', (e) => {
        const point = [e.offsetX, e.offsetY];
        drawPointAt(ctx, point[0], point[1], shape?.pointSize ?? 4, 'black');

        if(points.length > 0) { // a previous point is present
            const prevPoint = points[points.length - 1  ];
            drawLine(ctx, prevPoint[0], prevPoint[1], point[0], point[1], 2, 'black');
        }

        points.push(point);

        //console.log(points);
    });

    //
    // select Region category (USA, FRA, ...)
    //
    regionSelectionEl.addEventListener('change', (e) => {
        const region = e.target.value;
        if(region) {
            allPaths = getRegionPaths(region, 50 /* min points */);
        }
    });

    //
    // path chosen (eg. Norway > polyF1S163P29-7)
    // 
    svgPathsEl.addEventListener('change', async (e) => {
        const id = e.target.value;
        if(id) {
            shape = await loadBySVGId(svgDoc, id, { name: id, pointSize: 2, lineWidth: 1, color: 'green' });
            
            points = []; // erase previous handmade points (if any..)
            isSimplified = false;
            displayShapeName(shape);
            clearCanvas(); // canvas
            redraw(shape);

        }
    });

    countRandomShapesEl.innerText = shapes.length;
    
    shape = Europe; // hardcoded 1st selection    
    
    clearCanvas();
    redraw(shape);
}

function simplify(points, shiftTextDownBy=0) {
    console.log("apply simplification!");

    const t0 = window.performance.now();
    const simplifiedPoints = douglasPeucker(points, epsilonEl.value ?? 10);
    const t1 = window.performance.now();

    const timeElapsedMs = t1 - t0;

    drawLineThroughPoints(ctx, simplifiedPoints, (shape?.pointSize ?? 2) * 2, 'red'); // line
    simplifiedPoints.forEach(point => drawPointAt(ctx, point[0], point[1], (shape?.pointSize ?? 2) * 2, 'red')); // points

    //
    // overlay debugging info.
    //
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "black";
    const compressionRate = points.length ? (1 - simplifiedPoints.length / points.length) * 100 : 0;
    ctx.fillText(
        `simplified${shape == null || shape.paths.length > 1 ? ' from ' + points.length : ''} to ${simplifiedPoints.length} points in ${Math.round(timeElapsedMs * 10) / 10} ms.` + 
        ` (compression by -${Math.round(compressionRate * 10)/10}%)`,
        5, // x pos
        15 + shiftTextDownBy // y pos
    );

    isSimplified = true; // done
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

    if(! points.length) return [];

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

function displayShapeName(shape='') {
    const shapeNameEl = document.querySelector("#shape_name");
    if(shape) {
        const text = shape.name + ' (' + shape.paths.reduce((acc, path) => acc += path.length, 0) + ' points)';
        shapeNameEl.innerText = text;
        shapeNameEl.style.color = shape.color;
    } else {
        shapeNameEl.innerText = '...';
    }
}




// shape only (not the simplified curve)
function redraw(shape) {

    console.log("Initial number of points in the shape :", shape?.path?.length ?? '?!');

    //console.log(`draw a shape having ${points.length} points`);
    displayShapeName(shape ?? '');
    // show number of lines in the svg path
    countPathLinesEl.innerText = shape?.info?.line_count ?? '-';

    if(shape) {
        shape.paths.forEach(path => {
            // lines
            drawLineThroughPoints(ctx, path, shape.lineWidth ?? 1, shape.color ?? 'black');
            // points
            path.forEach(point => drawPointAt(ctx, point[0], point[1], shape.pointSize ?? 4, shape.color ?? 'black'));
        });
    } else {
        // lines
        drawLineThroughPoints(ctx, points, 1, 'black');
        // points
        points.forEach(point => drawPointAt(ctx, point[0], point[1], 4, 'black'));
    }
}




main();
