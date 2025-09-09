
import { Octokit } from '@octokit/rest';
import { prisma } from '@/lib/db';

interface GitHubRepo {
  owner: string;
  repo: string;
}

export class GitService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getPullRequests(repo: GitHubRepo) {
    const { data } = await this.octokit.pulls.list({
      owner: repo.owner,
      repo: repo.repo,
      state: 'all',
    });
    return data;
  }

  async getCommits(repo: GitHubRepo, sha?: string) {
    const { data } = await this.octokit.repos.listCommits({
      owner: repo.owner,
      repo: repo.repo,
      sha,
    });
    return data;
  }

  // You can add more methods here for other GitHub API interactions
}

// Helper to extract repo info from a git URL
export function parseGitUrl(gitUrl: string): GitHubRepo | null {
  const match = gitUrl.match(/github\.com\/([\w-]+)\/([\w-]+)(?:\.git)?/i);
  if (match && match[1] && match[2]) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

// Function to match repo events to tasks by gitUrl
export async function matchEventToTask(repo: GitHubRepo, commitSha: string) {
  // In a real application, you'd search your database for tasks
  // that have a gitUrl matching this repo and potentially this commit/PR.
  // For now, this is a placeholder.
  console.log(`Matching event for repo: ${repo.owner}/${repo.repo}, commit: ${commitSha}`);

  const tasks = await prisma.task.findMany({
    where: {
      gitUrl: {
        contains: `${repo.owner}/${repo.repo}`,
      },
    },
  });

  // Further logic to find the exact task based on commitSha or PR number
  // This would likely involve more complex queries or iterating through tasks' associated PRs/commits.

  return tasks;
}
