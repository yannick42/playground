

import { UF } from './UF.js';


//
// used to find contiguous areas on a grid
//
// grid with 0|BG_COLOR or something else (a ball)
//
export function Hoshen_Kopelman(grid, BG_COLOR, HK_RELABEL) {
  
  let disjointSet = new UF(); // start empty
  
  let largestLabel = 0; // 0 = no label
  
  // fill with 0s (same size as "grid")
  let label = Array(Math.round(grid.length))
                  .fill(0).map(
                    () => Array(grid[0].length).fill(0)
                  );
  
  //let indexes = Array.from(Array(grid.length * grid[0].length).keys());
  //disjointSet.makeSet(indexes);
  //console.log("count makeset: ", disjointSet.size());
  
  let left, above;
  
  // first vertically
  for(let x = 0; x < grid[0].length; x=x+1)
  {
    for(let y = 0; y < grid.length; y=y+1)
    {
      // if an element (ball) is present, we can to cluster it with others clusters
      if(grid[y][x] !== BG_COLOR && grid[y][x] !== 0) // warning !!!! x/y order...
      {
        left = x === 0 ? 0 : label[y][x - 1];    // cluster value
        above = y === 0 ? 0 : label[y - 1][x];   //
        
        // Not useful (index are not saved into the Union-Find, only created labels)
        // leftPos = grid.length * x + y - 1;    // indexed position
        // abovePos = grid.length * (x-1) + y;   // indexed position
        
        if(left === 0 && above === 0) // neither a label above nor to the left
        {
          largestLabel++;                     // make a new cluster label
          disjointSet.makeSet([largestLabel]) // insert into the disjoint sets
          label[y][x] = largestLabel;         // apply it to the "temporary result"
        }
        else if (left !== 0 && above === 0) // one neighbor is on the left
        {
          // find the current representative element of this set
          //label[x][y] = disjointSet.find(left)?.head?.value;
          label[y][x] = left;
          //if(left !== disjointSet.find(left)?.head?.value) {
            //console.log("Neighbor on left:", left, disjointSet.find(left)?.head?.value);
          //}
        }
        else if (left === 0 && above !== 0) // one neighbor is above
        {
          // find the current "representative element" of this set
          //label[x][y] = disjointSet.find(above)?.head?.value;
          label[y][x] = above;
          //if(above !== disjointSet.find(above)?.head?.value) {
            //console.log("Neighbor above:", above, disjointSet.find(above)?.head?.value);
          //}
        }
        else // neighbor both on the left and above (merge them ?)
        {
          let previousSize = disjointSet.size();
          // UNION 2 sets...
          disjointSet.union(left, above); // sets size should decrement (if two ids for the same blob)
          
          //if(disjointSet.size() !== previousSize) {
          //  console.log("DECREASED disjoint set from UNION of ", left, "and", above);
          //}
          
          let found = disjointSet.find(left)?.head?.value;
          
          if(!found) {
            // /!\ should not happen
          }
          
          // add to results
          label[y][x] = found; //?.head?.value;
        }
      }
    }
  }
  
  // BEFORE, we have :
  //console.log(label);
  
  // Find smallest(?) "representative" label in its "equivalence class"
  // needed or else the colors flicker... as their are multiple label ids for the same object !
  if(HK_RELABEL) {
    let new_label;
    for(let i = 0; i < label[0].length; i++)
    {
      for(let j = 0; j < label.length; j++) // again "raster scan" ??? no ...
      {
        // TODO: check if label[i][j] is already a valid "representative", by keeping track of them
        // ⚠️FIXME⚠️: why it can be undefined ?!? -> that's why it flickers sometimes ?!
        new_label = disjointSet.find(label[j][i])?.head?.value; // O(n) ?
        if(label[j][i] !== 0 && new_label !== label[j][i]) {
          if(new_label == undefined) { // unable to find one ?!?
            console.log("old:", label[j][i], "new:", new_label);
          }
          label[j][i] = new_label;
        }
      }
    }
  }
  
  // THEN :
  //console.log(label);
  
  
  
  // at start only / first call
	/*
  if(loop === 0) {
    // display size of each sets
    console.log("Starting with a total of", disjointSet.size(), "disjoint sets");
    // List of labels that finally are in the same equivalence class
    disjointSet.printSet();
  }
  */
	
  return [label, disjointSet];
}

/*
// examples :
let value = Hoshen_Kopelman([
    [1, 0, 1, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 1, 0],
]);
console.log(value);
// [1, 0, 1, 0]
// [1, 1, 1, 1]
// [1, 0, 1, 1]

value = Hoshen_Kopelman([
  [0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1],
  [1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1]
]);
console.log(value);
// [0, 0, 1, 0, 2]
// [1, 1, 1, 0, 2]
// [1, 1, 1, 0, 2]
// [1, 0, 0, 0, 2]
*/




/*
let ds = new UF();

ds.makeSet([1]);
ds.makeSet([2]);

console.log(ds.size());

ds.union(1, 2);

console.log(ds.size());

ds.printSetValues(1);
ds.printSetValues(2);
*/

