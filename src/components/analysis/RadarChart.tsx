'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { ScoreCardCategory } from '@/lib/engine/types';

interface PropertyRadarChartProps {
  data: ScoreCardCategory[];
}

export function PropertyRadarChart({ data }: PropertyRadarChartProps) {
  // Normalize data for chart (0-100 scale)
  const chartData = data.map(item => ({
    category: item.category.split(' ')[0], // Shorten name
    fullCategory: item.category,
    value: Math.round((item.score / item.maxScore) * 100),
    originalScore: item.score,
    maxScore: item.maxScore
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => [
              `${props.payload.originalScore}/${props.payload.maxScore}`, 
              props.payload.fullCategory
            ]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
