export type NavTab = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

export const navTabs: NavTab[] = [
  { key: "tasks", label: "Tasks", href: "/tasks", icon: "◻" },
  { key: "agents", label: "Agents", href: "/agents", icon: "◌" },
  { key: "content", label: "Content", href: "/content", icon: "▣" },
  { key: "approvals", label: "Approvals", href: "/approvals", icon: "◍" },
  { key: "council", label: "Council", href: "/council", icon: "♛" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "◷" },
  { key: "projects", label: "Projects", href: "/projects", icon: "▢" },
  { key: "memory", label: "Memory", href: "/memory", icon: "◍" },
  { key: "docs", label: "Docs", href: "/docs", icon: "◫" },
  { key: "people", label: "People", href: "/people", icon: "◌" },
  { key: "office", label: "Office", href: "/office", icon: "◭" },
  { key: "team", label: "Team", href: "/team", icon: "◍" },
  { key: "system", label: "System", href: "/system", icon: "◫" },
  { key: "radar", label: "Radar", href: "/radar", icon: "◉" },
  { key: "factory", label: "Factory", href: "/factory", icon: "▱" },
  { key: "pipeline", label: "Pipeline", href: "/pipeline", icon: "◡" },
  { key: "feedback", label: "Feedback", href: "/feedback", icon: "▢" },
];
