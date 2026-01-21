import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { Layout } from "../components/Layout";
import { StreakBadge } from "../components/StreakBadge";
import { TaskFrequency, TaskWithCompletions } from "../types/task";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, loading, error, addTask, updateTask, deleteTask, cycleTodayStatus, stats } = useTasks(
    user?.uid
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("daily");
  const [focusMode, setFocusMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFrequency, setEditFrequency] = useState<TaskFrequency>("daily");

  const last7Days = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const handleDownloadUsage = () => {
    if (!tasks.length) return;

    const today = new Date();
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const lines: string[] = [];
    lines.push(`streak_days,${stats.streak}`);
    lines.push("");
    lines.push("date,task_title,frequency,status");

    dates.forEach((date) => {
      tasks.forEach((task) => {
        if (!task.active) return;
        const createdDate = task.createdAt.slice(0, 10);
        if (date < createdDate) return;
        const raw = task.completions?.[date];
        let status: string;
        const todayKey = new Date().toISOString().slice(0, 10);
        if (raw === "completed") status = "completed";
        else if (raw === "missed") status = "missed";
        else if (date === todayKey) status = "pending";
        else status = "missed";
        lines.push(
          `${date},${JSON.stringify(task.title)},${task.frequency},${status}`
        );
      });
    });

    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taskflow-usage-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await addTask({ title: title.trim(), description, frequency });
    } catch {
      // error is surfaced via useTasks().error
      return;
    }
    setTitle("");
    setDescription("");
    setFrequency("daily");
  };

  const renderTask = (task: TaskWithCompletions) => {
    const today = new Date().toISOString().slice(0, 10);
    const todayStatus = task.completions?.[today];
    const isCompleted = todayStatus === "completed";
    const isMissed = todayStatus === "missed";

    const isEditing = editingTaskId === task.id;

    const startEdit = () => {
      setEditingTaskId(task.id);
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setEditFrequency(task.frequency);
    };

    const cancelEdit = () => {
      setEditingTaskId(null);
      setEditTitle("");
      setEditDescription("");
      setEditFrequency("daily");
    };

    const saveEdit = async () => {
      await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        frequency: editFrequency,
      });
      cancelEdit();
    };

    const confirmDelete = async () => {
      const ok = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
      if (!ok) return;
      await deleteTask(task.id);
      if (editingTaskId === task.id) cancelEdit();
    };

    return (
      <motion.li
        key={task.id}
        className="task-item task-item-long"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className={
            "task-main-long" +
            (isCompleted ? " task-main-completed" : "") +
            (isMissed ? " task-main-missed" : "") +
            (!isCompleted && !isMissed ? " task-main-open" : "")
          }
        >
          <button
            type="button"
            className="task-check-button"
            onClick={() => cycleTodayStatus(task)}
            aria-label="Edit completion for today"
          >
            <span className="task-check">
              {isCompleted ? "✅" : isMissed ? "❌" : "⬜"}
            </span>
          </button>

          <div className="task-text">
            <div className="task-title-row">
              <span className="task-title">{task.title}</span>
              <span className={`task-pill pill-${task.frequency}`}>
                {task.frequency}
              </span>
            </div>
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
            <div className="task-day-strip">
              {last7Days.map((date) => {
                const status = task.completions?.[date];
                const isToday = date === today;
                const label = date.slice(5);
                const boxClass =
                  status === "completed"
                    ? "task-day task-day-completed"
                    : status === "missed"
                    ? "task-day task-day-missed"
                    : isToday
                    ? "task-day task-day-open"
                    : "task-day";

                const handleClick = () => {
                  if (!isToday) return;
                  cycleTodayStatus(task);
                };

                return (
                  <button
                    key={date}
                    type="button"
                    className={boxClass}
                    onClick={handleClick}
                  >
                    <span className="task-day-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="task-actions">
            {!isEditing ? (
              <>
                <button type="button" className="mini-button" onClick={startEdit}>
                  Edit
                </button>
                <button
                  type="button"
                  className="mini-button danger"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button type="button" className="mini-button" onClick={saveEdit}>
                  Save
                </button>
                <button
                  type="button"
                  className="mini-button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="task-edit">
            <div className="task-edit-row">
              <label className="task-edit-field">
                <span>Title</span>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>
              <label className="task-edit-field">
                <span>Frequency</span>
                <select
                  value={editFrequency}
                  onChange={(e) =>
                    setEditFrequency(e.target.value as TaskFrequency)
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>
            <label className="task-edit-field">
              <span>Description</span>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>
        )}
      </motion.li>
    );
  };

  const rightActions = (
    <button
      className={focusMode ? "secondary-button" : "primary-ghost"}
      onClick={() => setFocusMode((v) => !v)}
    >
      {focusMode ? "Exit focus mode" : "Focus mode"}
    </button>
  );

  return (
    <Layout title="Dashboard" rightActions={rightActions}>
      <div className={focusMode ? "dashboard dashboard-focus" : "dashboard"}>
        <section className="dashboard-main">
          <div className="panel">
            <h2>Your daily checklist for today</h2>
            <p className="muted">
              These long checkboxes are{" "}
              <strong>only open for completion today</strong>. Tomorrow they will
              close and count as missed if not done.
            </p>
            {error && (
              <div className="error-banner">
                <strong>Firestore error:</strong> {error}
                <div className="muted">
                  If this says “Missing or insufficient permissions”, update your
                  Firestore Rules to allow authenticated users to write to
                  <code> users/{`{uid}`}/tasks </code>.
                </div>
              </div>
            )}
            <form className="task-form" onSubmit={handleAddTask}>
              <div className="task-form-row">
                <input
                  placeholder="Add a task..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as TaskFrequency)
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <button className="primary-button" type="submit">
                  Add
                </button>
              </div>
              <textarea
                placeholder="Optional description or notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </form>

            {loading ? (
              <p>Loading tasks…</p>
            ) : tasks.length === 0 ? (
              <p className="muted">No tasks yet. Start by adding your first one.</p>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => renderTask(task))}
              </ul>
            )}
          </div>
        </section>

        {!focusMode && (
          <section className="dashboard-side">
            <div className="panel grid-2">
              <div className="stat-card">
                <h3>Weekly productivity</h3>
                <p className="stat-number">{stats.weeklyStats.productivity}%</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${stats.weeklyStats.productivity}%` }}
                  />
                </div>
                <p className="muted">
                  {stats.weeklyStats.completed} completed ·{" "}
                  {stats.weeklyStats.missed} missed
                </p>
              </div>
              <div className="stat-card">
                <h3>Monthly productivity</h3>
                <p className="stat-number">{stats.monthlyStats.productivity}%</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill alt"
                    style={{ width: `${stats.monthlyStats.productivity}%` }}
                  />
                </div>
                <p className="muted">
                  {stats.monthlyStats.completed} completed ·{" "}
                  {stats.monthlyStats.missed} missed
                </p>
              </div>
            </div>

            <div className="panel">
              <h3>Streak</h3>
              <StreakBadge days={stats.streak} />
              <button
                type="button"
                className="mini-button"
                onClick={handleDownloadUsage}
              >
                Download streak & days (CSV)
              </button>
              <p className="muted">
                Keep completing all tasks for a day without misses to extend your
                streak.
              </p>
            </div>

            <div className="panel">
              <h3>Weekly report</h3>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <h3>Smart insights</h3>
              <ul className="insights-list">
                <li>
                  <span className="dot dot-green" />
                  <span>
                    Your current weekly productivity is{" "}
                    <strong>{stats.weeklyStats.productivity}%</strong>. Aim for
                    80%+ to build strong habits.
                  </span>
                </li>
                <li>
                  <span className="dot dot-blue" />
                  <span>
                    Streak of <strong>{stats.streak} days</strong>. Even one
                    small task keeps the streak alive.
                  </span>
                </li>
                <li>
                  <span className="dot dot-amber" />
                  <span>
                    Review missed tasks in the chart to identify patterns (e.g.
                    harder tasks on specific weekdays).
                  </span>
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};


