export type NavTab = {
  key: string;
  label: string;
  href: string;
  count?: number;
};

export const navTabs: NavTab[] = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "inbox", label: "Inbox", href: "/inbox", count: 3 },
  { key: "tasks", label: "Tasks", href: "/tasks", count: 18 },
  { key: "calendar", label: "Calendar", href: "/calendar" },
  { key: "projects", label: "Projects", href: "/projects", count: 6 },
  { key: "memory", label: "Memory", href: "/memory" },
  { key: "routines", label: "Routines", href: "/routines" },
  { key: "team", label: "Team", href: "/team", count: 7 },
  { key: "settings", label: "Settings", href: "/settings" },
];
