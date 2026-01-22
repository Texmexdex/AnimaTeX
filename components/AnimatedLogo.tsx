import React, { useState, useEffect } from 'react';

interface AnimatedLogoProps {
  size?: number;
  fps?: number;
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 40, 
  fps = 10,
  className = '' 
}) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 62;
  const frameDelay = 1000 / fps; // Convert FPS to milliseconds

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev >= totalFrames ? 1 : prev + 1));
    }, frameDelay);

    return () => clearInterval(interval);
  }, [frameDelay, totalFrames]);

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={`/logo-frames/${currentFrame}.png`}
        alt="AnimaTeX Logo"
        className="w-full h-full object-contain"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};

export default AnimatedLogo;
