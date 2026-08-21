# WriteFlow

WriteFlow is a collaborative writing workspace with real-time editing and optional AI-assisted writing tools.

## Local development

1. Copy `.env.example` to `server/.env` and set `MONGODB_URI`.
2. Add `OPENROUTER_API_KEY` if you want AI tools enabled. The default OpenRouter model is `openrouter/free`; change `AI_MODEL` for a specific paid model.
3. In one terminal, run `npm install` and `npm run dev` from `server`.
4. In another terminal, run `npm install` and `npm start` from `client`.

## Render deployment

The included `render.yaml` deploys the client and server as one Render web service. Connect the repository in Render and create a Blueprint from the file. Set `MONGODB_URI`; set `OPENROUTER_API_KEY` if AI tools should be available. Render supplies `PORT` automatically.
