import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  DollarSign,
  TrendingUp,
  Home,
  Wrench,
  Download,
  BarChart3,
  FileDown,
} from "lucide-react";
import { mockProperties } from "@/data/mockLandlordData";
import type { NextPageWithLayout } from "../_app";

const ReportsPage: NextPageWithLayout = () => {
  const [selectedReportType, setSelectedReportType] =
    React.useState("Rent Collection");
  const [selectedDateRange, setSelectedDateRange] =
    React.useState("Last 3 Months");
  const [selectedProperty, setSelectedProperty] =
    React.useState("All Properties");
  const [selectedExportFormat, setSelectedExportFormat] = React.useState("PDF");

  // Calculate summary stats
  const totalRevenue = 1250000;
  const avgOccupancyRate = 84.5;
  const maintenanceCost = 85000;

  // Mock chart data - matching the design
  const revenueExpensesData = [
    { month: "Jan", revenue: 850000, expenses: 140000 },
    { month: "Feb", revenue: 910000, expenses: 150000 },
    { month: "Mar", revenue: 970000, expenses: 120000 },
    { month: "Apr", revenue: 1040000, expenses: 170000 },
    { month: "May", revenue: 1090000, expenses: 130000 },
    { month: "Jun", revenue: 1140000, expenses: 140000 },
    { month: "Jul", revenue: 1200000, expenses: 150000 },
    { month: "Aug", revenue: 1180000, expenses: 170000 },
    { month: "Sep", revenue: 1230000, expenses: 140000 },
    { month: "Oct", revenue: 1190000, expenses: 150000 },
    { month: "Nov", revenue: 1270000, expenses: 140000 },
    { month: "Dec", revenue: 1330000, expenses: 160000 },
  ];

  const rentCollectionData = [
    { property: "Harmony Court", collected: 450000, pending: 50000 },
    { property: "Garden View", collected: 380000, pending: 30000 },
    { property: "Palm Estate", collected: 320000, pending: 40000 },
    { property: "Ocean View", collected: 280000, pending: 20000 },
  ];

  const occupancyData = {
    occupied: 42,
    vacant: 8,
  };

  const maintenanceCostsData = [
    { category: "Plumbing", cost: 26000 },
    { category: "Electrical", cost: 20000 },
    { category: "HVAC", cost: 22000 },
    { category: "Painting", cost: 12000 },
    { category: "Other", cost: 5000 },
  ];

  const availableReports = [
    {
      id: "rent-collection",
      title: "Rent Collection Summary",
      description:
        "Overview of rent collected, pending, and overdue for a selected period.",
      lastGenerated: "06 Dec 2025",
      icon: DollarSign,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      id: "overdue",
      title: "Overdue Report (Ageing)",
      description:
        "Detailed breakdown of overdue payments by tenant and property.",
      lastGenerated: "05 Dec 2025",
      icon: TrendingUp,
      iconColor: "bg-red-100 text-red-600",
    },
    {
      id: "occupancy",
      title: "Occupancy Report",
      description: "Current occupancy rates across all properties and units.",
      lastGenerated: "01 Dec 2025",
      icon: Home,
      iconColor: "bg-green-100 text-green-600",
    },
    {
      id: "maintenance",
      title: "Maintenance Cost Report",
      description: "Summary of maintenance expenses by property and category.",
      lastGenerated: "30 Nov 2025",
      icon: Wrench,
      iconColor: "bg-yellow-100 text-yellow-600",
    },
    {
      id: "revenue",
      title: "Revenue Trends",
      description: "Month-over-month revenue analysis and projections.",
      lastGenerated: "01 Dec 2025",
      icon: BarChart3,
      iconColor: "bg-purple-100 text-purple-600",
    },
  ];

  const recentExports = [
    {
      fileName: "Rent Collection - November 2025.pdf",
      date: "05 Dec 2025",
      size: "245 KB",
    },
    {
      fileName: "Occupancy Report - Q4 2025.xlsx",
      date: "01 Dec 2025",
      size: "128 KB",
    },
    {
      fileName: "Maintenance Costs - October 2025.csv",
      date: "01 Nov 2025",
      size: "87 KB",
    },
  ];

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const maxRevenue = 1_400_000; // fixed scale to match design
  const maxMaintenance = Math.max(...maintenanceCostsData.map((d) => d.cost));

  const formatNumber = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <>
      <Head>
        <title>Reports & Analytics | DWELLA NG</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate and download property management reports.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 flex-1 min-w-0 truncate">
                Total Revenue (Dec)
              </p>
              <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words leading-tight">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-green-600">
              +12% from last month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 flex-1 min-w-0 truncate">
                Avg Occupancy Rate
              </p>
              <Home
                className="h-4 w-4 flex-shrink-0"
                style={{ color: "#228CC6" }}
              />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words leading-tight">
              {avgOccupancyRate}%
            </p>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Across all properties
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 flex-1 min-w-0 truncate">
                Maintenance Costs
              </p>
              <Wrench
                className="h-4 w-4 flex-shrink-0"
                style={{ color: "#D08700" }}
              />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words leading-tight">
              {formatCurrency(maintenanceCost)}
            </p>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              This month
            </p>
          </motion.div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue vs Expenses Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Revenue vs Expenses Trend
            </h3>
            <div className="h-80 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-sm text-gray-600 pr-3 text-right">
                {[1_400_000, 1_050_000, 700_000, 350_000, 0].map((tick) => (
                  <span key={tick}>{formatNumber(tick)}</span>
                ))}
              </div>
              {/* Chart area */}
              <div className="ml-16 h-full relative">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 400 100"
                  preserveAspectRatio="none"
                >
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="400"
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth="0.6"
                      strokeDasharray="2 4"
                    />
                  ))}
                  {/* Vertical grid lines */}
                  {revenueExpensesData.map((_, i) => (
                    <line
                      key={`vx-${i}`}
                      x1={(i / (revenueExpensesData.length - 1)) * 400}
                      y1="0"
                      x2={(i / (revenueExpensesData.length - 1)) * 400}
                      y2="100"
                      stroke="#E5E7EB"
                      strokeWidth="0.6"
                      strokeDasharray="2 4"
                    />
                  ))}
                  {/* Revenue line */}
                  <polyline
                    points={revenueExpensesData
                      .map(
                        (d, i) =>
                          `${(i / (revenueExpensesData.length - 1)) * 400},${
                            100 - (d.revenue / maxRevenue) * 100
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                  />
                  {/* Revenue points (open circles) */}
                  {revenueExpensesData.map((d, i) => (
                    <circle
                      key={`revenue-${i}`}
                      cx={(i / (revenueExpensesData.length - 1)) * 400}
                      cy={100 - (d.revenue / maxRevenue) * 100}
                      r="2"
                      fill="white"
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                    />
                  ))}
                  {/* Expenses line */}
                  <polyline
                    points={revenueExpensesData
                      .map(
                        (d, i) =>
                          `${(i / (revenueExpensesData.length - 1)) * 400},${
                            100 - (d.expenses / maxRevenue) * 100
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                  />
                  {/* Expenses points (open circles) */}
                  {revenueExpensesData.map((d, i) => (
                    <circle
                      key={`expenses-${i}`}
                      cx={(i / (revenueExpensesData.length - 1)) * 400}
                      cy={100 - (d.expenses / maxRevenue) * 100}
                      r="2"
                      fill="white"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
                {/* X-axis labels - show every month */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-sm text-gray-600 mt-3">
                  {revenueExpensesData.map((d, i) => (
                    <span key={i}>{d.month}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white"></div>
                <span className="text-sm text-gray-700">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-white"></div>
                <span className="text-sm text-gray-700">Expenses</span>
              </div>
            </div>
          </motion.div>

          {/* Rent Collection by Property */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Rent Collection by Property
            </h3>
            <div className="h-72 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-sm text-gray-600 pr-3 text-right">
                <span>600000</span>
                <span>450000</span>
                <span>300000</span>
                <span>150000</span>
                <span>0</span>
              </div>
              {/* Chart area */}
              <div className="ml-16 h-full relative pb-8">
                <div className="h-full w-full relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="border-t border-gray-200 border-dashed"
                      ></div>
                    ))}
                  </div>
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end justify-around gap-4 px-4">
                    {rentCollectionData.map((item, index) => {
                      const collectedHeight = (item.collected / 600000) * 100;
                      const pendingHeight = (item.pending / 600000) * 100;
                      return (
                        <div
                          key={index}
                          className="flex-1 flex items-end justify-center gap-1 h-full max-w-[100px]"
                        >
                          {/* Collected bar (blue, left) */}
                          <div
                            className="flex-1 bg-blue-500 rounded"
                            style={{
                              height: `${collectedHeight}%`,
                            }}
                          ></div>
                          {/* Pending bar (orange, right) */}
                          <div
                            className="flex-1 bg-orange-500 rounded"
                            style={{
                              height: `${pendingHeight}%`,
                            }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-around text-xs text-gray-600 px-4">
                  {rentCollectionData.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 text-center max-w-[80px]"
                    >
                      {item.property}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-700">Collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Unit Occupancy Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Unit Occupancy Overview
            </h3>
            <div className="flex items-center justify-center h-64 relative px-8">
              {/* Left label */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-700">
                Occupied: {occupancyData.occupied} units
              </div>

              {/* Pie chart */}
              <div className="relative w-56 h-56">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {(() => {
                    const total = occupancyData.occupied + occupancyData.vacant;
                    const occupiedPercentage = occupancyData.occupied / total;

                    // Calculate the angle in radians (starting from top, going clockwise)
                    const angle = occupiedPercentage * 2 * Math.PI;

                    // Calculate end point (start from top: 100, 0)
                    // For clockwise: x = cx + r * sin(angle), y = cy - r * cos(angle)
                    const endX = 100 + 100 * Math.sin(angle);
                    const endY = 100 - 100 * Math.cos(angle);

                    // Use large arc flag if percentage > 50%
                    const largeArcFlag = occupiedPercentage > 0.5 ? 1 : 0;

                    return (
                      <>
                        {/* Occupied slice (blue) */}
                        <path
                          d={`M 100 100 L 100 0 A 100 100 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                          fill="#3B82F6"
                        />
                        {/* Vacant slice (gray) */}
                        <path
                          d={`M 100 100 L ${endX} ${endY} A 100 100 0 ${1 - largeArcFlag} 1 100 0 Z`}
                          fill="#D1D5DB"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Right label */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600">
                Vacant: {occupancyData.vacant} units
              </div>
            </div>
          </motion.div>

          {/* Maintenance Costs by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Maintenance Costs by Category
            </h3>
            <div className="h-64 relative">
              {/* Y-axis labels (categories) */}
              <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-around text-sm text-gray-600 pr-3">
                {maintenanceCostsData.map((item, index) => (
                  <span key={index}>{item.category}</span>
                ))}
              </div>
              {/* Chart area */}
              <div className="ml-20 h-full relative">
                <div className="h-full w-full flex flex-col justify-around">
                  {maintenanceCostsData.map((item, index) => (
                    <div key={index} className="h-8 relative">
                      <div
                        className="h-full bg-orange-500 rounded"
                        style={{
                          width: `${(item.cost / maxMaintenance) * 100}%`,
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* X-axis labels */}
              <div className="ml-20 mt-2 flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>6500</span>
                <span>13000</span>
                <span>19500</span>
                <span>26000</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Available Reports Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Reports
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${report.iconColor} flex-shrink-0`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {report.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Last generated: {report.lastGenerated}
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Custom Report Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Custom Report Builder
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option>Rent Collection</option>
                <option>Occupancy Report</option>
                <option>Maintenance Costs</option>
                <option>Revenue Trends</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>Last 12 Months</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option>All Properties</option>
                {mockProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Export Format
              </label>
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-main/90"
            >
              <FileDown className="h-4 w-4" />
              Generate Custom Report
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Exports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Exports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExports.map((exportItem, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 + index * 0.1 }}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exportItem.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {exportItem.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {exportItem.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>
    </>
  );
};

ReportsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default ReportsPage;
