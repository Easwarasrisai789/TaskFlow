import React, { useMemo } from "react";

type StreakTier = {
  minDays: number;
  name: string;
  subtitle: string;
  emoji: string;
};

const TIERS: StreakTier[] = [
  {
    minDays: 0,
    name: "Spark",
    subtitle: "Start your streak",
    emoji: "✨",
  },
  {
    minDays: 3,
    name: "Flame",
    subtitle: "3-day momentum",
    emoji: "🔥",
  },
  {
    minDays: 7,
    name: "Blaze",
    subtitle: "1 week strong",
    emoji: "⚡",
  },
  {
    minDays: 14,
    name: "Comet",
    subtitle: "2 weeks locked in",
    emoji: "🌠",
  },
  {
    minDays: 30,
    name: "Legend",
    subtitle: "30-day master",
    emoji: "👑",
  },
];

function pickTier(days: number): StreakTier {
  const sorted = [...TIERS].sort((a, b) => a.minDays - b.minDays);
  let current = sorted[0];
  for (const tier of sorted) {
    if (days >= tier.minDays) current = tier;
  }
  return current;
}

export const StreakBadge: React.FC<{ days: number }> = ({ days }) => {
  const tier = useMemo(() => pickTier(days), [days]);
  const nextTier = useMemo(() => {
    const sorted = [...TIERS].sort((a, b) => a.minDays - b.minDays);
    return sorted.find((t) => t.minDays > tier.minDays) || null;
  }, [tier.minDays]);

  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const span = nextTier.minDays - tier.minDays;
    const into = Math.max(0, days - tier.minDays);
    return Math.max(0, Math.min(100, Math.round((into / span) * 100)));
  }, [days, tier.minDays, nextTier]);

  // Dynamic color: short streaks = blue, long streaks = red
  const background = useMemo(() => {
    const clamped = Math.max(0, Math.min(days, 30));
    const t = clamped / 30; // 0 → 1
    const startHue = 210; // blue
    const endHue = 10; // red
    const hue = startHue + (endHue - startHue) * t;
    const hue2 = hue + 15;
    return `linear-gradient(135deg, hsl(${hue}, 85%, 52%), hsl(${hue2}, 90%, 32%))`;
  }, [days]);

  return (
    <div className="streak-badge" style={{ background }}>
      <div className="streak-badge-top">
        <div className="streak-badge-left">
          <div className="streak-badge-emoji">{tier.emoji}</div>
          <div className="streak-badge-title">{tier.name}</div>
          <div className="streak-badge-subtitle">{tier.subtitle}</div>
        </div>
        <div className="streak-badge-right">
          <div className="streak-badge-days">
            {days}
            <span className="streak-badge-days-fire">🔥</span>
          </div>
          <div className="streak-badge-days-label">days</div>
        </div>
      </div>

      <div className="streak-badge-meter">
        <div className="streak-badge-meter-bar">
          <div
            className="streak-badge-meter-fill"
            style={{ width: `${progressToNext}%` }}
          />
        </div>
        <div className="streak-badge-meter-text">
          {nextTier
            ? `Next badge: ${nextTier.name} at ${nextTier.minDays} days`
            : "Top badge reached"}
        </div>
      </div>
    </div>
  );
};


