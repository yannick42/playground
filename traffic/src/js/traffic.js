
import * as cytoscape from 'cytoscape';

import { Graph as G, Node } from "./graph.js"; // my own lib...
import { Car } from "./car.js";

let intervalId; // ...

const NB_INTERSECTIONS = 10;
const NB_TERMINAL = 5;
//const NB_ROADS = 6; // w/o "terminal" route where the cars are created or disappear

// as the max. number of road with N intersections is N(N-1)/2 (ex: 4 -> 6)
const NB_ROADS = Math.floor(NB_INTERSECTIONS * (NB_INTERSECTIONS - 1) / 2 * 0.3);
const INIT_NB_CARS = 10;
const randomRate = 0.25;
const TEXT_OPACITY = 0;

const cars = [];
let network; // custom graph ...
let number_of_cars = 0; // current number of cars



/*
FIXME:
- if no path ! (not connected components)


*/




function createInfrastructure() {
	
	const network = new G();				// create random graph (which represents a road network)
	
	// add intersections as __nodes__
	for(let i = 0; i < NB_INTERSECTIONS; i++) {
		network.addNode(`Node ${i+1}`);
	}
	
	// add other random road
	for(let i = 0; i < NB_ROADS; i++) {
		// pick 2 different non terminal points in the network
		const start_node = network.pickANonTerminalNode();
		let end_node;
		while((end_node = network.pickANonTerminalNode()) === start_node) {
			// ...
		}
		
		// make a road between those 2 points/intersections
		//console.log(start_node.name, end_node.name);
		
		try {
			network.addEdge(start_node, end_node);
		} catch (e) {
			//console.error(e);
			i -= 1; // retry ...
		}
		
	}
	
	// add at least random sinks/sources __node__
	for(let i = 0; i < NB_TERMINAL; i++) {
		const terminal_node = network.addNode(`Terminal node ${i+1}`);
		const end_node = network.pickANonTerminalNode();
		network.addEdge(terminal_node, end_node);
	}
	
	return network;
}





let cy;

/**
 * Display network
 */
function showGraph(g) {
	
	let elements = [];
	
	//
	// modify "g" nodes & edges for CYTOSCAPE
	//
	const nodeElements = g.nodes.map(n => {
		return {
			data: {
				id: n.name
			},
			//locked: true, // cars ...work....
			position: {
				x: parseInt(Math.random()*500),
				y: parseInt(Math.random()*500) 
			},
			style: { // WARNING : style property overrides
				'background-color': n.name.includes('Terminal') ? 'grey' : 'lightgreen',
				'text-opacity': TEXT_OPACITY,
				'font-size': 10
			}
		}
	});
	
	const edgeElements = g.edges.map(e => {
		return {
			data: {
				id: e.name,
				source: e.startNode.name,
				target: e.endNode.name
			},
			selectable: false,
		}
	});
	
	cy = cytoscape({
		container: document.getElementById('content'),
		elements: [
			...nodeElements,
			...edgeElements
		],
	  userZoomingEnabled: false,
		// so we can see the ids
		style: [{
			selector: 'node',
			style: {
				'label': 'data(id)',
				'height': '13px',
				'width': '13px',
			}
		}]
	});
	
	cy.layout({
		name: 'cose',
		animate: false,
		//fit: false,
	}).run();

	/*
	const padding = 20; // Adjust this value to set the desired margin size

	const bounds = cy.elements().boundingBox();
	const viewport = {
		x1: bounds.x1 - padding,
		y1: bounds.y1 - padding,
		x2: bounds.x2 + padding,
		y2: bounds.y2 + padding,
	};
	cy.viewport(viewport).fit(cy.elements(), padding);
	*/
	
	cy.on('tap', 'node', (event) => {
		const clickedNode = event.target;
		if(clickedNode.id().includes('Terminal')) {
			createNCars(1, network, network.findNode(clickedNode.id()));
		} else {
			const newColor = clickedNode.style('background-color') === 'rgb(144,238,144)' ? 'rgb(255,0,0)' : 'rgb(144,238,144)';
			clickedNode.style('background-color', newColor);
			const node = network.findNode(clickedNode.id());

			// is blocked ?
			node.setIsBlocked(clickedNode.style('background-color') === 'rgb(255,0,0)');
		}
	});
}


