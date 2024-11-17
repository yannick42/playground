
// in 2D
export function getBoundingBox(boxes) {

    let minX, minY, maxX, maxY;

    boxes.forEach(box => {
        if(minX === undefined || minX > box.x) { minX = box.x; }
        if(minY === undefined || minY > box.y) { minY = box.y; }
        if(maxX === undefined || maxX < (box.x + box.width)) { maxX = box.x + box.width; }
        if(maxY === undefined || maxY < (box.y + box.height)) { maxY = box.y + box.height; }
    });

    const width = maxX - minX,
        height = maxY - minY,
        x = minX,
        y = minY;
    return {
        x, y, width, height
    }
}

export function getBBoxCenter(bbox) {
    return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
}

// SVG...
export function getPathBoundingBox(pathData, translation=null) {
    // temporary SVG element

    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.setAttribute('style', 'position: absolute; visibility: hidden; width: 0; height: 0;');
    document.body.appendChild(tempSvg);

    // wraped into a group ?!! to have it true size (after transforms: translate, ...)
    let group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // create a path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);

    if(translation?.length === 2 && (translation[0] || translation[1])) {
        const translate = 'translate('+translation[0]+','+translation[1]+')';
        console.log(">", translate);
        path.setAttribute('transform', translate);
    }

    group.appendChild(path);
    tempSvg.appendChild(group);
    
    // get the bounding box of the path
    const bbox = group.getBBox();
    /*console.log(
        bbox,
        path.getBoundingClientRect() // DOMRect
    );*/

    // remove the temporary SVG element
    document.body.removeChild(tempSvg);

    return bbox;
}
