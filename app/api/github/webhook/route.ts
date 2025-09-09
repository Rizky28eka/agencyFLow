
import { NextResponse } from 'next/server';
import { matchEventToTask } from '@/services/gitService';

export async function POST(request: Request) {
  const githubEvent = request.headers.get('X-GitHub-Event');
  const payload = await request.json();

  if (!githubEvent) {
    return NextResponse.json({ error: 'X-GitHub-Event header missing' }, { status: 400 });
  }

  console.log(`Received GitHub event: ${githubEvent}`);

  switch (githubEvent) {
    case 'push':
      const { head_commit, repository } = payload;
      if (head_commit && repository) {
        const repo = { owner: repository.owner.name, repo: repository.name };
        await matchEventToTask(repo, head_commit.id);
        console.log(`Push event on ${repo.owner}/${repo.repo}, commit: ${head_commit.id}`);
      }
      break;
    case 'pull_request':
      const { action, pull_request } = payload;
      if (pull_request && pull_request.head.repo) {
        const repo = { owner: pull_request.head.repo.owner.login, repo: pull_request.head.repo.name };
        console.log(`Pull request ${action} on ${repo.owner}/${repo.repo}, PR #${pull_request.number}`);
        // You might want to match PRs to tasks here as well
      }
      break;
    // Add more event types as needed (e.g., 'issues', 'issue_comment')
    default:
      console.log(`Unhandled GitHub event type: ${githubEvent}`);
  }

  return new Response(null, { status: 200 });
}
