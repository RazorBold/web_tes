"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface BaseChartProps {
  option: any;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
  onEvents?: Record<string, Function>;
}

export default function BaseChart({
  option,
  style,
  className,
  theme,
  onEvents,
}: BaseChartProps) {
  return (
    <div className={`w-full h-full relative ${className || ""}`} style={style}>
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        theme={theme}
        onEvents={onEvents}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
