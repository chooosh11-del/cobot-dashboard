"use client";

import { useState } from "react";

type DailyReport = {
  id: number;
  date: string;
  experimenter: string;
  location: string;
  robot_system: string;
  goal: string;
  environmental_notes?: string;
  overall_success_rate: number;
  grasp_success_rate?: number | null;
  failed_modules?: string;
  report_file_url?: string;
  bottleneck_summary?: string;
};

type TaskTrial = {
  id: number;
  report_id?: number;
  trial_number: number;
  task_name: string;
  success: boolean;
  failed_module?: string;
  observation?: string;
};

type ModuleRating = {
  id: number;
  report_id?: number;
  module_name: string;
  rating: number;
  detailed_observation?: string;
};

const MAIN_BLUE = "#3b82c4";
const LIGHT_BLUE = "#d9eaf7";

export default function CobotDashboard({
  dailyReports,
  moduleRatings,
  taskTrials,
}: {
  dailyReports: DailyReport[];
  moduleRatings: ModuleRating[];
  taskTrials: TaskTrial[];
}) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "reports">(
    "dashboard"
  );

  const [selectedReportId, setSelectedReportId] = useState<number | null>(
    dailyReports[0]?.id ?? null
  );

  const selectedReport =
    dailyReports.find((report) => report.id === selectedReportId) ?? null;

  const reportTrials = selectedReport
    ? taskTrials.filter((trial) => trial.report_id === selectedReport.id)
    : [];

  const reportRatings = selectedReport
    ? moduleRatings.filter((rating) => rating.report_id === selectedReport.id)
    : [];

  const totalTasks = reportTrials.length;
  const successTasks = reportTrials.filter((task) => task.success).length;

  const successRate =
    totalTasks > 0 ? Math.round((successTasks / totalTasks) * 1000) / 10 : 0;

  const allTotalTasks = taskTrials.length;
  const allSuccessTasks = taskTrials.filter((task) => task.success).length;
  const allFailedTasks = allTotalTasks - allSuccessTasks;

  const allSuccessRate =
    allTotalTasks > 0
      ? Math.round((allSuccessTasks / allTotalTasks) * 1000) / 10
      : 0;

  const validGraspReports = dailyReports.filter(
    (report) =>
      report.grasp_success_rate !== null &&
      report.grasp_success_rate !== undefined &&
      !Number.isNaN(Number(report.grasp_success_rate))
  );

  const graspSuccessRate =
    validGraspReports.length > 0
      ? Math.round(
          (validGraspReports.reduce(
            (sum, report) => sum + Number(report.grasp_success_rate),
            0
          ) /
            validGraspReports.length) *
            10
        ) / 10
      : 0;

  const failedModuleCounts = taskTrials
    .filter((trial) => !trial.success && trial.failed_module)
    .reduce<Record<string, number>>((acc, trial) => {
      const key = trial.failed_module ?? "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  const majorBottlenecks = Object.entries(failedModuleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const averageModuleRatings = [
    "Sensing",
    "Perception",
    "Planning",
    "Control",
  ].map((moduleName) => {
    const ratings = moduleRatings.filter(
      (rating) =>
        rating.module_name.toLowerCase() === moduleName.toLowerCase()
    );

    const average =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) /
          ratings.length
        : 0;

    return {
      module_name: moduleName,
      rating: Math.round(average * 10) / 10,
    };
  });

  return (
    <main className="min-h-screen bg-[#f4f8fb] text-black">
      <nav className="flex items-center justify-between border-b border-slate-200 bg-[#eaf5fc] px-8 py-3 shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="text-2xl text-blue-500">⚙️</span>
          COBOT STATS
        </h1>

        <div className="flex gap-10 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={
              activeTab === "dashboard"
                ? "border-b-4 border-[#3b82c4] pb-2 text-black"
                : "pb-2 text-black hover:text-[#3b82c4]"
            }
          >
            DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={
              activeTab === "reports"
                ? "border-b-4 border-[#3b82c4] pb-2 text-black"
                : "pb-2 text-black hover:text-[#3b82c4]"
            }
          >
            REPORTS
          </button>
        </div>
      </nav>

      {activeTab === "dashboard" && (
        <section className="p-8">
          <h2 className="mb-6 text-3xl font-extrabold">
            COBOT STATS DASHBOARD
          </h2>

          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
            <Card title="TODAY'S TASK SUCCESS RATE">
              <GaugeChart
                value={allSuccessRate}
                subtitle="Overall success rate"
              />
            </Card>

            <Card title="CURRENT GRASP SUCCESS RATE">
              <GaugeChart
                value={graspSuccessRate}
                subtitle="Grasp performance"
              />
            </Card>

            <Card title="TOTAL TASKS TODAY">
              <div className="flex w-full items-center justify-around text-center">
                <Stat label="Total" value={allTotalTasks} />
                <Stat
                  label="Succeed"
                  value={allSuccessTasks}
                  color="text-green-600"
                />
                <Stat
                  label="Failed"
                  value={allFailedTasks}
                  color="text-red-600"
                />
              </div>
            </Card>

            <Card title="MAJOR BOTTLENECKS">
              <div className="flex w-full flex-col items-start justify-center space-y-2 text-sm font-medium">
                {majorBottlenecks.length > 0 ? (
                  majorBottlenecks.map(([module, count]) => (
                    <p key={module}>
                      • {module} ({count})
                    </p>
                  ))
                ) : (
                  <p>No major bottlenecks</p>
                )}
              </div>
            </Card>
          </div>

          <h2 className="mb-4 text-2xl font-extrabold">
            EXPERIMENTAL PERFORMANCE OVER TIME
          </h2>

          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card title="TASK SUCCESS RATE TREND">
              <LineChart reports={dailyReports} />
            </Card>

            <Card title="AVERAGE MODULE RATINGS (1-5)">
              <div className="w-full space-y-4">
                {averageModuleRatings.map((module) => (
                  <div key={module.module_name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-extrabold uppercase">
                        {module.module_name}
                      </span>
                      <span className="font-bold">{module.rating}</span>
                    </div>

                    <div className="h-5 rounded bg-[#e5e9ef]">
                      <div
                        className="h-5 rounded shadow-sm"
                        style={{
                          width: `${(module.rating / 5) * 100}%`,
                          backgroundColor: MAIN_BLUE,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <h2 className="mb-4 text-2xl font-extrabold">
            RECENT COBOT EXPERIMENT REPORTS
          </h2>

          <ReportTable reports={dailyReports} trials={taskTrials} />
        </section>
      )}

      {activeTab === "reports" && (
        <section className="p-8">
          <h2 className="mb-6 text-3xl font-extrabold">
            COBOT EXPERIMENT REPORT
          </h2>

          {selectedReport ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
              <div className="mb-4 flex justify-end text-sm">
                <label className="mr-2 font-bold">Date:</label>

                <input
                  type="date"
                  value={selectedReport.date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;

                    const matchedReport = dailyReports.find(
                      (report) => report.date === selectedDate
                    );

                    if (matchedReport) {
                      setSelectedReportId(matchedReport.id);
                    } else {
                      setSelectedReportId(null);
                    }
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-1"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-5">
                <ReportInfo
                  title="EXPERIMENTER"
                  value={selectedReport.experimenter}
                />
                <ReportInfo title="LOCATION" value={selectedReport.location} />
                <ReportInfo
                  title="ROBOT SYSTEM"
                  value={selectedReport.robot_system}
                />
                <ReportInfo title="TOTAL TASKS" value={`${totalTasks}`} />
                <ReportInfo
                  title="OVERALL SUCCESS RATE"
                  value={`${successRate}%`}
                />
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <ReportBox title="EXPERIMENT GOAL" text={selectedReport.goal} />
                <ReportBox
                  title="ENVIRONMENTAL NOTES"
                  text={selectedReport.environmental_notes ?? "-"}
                />
              </div>

              <h3 className="mb-3 text-lg font-extrabold">
                TASK PERFORMANCE RESULTS
              </h3>

              <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#eaf5fc]">
                    <tr>
                      <th className="border border-slate-200 p-3">TRIAL #</th>
                      <th className="border border-slate-200 p-3">TASK</th>
                      <th className="border border-slate-200 p-3">RESULT</th>
                      <th className="border border-slate-200 p-3">
                        FAILED MODULE
                      </th>
                      <th className="border border-slate-200 p-3">
                        OBSERVATION
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportTrials.map((trial) => (
                      <tr key={trial.id} className="bg-white align-top">
                        <td className="border border-slate-200 p-3">
                          {trial.trial_number}
                        </td>
                        <td className="border border-slate-200 p-3">
                          {trial.task_name}
                        </td>
                        <td
                          className={`border border-slate-200 p-3 font-extrabold ${
                            trial.success ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {trial.success ? "Success" : "Failure"}
                        </td>
                        <td className="border border-slate-200 p-3">
                          {trial.failed_module ?? "-"}
                        </td>
                        <td className="border border-slate-200 p-3">
                          {trial.observation ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mb-3 text-lg font-extrabold">
                MODULE PERFORMANCE EVALUATION
              </h3>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#eaf5fc]">
                    <tr>
                      <th className="border border-slate-200 p-3">MODULE</th>
                      <th className="border border-slate-200 p-3">RATING</th>
                      <th className="border border-slate-200 p-3">
                        DETAILED OBSERVATION
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportRatings.map((module) => (
                      <tr key={module.id} className="bg-white align-top">
                        <td className="border border-slate-200 p-3">
                          {module.module_name}
                        </td>
                        <td className="border border-slate-200 p-3">
                          {module.rating}
                        </td>
                        <td className="border border-slate-200 p-3">
                          {module.detailed_observation ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-lg font-extrabold">
                  RECURRING FAILURE PATTERNS
                </h3>

                <div className="min-h-[180px] rounded-lg border border-slate-200 bg-[#f4f8fb] p-4 text-sm leading-6">
                  {selectedReport.bottleneck_summary ? (
                    <p>{selectedReport.bottleneck_summary}</p>
                  ) : (
                    <p>No recurring failure pattern was detected.</p>
                  )}
                </div>
              </div>

              {selectedReport.report_file_url && (
                <div className="mt-6 flex justify-end">
                  <a
                    href={selectedReport.report_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded px-5 py-2 text-sm font-extrabold text-white shadow hover:opacity-80"
                    style={{ backgroundColor: MAIN_BLUE }}
                  >
                    VIEW FULL REPORT (WORD)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex justify-end text-sm">
                <label className="mr-2 font-bold">Date:</label>

                <input
                  type="date"
                  onChange={(e) => {
                    const selectedDate = e.target.value;

                    const matchedReport = dailyReports.find(
                      (report) => report.date === selectedDate
                    );

                    if (matchedReport) {
                      setSelectedReportId(matchedReport.id);
                    } else {
                      setSelectedReportId(null);
                    }
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-1"
                />
              </div>

              <p>No report data found for the selected date.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[190px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
      <h3 className="mb-2 text-sm font-extrabold uppercase tracking-tight text-black">
        {title}
      </h3>

      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

function GaugeChart({
  value,
  subtitle,
}: {
  value: number;
  subtitle: string;
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const circumference = 170;
  const progress = (safeValue / 100) * circumference;

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <svg viewBox="0 0 170 105" className="h-40 w-64">
        <path
          d="M 30 78 A 55 55 0 0 1 140 78"
          fill="none"
          stroke={LIGHT_BLUE}
          strokeWidth="20"
          strokeLinecap="butt"
        />

        <path
          d="M 30 78 A 55 55 0 0 1 140 78"
          fill="none"
          stroke={MAIN_BLUE}
          strokeWidth="20"
          strokeLinecap="butt"
          strokeDasharray={`${progress} ${circumference}`}
        />

        <text
          x="85"
          y="75"
          textAnchor="middle"
          className="fill-black text-[18px] font-extrabold"
        >
          {safeValue}%
        </text>
      </svg>

      <p className="-mt-5 text-xs font-medium text-slate-700">{subtitle}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-black",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <p className={`text-4xl font-extrabold ${color}`}>{value}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function ReportInfo({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-extrabold">{title}</p>
      <p className="mt-2 text-lg font-extrabold">{value}</p>
    </div>
  );
}

function ReportBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-extrabold">{title}</p>
      <p className="whitespace-pre-line text-sm">{text}</p>
    </div>
  );
}

function ReportTable({
  reports,
  trials,
}: {
  reports: DailyReport[];
  trials: TaskTrial[];
}) {
  const [sortBy, setSortBy] = useState<"date" | "success">("date");
  const [page, setPage] = useState(1);

  const pageSize = 7;

  const sortedReports = reports.slice().sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }

    return Number(a.overall_success_rate) - Number(b.overall_success_rate);
  });

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize));

  const paginatedReports = sortedReports.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function handleSortChange(value: "date" | "success") {
    setSortBy(value);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <select
          value={sortBy}
          onChange={(e) =>
            handleSortChange(e.target.value as "date" | "success")
          }
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm"
        >
          <option value="date">By date</option>
          <option value="success">By overall success</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#eaf5fc]">
            <tr>
              <th className="border border-slate-200 p-3">DATE</th>
              <th className="border border-slate-200 p-3">EXPERIMENTER</th>
              <th className="border border-slate-200 p-3">LOCATION</th>
              <th className="border border-slate-200 p-3">ROBOT SYSTEM</th>
              <th className="border border-slate-200 p-3">GOAL</th>
              <th className="border border-slate-200 p-3">TASKS</th>
              <th className="border border-slate-200 p-3">SUCCESS %</th>
              <th className="border border-slate-200 p-3">FAILED MODULES</th>
              <th className="border border-slate-200 p-3">VIEW REPORT</th>
            </tr>
          </thead>

          <tbody>
            {paginatedReports.map((report) => {
              const reportTrials = trials.filter(
                (trial) => trial.report_id === report.id
              );

              return (
                <tr key={report.id} className="bg-white">
                  <td className="border border-slate-200 p-3">
                    {report.date}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {report.experimenter}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {report.location}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {report.robot_system}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {report.goal}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {reportTrials.length}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {Number(report.overall_success_rate)}%
                  </td>
                  <td className="border border-slate-200 p-3">
                    {getFailedModulesForReport(report.id, trials)}
                  </td>
                  <td className="border border-slate-200 p-3">
                    {report.report_file_url ? (
                      <a
                        href={report.report_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded px-4 py-2 text-xs font-extrabold text-white shadow hover:opacity-80"
                        style={{ backgroundColor: MAIN_BLUE }}
                      >
                        VIEW
                      </a>
                    ) : (
                      <span className="text-slate-400">No file</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            ‹
          </button>

          <span className="rounded bg-[#eaf5fc] px-3 py-1 font-bold">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function getFailedModulesForReport(reportId: number, trials: TaskTrial[]) {
  const modules = trials
    .filter((trial) => trial.report_id === reportId && trial.failed_module)
    .map((trial) => trial.failed_module)
    .filter(Boolean) as string[];

  const uniqueModules = Array.from(new Set(modules));

  return uniqueModules.length > 0 ? uniqueModules.join(", ") : "-";
}

function LineChart({ reports }: { reports: DailyReport[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    report: DailyReport;
  } | null>(null);

  const sortedReports = reports
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartWidth = 500;
  const chartHeight = 250;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = sortedReports.map((report, index) => {
    const x =
      sortedReports.length <= 1
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (index / (sortedReports.length - 1)) * plotWidth;

    const y =
      paddingTop +
      ((100 - Number(report.overall_success_rate)) / 100) * plotHeight;

    return { x, y, report };
  });

  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints =
    points.length > 0
      ? `${points[0].x},${chartHeight - paddingBottom} ${polylinePoints} ${
          points[points.length - 1].x
        },${chartHeight - paddingBottom}`
      : "";

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-72 w-full">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MAIN_BLUE} stopOpacity="0.28" />
          <stop offset="100%" stopColor={MAIN_BLUE} stopOpacity="0.03" />
        </linearGradient>

        <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            floodColor={MAIN_BLUE}
            floodOpacity="0.25"
          />
        </filter>
      </defs>

      {[0, 25, 50, 75, 100].map((value) => {
        const y = paddingTop + ((100 - value) / 100) * plotHeight;

        return (
          <g key={value}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            <text
              x={paddingLeft - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-slate-600 text-[10px] font-bold"
            >
              {value}
            </text>
          </g>
        );
      })}

      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={chartHeight - paddingBottom}
        stroke="#94a3b8"
        strokeWidth="1"
      />

      <line
        x1={paddingLeft}
        y1={chartHeight - paddingBottom}
        x2={chartWidth - paddingRight}
        y2={chartHeight - paddingBottom}
        stroke="#94a3b8"
        strokeWidth="1"
      />

      {points.length > 0 && (
        <polygon points={areaPoints} fill="url(#lineFill)" />
      )}

      <polyline
        fill="none"
        stroke={MAIN_BLUE}
        strokeWidth="3"
        points={polylinePoints}
        filter="url(#lineShadow)"
      />

      {points.map(({ x, y, report }) => (
        <g
          key={report.id}
          onMouseEnter={() => setHoveredPoint({ x, y, report })}
          onMouseLeave={() => setHoveredPoint(null)}
          className="cursor-pointer"
        >
          <circle
            cx={x}
            cy={y}
            r="5"
            fill="white"
            stroke={MAIN_BLUE}
            strokeWidth="2"
          />

          <circle cx={x} cy={y} r="14" fill="transparent" />

          <text
            x={x}
            y={chartHeight - 18}
            textAnchor="middle"
            className="fill-slate-600 text-[10px] font-bold"
          >
            {formatChartDate(report.date)}
          </text>
        </g>
      ))}

      {hoveredPoint && (
        <g>
          <line
            x1={hoveredPoint.x}
            y1={paddingTop}
            x2={hoveredPoint.x}
            y2={chartHeight - paddingBottom}
            stroke={MAIN_BLUE}
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          <rect
            x={Math.min(hoveredPoint.x + 10, chartWidth - 130)}
            y={Math.max(hoveredPoint.y - 55, 10)}
            width="120"
            height="48"
            rx="6"
            fill="white"
            stroke="#cbd5e1"
            filter="url(#lineShadow)"
          />

          <text
            x={Math.min(hoveredPoint.x + 20, chartWidth - 120)}
            y={Math.max(hoveredPoint.y - 35, 30)}
            className="fill-black text-[10px] font-bold"
          >
            {hoveredPoint.report.date}
          </text>

          <text
            x={Math.min(hoveredPoint.x + 20, chartWidth - 120)}
            y={Math.max(hoveredPoint.y - 18, 47)}
            className="fill-slate-700 text-[10px]"
          >
            Success: {Number(hoveredPoint.report.overall_success_rate)}%
          </text>
        </g>
      )}
    </svg>
  );
}

function formatChartDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}