import React, { useState } from 'react';
import { Users, ClipboardCheck } from 'lucide-react';
import AttendanceOverview from './AttendanceOverview';
import styles from './AgeDemograph.module.css';

const ageGroups = [
  { range: '<18', count: 14, percentage: 1 },
  { range: '19-25', count: 330, percentage: 22 },
  { range: '26-35', count: 661, percentage: 43 },
  { range: '36-45', count: 321, percentage: 21 },
  { range: '46-55', count: 177, percentage: 12 },
  { range: '56-60', count: 22, percentage: 1 },
  { range: '60+', count: 6, percentage: 0 },
];

function AgeDemograph({ attendanceData = [] }) {
  const [activeView, setActiveView] = useState('attendance'); // 'age' | 'attendance' - default attendance
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Bar chart SVG configurations
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;
  
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  
  const barWidth = 35;
  const gap = (chartWidth - barWidth * ageGroups.length) / (ageGroups.length - 1);

  // Y-axis grid values
  const gridLines = [100, 75, 50, 25, 0];

  // Helper to generate SVG path for a bar rounded only at the top
  const getRoundedBarPath = (x, y, width, height, radius) => {
    const r = Math.min(radius, height, width / 2);
    return `
      M ${x},${y + height}
      L ${x},${y + r}
      A ${r},${r} 0 0 1 ${x + r},${y}
      L ${x + width - r},${y}
      A ${r},${r} 0 0 1 ${x + width},${y + r}
      L ${x + width},${y + height}
      Z
    `.replace(/\s+/g, ' ').trim();
  };

  if (activeView === 'attendance') {
    return (
      <div className={styles.attendanceWrapper}>
        <div className={styles.toggleContainer}>
          <button 
            onClick={() => setActiveView('age')} 
            className={styles.toggleBtn}
            title="Age Demographics"
          >
            <Users size={16} />
          </button>
          <button 
            onClick={() => setActiveView('attendance')} 
            className={`${styles.toggleBtn} ${styles.active}`}
            title="Attendance Overview"
          >
            <ClipboardCheck size={16} />
          </button>
        </div>
        <AttendanceOverview data={attendanceData} loading={false} />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Age Demograph</h3>
        
        {/* Toggle buttons */}
        <div className={styles.toggleGroup}>
          <button 
            onClick={() => setActiveView('age')} 
            className={`${styles.toggleBtn} ${styles.active}`}
            title="Age Demographics"
          >
            <Users size={16} />
          </button>
          <button 
            onClick={() => setActiveView('attendance')} 
            className={styles.toggleBtn}
            title="Attendance Overview"
          >
            <ClipboardCheck size={16} />
          </button>
        </div>
      </div>

      {/* Bar Chart */}
      <div className={styles.chartContainer}>
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className={styles.svg}
          width="100%"
          height="100%"
        >
          {/* Horizontal Grid lines */}
          {gridLines.map((val, idx) => {
            const y = paddingY + chartHeight * (1 - val / 100);
            const isBaseline = val === 0;
            return (
              <g key={idx} className={styles.gridGroup}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={svgWidth - paddingX} 
                  y2={y} 
                  className={isBaseline ? styles.baseline : styles.gridLine}
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 4} 
                  className={styles.gridLabel}
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Bar groups */}
          {ageGroups.map((item, idx) => {
            const x = paddingX + idx * (barWidth + gap);
            const barHeight = chartHeight * (item.percentage / 100);
            const y = paddingY + chartHeight - barHeight;
            const isHovered = hoveredBarIndex === idx;

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                className={styles.barGroup}
              >
                {/* Main bar background (track) */}
                <path
                  d={getRoundedBarPath(x, paddingY, barWidth, chartHeight, 3)}
                  className={styles.barTrack}
                />

                {/* Primary colored bar */}
                <path
                  d={getRoundedBarPath(x, y, barWidth, barHeight, 3)}
                  className={`${styles.bar} ${isHovered ? styles.barHovered : ''}`}
                  style={{
                    fill: isHovered ? '#2563eb' : '#3b82f6',
                  }}
                />

                {/* X Axis Labels */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - 4}
                  className={styles.xAxisLabel}
                >
                  {item.range}
                </text>
              </g>
            );
          })}

          {/* Render active tooltip after all bars in SVG render order so it is always on top */}
          {hoveredBarIndex !== null && (() => {
            const activeItem = ageGroups[hoveredBarIndex];
            if (!activeItem) return null;

            const x = paddingX + hoveredBarIndex * (barWidth + gap);
            const barHeight = chartHeight * (activeItem.percentage / 100);
            const y = paddingY + chartHeight - barHeight;

            const tooltipWidth = 52;
            const tooltipHeight = 22;

            // Keep tooltip horizontally inside chart boundaries
            const tooltipX = Math.max(
              6,
              Math.min(svgWidth - tooltipWidth - 6, x + barWidth / 2 - tooltipWidth / 2)
            );

            // Position above bar; prevent clipping at top edge
            const tooltipY = Math.max(2, y - tooltipHeight - 6);

            return (
              <g className={styles.tooltipGroup}>
                <rect 
                  x={tooltipX} 
                  y={tooltipY} 
                  width={tooltipWidth} 
                  height={tooltipHeight} 
                  rx={4} 
                  className={styles.tooltipBg} 
                />
                <text 
                  x={tooltipX + tooltipWidth / 2} 
                  y={tooltipY + 15.5} 
                  className={styles.tooltipText}
                >
                  {activeItem.percentage}%
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

export default AgeDemograph;
