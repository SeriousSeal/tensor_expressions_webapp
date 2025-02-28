import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that handles device size detection and layout calculations
 * @returns {Object} Device dimensions and panel sizing functions
 */
const useDeviceSize = () => {
    /**
     * Calculates effective width and device type based on screen size and device pixel ratio
     * @returns {Object} Object containing width and device type flags
     */
    const getEffectiveWidth = () => {
        const effectiveWidth = window.innerWidth;
        const effectiveHeight = window.innerHeight;

        // Use standard breakpoints, regardless of DPR
        return {
            width: effectiveWidth,
            height: effectiveHeight,
            isMobile: effectiveWidth <= 480,
            isTablet: effectiveWidth > 480 && effectiveWidth <= 1024,
            isDesktop: effectiveWidth > 1024
        };
    };

    const [dimensions, setDimensions] = useState(getEffectiveWidth());

    /**
     * Effect hook to handle window resize and orientation changes
     */
    useEffect(() => {
        const handleResize = () => setDimensions(getEffectiveWidth());
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    /**
     * Calculates dimensions for the information panel based on current device size
     * @returns {Object} Object containing panel dimensions and styling parameters
     */
    const getInfoPanelDimensions = () => {
        const { width, height } = dimensions;

        // Use a more subtle scaling factor with less aggressive changes
        const baseWidth = 1440; // Reference width
        // Cap the scaling factor to avoid extreme scaling on very large or small screens
        const scaleFactor = Math.min(Math.max(width / baseWidth, 0.85), 1.1);

        if (dimensions.isMobile) {
            const panelWidth = Math.min(320, width * 0.92);
            return {
                panelWidth,
                fontSize: 14,  // Use fixed font sizes instead of aggressive scaling
                padding: 10,
                showMiniFlow: true,
                miniFlow: {
                    width: Math.min(260, panelWidth * 0.9),
                    height: 130,
                    nodeWidth: 90,
                    nodeHeight: 28,
                    fontSize: 12,
                    letterSize: 14
                }
            };
        }

        if (dimensions.isTablet) {
            const panelWidth = Math.min(340, width * 0.7);
            return {
                panelWidth,
                fontSize: 14,
                padding: 5,
                showMiniFlow: true,
                miniFlow: {
                    width: 280,
                    height: 150,
                    nodeWidth: 110,
                    nodeHeight: 30,
                    fontSize: 14,
                    letterSize: 15
                }
            };
        }

        // Desktop - apply subtle scaling that won't dramatically change proportions
        const panelWidth = Math.min(360, width * 0.5);
        return {
            panelWidth,
            fontSize: 14, // Keep base font size constant
            padding: 10,
            showMiniFlow: true,
            miniFlow: {
                width: Math.max(280, panelWidth * 0.85),
                height: 160,
                nodeWidth: 110,
                nodeHeight: 32,
                fontSize: 14,
                letterSize: 18
            }
        };
    };

    return { ...dimensions, getInfoPanelDimensions, isTablet: dimensions.isTablet };
};

export default useDeviceSize;