function loop(canvas, ctx, network) {
	//console.log("loop!");
	
	if(Math.random() < randomRate) {
		createNCars(1, network);
	}
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	//
	// show current cars at its current position
	//
	cars./*sort((a, b) => b?.size - a?.size).*/forEach(car => {
		if(car) {
			showCar(car, ctx);
		}
	});
	
	let maxRoadAvailablePos = {};

	//
	// make them tick (move forward, if possible)
	//
	cars.forEach((car, index) => {
		if(!car) return; // to skip removed cars .....
		
		//console.log(car.name, 'position = ', car.pos);
		
		if(car.pos >= 100) { // has reach the endNode of the current edge/road
			
			// randomly ?! choose next road...
			//let neigh = network.findNeighbors(car.current_edge.endNode);			
			//const nextNodes = neigh.filter(n => n.name !== car.current_edge.endNode.name).sort(() => Math.random() - 0.5);
			//new_edge = network.findEdge(car.current_edge.endNode, nextNodes[0]); // random pick 
			// do not include starting point !!
			
			const startNode = cy.getElementById(car.current_edge.endNode.name);
			const endNode = cy.getElementById(car.dest.name);
	
			let car_blocked = false;
			
			// search without blocked intersections
			let dfs = cy.elements().filter(function(element) { // remove blocked nodes !
					return !element.isNode() || (element.isNode() && !network.findNode(element.id()).blocked);
			}).aStar({
				root: startNode,
				goal: endNode
			});
			
			if(!dfs.found) { // if impossible to reach the end : redo with every intersections
				dfs = cy.elements().aStar({
					root: startNode,
					goal: endNode
				});
				car_blocked = true;
			}
			
			if(dfs.path?.length > 1) { // a path was found
				 
				const to = dfs.path[1].data('target') !== car.current_edge.endNode.name ? dfs.path[1].data('target') : dfs.path[1].data('source');

				const toNode = network.findNode(to);
	
				if(maxRoadAvailablePos[car.current_edge.endNode.name+'-'+toNode.name] >= 100) { // too much traffic on this road
					
					// it overflow on current non-blocked road, so wait ...
					car.current_edge.endNode.blocked = true;
					maxRoadAvailablePos[car.current_edge.startNode.name+'-'+car.current_edge.endNode.name] = (car.size);
					
				} else {
					
					if(car.current_edge.endNode.blocked) {
						car.current_edge.endNode.blocked = false;
					}

					let new_edge = network.findEdge(car.current_edge.endNode, toNode); // from A* algorithm

					// if the edge is in the wrong way : reverse it ...
					if(new_edge.startNode !== car.current_edge.endNode) {
						const ed = Object.assign({}, new_edge); // or else BUG!! switched paths between points?!
						const start = ed.startNode;
						ed.startNode = ed.endNode;
						ed.endNode = start;
						new_edge = ed;
						//[new_edge.startNode, new_edge.endNode] = [new_edge.endNode, new_edge.startNode];
					}

					car.setEdge(new_edge);
					car.pos = 0; // reinit. on new road

					if(car_blocked) {
						/*car.pos += 1;
						if(car.pos >= 100) {
							car.pos = 99;
						}*/
					} else {

					}
				}
			} else {
				if(!car_blocked) {
					cars[index] = null;
					number_of_cars -= 1;
					document.getElementById('number_of_cars').innerText = number_of_cars + ' vehicles';
					if(Math.random() < randomRate) {
						createNCars(1, network); // create a new one ...
						if(Math.random() < randomRate) {
							createNCars(1, network); // create a new one ...
						}
					}
				} else {
					// will stop ?
				}
			}
		
		} else { // haven't reach the endNode

			if(cars[index]) {
				// position in the canvas ?
				const startPosition = cy.getElementById(car.current_edge.startNode.name).position();
				const endPosition = cy.getElementById(car.current_edge.endNode.name).position();
				const edgeName = car.current_edge.startNode.name+"-"+car.current_edge.endNode.name;
		
				if(car.current_edge.endNode.blocked) { // 
					
					// TODO: do not decrease if blocked ?!
					maxRoadAvailablePos[edgeName] = (maxRoadAvailablePos[edgeName] ?? 1) + (car.size + 8);
					
					//let nbCarsAlsoBlockedHere = cars.filter(c => c?.current_edge.endNode.blocked && c?.current_edge.endNode.name === car.current_edge.endNode.name).length;																				
					//console.log("count:", nbCarsAlsoBlockedHere);
					//console.log(car.pos, car.current_edge.endNode);
					
					//car.pos += 1; // slow down, road blocked
					car.pos += 5 * car.speed;
					
					// if blocked, calculate where to stop ...
					if(car.pos >= 100 - maxRoadAvailablePos[edgeName]) {
						car.pos = 99 - maxRoadAvailablePos[edgeName]; // stop here
						if(car.pos < 1) {
							// overflow / previous intersection blocked...
							car.pos = 1;
							
							
							if(!car.current_edge.startNode.name.includes('Terminal')) {
								cy.getElementById(car.current_edge.startNode.name).style('background-color', 'orange');
							}
						}
					}
					
				} else { // move !?
					
					maxRoadAvailablePos[edgeName] = 1; // reinit queue to none...
					car.pos += 5 * car.speed; // / car.size; // move ( & show position next time... )
					
					// TODO : bug ... switch between orange then green then orange ...
					if(!car.current_edge.endNode.name.includes('Terminal') && !car.current_edge.endNode.blocked) { // reopen road
						cy.getElementById(car.current_edge.endNode.name).style('background-color', 'lightgreen');
					}
				}
				car.x = startPosition.x + (endPosition.x - startPosition.x) * car.pos / 100;
				car.y = startPosition.y + (endPosition.y - startPosition.y) * car.pos / 100;
			}
		}
	});

}






