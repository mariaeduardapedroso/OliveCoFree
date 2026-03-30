import React from "react";

const OliveIcon = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Olive fruit body - slightly tilted oval */}
    <ellipse cx="12" cy="14" rx="5" ry="6.5" transform="rotate(-10 12 14)" />
    {/* Stem */}
    <path d="M12 7.5 L13.5 4.5" />
    {/* Small leaf */}
    <path d="M13.5 4.5 Q16 3.5 17 5 Q15.5 5.5 13.5 4.5" />
  </svg>
);

export default OliveIcon;
