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
            viewBox="0 0 280 60"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Uchu51 Logo"
        >
            <defs>
                <linearGradient id="chili-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
            </defs>

            {/* Stylized Chili Pepper Icon */}
            <g transform="translate(5, 5) scale(0.9)">
                <path
                    d="M 23.9, 8.4 C 23.9, 8.4 5.9, 18.4 9.9, 38.4 C 9.9, 38.4 17.9, 20.4 29.9, 16.4 C 29.9, 16.4 25.9, 28.4 23.9, 40.4 C 23.9, 40.4 35.9, 28.4 35.9, 12.4 C 35.9, 12.4 31.9, 18.4 23.9, 8.4 Z"
                    fill="url(#chili-gradient)"
                />
                <path
                    d="M 35.9, 12.4 C 35.9, 12.4 37.9, 4.4 31.9, 2.4 C 31.9, 2.4 31.9, 8.4 35.9, 12.4 Z"
                    fill="#65A30D"
                />
            </g>

            {/* Text part of the logo */}
            <text
                x="48"
                y="48"
                fontSize="48"
                fill={textColor}
                letterSpacing="-2"
            >
                <tspan fontFamily="'Fredoka', sans-serif" fontWeight="600">uchu</tspan>
                <tspan fontFamily="'Montserrat', sans-serif" fill={fiftyOneColor} fontWeight="800" dx="-8">51</tspan>
            </text>
        </svg>
    );
};
