import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DashboardWidgetVisibility {
  kpi: boolean;
  fleet: boolean;
  flood: boolean;
  water: boolean;
  power: boolean;
  temphum: boolean;
  weather: boolean;
}

const defaultVisibility: DashboardWidgetVisibility = {
  kpi: true,
  fleet: true,
  flood: true,
  water: true,
  power: true,
  temphum: true,
  weather: true,
};

interface DashboardWidgetsState {
  visibility: DashboardWidgetVisibility;
  setVisible: (key: keyof DashboardWidgetVisibility, value: boolean) => void;
}

export const useDashboardWidgetsStore = create<DashboardWidgetsState>()(
  persist(
    (set) => ({
      visibility: defaultVisibility,
      setVisible: (key, value) =>
        set((state) => ({ visibility: { ...state.visibility, [key]: value } })),
    }),
    { name: "dashboard-widgets-visibility" }
  )
);
