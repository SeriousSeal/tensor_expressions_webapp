import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import MiniReactFlowTree from './MiniReactFlowTree.jsx';
import { dimensionTypes } from '../utils/dimensionClassifier.jsx';
import { TbArrowsExchange, TbArrowsShuffle } from "react-icons/tb";
import useDeviceSize from '../utils/useDeviceSize.jsx';

import { isEqual } from "lodash";

/**
 * InfoPanel Component
 * Displays detailed information about tensor contractions and their dimensions
 * 
 * @param {Object} props
 * @param {Object} props.node - Current node being displayed
 * @param {Object} props.connectedNodes - Connected nodes information {value: [], left: null, right: null}
 * @param {Function} props.setConnectedNodes - Function to update connected nodes
 * @param {Function} props.onClose - Function to handle panel closure
 * @param {Object} props.initialPosition - Initial position of the panel {x: number, y: number}
 * @param {Object} props.indexSizes - Sizes of different indices
 * @param {boolean} props.showSizes - Toggle between showing indices or sizes
 * @param {Function} props.onToggleSizes - Function to toggle size display
 * @param {Function} props.swapChildren - Function to swap left and right children
 * @param {Function} props.recalculateTreeAndOperations - Function to recalculate tree layout
 * @param {Function} props.addPermutationNode - Function to add permutation node
 * @param {Function} props.removePermutationNode - Function to remove permutation node
 */
