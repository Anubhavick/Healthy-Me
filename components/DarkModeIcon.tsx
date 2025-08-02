import React from 'react';

interface DarkModeIconProps {
  src: string;
  alt: string;
  className?: string;
  isDarkMode?: boolean;
  invertInDarkMode?: boolean;
}

const DarkModeIcon: React.FC<DarkModeIconProps> = ({ 
  src, 
  alt, 
  className = '', 
  isDarkMode = false, 
  invertInDarkMode = true 
}) => {
  const filterClass = isDarkMode && invertInDarkMode ? 'filter brightness-0 invert' : '';
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${className} ${filterClass}`} 
    />
  );
};

export default DarkModeIcon;
