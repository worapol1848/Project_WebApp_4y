// code in this file is written by worapol สุดหล่อ
import React from 'react';

const VelinLogo = ({ className = '', textColor = '#FFFFFF', width, height, viewBox, iconOnly = false }) => {
  const defaultWidth = iconOnly ? 40 : 120;
  const defaultHeight = 40;
  const defaultViewBox = iconOnly ? "24 -2 42 42" : "26 0 120 40";

  return (
    <svg
      className={className}
      width={width || defaultWidth}
      height={height || defaultHeight}
      viewBox={viewBox || defaultViewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradRedPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(120, 230, 210)" />
          <stop offset="100%" stopColor="rgb(90, 170, 210)" />
        </linearGradient>
        <linearGradient id="logoGradPurpleRed" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(140, 200, 230)" />
          <stop offset="100%" stopColor="rgb(173, 252, 234)" />
        </linearGradient>
      </defs>
      <line x1="44" y1="34" x2="57" y2="6" stroke="url(#logoGradPurpleRed)" strokeWidth="10" strokeLinecap="round" />
      <line x1="32" y1="6" x2="44" y2="34" stroke="url(#logoGradRedPurple)" strokeWidth="10" strokeLinecap="round" />
      {!iconOnly && <text x="62" y="31" fontFamily="'Poppins', sans-serif" fontSize="22" fontWeight="800" fill={textColor} letterSpacing="3">elin</text>}
    </svg>
  );
};

export default VelinLogo;
