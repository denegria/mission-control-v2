import type { LinkedGithubObject, Project, Settings } from "@/domain/schema";
import { asGithubLinkType } from "@/domain/schema";

export type GithubRepoContext = {
  repo?: string;
  defaultBaseBranch?: string;
};

export type GithubIntegrationStatus = GithubRepoContext & {
  enableLinking: boolean;
  canWrite: boolean;
  writeBlockedReason?: string;
  authSource: "env" | "none";
};

export type GithubCreateIssueInput = {
  repo: string;
  title: string;
  body?: string;
};

export type GithubCreateIssueResult =
  | {
      ok: true;
      issue: LinkedGithubObject;
    }
  | {
      ok: false;
      error: string;
    };

function parseRepo(repo: string) {
  const [owner, name, ...rest] = repo.trim().split("/");
  if (!owner || !name || rest.length > 0) {
    return null;
  }
  return { owner, name };
}

export function resolveGithubRepoContext(project: Project | null, settings: Settings | null): GithubRepoContext {
  return {
    repo: project?.githubRepo ?? settings?.githubDefaults.defaultRepo,
    defaultBaseBranch: project?.githubDefaultBaseBranch ?? settings?.githubDefaults.defaultBaseBranch,
  };
}

export function getGithubIntegrationStatus(project: Project | null, settings: Settings | null): GithubIntegrationStatus {
  const context = resolveGithubRepoContext(project, settings);
  const hasToken = Boolean(process.env.GITHUB_TOKEN);

  if (!settings?.githubDefaults.enableLinking) {
    return {
      ...context,
      enableLinking: false,
      canWrite: false,
      writeBlockedReason: "GitHub linking is disabled in settings.",
      authSource: hasToken ? "env" : "none",
    };
  }

  if (!hasToken) {
    return {
      ...context,
      enableLinking: true,
      canWrite: false,
      writeBlockedReason: "No clean GitHub auth path is configured.",
      authSource: "none",
    };
  }

  if (!context.repo) {
    return {
      ...context,
      enableLinking: true,
      canWrite: false,
      writeBlockedReason: "No default GitHub repo is configured.",
      authSource: "env",
    };
  }

  return {
    ...context,
    enableLinking: true,
    canWrite: true,
    authSource: "env",
  };
}

export function normalizeGithubLink(input: {
  type: string;
  ref: string;
  title?: string;
  repo?: string;
  state?: string;
  url?: string;
}): LinkedGithubObject {
  return {
    type: asGithubLinkType(input.type),
    ref: input.ref.trim(),
    title: input.title?.trim() || undefined,
    repo: input.repo?.trim() || undefined,
    state: input.state?.trim() || undefined,
    url: input.url?.trim() || undefined,
  };
}

export function createGithubService() {
  return {
    getIntegrationStatus: getGithubIntegrationStatus,
    resolveRepoContext: resolveGithubRepoContext,
    normalizeLink: normalizeGithubLink,
    async createIssue(input: GithubCreateIssueInput): Promise<GithubCreateIssueResult> {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return {
          ok: false,
          error: "No clean GitHub auth path is configured.",
        };
      }

      const repo = parseRepo(input.repo);
      if (!repo) {
        return {
          ok: false,
          error: "GitHub repo must be configured as owner/name.",
        };
      }

      let response: Response;
      try {
        response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues`, {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "mission-control-v2",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            title: input.title.trim(),
            body: input.body?.trim() || undefined,
          }),
          cache: "no-store",
        });
      } catch {
        return {
          ok: false,
          error: "GitHub issue creation failed before GitHub responded.",
        };
      }

      const payload = (await response.json().catch(() => null)) as
        | {
            number?: number;
            title?: string;
            html_url?: string;
            state?: string;
            message?: string;
            errors?: Array<{ message?: string }>;
          }
        | null;

      if (!response.ok) {
        const details = payload?.errors?.map((item) => item.message).filter(Boolean).join("; ");
        return {
          ok: false,
          error: details || payload?.message || `GitHub issue creation failed with status ${response.status}.`,
        };
      }

      if (typeof payload?.number !== "number") {
        return {
          ok: false,
          error: "GitHub issue creation returned an incomplete response.",
        };
      }

      return {
        ok: true,
        issue: normalizeGithubLink({
          type: "issue",
          ref: `#${payload.number}`,
          title: payload.title,
          repo: input.repo,
          state: payload.state,
          url: payload.html_url,
        }),
      };
    },
    createOrUpdatePullRequest() {
      return {
        implemented: false,
        reason: "Live GitHub writes are deferred until auth/config are clean.",
      };
    },
  };
}
