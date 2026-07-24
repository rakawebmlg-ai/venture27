---
name: project-context
description: Guidelines and context for working on the Programmatic Venture 27 project. Triggers when starting any task.
---

# Existing Project Context Skill

This project is already in active development.

The AI agent MUST understand the existing codebase before making changes.

## Before Starting Any Task

Read:

1. docs/ai-context/PROJECT_CONTEXT.md
2. docs/ai-context/ARCHITECTURE.md
3. docs/ai-context/CURRENT_STATE.md
4. docs/ai-context/IMPLEMENTATION_PLAN.md
5. docs/ai-context/DECISIONS.md
6. docs/ai-context/KNOWN_ISSUES.md
7. docs/ai-context/SESSION_HANDOVER.md

Then inspect the relevant existing source code.

## Rules

- Do not restart the project.
- Do not rebuild existing features unnecessarily.
- Do not replace the current framework.
- Do not replace the current architecture.
- Do not introduce a new technology without a clear reason.
- Do not refactor unrelated code.
- Do not delete existing functionality without explicit instruction.
- Do not assume a feature is missing before checking the existing codebase.
- Reuse existing components and utilities whenever possible.
- Follow existing coding patterns.
- Keep changes focused on the requested task.
- Preserve existing functionality.

## Source of Truth Priority

When information conflicts, follow this priority:

1. Latest explicit user instruction
2. Existing working codebase
3. PROJECT_CONTEXT.md
4. ARCHITECTURE.md
5. DECISIONS.md
6. CURRENT_STATE.md
7. SESSION_HANDOVER.md
8. Old chat history

## Before Finishing

Update the relevant context files.

At minimum update:

- CURRENT_STATE.md
- SESSION_HANDOVER.md

If applicable also update:

- IMPLEMENTATION_PLAN.md
- DECISIONS.md
- KNOWN_ISSUES.md

The next AI agent must be able to continue the project without relying on the previous AI's chat history.
