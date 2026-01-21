import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Task, TaskFrequency, TaskStatus, TaskWithCompletions } from "../types/task";

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export const useTasks = (userId: string | undefined) => {
  const [tasks, setTasks] = useState<TaskWithCompletions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const tasksRef = collection(db, "users", userId, "tasks");
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const baseTasks: TaskWithCompletions[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          title: data.title,
          description: data.description,
          frequency: data.frequency,
          createdAt: data.createdAt,
          active: data.active ?? true,
          completions: data.completions || {},
        };
      });
      setTasks(baseTasks);
      setLoading(false);
      setError(null);
    }, (err) => {
      setLoading(false);
      setError(err?.message || "Failed to load tasks.");
    });

    return () => {
      unsubTasks();
    };
  }, [userId]);

  const addTask = async (payload: {
    title: string;
    description?: string;
    frequency: TaskFrequency;
  }) => {
    if (!userId) return;
    const tasksRef = collection(db, "users", userId, "tasks");
    const nowIso = new Date().toISOString();
    try {
      setError(null);
      await addDoc(tasksRef, {
        ...payload,
        createdAt: nowIso,
        active: true,
        completions: {},
      });
    } catch (err: any) {
      setError(err?.message || "Failed to add task.");
      throw err;
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "frequency" | "active">>
  ) => {
    if (!userId) return;
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    try {
      setError(null);
      await updateDoc(taskRef, updates as any);
    } catch (err: any) {
      setError(err?.message || "Failed to update task.");
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    try {
      setError(null);
      await deleteDoc(taskRef);
    } catch (err: any) {
      setError(err?.message || "Failed to delete task.");
      throw err;
    }
  };

  const cycleTodayStatus = async (task: TaskWithCompletions) => {
    if (!userId) return;
    const dateKey = todayKey();
    const current = task.completions?.[dateKey] as TaskStatus | undefined;

    // Editable ONLY for today: cycle through completed -> missed -> clear -> completed...
    const next: TaskStatus | null =
      current === "completed" ? "missed" : current === "missed" ? null : "completed";

    const taskRef = doc(db, "users", userId, "tasks", task.id);
    try {
      setError(null);
      if (next === null) {
        // clear today's completion so it can be re-set today
        await updateDoc(taskRef, {
          [`completions.${dateKey}`]: null,
        });
      } else {
        await updateDoc(taskRef, {
          [`completions.${dateKey}`]: next,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update task status.");
      throw err;
    }
  };

  const computed = useMemo(() => {
    const dateRange = (days: number) => {
      const dates: string[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }
      return dates;
    };

    const last7Days = dateRange(7);
    const last30Days = dateRange(30);

    const buildStats = (range: string[]) => {
      let total = 0;
      let completed = 0;
      let missed = 0;

      range.forEach((date) => {
        tasks.forEach((task) => {
          if (!task.active) return;
          const createdDate = task.createdAt.slice(0, 10);
          if (date < createdDate) return;
          const status = task.completions?.[date];
          if (status === "completed") {
            completed += 1;
            total += 1;
          } else if (status === "missed") {
            missed += 1;
            total += 1;
          } else {
            // treat missing status as missed for historical days
            if (date !== todayKey()) {
              missed += 1;
              total += 1;
            }
          }
        });
      });

      const productivity = total ? Math.round((completed / total) * 100) : 0;
      return { total, completed, missed, productivity };
    };

    const weeklyStats = buildStats(last7Days);
    const monthlyStats = buildStats(last30Days);

    const streakInfo = (() => {
      let streak = 0;
      const today = todayKey();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);

      const isSuccessfulDay = (date: string) => {
        let dayCompleted = 0;
        let dayMissed = 0;
        tasks.forEach((task) => {
          if (!task.active) return;
          const createdDate = task.createdAt.slice(0, 10);
          if (date < createdDate) return;
          const status = task.completions?.[date];
          if (status === "completed") {
            dayCompleted += 1;
          } else if (status === "missed") {
            dayMissed += 1;
          } else if (date !== todayKey()) {
            dayMissed += 1;
          }
        });
        return dayCompleted > 0 && dayMissed === 0;
      };

      const range = dateRange(30).reverse();
      for (const date of range) {
        if (isSuccessfulDay(date)) {
          streak += 1;
        } else if (date === today || date === yesterdayKey) {
          continue;
        } else {
          break;
        }
      }
      return { streak };
    })();

    const weeklyChartData = last7Days.map((date) => {
      let completeCount = 0;
      let missedCount = 0;
      tasks.forEach((task) => {
        if (!task.active) return;
        const createdDate = task.createdAt.slice(0, 10);
        if (date < createdDate) return;
        const status = task.completions?.[date];
        if (status === "completed") {
          completeCount += 1;
        } else if (status === "missed") {
          missedCount += 1;
        } else if (date !== todayKey()) {
          missedCount += 1;
        }
      });
      return {
        date: date.slice(5),
        completed: completeCount,
        missed: missedCount,
      };
    });

    return {
      weeklyStats,
      monthlyStats,
      weeklyChartData,
      streak: streakInfo.streak,
    };
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    cycleTodayStatus,
    stats: computed,
  };
};


