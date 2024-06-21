
import { Road } from "./road.js";

export class Graph {
	
	nodes = [];
	edges = [];
	
	constructor() { }
	
	addNode(name) {
		if(this.nodes.find(n => n.name == name)) throw new Exception("Name already existing");
		
		this.nodes.push(new Node(name));
		return this.nodes[this.nodes.length-1];
	}

	addEdge(startNode, endNode, capacity=1) {
		if(this.edges.find(edge => {
			return (edge.startNode.name == startNode.name
							&& edge.endNode.name == endNode.name)
						|| 
						(edge.startNode.name == endNode.name
							&& edge.endNode.name == startNode.name);
		})) throw new Error("undirected edge already existing");
		
		this.edges.push(new Edge("Edge #"+(this.edges.length + 1), startNode, endNode, new Road(capacity)));
		
		return this.edges[this.edges.length-1];
	}
	
	// = intersections
	pickANonTerminalNode() {
		const nodes = this.nodes.filter(n => !n.name.includes('Terminal'));
		return nodes[Math.floor(Math.random() * nodes.length)];
	}

	// = sinks/sources
	pickATerminalNode() {
		const nodes = this.nodes.filter(n => n.name.includes('Terminal'));
		return nodes[Math.floor(Math.random() * nodes.length)];
	}

	findNeighbors(node) {
		//console.log("searching", node, "in:", this.edges);
		const possibleNodes = this.edges.filter(edge => edge.startNode === node || edge.endNode === node);
		//console.log("possibleNodes:", possibleNodes);
		const nodes = possibleNodes.flatMap(edge => [edge.startNode, edge.endNode]);
		//console.log("nodes:", nodes);
		const ret = nodes.filter(n => n.name !== node.name);
		//console.log("ret:", ret);
		return ret;
	}

	findEdge(node1, node2) {
		return this.edges.find(edge => (edge.startNode == node1 && edge.endNode == node2) || (edge.endNode == node1 && edge.startNode == node2));
	}

	findNode(name) {
		return this.nodes.find(n => n.name == name);
	}

}

// Intersection
export class Node {
	name = 'default name';
	x = 0;
	y = 0;
	blocked;
	
	constructor(name) {
		this.name = name;
	}
	
	isTerminal() {
		return this.name.includes("Terminal");
	}

	setIsBlocked(value) {
		this.blocked = value;
	}
}

export class Edge {
	name;
	startNode;
	endNode;
	road;
	constructor(name, startNode, endNode, road) {
		this.startNode = startNode;
		this.endNode = endNode;
		this.road = road;
	}
}
