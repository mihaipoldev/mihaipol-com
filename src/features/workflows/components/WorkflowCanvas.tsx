"use client";

import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Workflow } from "../types";

type WorkflowCanvasProps = {
  workflows: Workflow[];
};

export function WorkflowCanvas({ workflows }: WorkflowCanvasProps) {
  // Create nodes from workflows
  const workflowNodes: Node[] = useMemo(
    () =>
      workflows.map((workflow, index) => ({
        id: workflow.id,
        type: "default",
        position: { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
        data: { label: workflow.name },
      })),
    [workflows]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(workflowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes when workflows change
  useEffect(() => {
    setNodes(workflowNodes);
  }, [workflowNodes, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
