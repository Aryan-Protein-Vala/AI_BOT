from __future__ import annotations

import logging
from typing import List, Optional
from pydantic_ai import Agent, RunContext, ToolReturn
from pydantic_ai.ui import StateDeps
from ag_ui.core import StateSnapshotEvent, EventType

from app.config import MODEL_NAME, is_model_configured
from app.schema import (
    BrandBriefState,
    UpdateBrandBriefInput,
    ProposePositioningInput,
    DevelopLaunchStrategyInput,
)

logger = logging.getLogger(__name__)

BASE_SYSTEM_INSTRUCTION = """
You are Sorsiri Brand Strategist, an expert AI partner who collaborates with founders and marketing leaders to develop rigorous, distinctive brand briefs.

Your purpose is to transform raw ideas into coherent, differentiated brand strategies with real-time shared state synchronization.

Operating Principles:
1. Help users develop coherent, actionable brand strategies.
2. Ask concise, pointed clarifying questions when essential context or strategic tension is missing.
3. Prefer sharp, distinctive recommendations over generic marketing buzzwords (e.g. avoid clichés like "innovative solution", "game changer", "seamless experience").
4. Keep the structured BrandBrief state synchronized with the conversation: whenever you propose, agree on, or refine strategic elements (brand name, positioning, audience, differentiators, value proposition, tone, launch goal), call the `update_brand_brief` tool.
5. Explain your strategic reasoning clearly in refined, user-facing language.
6. Never fabricate customer research or claim to have conducted external empirical studies.
7. Treat user-supplied facts as facts, and label your strategic suggestions as recommendations until confirmed.
8. Distinguish sharp positioning choices from broad appeal: good positioning makes a clear choice about who it is NOT for.
"""


