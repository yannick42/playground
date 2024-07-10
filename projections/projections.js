
import { setUpCanvas, drawPointAt, drawArrow, drawLine, drawLineThroughPoints } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { matMul } from '../common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let cameraXPos = 285;
let cameraYPos = 290;
let cameraZPos = -115;

let cameraOrientationTheta = 0; // roll ?
let cameraOrientationPhi = 0; // pitch ?
let cameraOrientationPsi = 0; // yaw ?

function main() {
    document.querySelector("#camera_orientation_roll").addEventListener('change', (e) => {
        cameraOrientationTheta = e.target.value;
        redraw();
    });
    document.querySelector("#camera_orientation_pitch").addEventListener('change', (e) => {
        cameraOrientationPhi = e.target.value;
        redraw();
    });
    document.querySelector("#camera_orientation_yaw").addEventListener('change', (e) => {
        cameraOrientationPsi = e.target.value;
        redraw();
    });

    // camera position
    document.querySelector("#camera_x_pos").addEventListener('change', (e) => {
        cameraXPos = e.target.value;
        redraw();
    });
    document.querySelector("#camera_y_pos").addEventListener('change', (e) => {
        cameraYPos = e.target.value;
        redraw();
    });
    document.querySelector("#camera_z_pos").addEventListener('change', (e) => {
        cameraZPos = e.target.value;
        redraw();
    });

    document.querySelector("#camera_x_pos").value = cameraXPos;
    document.querySelector("#camera_y_pos").value = cameraYPos;
    document.querySelector("#camera_z_pos").value = cameraZPos;

    redraw();
}

// TODO: add point3D, to allow squares in space ! and not only with z=0 ...
class Square {
    points = [];
    constructor(x, y, z, width, height, followAxis='X', color='blue') {
        this.x = x; // always top-left angle
        this.y = y;
        this.z = z;
        this.color = color;

        this.followAxis = followAxis;

        this.width = width;
        this.height = height;
        
        if(followAxis == 'X') { // in the xy-plane
            this.points = [[x, y, z], [x + width, y, z], [x + width, y + height, z], [x, y + height, z]];
        } else if (followAxis == 'Y') { // yz-plane
            this.points = [[x, y, z], [x, y + width, z], [x, y + width, z + height], [x, y, z + height]];
        } else { // Z = xz-plane ?
            // the 2nd point should be coming in our direction -> OK ?
            this.points = [[x, y, z], [x, y, z + width], [x + height, y, z + width], [x + height, y, z]];
        }
        // close path ...
        this.points.push(this.points[0]);
    }

    get center() { // 2D point
        return [this.centerX, this.centerY];
    }

    get centerX() {
        if(this.followAxis == 'X' || this.followAxis == 'Z') {
            return this.x + this.width / 2;
        } else if (this.followAxis == 'Y') {
            return this.x;
        }
    }

    get centerY() {
        if(this.followAxis == 'X' || this.followAxis == 'Y') {
            return this.y + this.height / 2;
        } else if (this.followAxis == 'Z') {
            return this.y;
        }
    }

    // not used
    get centerZ() {
        return this.z + this.height / 2;
    }

    draw(lineWidth, color=null) {
        // TODO: ctx ?!
        drawLineThroughPoints(ctx, this.points, lineWidth, color ?? this.color);
    }
}

// TODO: create the 6 faces + a draw function
class Cube {

    squares = [];

    constructor(x, y, length, width, height) {
        // TODO: add 6 squares

        // top face
        this.squares.push(new Square(x, y, width, height));
        // bottom face ???
        this.squares.push(new Square(x + length, y, width, height));

    }

}


function createRandomSquarePoints(canvas, prop={}) {

    const defaultProps = {
        maxWidth: canvas.width / 4,
        maxHeight: canvas.height / 4,
    };
    // fill properties
    prop = Object.assign({}, defaultProps, prop);

    const x = randInt(0, canvas.width);
    const y = randInt(0, canvas.height);
    const width = randInt(2, prop.maxWidth); // TODO : do not go outside canvas !
    const height = randInt(2, prop.maxHeight);

    const square = new Square(x, y, width, height);

    return square;
}

