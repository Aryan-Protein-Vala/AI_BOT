from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BrandBriefState(BaseModel):
    """
    Structured brand brief shared state between frontend UI and Pydantic AI agent.
    Supports both snake_case (internal pythonic) and camelCase (frontend v0) serialization.
    """
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    brand_name: str = Field(
        default="Lumen House",
        alias="brandName",
        description="Name of the brand"
    )
    industry: str = Field(
        default="Independent hospitality",
        alias="industry",
        description="Industry or market category"
    )
    target_audience: str = Field(
        default="Design-conscious travelers who want a slower, more personal stay.",
        alias="targetAudience",
        description="Core customer segment and audience profile"
    )
    audience_pain_points: str = Field(
        default="Hotels feel interchangeable; planning a thoughtful trip takes too many tabs and too much guesswork.",
        alias="painPoints",
        description="Key frustrations and unmet needs of the audience"
    )
    positioning: str = Field(
        default="A collection of intimate stays for people who travel to feel somewhere, not simply see it.",
        alias="positioning",
        description="Strategic positioning statement and market stance"
    )
    personality: str = Field(
        default="Warm, curious, quietly confident",
        alias="personality",
        description="Brand archetype, traits, and persona"
    )
    value_proposition: str = Field(
        default="Lumen makes meaningful travel feel easy to find and remember.",
        alias="valueProposition",
        description="Primary promise of value delivered to customers"
    )
    differentiators: str = Field(
        default="Local hosts, considered spaces, and itineraries shaped by people who live there.",
        alias="differentiators",
        description="What sets the brand apart from existing alternatives"
    )
    tone_of_voice: str = Field(
        default="Observant, inviting, specific, never salesy.",
        alias="tone",
        description="Editorial voice and communication style"
    )
    launch_objective: str = Field(
        default="Build an early waitlist of 500 design-minded travelers in 30 days.",
        alias="launchObjective",
        description="Measurable milestone for early market entry"
    )

    def to_snapshot(self) -> Dict[str, Any]:
        """
        Produce a protocol snapshot containing both snake_case and camelCase aliases
        so frontend components and AG-UI consumers can access either effortlessly.
        """
        snake = self.model_dump(by_alias=False)
        camel = self.model_dump(by_alias=True)
        merged = {**snake, **camel}
        return merged

    def update_fields(self, **kwargs: Optional[str]) -> List[str]:
        """
        Safely update specified non-None fields while preserving all unrelated fields.
        Returns the list of field names that were updated.
        """
        updated: List[str] = []
        for key, value in kwargs.items():
            if value is None:
                continue
            # Normalize key to attribute name
            attr = key
            if key == "brandName":
                attr = "brand_name"
            elif key == "targetAudience":
                attr = "target_audience"
            elif key == "painPoints":
                attr = "audience_pain_points"
            elif key == "valueProposition":
                attr = "value_proposition"
            elif key == "tone":
                attr = "tone_of_voice"
            elif key == "launchObjective":
                attr = "launch_objective"

            if hasattr(self, attr):
                str_val = str(value).strip()
                if str_val:
                    setattr(self, attr, str_val)
                    updated.append(attr)
        return updated

    def completeness_score(self) -> int:
        """Count filled fields out of 10."""
        fields = [
            self.brand_name,
            self.industry,
            self.target_audience,
            self.audience_pain_points,
            self.positioning,
            self.personality,
            self.value_proposition,
            self.differentiators,
            self.tone_of_voice,
            self.launch_objective,
        ]
        return sum(1 for f in fields if bool(f and f.strip()))

    def missing_fields(self) -> List[str]:
        """Return human-readable names of empty fields."""
        checks = [
            ("Brand Name", self.brand_name),
            ("Industry", self.industry),
            ("Target Audience", self.target_audience),
            ("Audience Pain Points", self.audience_pain_points),
            ("Positioning Statement", self.positioning),
            ("Brand Personality", self.personality),
            ("Value Proposition", self.value_proposition),
            ("Differentiators", self.differentiators),
            ("Tone of Voice", self.tone_of_voice),
            ("Launch Objective", self.launch_objective),
        ]
        return [label for label, val in checks if not (val and val.strip())]


class UpdateBrandBriefInput(BaseModel):
    """Input payload for agent tool to update the brand brief."""
    brand_name: Optional[str] = Field(None, description="Updated brand name")
    industry: Optional[str] = Field(None, description="Updated industry or category")
    target_audience: Optional[str] = Field(None, description="Updated target audience description")
    audience_pain_points: Optional[str] = Field(None, description="Updated audience pain points")
    positioning: Optional[str] = Field(None, description="Updated positioning statement")
    personality: Optional[str] = Field(None, description="Updated personality traits")
    value_proposition: Optional[str] = Field(None, description="Updated value proposition")
    differentiators: Optional[str] = Field(None, description="Updated key differentiators")
    tone_of_voice: Optional[str] = Field(None, description="Updated tone of voice")
    launch_objective: Optional[str] = Field(None, description="Updated launch objective")


class ProposePositioningInput(BaseModel):
    """Input for proposing a strategic positioning direction."""
    angle: str = Field(..., description="Angle name, e.g. 'Quiet Luxury', 'Challenger', 'Accessible Craft'")
    positioning_statement: str = Field(..., description="The drafted positioning statement")
    strategic_rationale: str = Field(..., description="Why this positioning works against competitors")
    apply_to_brief: bool = Field(False, description="Whether to immediately update the shared brief")


class DevelopLaunchStrategyInput(BaseModel):
    """Input for developing a launch messaging plan."""
    launch_objective: Optional[str] = Field(None, description="Specific quantifiable launch goal")
    messaging_pillars: List[str] = Field(default_factory=list, description="Core narrative pillars")
    key_milestones: List[str] = Field(default_factory=list, description="Phased launch milestones")
    apply_to_brief: bool = Field(False, description="Whether to update launch_objective in brief")
