# Scripts

Utility and initialization scripts for the Rename-Tab project.

## Asset Generation

One-time scripts for generating brand assets using the Gemini AI image generation API.

### Prerequisites

Set `GEMINI_API_KEY` in your `.env` file:

```
GEMINI_API_KEY=AIza...
```

### generate-banner.ts

Generates a banner image using LLM-powered description generation and Gemini image generation.

**Usage:**

```bash
# Using Makefile
make banner

# Direct (with optional title and suggestion args)
bun run scripts/generate-banner.ts
bun run scripts/generate-banner.ts "My-Project" "use a rabbit in the image"
```

**Output:**

- `media/banner.png` - Wide horizontal banner (16:9 aspect ratio, sumi-e ink wash style)

### Dependencies

- `@google/genai` - Gemini API client

## Other Scripts

- **check_ai_writing.ts** - Checks for em dashes in the codebase (AI writing detector)
- **validate-agents-md.ts** - Validates CLAUDE.md/AGENTS.md has required sections