function redraw() {

    // clear everything
    setUpCanvas(ctx, canvas.width, canvas.height, 'AliceBlue');

    //const square = createRandomSquarePoints(canvas);
    const squares = [];

    // /!\ orderer from least visible to front ...


    function cube(width, height, depth, x, y, z) {
        // back face
        squares.push(new Square(x, y, z + depth /*z*/, width, height, 'X', 'red'));
        // right face
        squares.push(new Square(x + width, y, z, height, depth, 'Y', 'fuchsia'));
        // top face
        squares.push(new Square(x, y, z, depth, width, 'Z', 'lightgreen'));
        // bottom face
        squares.push(new Square(x, y + height, z, depth, width, 'Z', 'darkorange'));
        // left face
        squares.push(new Square(x, y, z, height, depth, 'Y', 'blue'));
        // front face
        squares.push(new Square(x, y, z, width, height, 'X', 'purple'));
    }

    cube(50, 50, 100, 300, 300, 0); // left
    cube(50, 50, 100, 375, 300, 0); // right
    cube(10, 10, 10, 357.5, 320, 0); // front
    cube(10, 10, 10, 357.5, 300, 20); // bottom - up

    console.log("squares:", squares);
    const nbOfSquares = squares.length;    

    for(let i = 0; i < nbOfSquares; i++) {
        // draw square on 2D-canvas
        const lineWidth = 1;
        squares[i].draw(lineWidth);
        // with its center point
        //drawPointAt(ctx, squares[i].centerX, squares[i].centerY, 1, 'red');
    }

    //
    // rotate each point around x-axis -> 
    //

    function toMatrix(vector) { // to column vector !
        return vector.map(v => [v]);
    }

    function toVector(matrix) { // from column vector (m x 1)
        //console.error("matrix:", matrix, "to vector !");
        return matrix.map(row => {
            //console.log("row=", row, "type=", typeof row, ">", row[0]);
            return row[0]; /* first column ?! */
        });
    }

    function orthogonalProjection(point2D) {
        return point2D;
    }

    /**
     * string "axis" = X, Y or Z
     * number "angle" in degree
     */
    function rotate(axis, point3D, angle) {

        //console.error("3D point : ", point3D);

        const radianAngle = angle * Math.PI / 180;

        let rotationMat;
        switch(axis.toUpperCase()) {
            case "X":
                rotationMat = [
                    [1, 0, 0],
                    [0, Math.cos(radianAngle), -Math.sin(radianAngle)],
                    [0, Math.sin(radianAngle), Math.cos(radianAngle)]
                ];
                break;

            case "Y":
                rotationMat = [
                    [Math.cos(radianAngle), 0, Math.sin(radianAngle)],
                    [0, 1, 0],
                    [-Math.sin(radianAngle), 0, Math.cos(radianAngle)]
                ];
                break;

            case "Z":
                rotationMat = [
                    [Math.cos(radianAngle), -Math.sin(radianAngle), 0],
                    [Math.sin(radianAngle), Math.cos(radianAngle), 0],
                    [0, 0, 1]
                ];
                break;
            default:
                throw new ("Error: Unknown rotation axis. use X, Y or Z.");
        }

        //   R    *    pt
        // 3 x 3  *  3 x 1 -> 3 x 1
        //console.log(point2D, toMatrix(point2D));
        const result = matMul(rotationMat, toMatrix(point3D));

        const out = toVector(result);
        //console.log("rotation result:", out);

        return out;
    }

    function translate2D(point2D, byX, byY) {
        //console.warn(`translating ${point2D} by x=${byX} and y=${byY}`)
        return [point2D[0] + byX, point2D[1] + byY];
    }

    // around horizontal x-axis / vertical y-axis / perpendicular z-axis
    const rotationAngles = [45, 45, 45];


    ctx.fillStyle = 'black';
    ctx.font = "12pt Arial";
    ctx.fillText("Front view", 322.5, 295);

    squares.forEach(square => {

        //console.log("center:", square.center)

        const rotatedSquare = [];
        const projectedSquare = [];
        square.points.forEach(pt => {

            //console.log("point : ", pt);

            // translate square's center point to origin (before rotation, then translate back..)
            const translatedPt = translate2D(pt, -square.centerX, -square.centerY)
            //console.log("translated point 2D:", translatedPt);

            translatedPt.push(0); // 3D !
            //console.log("translated point 3D:", translatedPt);

            let translatedAndRotatedPt = rotate('X', translatedPt, rotationAngles[0]); // 2D point
            translatedAndRotatedPt = rotate('Y', translatedAndRotatedPt, rotationAngles[1]);
            translatedAndRotatedPt = rotate('Z', translatedAndRotatedPt, rotationAngles[2]);

            //console.log(`translate and rotated(x=${rotationAngles[0]}, y=${rotationAngles[1]}, z=${rotationAngles[2]}):`, translatedAndRotatedPt);

            const rotatedPt = translate2D(translatedAndRotatedPt, square.centerX, square.centerY);
            
            rotatedPt.push(translatedAndRotatedPt[2]); // TODO :: ???
            //console.log("add point:", rotatedPt);
            rotatedSquare.push(rotatedPt);










            
            //const projectedPt = orthogonalProjection(rotatedPt); // no change...









            //
            // to control the behavior of the perspective
            //
            const cameraPosition = [cameraXPos, cameraYPos, cameraZPos]; // C (= origin)
            const cameraOrientation = [cameraOrientationTheta, cameraOrientationPhi, cameraOrientationPsi]; // Tait-Bryan angles (Euler angles)
            
            const displaySurfacePosition = [0, 0, 1]; // E = display surface relative to C
            
            //const cameraFieldOfView = [1, 1, 1]; // ???
            
            // position with respect to the coordinate system defined by the camera
            // d =  Rx * Ry * Rz (A - C)
            // A = the 3D point to project onto a 2D plane !
            const D = rotate( // 3D ! -> use z ..
                'X',
                rotate(
                    'Y',
                    rotate(
                        'Z',
                        [
                            pt[0] - cameraPosition[0],
                            pt[1] - cameraPosition[1],
                            pt[2] - cameraPosition[2],
                        ], // TODO: vector substraction function (in 3D..)
                        cameraOrientation[2]
                    ),
                    cameraOrientation[1]
                ),
                cameraOrientation[0]
            );

            // TODO: use matrix form... (homogeneous coordinates = ?)
            const projectedPt = [
                displaySurfacePosition[2] / D[2] * D[0] + displaySurfacePosition[0],
                displaySurfacePosition[2] / D[2] * D[1] + displaySurfacePosition[1]
            ];

            projectedSquare.push([projectedPt[0] * 500, projectedPt[1] * 500]);
        });

        //console.log("rotatedSquare:", rotatedSquare);
        //drawLineThroughPoints(ctx, rotatedSquare, 0.5, 'red');

        console.log("projectedSquare:", projectedSquare);
        drawLineThroughPoints(ctx, projectedSquare, 0.5, square.color);

    })

}

main();
