'use client';

import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
}

export function ScoreGauge({ score, maxScore = 100, size = 120, label = 'Total Score' }: ScoreGaugeProps) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const percentage = (score / maxScore) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Color based on score
  let color = '#ef4444'; // Red (0-40)
  if (score > 40) color = '#f59e0b'; // Amber (41-70)
  if (score > 70) color = '#22c55e'; // Green (71-100)

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="transparent"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{Math.round(score)}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