//
// add more cars
//
function createNCars(N, network, start_node=null) {
	//console.log(cars.length, N);
	
	for(let i = 0; i < N; i++) {
	//for(let i = cars.length; i < (cars.length + N); i++) {
		// create a car
		const car = new Car(`Car ${i+1}`);
		
		const terminal_node = start_node ?? network.pickATerminalNode();
		const neigh = network.findNeighbors(terminal_node);
		//console.log(terminal_node, "->", neigh[0]);
		let destination_node;
		while((destination_node = network.pickATerminalNode()) == terminal_node) {
			// ...
		}
		car.dest = destination_node;
		
		const new_edge = network.findEdge(terminal_node, neigh[0]);
		// missing positions (=0) on node in edge !...
		if(new_edge.startNode !== terminal_node) {
			// reverse...
			[new_edge.startNode, new_edge.endNode] = [new_edge.endNode, new_edge.startNode];
		}
		car.setEdge(new_edge); // put the car on a incoming road
		
		car.pos = 0; // starting position !
		
		const positions = cy.getElementById(terminal_node.name).position();
		car.x = positions.x;
		car.y = positions.y;
		
		// TODO: check if traffic jam !!! -> ? show a warning ?
		
		
		cars.push(car);
	}
	number_of_cars += N;
	document.getElementById('number_of_cars').innerText = number_of_cars + ' vehicles';
}

function showCar(car, ctx) {
	const centerX = car.x;
	const centerY = car.y;
	const radius = 2 + car.size;
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	ctx.fillStyle = car.color;
	ctx.fill();
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#003300';
	ctx.stroke();
}


function main() {
	
	network = createInfrastructure(); // random graph !
	showGraph(network); // with "cytoscape"
	
	createNCars(INIT_NB_CARS, network);
	
	const canvas = document.querySelector('#content > div > canvas:nth-child(1)');
	const ctx = canvas.getContext('2d');

	intervalId = setInterval(() => loop(canvas, ctx, network), 1000/24);
}





// start ...
main();
