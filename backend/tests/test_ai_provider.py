import asyncio
import sys
import types

from app import ai as ai_module


class _FakeMessage:
    def __init__(self, content: str):
        self.content = content


class _FakeChoice:
    def __init__(self, content: str):
        self.message = _FakeMessage(content)


class _FakeResponse:
    def __init__(self, content: str, model: str):
        self.choices = [_FakeChoice(content)]
        self.model = model


def test_ai_advice_uses_openrouter_config_and_model_fallbacks(monkeypatch):
    captured: dict[str, object] = {}

    class FakeAsyncOpenAI:
        def __init__(self, **kwargs):
            captured["init"] = kwargs
            self.chat = types.SimpleNamespace(
                completions=types.SimpleNamespace(create=self._create)
            )

        async def _create(self, **kwargs):
            captured["create"] = kwargs
            return _FakeResponse("Provider advice", "stepfun/step-3.5-flash:free")

    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
    monkeypatch.setenv("AI_MODEL_PRIMARY", "stepfun/step-3.5-flash:free")
    monkeypatch.setenv("AI_MODEL_FALLBACKS", "nvidia/nemotron-3-super-120b-a12b:free")
    monkeypatch.setenv("AI_APP_URL", "https://aqbobek.example")
    monkeypatch.setenv("AI_APP_NAME", "Aqbobek Portal")
    monkeypatch.delitem(sys.modules, "openai", raising=False)
    monkeypatch.setitem(sys.modules, "openai", types.SimpleNamespace(AsyncOpenAI=FakeAsyncOpenAI))

    text, source = asyncio.run(
        ai_module.generate_ai_advice(
            risk=72,
            grades=[5, 4, 3],
            attendance=0.7,
            subject="Physics",
        )
    )

    assert text == "Provider advice"
    assert source == "openrouter:stepfun/step-3.5-flash:free"
    assert captured["init"] == {
        "api_key": "test-key",
        "base_url": "https://openrouter.ai/api/v1",
        "default_headers": {
            "HTTP-Referer": "https://aqbobek.example",
            "X-OpenRouter-Title": "Aqbobek Portal",
        },
    }
    assert captured["create"]["model"] == "stepfun/step-3.5-flash:free"
    assert captured["create"]["extra_body"] == {
        "models": ["nvidia/nemotron-3-super-120b-a12b:free"]
    }


def test_ai_advice_falls_back_without_api_key(monkeypatch):
    monkeypatch.delenv("AI_API_KEY", raising=False)
    monkeypatch.delenv("AI_BASE_URL", raising=False)
    monkeypatch.delenv("AI_MODEL_PRIMARY", raising=False)
    monkeypatch.delenv("AI_MODEL_FALLBACKS", raising=False)

    text, source = asyncio.run(
        ai_module.generate_ai_advice(
            risk=75,
            grades=[3, 3, 2],
            attendance=0.68,
            subject="Physics",
        )
    )

    assert source == "fallback"
    assert "High risk in Physics" in text


def test_parent_summary_uses_openrouter_response_text(monkeypatch):
    class FakeAsyncOpenAI:
        def __init__(self, **kwargs):
            self.chat = types.SimpleNamespace(
                completions=types.SimpleNamespace(create=self._create)
            )

        async def _create(self, **kwargs):
            return _FakeResponse(
                "Summary paragraph.\n\nRecommendation paragraph.",
                "stepfun/step-3.5-flash:free",
            )

    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
    monkeypatch.setenv("AI_MODEL_PRIMARY", "stepfun/step-3.5-flash:free")
    monkeypatch.delitem(sys.modules, "openai", raising=False)
    monkeypatch.setitem(sys.modules, "openai", types.SimpleNamespace(AsyncOpenAI=FakeAsyncOpenAI))

    summary, recommendation, source = asyncio.run(
        ai_module.generate_parent_weekly_summary(
            child_name="Duman",
            risk_score=42,
            average_attendance=0.88,
            strong_subjects=["Mathematics"],
            attention_subjects=["Physics"],
        )
    )

    assert summary == "Summary paragraph."
    assert recommendation == "Recommendation paragraph."
    assert source == "openrouter:stepfun/step-3.5-flash:free"


def test_teacher_report_falls_back_after_provider_error(monkeypatch):
    captured = {"create_calls": 0}

    class FakeAsyncOpenAI:
        def __init__(self, **kwargs):
            self.chat = types.SimpleNamespace(
                completions=types.SimpleNamespace(create=self._create)
            )

        async def _create(self, **kwargs):
            captured["create_calls"] += 1
            raise RuntimeError("provider unavailable")

    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
    monkeypatch.setenv("AI_MODEL_PRIMARY", "stepfun/step-3.5-flash:free")
    monkeypatch.delitem(sys.modules, "openai", raising=False)
    monkeypatch.setitem(sys.modules, "openai", types.SimpleNamespace(AsyncOpenAI=FakeAsyncOpenAI))

    text, source = asyncio.run(
        ai_module.generate_teacher_class_report(
            {
                "class_id": "10A",
                "total_students": 25,
                "high_risk": 4,
                "medium_risk": 8,
                "average_risk": 51,
            }
        )
    )

    assert captured["create_calls"] == 1
    assert source == "fallback"
    assert "Class 10A" in text
