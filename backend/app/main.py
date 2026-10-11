from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import replace
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError

from pydantic_ai.ui.ag_ui import AGUIAdapter

from app.agent import brand_agent, deps_template
from app.config import (
    CORS_ORIGINS,
    MODEL_NAME,
    is_model_configured,
)
from app.schema import BrandBriefState

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sorsiri.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Sorsiri Brand Workspace backend service...")
    logger.info("Configured Model: %s (API key valid: %s)", MODEL_NAME, is_model_configured())
    logger.info("Allowed CORS Origins: %s", CORS_ORIGINS)
    yield
    logger.info("Shutting down Sorsiri Brand Workspace backend service.")


app = FastAPI(
    title="Sorsiri Brand Workspace AG-UI Agent API",
    description="Pydantic AI backend integrating AG-UI protocol for real-time bidirectional shared state.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Service landing endpoint with API discovery."""
    return {
        "service": "Sorsiri Brand Workspace Agent",
        "description": "Collaborative Brand Strategy Workspace powered by Pydantic AI & AG-UI",
        "protocol": "AG-UI Protocol v1.0",
        "endpoints": {
            "health": "/health",
            "agent": "/agent (POST - AG-UI Event Stream)",
            "schema": "/api/brief/schema (GET)",
            "validate": "/api/brief/validate (POST)",
        },
        "model": MODEL_NAME,
        "configured": is_model_configured(),
    }


@app.get("/health")
async def health():
    """Service health check endpoint."""
    configured = is_model_configured()
    return {
        "status": "healthy" if configured else "needs_configuration",
        "model": MODEL_NAME,
        "configured": configured,
        "protocol": "AG-UI",
        "framework": "Pydantic AI v2.55.0",
        "message": "Ready to process AG-UI agent runs" if configured else "OpenRouter API key is required",
    }


@app.get("/api/brief/schema")
async def get_brief_schema():
    """Inspect the BrandBrief state schema and field descriptions."""
    return {
        "title": "BrandBriefState",
        "schema": BrandBriefState.model_json_schema(),
        "default": BrandBriefState().to_snapshot(),
    }


@app.post("/api/brief/validate")
async def validate_brief(payload: Dict[str, Any]):
    """Validate client-supplied brief state against BrandBriefState schema."""
    try:
        validated = BrandBriefState.model_validate(payload)
        return {
            "valid": True,
            "completeness": validated.completeness_score(),
            "missingFields": validated.missing_fields(),
            "snapshot": validated.to_snapshot(),
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Invalid brand brief state", "errors": e.errors()},
        )


@app.post("/agent")
async def agent_endpoint(request: Request) -> Response:
    """
    Official AG-UI protocol endpoint.
    Receives RunAgentInput with messages and shared BrandBrief state.
    Streams Server-Sent Events (SSE) including text deltas and STATE_SNAPSHOT events.
    """
    if not is_model_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENROUTER_API_KEY is not configured on the backend. Please check environment variables.",
        )

    try:
        # Give each request its own isolated StateDeps instance initialized from the template
        req_deps = replace(deps_template)
        return await AGUIAdapter.dispatch_request(
            request,
            agent=brand_agent,
            deps=req_deps,
        )
    except Exception as exc:
        logger.exception("Error executing AG-UI agent request: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(exc), "type": exc.__class__.__name__},
        )
