import React from 'react';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';

export default function ChardhoLogo({ size = 40 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
            {/* Gradients */}
            <Defs>
                <LinearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#4FD1C5" stopOpacity="1" />
                    <Stop offset="50%" stopColor="#38B2AC" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#319795" stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#E6FFFA" stopOpacity="0.7" />
                </LinearGradient>
                <LinearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#F0FDFA" stopOpacity="0.95" />
                </LinearGradient>
            </Defs>

            {/* Outer Glow Circle */}
            <Circle cx="100" cy="100" r="98" fill="url(#mainGradient)" opacity="0.15" />

            {/* Main Circle Background */}
            <Circle cx="100" cy="100" r="90" fill="url(#mainGradient)" />

            {/* Location Pin + Arrow Hybrid Design */}
            {/* Pin Base */}
            <Path
                d="M 100 45 
           C 75 45, 55 65, 55 90
           C 55 105, 65 120, 100 155
           C 135 120, 145 105, 145 90
           C 145 65, 125 45, 100 45 Z"
                fill="url(#glowGradient)"
                opacity="0.95"
            />

            {/* Inner Pin Circle */}
            <Circle cx="100" cy="88" r="20" fill="url(#mainGradient)" />

            {/* Forward Arrow - Dynamic Speed Element */}
            <G opacity="0.9">
                {/* Main Arrow */}
                <Path
                    d="M 85 95 L 125 100 L 85 105 Z"
                    fill="#FFFFFF"
                />
                {/* Arrow Shaft */}
                <Rect x="60" y="97" width="30" height="6" rx="3" fill="#FFFFFF" opacity="0.8" />

                {/* Speed Lines */}
                <Rect x="50" y="85" width="20" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
                <Rect x="55" y="112" width="15" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
            </G>

            {/* Route Path Accent */}
            <Path
                d="M 70 140 Q 85 145, 100 140 T 130 140"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
            />

            {/* GO+ Badge */}
            <G opacity="0.95">
                <Circle cx="150" cy="150" r="22" fill="#FFFFFF" />
                <Circle cx="150" cy="150" r="20" fill="url(#mainGradient)" />
                {/* Plus Symbol */}
                <Rect x="145" y="142" width="10" height="2.5" rx="1.25" fill="#FFFFFF" />
                <Rect x="148.75" y="138.25" width="2.5" height="10" rx="1.25" fill="#FFFFFF" />
                {/* GO Text */}
                <Path
                    d="M 144 155 L 144 158 L 147 158 L 147 155 Z
             M 149 155 L 149 158 Q 149 159, 150 159 Q 151 159, 151 158 L 151 155 Q 151 154, 150 154 Q 149 154, 149 155 Z"
                    fill="#FFFFFF"
                    opacity="0.9"
                />
            </G>

            {/* Subtle Ring Detail */}
            <Circle cx="100" cy="100" r="85" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.2" />
        </Svg>
    );
}
