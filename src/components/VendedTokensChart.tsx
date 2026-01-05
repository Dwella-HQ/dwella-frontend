import * as React from "react";
import { ChevronDown } from "lucide-react";

export type VendedTokensChartProps = {
  labels: string[];
  vendedTokens: number[];
  revenue: number[];
  useMockData?: boolean;
};

type ChartMode = "vendedTokens" | "revenue";

// Mock data matching the API response structure - using realistic values
const mockLabels = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const mockVendedTokens = [28, 45, 40, 58, 20, 75, 18, 68, 85, 52, 35, 70];
const mockRevenue = [2100, 3375, 3000, 4350, 1500, 5625, 1350, 5100, 6375, 3900, 2625, 5250];

/**
 * Calculate nice rounded Y-axis values
 */
const calculateYAxisValues = (maxValue: number): number[] => {
  if (maxValue === 0) return [0, 20, 40, 60, 80, 100];
  
  // Round max value to a nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;
  let niceMax: number;
  
  if (normalized <= 1) niceMax = magnitude;
  else if (normalized <= 2) niceMax = 2 * magnitude;
  else if (normalized <= 5) niceMax = 5 * magnitude;
  else niceMax = 10 * magnitude;
  
  // Generate 6 evenly spaced values
  const step = niceMax / 5;
  return [0, step, step * 2, step * 3, step * 4, niceMax].map(v => Math.round(v));
};

export const VendedTokensChart = ({
  labels = [],
  vendedTokens = [],
  revenue = [],
  useMockData = false, // Change to true to use mock data
}: VendedTokensChartProps) => {
  const [chartMode, setChartMode] = React.useState<ChartMode>("vendedTokens");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Use mock data if specified or if no data provided
  const actualLabels = useMockData || labels.length === 0 ? mockLabels : labels;
  const actualVendedTokens = useMockData || vendedTokens.length === 0 ? mockVendedTokens : vendedTokens;
  const actualRevenue = useMockData || revenue.length === 0 ? mockRevenue : revenue;

  const chartData = actualLabels.map((label, index) => ({
    month: label,
    vendedTokensValue: actualVendedTokens[index] || 0,
    revenueValue: actualRevenue[index] || 0,
  }));

  const currentValues = chartMode === "vendedTokens" 
    ? chartData.map((d) => d.vendedTokensValue)
    : chartData.map((d) => d.revenueValue);

  const maxValue = Math.max(...currentValues, 1); // Ensure at least 1 to avoid division by zero
  const yAxisValues = calculateYAxisValues(maxValue);
  const displayMax = yAxisValues[yAxisValues.length - 1];

  // Calculate points for the line chart
  const pointCount = chartData.length;
  const pointSpacing = pointCount > 1 ? 1000 / (pointCount - 1) : 0;

  // Generate SVG path for the line and area
  const points = chartData.map((data, index) => {
    const value = chartMode === "vendedTokens" ? data.vendedTokensValue : data.revenueValue;
    const x = (index * pointSpacing);
    // Use displayMax for scaling so the chart uses the full height
    const y = displayMax > 0 ? 100 - (value / displayMax) * 100 : 100;
    return { x, y, value };
  });

  // Create path for the area (filled under the line)
  const areaPath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} 100 L ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, "") + ` L ${points[points.length - 1]?.x || 0} 100 Z`;

  // Create path for the line
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, "");

  return (
    <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-brand-black">
            Vended Tokens
          </h3>
          <p className="text-xs text-brand-ash">
            Latest transactions with Partner
          </p>
        </div>
        {/* <button
          type="button"
          className="transition-fx flex items-center gap-2 rounded-lg border border-brand-border-light bg-brand-white px-3 py-2 text-xs font-medium text-brand-ash hover:border-brand-main hover:text-brand-main"
        >
          Last 12 months
          <ChevronDown className="h-3 w-3" />
        </button> */}
      </div>

      <div className="mt-8 relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[10px] text-brand-ash z-10">
          {[...yAxisValues].reverse().map((value, index) => (
            <span key={`y-${index}-${value}`}>{value.toLocaleString("en-NG")}</span>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ marginLeft: "48px", marginRight: "8px" }}>
          {yAxisValues.map((_, index) => (
            <div
              key={index}
              className="h-px bg-brand-border-light/50"
            />
          ))}
        </div>

        {/* SVG Chart */}
        <div className="absolute inset-0" style={{ marginLeft: "48px", marginRight: "8px", paddingTop: "4px", paddingBottom: "16px" }}>
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id={`gradient-${chartMode}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d={areaPath}
              fill={`url(#gradient-${chartMode})`}
            />
            
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#1E40AF"
              strokeWidth="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Points (circular markers) - show all points but style differently for zero */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={point.value > 0 ? (hoveredIndex === index ? "2" : "1.5") : "0.5"}
                fill={point.value > 0 ? "#1E40AF" : "#e5e7eb"}
                stroke={point.value > 0 ? "#ffffff" : "transparent"}
                strokeWidth={point.value > 0 ? (hoveredIndex === index ? "0.3" : "0.2") : "0"}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
            
            {/* Invisible larger hit areas for better hover */}
            {points.map((point, index) => (
              <circle
                key={`hit-${index}`}
                cx={point.x}
                cy={point.y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>
          
          {/* Tooltip positioned absolutely */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute bg-brand-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg pointer-events-none z-20"
              style={{
                left: `${(points[hoveredIndex].x / 1000) * 100}%`,
                top: `${points[hoveredIndex].y}%`,
                transform: "translate(-50%, -120%)",
              }}
            >
              {points[hoveredIndex].value.toLocaleString("en-NG", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center text-[10px] text-brand-ash" style={{ marginLeft: "24px", marginRight: "8px" }}>
          {chartData.map((data) => (
            <span key={data.month}>{data.month}</span>
          ))}
        </div>
      </div>

      {/* Legend with colored circles */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setChartMode("vendedTokens")}
          className="flex items-center gap-2 cursor-pointer group transition-fx"
        >
          <span className={`h-3 w-3 rounded-full transition-all ${
            chartMode === "vendedTokens" 
              ? "bg-[#1E40AF]" 
              : "border-2 border-[#1E40AF] bg-transparent group-hover:bg-[#1E40AF]/10"
          }`} />
          <span className={`text-sm transition-colors ${
            chartMode === "vendedTokens" 
              ? "text-brand-black font-medium" 
              : "text-brand-ash group-hover:text-brand-black"
          }`}>
            Vended Tokens
          </span>
        </button>
        <button
          type="button"
          onClick={() => setChartMode("revenue")}
          className="flex items-center gap-2 cursor-pointer group transition-fx"
        >
          <span className={`h-3 w-3 rounded-full transition-all ${
            chartMode === "revenue" 
              ? "bg-[#1E40AF]" 
              : "border-2 border-[#1E40AF] bg-transparent group-hover:bg-[#1E40AF]/10"
          }`} />
          <span className={`text-sm transition-colors ${
            chartMode === "revenue" 
              ? "text-brand-black font-medium" 
              : "text-brand-ash group-hover:text-brand-black"
          }`}>
            Revenue
          </span>
        </button>
      </div>
    </div>
  );
};
