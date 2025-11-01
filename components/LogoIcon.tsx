import React from 'react';

interface LogoIconProps {
    className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 55 55"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Uchu51 Icon"
        >
            <defs>
                <linearGradient id="chili-gradient-icon" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FDBA74" />
                    <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
            </defs>
            <g transform="translate(0, 3)">
                <path d="M38.8,3.2c-6.8-4.3-16.8,1.9-19.3,8.7c-0.2,0.6-0.4,1.2-0.5,1.8c3.9-3.4,8.8-5.4,14-5.7C36.3,7.7,38.8,3.2,38.8,3.2z" fill="#84CC16" />
                <path d="M19,13.8c-2.7,7.2,0.3,15.4,6.4,19.9c7.5,5.4,17.7,4.3,23.9-2.5c6.5-7.2,7.4-17.8,2.3-25.3c-0.4-0.6-0.8-1.2-1.3-1.7c-5.1-5.5-12.8-8-20.5-6.4C25.1,0.1,21.1,5.9,19,13.8z" fill="url(#chili-gradient-icon)" />
            </g>
        </svg>
    );
};
