# ADR-0008 · Workflows and checklists as data, not code

**Status:** Accepted · 2026-07-07

## Context
County permit processes differ per county and change; milestone checklists differ per construction system (masonry vs. framed, flat vs. pitched roof, borehole vs. mains); vetting gates, setup checklists, and handover flows are all "steps with gates, documents, and assignees." Hard-coding each variant makes every new county or house type an engineering project (violates R7 and the pod-based expansion model, doc 07 §3).

## Decision
A single generic mechanism: `workflow_templates` (versioned JSON step definitions: steps, dependencies, required checklist items, required document kinds, assignee roles, gate types) instantiated into `workflow_instances` + `workflow_steps` rows bound to a project (or vetting case). Milestone checklists use the same template structure. Templates are authored by ops (Head of Delivery owns the library), reviewed like code, versioned immutably — running instances keep their template version.

## Rationale
- Opening a new county = writing a template, not shipping code — the expansion cost model depends on this.
- Ops owns process improvement without engineering in the loop; playbook diffs (doc 07 §7) become template diffs with history.
- Deliberately NOT a BPMN/workflow engine: our processes are DAGs of gated checklists; a rules engine's power isn't worth its opacity in a trust-critical system.

## Consequences
- Template schema needs discipline: JSON-schema validated, migration story for evolving definitions (instances pin versions, so old projects are unaffected).
- Some genuinely dynamic behavior (e.g., auto-scheduling inspection routes) stays in code and consumes workflow state — the engine gates, code acts.
