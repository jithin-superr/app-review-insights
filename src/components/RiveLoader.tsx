import React, { useEffect, useRef } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface RiveLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RiveLoader: React.FC<RiveLoaderProps> = ({ size = 'md', className = '' }) => {
  // Get dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 40, height: 40 };
      case 'lg':
        return { width: 100, height: 100 };
      case 'md':
      default:
        return { width: 80, height: 80 };
    }
  };

  const { width, height } = getDimensions();
  
  // Use your Rive file - make sure the path is correct
  // the .riv file should be in the public folder
  const { RiveComponent, rive } = useRive({
    src: '/animations/loading.riv', // Updated to match your actual file name
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <RiveComponent />
    </div>
  );
};

export default RiveLoader; 