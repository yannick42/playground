import { useState, useCallback } from 'react'
import mysqlLogo from './assets/mysql-horizontal.svg'
import './App.css'

import Dagre from '@dagrejs/dagre';

import { ReactFlow, MiniMap, Controls, applyNodeChanges, applyEdgeChanges } from '@xyflow/react' 
import '@xyflow/react/dist/style.css';
 
let initialNodes = [];
/*[
  { id: 'group1', type: 'group', position: { x: 0, y: 0 }, data: { label: null }, style: { width: 100, height: 100} },
  { id: '1', parentId: 'group1', position: { x: 10, y: 10 }, data: { label: '1' }, style: { height: 30, width: 80 } },
  { id: '2', parentId: 'group1', position: { x: 10, y: 60 }, data: { label: '2' }, style: { height: 30, width: 80 } },
];*/

let initialEdges = [];
//{ id: 'e1-2', source: '1', target: '2' }];
 

import planJson from '/public/plan_group_by.json';


const getLayoutedElements = (nodes, edges, options) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: options.direction });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};




let currentParent, // to regroup inside the parent in a "subflow"
    currentLink;   // link between 2 nodes


function addSelectNode(id, name='no name', isGroup=false) {
  const node = {
    id: id.toString(),
    data: { label: name },
    position: { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) },
    style: { height: 100, width: 200 }
  };

  if(isGroup) {
    node.type = 'group';
    currentParent = id; // ???
  } else {
    currentLink = id.toString();
  }
  
  // save
  console.log("pushing :", node);
  initialNodes.push(node)
}


function addTableNode(tableName, info) {

  const node = {
    id: tableName,
    data: { label: `${tableName} (${info})` },
    parentId: currentParent,
    position: { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) },
    style: { height: 100, width: 200 }
  };

  // save
  initialNodes.push(node)
}


function parseJSON(rootName, json) {

  const keys = Object.keys(json);
  console.log("at", rootName, "keys of", json, "are:", keys);

  // traverse each level of the tree (before going deeper, if necessary)
  keys.forEach(key => {

    switch(key) {
      case "query_block":

        console.log(`Analyzing ${key}`);

        const id = json[key].select_id;
        const isGroup = false; //!! json[key].grouping_operation;
        addSelectNode(id, 'SELECT', isGroup);

        parseJSON('grouping_operation', json[key].grouping_operation);
        break;
        
      case "nested_loop":

        console.log(`Analyzing ${key}`);

        // add tables (TODO: or reuse ?)

        json[key].forEach(t => {

          if(t.table) {
        
            addTableNode(t.table.table_name, `access type = ${t.table.access_type}`)

            if(currentLink) {
              const edgeId = `${currentLink}-${t.table.table_name}`;
              console.warn("adding edgeId:", edgeId)
              initialEdges.push({id: edgeId, source: t.table.table_name, target: currentLink});
            }
        
          }

        })

        break;
      
      default:
        console.log(`skip key='${key}'`);
    }

  });
  

}












const LayoutFlow = () => {

  //
  // Init
  // 
  initialNodes = [];
  initialEdges = [];
  parseJSON('root', planJson)
  console.log("->", initialNodes, initialEdges)
  
  

  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);


  const onLayout = useCallback(
    (direction) => {
      console.log(nodes);
      const layouted = getLayoutedElements(nodes, edges, { direction });

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      window.requestAnimationFrame(() => {
        fitView();
      });
    },
    [nodes, edges],
  );

  onLayout('LR'); // = horizontal

  return (
    <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
            >
      <Controls />
      <MiniMap />
    </ReactFlow>
  );



function App() {

  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://mysql.com" target="_blank">
          <img src={mysqlLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <div style={{ width: '80vw', height: '50vh' }}>
        <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
      </div>
    </>
  );

}

export default App
