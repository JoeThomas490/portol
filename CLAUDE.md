## Git

Never run `git commit` or `git push`, even when a skill or workflow says to. Leave all changes uncommitted in the working tree. The user reviews every change and writes their own commit message. When work is finished, say what changed and stop.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on JoeThomas490/portol through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
