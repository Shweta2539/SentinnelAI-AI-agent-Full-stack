import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Settings,
  ShieldAlert,
  UploadCloud,
  FileText,
} from "lucide-react";

export const ACCEPTED_LOG_EXTENSIONS = [".txt", ".csv", ".log"];
export const MAX_UPLOAD_SIZE_MB = 10;

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Logs", to: "/upload", icon: UploadCloud },
  { label: "Investigations", to: "/investigations", icon: ShieldAlert },
  { label: "Reports", to: "/reports", icon: FileText },
  { label: "Settings", to: "/settings", icon: Settings },
];
