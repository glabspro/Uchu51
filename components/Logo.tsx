import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'default' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className, variant = 'default' }) => {
    const textColor = variant === 'light' ? '#FDFCFB' : '#44281D';
    const fiftyOneColor = variant === 'light' ? '#FFFFFF' : '#F97316';

    return (
        <svg
            className={className}
            viewBox="0 0 285 60"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Uchu51 Logo"
        >
            <defs>
                <linearGradient id="chili-gradient-new" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FDBA74" />
                    <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
            </defs>

            {/* New Stylized Chili Pepper Icon */}
            <g transform="translate(0, 3)">
                <path d="M38.8,3.2c-6.8-4.3-16.8,1.9-19.3,8.7c-0.2,0.6-0.4,1.2-0.5,1.8c3.9-3.4,8.8-5.4,14-5.7C36.3,7.7,38.8,3.2,38.8,3.2z" fill="#84CC16" />
                <path d="M19,13.8c-2.7,7.2,0.3,15.4,6.4,19.9c7.5,5.4,17.7,4.3,23.9-2.5c6.5-7.2,7.4-17.8,2.3-25.3c-0.4-0.6-0.8-1.2-1.3-1.7c-5.1-5.5-12.8-8-20.5-6.4C25.1,0.1,21.1,5.9,19,13.8z" fill="url(#chili-gradient-new)" />
            </g>

            {/* Text part of the logo */}
            <text
                x="68"
                y="48"
                fontSize="48"
                fill={textColor}
                letterSpacing="-2"
            >
                <tspan fontFamily="'Fredoka', sans-serif" fontWeight="600">uchu</tspan>
                <tspan fontFamily="'Montserrat', sans-serif" fill={fiftyOneColor} fontWeight="800" dx="-4">51</tspan>
            </text>
        </svg>
    );
};