def create_brand_agent(model_override: Optional[str] = None) -> Agent[StateDeps[BrandBriefState], str]:
    """
    Instantiate the Pydantic AI agent configured for BrandBrief shared state.
    """
    model = model_override or (MODEL_NAME if is_model_configured() else "test")

    agent = Agent(
        model=model,
        deps_type=StateDeps[BrandBriefState],
        instructions=BASE_SYSTEM_INSTRUCTION,
    )

    @agent.system_prompt
    def inject_current_brand_state(ctx: RunContext[StateDeps[BrandBriefState]]) -> str:
        """
        Inject the live brand brief state into the model's context on every turn.
        If the user edited any field in the UI, that change appears here immediately.
        """
        s = ctx.deps.state
        return f"""
[Current Live Brand Brief State]
- Brand Name: {s.brand_name or '(not set)'}
- Industry: {s.industry or '(not set)'}
- Target Audience: {s.target_audience or '(not set)'}
- Audience Pain Points: {s.audience_pain_points or '(not set)'}
- Positioning: {s.positioning or '(not set)'}
- Personality: {s.personality or '(not set)'}
- Value Proposition: {s.value_proposition or '(not set)'}
- Key Differentiators: {s.differentiators or '(not set)'}
- Tone of Voice: {s.tone_of_voice or '(not set)'}
- Launch Objective: {s.launch_objective or '(not set)'}
- Completeness: {s.completeness_score()}/10 fields defined.

Important: If any of the above fields were edited by the user, respect those edits as the authoritative source of truth and build directly upon them.
"""

    @agent.tool
    async def update_brand_brief(
        ctx: RunContext[StateDeps[BrandBriefState]],
        brand_name: Optional[str] = None,
        industry: Optional[str] = None,
        target_audience: Optional[str] = None,
        audience_pain_points: Optional[str] = None,
        positioning: Optional[str] = None,
        personality: Optional[str] = None,
        value_proposition: Optional[str] = None,
        differentiators: Optional[str] = None,
        tone_of_voice: Optional[str] = None,
        launch_objective: Optional[str] = None,
    ) -> ToolReturn:
        """
        Update one or more fields in the structured brand brief.
        Preserves all existing unmentioned fields and broadcasts the updated state to the UI.
        """
        state = ctx.deps.state
        updated = state.update_fields(
            brand_name=brand_name,
            industry=industry,
            target_audience=target_audience,
            audience_pain_points=audience_pain_points,
            positioning=positioning,
            personality=personality,
            value_proposition=value_proposition,
            differentiators=differentiators,
            tone_of_voice=tone_of_voice,
            launch_objective=launch_objective,
        )

        logger.info("Updated BrandBrief fields: %s", updated)

        summary = f"Updated {len(updated)} brief field(s): {', '.join(updated) if updated else 'none'}."
        return ToolReturn(
            return_value=summary,
            metadata=[
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot=state.to_snapshot(),
                )
            ],
        )

    @agent.tool
    async def propose_positioning_options(
        ctx: RunContext[StateDeps[BrandBriefState]],
        angle: str,
        positioning_statement: str,
        strategic_rationale: str,
        apply_to_brief: bool = False,
    ) -> ToolReturn:
        """
        Propose a refined strategic positioning statement with rationale.
        Set apply_to_brief=True to immediately update the shared brief panel.
        """
        state = ctx.deps.state
        events = []

        if apply_to_brief:
            state.positioning = positioning_statement.strip()
            events.append(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot=state.to_snapshot(),
                )
            )

        res = (
            f"Positioning Proposal [{angle}]: '{positioning_statement}'\n"
            f"Strategic Rationale: {strategic_rationale}\n"
            f"Applied to brief: {'Yes' if apply_to_brief else 'No (pending user confirmation)'}"
        )
        return ToolReturn(return_value=res, metadata=events if events else None)

    @agent.tool
    async def develop_launch_strategy(
        ctx: RunContext[StateDeps[BrandBriefState]],
        launch_objective: Optional[str] = None,
        messaging_pillars: Optional[List[str]] = None,
        key_milestones: Optional[List[str]] = None,
        apply_to_brief: bool = False,
    ) -> ToolReturn:
        """
        Develop a focused launch strategy outline with measurable objective, narrative pillars, and key milestones.
        """
        state = ctx.deps.state
        events = []

        if apply_to_brief and launch_objective:
            state.launch_objective = launch_objective.strip()
            events.append(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot=state.to_snapshot(),
                )
            )

        pillars = messaging_pillars or ["Foundational Point of View", "Community Validation", "Direct Launch"]
        milestones = key_milestones or ["Waitlist opening (Day 1-10)", "Private preview (Day 11-20)", "Public debut (Day 21-30)"]

        res = (
            f"Launch Strategy Outline:\n"
            f"- Objective: {launch_objective or state.launch_objective or 'Build initial momentum'}\n"
            f"- Narrative Pillars: {', '.join(pillars)}\n"
            f"- Milestones: {'; '.join(milestones)}"
        )
        return ToolReturn(return_value=res, metadata=events if events else None)

    @agent.tool
    async def audit_brand_brief(
        ctx: RunContext[StateDeps[BrandBriefState]],
    ) -> ToolReturn:
        """
        Audit the current brand brief for completeness, strategic clarity, and audience tension.
        """
        state = ctx.deps.state
        missing = state.missing_fields()
        score = state.completeness_score()

        insights = []
        if not state.target_audience or len(state.target_audience) < 20:
            insights.append("Target audience lacks specificity; identify exact psychographics and purchasing context.")
        if not state.audience_pain_points:
            insights.append("No audience pain points identified yet; define what alternative choices fail to provide.")
        if not state.differentiators:
            insights.append("Missing core differentiators; specify defensible brand capabilities.")

        report = (
            f"Brand Brief Audit ({score}/10 complete):\n"
            f"- Missing fields: {', '.join(missing) if missing else 'None! All fields defined.'}\n"
            f"- Strategic opportunities: {' '.join(insights) if insights else 'Strong foundational alignment across fields.'}"
        )
        return ToolReturn(return_value=report)

    return agent


# Default singleton instance
brand_agent = create_brand_agent()
deps_template = StateDeps(BrandBriefState())
