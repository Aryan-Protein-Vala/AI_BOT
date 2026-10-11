# Technical Design Decisions & Architectural Trade-offs

This document outlines key technical decisions made during the design and implementation of the **Sorsiri Brand Workspace**.

---

## 1. Component Architecture

### Modular vs. Monolithic
The original v0 prototype was a single large file (`brand-workspace.tsx`). While convenient for initial visual exploration, a production system requires distinct separation of concerns:
- **`Sidebar`**: Dedicated workspace navigation, conversation history, and user settings.
- **`WorkspaceHeader`**: Breadcrumb routing, live AG-UI backend health badge, and synchronization status.
- **`ChatMessageItem`**: Handles message formatting, live streaming indicators, tool call chips (`⚡ Synced with Brand Brief`), and clipboard/retry interactions.
- **`ChatComposer`**: Auto-resizing textarea with keyboard shortcuts (Enter to submit, Shift+Enter for newline) and disabled states.
- **`BrandBriefPanel`**: Right sidebar containing the strategy completeness meter, categorized field groups, dirty/saved tracking, and the live activity feed.
- **`EditableBriefField`**: Self-contained inline edit component with draft state, save/cancel actions, and validation.
- **`StatusBanner`**: Contextual diagnostic alert if the backend service or model credentials are missing, preventing silent failure.

### Visual Restraint
Per Sorsiri's brand direction:
- Backgrounds: `#fbfaf7` (canvas) and `#f7f6f2` (subtle containers).
- Typography: `#242520` (charcoal primary) and `#45463f` (readable body).
- Accents: Olive green `#66745a` and sage `#dfe4d8`.
- No neon accents, floating orbs, or decorative sparkles. The application feels like serious, high-craft strategy software.

---

## 2. Shared-State Design & The AG-UI Protocol

### Why AG-UI (Agent-User Interaction Protocol)?
Rather than building an ad-hoc WebSocket protocol or polling REST endpoints:
1. **Industry Standard**: AG-UI is the official protocol co-developed by CopilotKit and supported natively in Pydantic AI (`pydantic_ai.ui.ag_ui`).
2. **Server-Sent Events (SSE)**: Standard HTTP streaming works seamlessly through corporate firewalls, reverse proxies, and CDN edge layers without WebSocket handshake complexity.
3. **Structured State Synchronization**: The protocol natively supports `STATE_SNAPSHOT` and `STATE_DELTA` events emitted alongside text streaming.

### Dual-Key Model (camelCase & snake_case)
- **Problem**: Python frameworks and database schemas traditionally favor `snake_case` (`target_audience`), whereas JavaScript/TypeScript and the v0 frontend utilize `camelCase` (`targetAudience`).
- **Solution**: The Pydantic model (`BrandBriefState`) uses `populate_by_name=True` with field aliases:
  ```python
  target_audience: str = Field(default="", alias="targetAudience")
  ```
  The snapshot serialization method (`to_snapshot()`) emits both conventions, ensuring frontend components and backend tools can access properties seamlessly with zero impedance mismatch.

### State Integrity: Preserving Unrelated Fields
When the agent updates a specific property (e.g., positioning), it must **not** overwrite or blank out unrelated fields (such as user-crafted target audience notes). The tool `update_brand_brief` accepts optional fields and only applies non-None changes:
```python
state.update_fields(positioning=positioning)  # Leaves brand_name, target_audience intact
```

---

## 3. Bidirectional Synchronization Mechanics

### Agent-to-UI Updates
1. User requests a positioning statement in chat.
2. The agent executes `update_brand_brief` (or `propose_positioning_options`).
3. The tool generates a `ToolReturn` carrying a `StateSnapshotEvent`.
4. The backend streams `data: {"type": "STATE_SNAPSHOT", "snapshot": {...}}`.
5. The frontend's `normalizeBriefSnapshot` reconciles the snapshot against local state and triggers a React state update.
6. The brief panel and completeness progress bar update in real-time.

### UI-to-Agent Updates
1. User clicks the pencil icon on any brief field (e.g., `targetAudience`).
2. User edits the text and clicks Save.
3. The frontend updates local state and logs an activity entry.
4. On the subsequent user turn, the frontend includes the updated `state` inside `RunAgentInput`.
5. Pydantic AI's `StateDeps[BrandBriefState]` validates and unpacks the incoming state into `ctx.deps.state`.
6. Dynamic system prompt injection feeds the latest brief state into the LLM context.
7. The agent reasons upon the user's manual edits without acting on stale values.

---

## 4. Model Selection & OpenRouter Configuration

- **Model Choice**: `openrouter:openrouter/free` (or openrouter models via `pydantic-ai`).
- **Provider Handling**: Configured cleanly in `backend/app/config.py` using Pydantic AI's native OpenRouter provider.
- **Security**: The API key is stored strictly on the backend (`backend/.env` or system environment). It is **never** exposed to client-side bundles.

---

## 5. Next.js API Proxy Pattern

In production deployments, the frontend and Python backend often live on separate domains (e.g., `sorsiri.vercel.app` and `sorsiri-api.onrender.com`).
To ensure seamless operation:
1. The frontend defaults to calling the internal route handler `/api/agent`.
2. The route handler forwards the SSE stream to the configured `BACKEND_URL`.
3. This eliminates CORS complexities in browser code, provides a centralized error boundary, and keeps API keys protected.
4. Direct backend access (`http://localhost:8000/agent`) is also enabled with CORS middleware for direct Postman/SDK access.

---

## 6. What Was Deliberately Excluded

To keep the architecture focused, performant, and reliable:
1. **No External Database**: Per assignment guidance, session state is preserved in tab session storage and runtime memory. No PostgreSQL or MongoDB was added, preventing setup overhead.
2. **No Heavy Auth System**: Authentication was excluded to keep evaluation immediate and friction-free.
3. **No Overengineered Multi-Agent Frameworks**: A focused, high-precision Pydantic AI agent with domain-specific tools was used rather than a sprawling graph of redundant agents.
