'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MCPServerNode from './MCPServerNode';
import TriggerNode from './TriggerNode';
import ConditionNode from './ConditionNode';
import OutputNode from './OutputNode';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';
import type { WorkflowDefinition, MCPNodeData } from '@/types';

// Custom node types
const nodeTypes = {
  mcpServer: MCPServerNode,
  trigger: TriggerNode,
  condition: ConditionNode,
  output: OutputNode,
};

interface WorkflowCanvasProps {
  initialDefinition?: WorkflowDefinition;
  onChange?: (definition: WorkflowDefinition) => void;
  readOnly?: boolean;
  executionState?: Record<
    string,
    'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  >;
}

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

function WorkflowCanvasInner({
  initialDefinition,
  onChange,
  readOnly = false,
  executionState,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDefinition?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDefinition?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [settings] = useState(
    initialDefinition?.settings || {
      maxCostCents: 100,
      timeout: 30000,
      parallelExecution: true,
      logLevel: 'info' as const,
    }
  );

  // Apply execution state to nodes
  const nodesWithState = useMemo(() => {
    if (!executionState) return nodes;
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        status: executionState[node.id],
      },
    }));
  }, [nodes, executionState]);

  // Notify parent of changes
  const notifyChange = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      if (onChange) {
        onChange({
          nodes: newNodes as WorkflowDefinition['nodes'],
          edges: newEdges as WorkflowDefinition['edges'],
          settings,
        });
      }
    },
    [onChange, settings]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Get updated nodes after change
      setNodes((nds) => {
        const updated = [...nds];
        notifyChange(updated, edges);
        return updated;
      });
    },
    [onNodesChange, edges, notifyChange, setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      setEdges((eds) => {
        const updated = [...eds];
        notifyChange(nodes, updated);
        return updated;
      });
    },
    [onEdgesChange, nodes, notifyChange, setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            animated: true,
            style: { strokeWidth: 2 },
          },
          eds
        );
        notifyChange(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, notifyChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');

      if (!type || !reactFlowWrapper.current) return;

      const data = dataStr ? JSON.parse(dataStr) : {};
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 100,
        y: event.clientY - bounds.top - 25,
      };

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data,
      };

      setNodes((nds) => {
        const updated = [...nds, newNode];
        notifyChange(updated, edges);
        return updated;
      });
    },
    [setNodes, edges, notifyChange]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeData: Record<string, unknown>
  ) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData(
      'application/reactflow-data',
      JSON.stringify(nodeData)
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const updateNodeData = (nodeId: string, data: Partial<MCPNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      })
    );
    // Update selected node reference
    setSelectedNode((prev) =>
      prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
    );
  };

  return (
    <div className="flex h-full">
      {/* Node Palette */}
      {!readOnly && <NodePalette onDragStart={handleDragStart} />}

      {/* Canvas */}
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodesWithState}
          edges={edges}
          onNodesChange={readOnly ? undefined : handleNodesChange}
          onEdgesChange={readOnly ? undefined : handleEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onDrop={readOnly ? undefined : onDrop}
          onDragOver={readOnly ? undefined : onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          className="bg-slate-50 dark:bg-slate-900"
        >
          <Background color="#94a3b8" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            className="!bg-slate-100 dark:!bg-slate-800"
          />
        </ReactFlow>
      </div>

      {/* Config Panel */}
      {!readOnly && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNodeData}
        />
      )}
    </div>
  );
}

export default function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
