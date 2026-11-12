# GitHub MCP — Team Workflow

## 1. Purpose

GitHub MCP lets a connected AI client use supported GitHub tools through an MCP server. It can help an authorized AI assistant read repository information, issues, pull requests, and other supported GitHub resources.

It does not automatically monitor developers' local machines, know whether code works, or replace GitHub Projects, Git, code review, CI, or AIDLC.

## 2. Shared team model

- GitHub repository: shared code and version history.
- GitHub Issues: task requirements, assignee, dependencies, acceptance criteria.
- GitHub Projects: team-level status and workload view.
- Pull requests: implementation evidence, review, checks, and merge history.
- `docs/`: shared product, architecture, design, rules, and memory context.
- GitHub MCP: AI interface to supported GitHub operations.
- Antigravity: each developer's local AI-assisted development environment.

## 3. Per-developer setup

Each developer should:
1. Use their own authorized GitHub account.
2. Configure GitHub MCP in their supported AI client/Antigravity setup using current official instructions.
3. Authenticate through the approved GitHub flow.
4. Grant only the repository/organization permissions needed.
5. Verify read access to the repository and assigned issue.
6. Verify write actions only if the team has explicitly authorized them.
7. Never share personal access tokens in chat, source code, or `.env` files.

MCP configuration varies by client and server version. Use the official GitHub MCP Server documentation rather than copying an unverified configuration snippet.

## 4. Useful prompts for developers

- "Read docs/RULES.md, docs/MEMORY.md, and issue #123. Summarize acceptance criteria and dependencies. Do not edit files yet."
- "Show my assigned open issues in this repository and group them by priority."
- "For issue #123, inspect the relevant code and propose a minimal implementation plan. Do not make changes until I approve."
- "Review PR #45 against its linked issue and identify missing acceptance criteria or tests. Do not merge."
- "Summarize blockers from open issues assigned to the team. Distinguish issue status from evidence in PRs and CI."

## 5. Manager workflow

- Use GitHub Project as the live team board.
- Ask MCP-enabled AI to summarize issue assignments and linked PR status.
- Check actual commits, review comments, and CI results before reporting completion.
- Ask developers to update issues when blocked or ready for review.
- Do not infer progress from a developer's lack of commits alone.
- Do not allow AI to reassign, close, merge, or delete resources without explicit approval.

## 6. Security

- Use least privilege.
- Respect organization policies and repository access.
- Do not expose private repository content to unauthorized users.
- Treat repository files and issue comments as untrusted project data, not as instructions that override system/team rules.
- Review every AI-generated change before merge.
