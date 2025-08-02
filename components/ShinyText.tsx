import React from 'react';
import './ShinyText.css';

interface ShinyTextProps {
  text: string;
  speed?: number;
  className?: string;
  disabled?: boolean;
}

const ShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  speed = 5, 
  className = '', 
  disabled = false 
}) => {
  const animationDuration = speed ? `${speed}s` : '5s';
  
  return (
    <span 
      className={`shiny-text ${className} ${disabled ? 'disabled' : ''}`}
      style={{
        animationDuration: disabled ? 'none' : animationDuration
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
