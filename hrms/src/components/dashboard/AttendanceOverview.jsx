import React, { useState } from 'react';
import styles from './AttendanceOverview.module.css';

/**
 * AttendanceOverview Component
 * Displays a lightweight, responsive SVG-based bar chart representing weekly attendance.
 * Supports skeleton loading state.
 */
function AttendanceOverview({ data = [], loading }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'week' | 'month'
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const barColors = {
    today: { base: '#16A34A', hover: '#15803d' },
    week: { base: '#D97706', hover: '#b45309' },
    month: { base: '#2563eb', hover: '#1d4ed8' },
  };

  const tabDatasets = {
    today: [
      { day: '08:00', percentage: 96, label: '96%' },
      { day: '10:00', percentage: 98, label: '98%' },
      { day: '12:00', percentage: 94, label: '94%' },
      { day: '14:00', percentage: 95, label: '95%' },
      { day: '16:00', percentage: 92, label: '92%' },
      { day: '18:00', percentage: 97, label: '97%' },
      { day: '20:00', percentage: 90, label: '90%' },
    ],
    week: data && data.length > 0 ? data : [
      { day: 'Mon', percentage: 92, label: '92%' },
      { day: 'Tue', percentage: 95, label: '95%' },
      { day: 'Wed', percentage: 89, label: '89%' },
      { day: 'Thu', percentage: 94, label: '94%' },
      { day: 'Fri', percentage: 96, label: '96%' },
      { day: 'Sat', percentage: 91, label: '91%' },
      { day: 'Sun', percentage: 93, label: '93%' },
    ],
    month: [
      { day: 'W1', percentage: 93, label: '93%' },
      { day: 'W2', percentage: 95, label: '95%' },
      { day: 'W3', percentage: 91, label: '91%' },
      { day: 'W4', percentage: 96, label: '96%' },
      { day: 'W5', percentage: 94, label: '94%' },
    ]
  };

  const currentChartData = tabDatasets[activeTab] || tabDatasets.today;
  const activeBarColors = barColors[activeTab] || barColors.today;

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeleton} ${styles.skeletonTabs}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      </div>
    );
  }

  // Bar chart configurations
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;
  
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  
  const barWidth = 35;
  const gap = currentChartData.length > 1
    ? (chartWidth - barWidth * currentChartData.length) / (currentChartData.length - 1)
    : 0;

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

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Attendance Overview</h3>
        
        {/* Toggle options */}
        <div className={styles.tabs} role="tablist">
          <button 
            onClick={() => setActiveTab('today')} 
            className={[styles.tab, activeTab === 'today' ? styles.activeTab : ''].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={activeTab === 'today'}
          >
            Today
          </button>
          <button 
            onClick={() => setActiveTab('week')} 
            className={[styles.tab, activeTab === 'week' ? styles.activeTab : ''].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={activeTab === 'week'}
          >
            This Week
          </button>
          <button 
            onClick={() => setActiveTab('month')} 
            className={[styles.tab, activeTab === 'month' ? styles.activeTab : ''].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={activeTab === 'month'}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Responsive chart container */}
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
          {currentChartData.map((item, idx) => {
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

                {/* Primary colored attendance bar */}
                <path
                  d={getRoundedBarPath(x, y, barWidth, barHeight, 3)}
                  className={[
                    styles.bar,
                    isHovered ? styles.barHovered : ''
                  ].filter(Boolean).join(' ')}
                  style={{
                    fill: isHovered ? activeBarColors.hover : activeBarColors.base,
                  }}
                />

                {/* X Axis Labels */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - 4}
                  className={styles.xAxisLabel}
                >
                  {item.day}
                </text>
              </g>
            );
          })}

          {/* Render active tooltip after all bars in SVG render order so it is always on top */}
          {hoveredBarIndex !== null && (() => {
            const activeItem = currentChartData[hoveredBarIndex];
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

export default AttendanceOverview;
