// --- Imports ---
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
  Handle,
  Position,
  ReactFlowProvider
} from 'reactflow';
import useDeviceSize from '../utils/useDeviceSize.jsx';
import NodeIndicesPanel from './NodeIndicesPanel.jsx';

// Add this at the top of the file after imports
let activeNodeIndicesPanel = null;

// --- Component Definitions ---
/**
 * Custom node component for the flow diagram
 * Handles tooltip display and index management for tensor nodes
 */
const CustomNode = React.memo(({ data, id }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const isTouchActiveRef = useRef(false);



  const clearTimeoutSafely = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimeoutSafely();
  }, []);

  useEffect(() => {
    if (showTooltip && nodeRef.current && !data.forceCloseTooltip) {
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  }, [showTooltip, data]);

  useEffect(() => {
    if (data.forceCloseTooltip) {
      clearTimeoutSafely();
      setShowTooltip(false);
    }
  }, [data.forceCloseTooltip]);

  const handleSwapIndices = (newIndices) => {
    if (data.indices) {
      data.onIndicesChange?.(id, newIndices);
    }
  };

  const handleInteractionStart = () => {
    if (data.forceCloseTooltip) return;
    clearTimeoutSafely();
    setShowTooltip(true);
  };

  const handleInteractionEnd = () => {
    clearTimeoutSafely();
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 100);
  };

  const handleTouchStart = (e) => {
    if (data.forceCloseTooltip) return;
    if (e.touches.length > 1) return;

    // Close any other open panel before opening a new one
    if (activeNodeIndicesPanel && activeNodeIndicesPanel !== id) {
      activeNodeIndicesPanel = null;
      setShowTooltip(false);
      return;
    }

    isTouchActiveRef.current = true;
    activeNodeIndicesPanel = id;
    clearTimeoutSafely();
    setShowTooltip(true);

    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchMove = (e) => {
    // Prevent default touch behavior during tooltip interaction
    if (showTooltip) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e) => {
    if (!isTouchActiveRef.current) return;

    // Don't close immediately on touch end
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchCancel = (e) => {
    isTouchActiveRef.current = false;
    activeNodeIndicesPanel = null;
    clearTimeoutSafely();
    setShowTooltip(false);
    e.preventDefault();
  };

  // Also add cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeNodeIndicesPanel === id) {
        activeNodeIndicesPanel = null;
      }
    };
  }, [id]);

  return (
    <div
      ref={nodeRef}
      className="relative w-full h-full bg-white rounded-md border border-gray-200"
      style={{ pointerEvents: 'all' }}
      onMouseEnter={() => !isTouchActiveRef.current && handleInteractionStart()}
      onMouseLeave={() => !isTouchActiveRef.current && handleInteractionEnd()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="w-full h-full flex items-center justify-center p-1">
        <div dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
      {showTooltip && data.indices && data.indices.length > 0 && createPortal(
        <NodeIndicesPanel
          indices={data.indices}
          onSwapIndices={handleSwapIndices}
          position={tooltipPosition}
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
        />,
        document.body
      )}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
});

/**
 * Custom hook to create memoized node types
 */
const useNodeTypes = () => {
  return useMemo(() => ({
    default: CustomNode
  }), []);
};

/**
 * Main component that renders a tree visualization of tensor operations
 * @param {Object} props Component props
 * @param {Array} props.node Root node indices
 * @param {Array} props.left Left child indices
 * @param {Array} props.right Right child indices
 * @param {Object} props.dimTypes Dimension types configuration
 * @param {Function} props.onIndicesChange Callback for index changes
 * @param {boolean} props.isDragging Indicates if parent is being dragged
 */
