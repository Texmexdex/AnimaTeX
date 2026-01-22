import React from 'react';

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 64,
  className = '' 
}) => {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={`${import.meta.env.BASE_URL}anilogo.gif`}
        alt="AnimaTeX Logo"
        className="w-full h-full object-contain"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
};

export default AnimatedLogo;