const InfoPanel = ({
  node,
  connectedNodes = { value: [], left: null, right: null },
  setConnectedNodes,
  onClose,
  initialPosition,
  indexSizes,
  showSizes,
  onToggleSizes,
  swapChildren,
  recalculateTreeAndOperations,
  addPermutationNode,
  removePermutationNode
}) => {
  const { getInfoPanelDimensions } = useDeviceSize();
  const dimensions = getInfoPanelDimensions();
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const prevConnectedNodesRef = useRef(connectedNodes);

  // Isn Bug und damit das nicht die ganze zeit in der Console rumnervt ....

  useEffect(() => {
    if (!isEqual(prevConnectedNodesRef.current, connectedNodes)) {
      prevConnectedNodesRef.current = connectedNodes;
    }
  }, [connectedNodes, indexSizes]);

  const dimTypes = useMemo(() => {
    if (connectedNodes.right)
      return dimensionTypes(connectedNodes.value, connectedNodes.left?.value, connectedNodes.right?.value);
  }, [connectedNodes.value, connectedNodes.left?.value, connectedNodes.right]);

  const isEmptyDimTypes = useMemo(() => {
    if (dimTypes) {
      return Object.values(dimTypes).every(category =>
        Object.values(category).every(arr => arr.length === 0)
      );
    }
    return true;
  }, [dimTypes]);

  const panelStyle = {
    position: 'absolute',
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 10,
    width: `${dimensions.panelWidth}px`,
    maxWidth: '95vw',
    fontSize: `${dimensions.fontSize}px`,
    padding: `${dimensions.padding}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  };

  const titleStyle = {
    fontSize: `${dimensions.fontSize * 1.4}px`,
    fontWeight: 'bold',
    marginBottom: `${dimensions.padding}px`,
    color: '#333',
    alignItems: "center",
  };

  const letterContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginRight: '16px',
    marginLeft: '16px',
    marginTop: '16px',
  };

  const letterStyle = {
    fontSize: `${dimensions.miniFlow.letterSize}px`,
    fontWeight: 'bold',
    lineHeight: '1.2',
    marginBottom: `${dimensions.padding}px`,
  };

  const reactFlowPanelStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: `${dimensions.padding}px`,
    width: '100%', // Changed from maxWidth
    margin: '0 auto',
    paddingTop: `${dimensions.padding}px`,
    position: 'relative',
    overflow: 'hidden'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    marginTop: `${dimensions.padding}px`,
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    fontSize: `${dimensions.fontSize}px`,
  };

  const cellStyle = {
    padding: `${dimensions.padding * 0.75}px`,
    textAlign: 'center',
    borderBottom: '1px solid #e0e0e0',
    height: `${dimensions.fontSize * 2.5}px`,
    position: 'relative',
  };

  const cellContentStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
  };

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    color: '#333',
  };

  /**
   * Calculates the size of a dimension based on its indices
   * @param {Array} indices - Array of index identifiers
   * @returns {string|number} - Calculated size or '-' if no indices
   */
  const calculateSize = (indices) => {
    if (!indices || indices.length === 0) return '-';
    return indices.reduce((acc, index) => acc * (indexSizes[index] || 1), 1);
  };


  /**
   * Handles mouse down event for panel dragging
   * @param {MouseEvent|TouchEvent} e - Mouse or touch event
   */
  const handleMouseDown = (e) => {
    // Don't initiate dragging if clicking the close button
    if (e.target.closest('button[data-close-button]')) {
      return;
    }

    const event = e.touches ? e.touches[0] : e;
    if (panelRef.current?.contains(event.target)) {
      setIsDragging(true);
      setDragOffset({
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      });
    }
  };

  /**
   * Handles mouse movement during panel drag
   * @param {MouseEvent} e - Mouse move event
   */
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  }, [isDragging, dragOffset]);

  /**
   * Handles touch movement during panel drag
   * @param {TouchEvent} e - Touch move event
   */
  const handleTouchMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);


  /**
   * Handles swapping of left and right children
   * @param {Event} e - Click event
   */
  const handleSwap = useCallback(async (e) => {
    e.stopPropagation();
    await swapChildren(node);
  }, [swapChildren, node]);

  /**
   * Handles addition of permutation node
   * @param {Event} e - Click event
   */
  const handleAddPermutation = useCallback(async (e) => {
    e.stopPropagation();
    await addPermutationNode(node);
    onClose();
  }, [addPermutationNode, node, onClose]);

  /**
   * Handles removal of permutation node
   * @param {Event} e - Click event
   */
  const handleRemovePermutation = useCallback(async (e) => {
    e.stopPropagation();
    await removePermutationNode(node);
    onClose(); // Close panel after removing
  }, [removePermutationNode, node, onClose]);

  /**
   * Handles changes in indices for nodes
   * @param {string} nodeId - ID of the node being modified
   * @param {Array} newIndices - New indices to be set
   */
  const handleIndicesChange = useCallback((nodeId, newIndices) => {
    if (!setConnectedNodes) return;

    const updatedConnectedNodes = {
      ...connectedNodes,
      id: node.id,
      value: nodeId === 'root' ? newIndices : connectedNodes.value,
      left: nodeId === 'left'
        ? { ...connectedNodes.left, value: newIndices }
        : connectedNodes.left,
      right: nodeId === 'right'
        ? { ...connectedNodes.right, value: newIndices }
        : connectedNodes.right
    };

    setConnectedNodes(prevState => ({
      ...prevState,
      connectedNodes: updatedConnectedNodes
    }));

    if (recalculateTreeAndOperations) {
      recalculateTreeAndOperations(updatedConnectedNodes);
    }
  }, [connectedNodes, setConnectedNodes, recalculateTreeAndOperations, node.id]);

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: `${dimensions.padding / 2}px`,
    width: '100%',
    padding: `${dimensions.padding / 2}px`,
  };

  const buttonStyle = {
    fontSize: `${dimensions.fontSize * 0.95}px`,
    padding: `${dimensions.padding * 0.5}px ${dimensions.padding * 0.75}px`,
    whiteSpace: 'nowrap',
    minWidth: 'fit-content',
  };

  const closeButtonStyle = {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    padding: 0,
    marginLeft: '8px',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
    minWidth: '36px', // Ensure minimum touch target size
    minHeight: '36px', // Ensure minimum touch target size
  };

  return (
    <div
      ref={panelRef}
      className="border border-gray-300 rounded shadow-md relative"
      style={panelStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Add a header container div to group title and controls */}
      <div className="flex items-center justify-between mb-2">
        <h3 style={titleStyle}>Contraction Info</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">
              {showSizes ? "Sizes" : "Indices"}
            </label>
            <label className="relative inline-block w-8 h-4">
              <input
                type="checkbox"
                className="hidden"
                checked={showSizes}
                onChange={onToggleSizes}
              />
              <span className="absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ease-in-out bg-gray-300">
                <span className={`
                  absolute h-3 w-3 rounded-full bg-white
                  transform transition-transform duration-200 ease-in-out
                  top-0.5 left-0.5
                  ${showSizes ? 'translate-x-4' : 'translate-x-0'}
                `} />
              </span>
            </label>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            style={closeButtonStyle}
            data-close-button="true"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {true && (
        <div style={reactFlowPanelStyle}>
          <div style={letterContainerStyle}>
            <span style={{ ...letterStyle, color: '#62c8d3' }}>C</span>
            <span style={{ ...letterStyle, color: '#007191' }}>M</span>
            <span style={{ ...letterStyle, color: '#d31f11' }}>N</span>
            <span style={{ ...letterStyle, color: '#b2df8a' }}>K</span>
          </div>
          <div>
            <div className="mt-4 mb-2 flex justify-center">
              <MiniReactFlowTree
                key={`${connectedNodes.value}-${connectedNodes.left?.value}-${connectedNodes.right?.value}`}
                node={connectedNodes.value}
                left={connectedNodes.left?.value}
                right={connectedNodes.right?.value}
                dimTypes={dimTypes}
                onIndicesChange={handleIndicesChange}
                isDragging={isDragging}  // Add this prop
              />
            </div>
            <div style={buttonContainerStyle}>
              {node.data.left && node.data.right && (
                <button
                  className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors duration-200"
                  style={buttonStyle}
                  onClick={handleSwap}
                  title="Swap Left and Right Children"
                >
                  <TbArrowsExchange size={dimensions.fontSize} />
                  <span>Swap</span>
                </button>
              )}
              {!node.data.deleteAble && (
                <button
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors duration-200"
                  style={buttonStyle}
                  onClick={handleAddPermutation}
                  title="Add Permutation Node"
                >
                  <TbArrowsShuffle size={dimensions.fontSize} />
                  <span>Add Permutation</span>
                </button>
              )}
              {node.data.deleteAble && (
                <button
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors duration-200"
                  style={buttonStyle}
                  onClick={handleRemovePermutation}
                  title="Remove Permutation Node"
                >
                  <TbArrowsShuffle size={dimensions.fontSize} />
                  <span>Remove Permutation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isEmptyDimTypes && (
        <div className={`w-full overflow-x-auto  'mt-4'}`}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Type</th>
                <th style={headerCellStyle}>
                  <div className="flex flex-col items-center -mb-1">
                    <span>Primitive</span>
                    <span className={`text-xs text-gray-500 h-3 leading-3 ${showSizes ? 'opacity-100' : 'opacity-0'}`}>
                      (sizes)
                    </span>
                  </div>
                </th>
                <th style={headerCellStyle}>
                  <div className="flex flex-col items-center -mb-1">
                    <span>Loop</span>
                    <span className={`text-xs text-gray-500 h-3 leading-3 ${showSizes ? 'opacity-100' : 'opacity-0'}`}>
                      (sizes)
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {['C', 'M', 'N', 'K'].map((type, index) => {
                const primitiveKey = `${type.toLowerCase()}b`;
                const loopKey = `b${type.toLowerCase()}`;
                const primitiveData = dimTypes.primitive[primitiveKey] || [];
                const loopData = dimTypes.loop[loopKey] || [];

                return (
                  <tr key={type} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={cellStyle}>{type}</td>
                    <td style={cellStyle}>
                      <div style={cellContentStyle}>
                        <div className="relative w-full">
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
                              }`}
                          >
                            {primitiveData.join(', ') || '-'}
                          </div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                              }`}
                          >
                            {calculateSize(primitiveData)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div style={cellContentStyle}>
                        <div className="relative w-full">
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
                              }`}
                          >
                            {loopData.join(', ') || '-'}
                          </div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                              }`}
                          >
                            {calculateSize(loopData)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/**
 * Memoized InfoPanel component with custom comparison function
 * Prevents unnecessary re-renders by comparing relevant props
 */
export default React.memo(InfoPanel, (prevProps, nextProps) =>
  isEqual(prevProps.connectedNodes, nextProps.connectedNodes) &&
  isEqual(prevProps.indexSizes, nextProps.indexSizes) &&
  prevProps.showSizes === nextProps.showSizes &&
  prevProps.onToggleSizes === nextProps.onToggleSizes &&
  isEqual(prevProps.node, nextProps.node) &&
  prevProps.swapChildren === nextProps.swapChildren &&
  prevProps.addPermutationNode === nextProps.addPermutationNode &&
  prevProps.removePermutationNode === nextProps.removePermutationNode &&
  prevProps.setConnectedNodes === nextProps.setConnectedNodes
);