const MiniReactFlowTree = ({ node, left, right, dimTypes, onIndicesChange, isDragging }) => {
  const { getInfoPanelDimensions } = useDeviceSize();
  const dimensions = getInfoPanelDimensions();
  const miniFlow = dimensions.miniFlow;
  const nodeTypes = useNodeTypes();

  /**
   * Determines the dimension type of a given letter based on dimTypes configuration
   * @param {string} letter The letter to check
   * @returns {string} Dimension type ('C', 'M', 'N', 'K', or 'O')
   */
  const determineDimensionType = useCallback((letter) => {
    if (!dimTypes) return 'O';

    const inC = (dimTypes.primitive?.cb || []).includes(letter) || (dimTypes.loop?.bc || []).includes(letter);
    const inM = (dimTypes.primitive?.mb || []).includes(letter) || (dimTypes.loop?.bm || []).includes(letter);
    const inN = (dimTypes.primitive?.nb || []).includes(letter) || (dimTypes.loop?.bn || []).includes(letter);
    const inK = (dimTypes.primitive?.kb || []).includes(letter) || (dimTypes.loop?.bk || []).includes(letter);

    if (inC) return 'C';
    if (inM) return 'M';
    if (inN) return 'N';
    if (inK) return 'K';
    return 'O';
  }, [dimTypes]);

  /**
   * Returns the color code for a given dimension type
   * @param {string} dimensionType The dimension type
   * @returns {string} Color hex code
   */
  const getLetterColor = useCallback((dimensionType) => {
    switch (dimensionType) {
      case 'C': return '#62c8d3';
      case 'M': return '#007191';
      case 'N': return '#d31f11';
      case 'K': return '#f47a00';
      default: return '#999';
    }
  }, []);

  /**
   * Creates a colored HTML label for node display
   * @param {string} nodeType Type of node ('root', 'left', or 'right')
   * @returns {Object} Object containing HTML and text representations
   */
  const createColoredLabel = useCallback((nodeType) => {
    let text;
    if (nodeType === 'root') {
      text = node;
    } else if (nodeType === 'left') {
      text = left;
    } else if (nodeType === 'right') {
      text = right;
    }

    if (!Array.isArray(text) || text.length === 0) {
      return {
        html: '-',
        fullText: '-',
        fullColoredHtml: '-',
        shouldTruncate: false
      };
    }

    const fullText = text.join('');
    const truncateThreshold = miniFlow.nodeWidth < 100 ? 8 : 12;
    const shouldTruncate = fullText.length > truncateThreshold;

    const createColoredHtml = (letters) => {
      return letters
        .map((letter) => {
          const dimensionType = determineDimensionType(letter);
          const color = getLetterColor(dimensionType);
          return `<span style="color: ${color};">${letter}</span>`;
        })
        .join(',');
    };

    const truncatedHtml = shouldTruncate ?
      '...' + createColoredHtml(text.slice(-3)) :
      createColoredHtml(text);

    const fullColoredHtml = createColoredHtml(text);

    return {
      html: truncatedHtml,
      fullText: fullText,
      fullColoredHtml: fullColoredHtml,
      shouldTruncate
    };
  }, [miniFlow, node, left, right, determineDimensionType, getLetterColor]);

  /**
   * Creates node data configuration for ReactFlow
   * @param {string} type Node type
   * @param {Object} position Node position coordinates
   * @returns {Object} Node configuration object
   */
  const createNodeData = useCallback((type, position) => {
    const { html } = createColoredLabel(type);
    let indices = [];
    if (type === 'root') {
      indices = Array.isArray(node) ? node : [];
    } else if (type === 'left') {
      indices = Array.isArray(left) ? left : [];
    } else if (type === 'right') {
      indices = Array.isArray(right) ? right : [];
    }

    return {
      id: type,
      position,
      data: {
        html,
        indices,
        onIndicesChange,
        forceCloseTooltip: isDragging, // Make sure this is included
      },
      style: {
        width: miniFlow.nodeWidth,
        height: miniFlow.nodeHeight,
        fontSize: `${miniFlow.fontSize}px`,
        padding: 0,
        backgroundColor: 'transparent',
        border: 'none'
      }
    };
  }, [miniFlow, createColoredLabel, node, left, right, onIndicesChange, isDragging]);

  /**
   * Generates node configurations for the flow diagram
   */
  const nodes = useMemo(() => {
    // Adjust nodes positioning to better fit the container
    const centerX = miniFlow.width / 2;
    const rootX = centerX - (miniFlow.nodeWidth / 2);
    const verticalSpacing = miniFlow.height * 0.5; // Reduced from 0.6
    const horizontalSpacing = miniFlow.width * 0.25; // Reduced from 0.3

    const baseNodes = [
      createNodeData('root', {
        x: rootX,
        y: miniFlow.height * 0.1
      }),
      createNodeData('left', {
        x: centerX - (right ? horizontalSpacing : 0) - (miniFlow.nodeWidth / 2),
        y: verticalSpacing
      })
    ];

    if (right !== undefined) {
      baseNodes.push(
        createNodeData('right', {
          x: centerX + horizontalSpacing - (miniFlow.nodeWidth / 2),
          y: verticalSpacing
        })
      );
    }

    return baseNodes;
  }, [miniFlow, createNodeData, right]);

  /**
   * Generates edge configurations for the flow diagram
   */
  const edges = useMemo(() => {
    const baseEdges = [
      {
        id: 'root-left',
        source: 'root',
        target: 'left',
        style: { stroke: '#999' }
      }
    ];

    if (right !== undefined) {
      baseEdges.push({
        id: 'root-right',
        source: 'root',
        target: 'right',
        style: { stroke: '#999' }
      });
    }

    return baseEdges;
  }, [right]);

  return (
    <ReactFlowProvider>
      <div style={{
        width: `${miniFlow.width}px`,
        height: `${miniFlow.height}px`,
        position: 'relative',
        overflow: 'hidden',
        transform: 'scale(0.9)',
        transformOrigin: 'center center',
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{
            padding: 0.1,
            minZoom: 0.1,
            maxZoom: 1,
          }}
          proOptions={{ hideAttribution: true }}
          nodeTypes={nodeTypes}
          zoomOnScroll={false}
          panOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          draggable={false}
          panOnDrag={false}
          minZoom={1}
          maxZoom={1}
        >
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default MiniReactFlowTree;