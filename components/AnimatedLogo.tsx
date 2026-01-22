import React from 'react';

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 40,
  className = '' 
}) => {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={`${import.meta.env.BASE_URL}animated-logo.gif`}
        alt="AnimaTeX Logo"
        className="w-full h-full object-contain"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};

export default AnimatedLogo;
