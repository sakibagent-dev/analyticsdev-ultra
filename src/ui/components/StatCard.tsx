import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  variant?: "emerald" | "blue" | "rose" | "amber" | "slate";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "slate",
}) => {
  const getColors = () => {
    switch (variant) {
      case "rose":
        return {
          icon: "text-rose-600 bg-rose-50 border-rose-100",
          val: "text-rose-700",
        };
      case "amber":
        return {
          icon: "text-amber-600 bg-amber-50 border-amber-100",
          val: "text-amber-700",
        };
      case "blue":
        return {
          icon: "text-blue-600 bg-blue-50 border-blue-100",
          val: "text-blue-700",
        };
      case "emerald":
        return {
          icon: "text-emerald-600 bg-emerald-50 border-emerald-100",
          val: "text-emerald-700",
        };
      default:
        return {
          icon: "text-slate-600 bg-slate-50 border-slate-100",
          val: "text-slate-800",
        };
    }
  };

  const colors = getColors();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className={`text-2xl font-bold mt-1.5 ${colors.val}`}>{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-2.5 rounded-lg border ${colors.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
