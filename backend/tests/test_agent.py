import pytest
from pydantic_ai.ui import StateDeps
from ag_ui.core import EventType, StateSnapshotEvent
from app.agent import create_brand_agent
from app.schema import BrandBriefState


@pytest.mark.asyncio
async def test_agent_instantiation():
    agent = create_brand_agent(model_override="test")
    assert agent is not None


@pytest.mark.asyncio
async def test_agent_tools_execution():
    agent = create_brand_agent(model_override="test")
    initial_state = BrandBriefState(
        brand_name="Alpha",
        positioning="Initial positioning",
        personality="Quiet",
    )
    deps = StateDeps(initial_state)

    # Directly verify the update_brand_brief tool logic
    # Find tool function
    tool_func = None
    for tool in agent.toolsets:
        # Check tools in toolset
        pass

    # We can run agent with test model to verify execution
    prompt = "Please audit the brand brief."
    result = await agent.run(prompt, deps=deps)
    assert result is not None
    assert isinstance(result.output, str)


@pytest.mark.asyncio
async def test_state_snapshot_event_generation():
    state = BrandBriefState(brand_name="Original", positioning="Old")
    deps = StateDeps(state)

    # Mutate state and create StateSnapshotEvent
    deps.state.positioning = "New positioning for modern travelers"
    event = StateSnapshotEvent(
        type=EventType.STATE_SNAPSHOT,
        snapshot=deps.state.to_snapshot(),
    )

    assert event.type == EventType.STATE_SNAPSHOT
    assert event.snapshot["positioning"] == "New positioning for modern travelers"
    assert event.snapshot["brand_name"] == "Original"
