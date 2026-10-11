import pytest
from app.schema import (
    BrandBriefState,
    UpdateBrandBriefInput,
    ProposePositioningInput,
    DevelopLaunchStrategyInput,
)


def test_brand_brief_defaults():
    brief = BrandBriefState()
    assert brief.brand_name == "Lumen House"
    assert brief.industry == "Independent hospitality"
    assert brief.completeness_score() == 10
    assert brief.missing_fields() == []


def test_camel_case_and_snake_case_parsing():
    # Frontend sends camelCase
    payload_camel = {
        "brandName": "Sorsiri Studios",
        "targetAudience": "CMOs and brand builders",
        "painPoints": "Slow creative iteration",
    }
    b1 = BrandBriefState.model_validate(payload_camel)
    assert b1.brand_name == "Sorsiri Studios"
    assert b1.target_audience == "CMOs and brand builders"
    assert b1.audience_pain_points == "Slow creative iteration"

    # Backend / Python code can also use snake_case
    payload_snake = {
        "brand_name": "Sorsiri Labs",
        "target_audience": "Founders",
        "audience_pain_points": "High agency fees",
    }
    b2 = BrandBriefState.model_validate(payload_snake)
    assert b2.brand_name == "Sorsiri Labs"
    assert b2.target_audience == "Founders"
    assert b2.audience_pain_points == "High agency fees"


def test_to_snapshot_dual_keys():
    brief = BrandBriefState(brand_name="Aura", industry="Fintech")
    snapshot = brief.to_snapshot()

    # Both snake_case and camelCase keys are present
    assert snapshot["brand_name"] == "Aura"
    assert snapshot["brandName"] == "Aura"
    assert snapshot["industry"] == "Fintech"
    assert "targetAudience" in snapshot
    assert "target_audience" in snapshot


def test_update_fields_preserves_unrelated():
    brief = BrandBriefState(
        brand_name="Original Name",
        industry="Original Industry",
        positioning="Original Positioning",
        personality="Bold",
    )

    # Update only positioning and industry
    updated = brief.update_fields(
        positioning="New Positioning",
        industry="New Industry",
        brand_name=None,  # should NOT overwrite
    )

    assert "positioning" in updated
    assert "industry" in updated
    assert brief.positioning == "New Positioning"
    assert brief.industry == "New Industry"
    # Unrelated fields preserved
    assert brief.brand_name == "Original Name"
    assert brief.personality == "Bold"


def test_completeness_and_missing_fields():
    empty_brief = BrandBriefState(
        brand_name="",
        industry="",
        target_audience="",
        audience_pain_points="",
        positioning="",
        personality="",
        value_proposition="",
        differentiators="",
        tone_of_voice="",
        launch_objective="",
    )
    assert empty_brief.completeness_score() == 0
    assert len(empty_brief.missing_fields()) == 10

    empty_brief.brand_name = "New Brand"
    assert empty_brief.completeness_score() == 1
    assert "Brand Name" not in empty_brief.missing_fields()
    assert "Industry" in empty_brief.missing_fields()


def test_tool_inputs():
    inp = UpdateBrandBriefInput(brand_name="A", positioning="B")
    assert inp.brand_name == "A"
    assert inp.positioning == "B"
    assert inp.industry is None

    pos = ProposePositioningInput(
        angle="Minimalist",
        positioning_statement="Simple by design",
        strategic_rationale="Clutter fatigue",
        apply_to_brief=True,
    )
    assert pos.apply_to_brief is True

    launch = DevelopLaunchStrategyInput(
        launch_objective="1,000 signups",
        messaging_pillars=["Clarity", "Craft"],
    )
    assert len(launch.messaging_pillars) == 2
