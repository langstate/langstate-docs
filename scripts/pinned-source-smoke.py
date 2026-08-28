import asyncio
import inspect
import json
from pathlib import Path

from core import (
    ActionResultData as RootActionResultData,
    AgentInput,
    CanonicalStateSchema as RootCanonicalStateSchema,
    EvaluationContext as RootEvaluationContext,
    InteractionRequest,
    InterpretiveStateSchema as RootInterpretiveStateSchema,
    LangState as RootLangState,
    LangStateConfig,
    LLMEvaluator as RootLLMEvaluator,
    StateFactory as RootStateFactory,
)
from core.action.base.action import BaseAction
from core.action.base.schema import ActionContext, ActionResult, ActionStatus
from core.evaluator.llm.evaluator import LLMEvaluator
from core.evaluator.schema import EvaluationContext, EvaluationResult
from core.langstate.base.langstate import LangState
from core.langstate.base.schema import ActionResultData
from core.mutator.llm.client.base import BaseLLMClient
from core.mutator.llm.mutator import LLMMutator
from core.mutator.llm.schema import StructuredInput
from core.projector.canonical.projector import BaseProjectorCanonicalState
from core.projector.canonical.schema import (
    CanonicalProjectionContext,
    CanonicalProjectionResult,
    CanonicalProjectionStrategy,
)
from core.projector.ui.projector import BaseProjectorUI
from core.projector.ui.schema import (
    UIComponent,
    UIComponentType,
    UIProjectionContext,
    UIProjectionResult,
)
from core.spec_extractor.openapi.extractor import OpenAPIReader
from core.state.canonical.schema import CanonicalStateSchema
from core.state.factory.state_factory import StateFactory
from core.state.interpretive.schema import (
    Inference,
    InterpretiveStateSchema,
    ValueConfidence,
)
from core.state.interpretive.state import InterpretiveState
from core.state.repository.memory import InMemoryStateRepository
from core.state.snapshot.memory import InMemorySnapshotStore


class FixedClient(BaseLLMClient):
    async def generate(self, prompt: str) -> str:
        assert "Ada Lovelace" in prompt
        return json.dumps(
            [
                {
                    "path": "registrant.name",
                    "value": "Ada Lovelace",
                    "confidence": 0.95,
                    "inference": "Extracted the stated name",
                }
            ]
        )


async def smoke_async(interpretive: InterpretiveState) -> None:
    repository = InMemoryStateRepository[InterpretiveState]()
    await repository.save("registration-17", interpretive)
    assert await repository.get("registration-17") is interpretive

    snapshots = InMemorySnapshotStore[InterpretiveState](max_snapshots=2)
    await snapshots.record_snapshot("quickstart", interpretive)
    assert (await snapshots.get_latest()).index == 0

    expected = InterpretiveState()
    expected.add_value(
        "registrant.name",
        ValueConfidence(value="Ada Lovelace", confidence=0.95),
    )
    result = await LLMEvaluator().evaluate(
        EvaluationContext(
            mutator=LLMMutator(FixedClient()),
            pre_state=InterpretiveState(),
            expected_post_state=expected,
            mutation_input=StructuredInput(
                prompt="My name is Ada Lovelace",
                message_id="message-1",
            ),
        )
    )
    assert result.comparison.overall_match
    assert result.accuracy_score == 1.0


def main() -> None:
    import_symbols = (
        AgentInput,
        InteractionRequest,
        LangStateConfig,
        BaseAction,
        ActionContext,
        ActionResult,
        ActionStatus,
        EvaluationResult,
        BaseProjectorCanonicalState,
        CanonicalProjectionContext,
        CanonicalProjectionResult,
        CanonicalProjectionStrategy,
        BaseProjectorUI,
        UIComponent,
        UIComponentType,
        UIProjectionContext,
        UIProjectionResult,
    )
    assert all(symbol is not None for symbol in import_symbols)
    assert RootActionResultData is ActionResultData
    assert RootCanonicalStateSchema is CanonicalStateSchema
    assert RootEvaluationContext is EvaluationContext
    assert RootInterpretiveStateSchema is InterpretiveStateSchema
    assert RootLangState is LangState
    assert RootLLMEvaluator is LLMEvaluator
    assert RootStateFactory is StateFactory

    schema = OpenAPIReader(root_entity="Registration").read(
        Path("tests/data/schemas/registeration.yaml")
    )
    factory = StateFactory()
    canonical = factory.create_canonical_state(schema)
    canonical.set_field("registrant.name", "Ada Lovelace")
    canonical.set_field("registrant.email", "ada@example.com")
    canonical.set_field("status", "draft")

    interpretive = factory.create_interpretive_state(canonical)
    interpretive.add_inference(
        "registrant.name",
        Inference(
            content="Loaded from canonical registration data",
            mutator_id="quickstart",
            message_id="example-1",
        ),
    )

    canonical_schema = CanonicalStateSchema(root=canonical.get_all_fields())
    interpretive_schema = InterpretiveStateSchema(
        root={
            path: field_state
            for path, field_state in interpretive.get_all_fields().items()
            if field_state is not None
        }
    )

    assert canonical_schema.root["registrant.name"] == "Ada Lovelace"
    assert interpretive_schema.root["registrant.name"].inference is not None
    assert interpretive.get_best_value("registrant.name").value == "Ada Lovelace"
    assert inspect.isabstract(LangState)
    assert "state" in ActionResultData.model_fields
    assert "canonical_state" in ActionResultData.model_fields

    asyncio.run(smoke_async(interpretive))
    print("Pinned source examples passed.")


if __name__ == "__main__":
    main()
