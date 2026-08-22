# WriteFlow

A real-time collaborative document editor with built-in smart text editing tools — autocomplete, rephrasing, translation, summarization, and more.

## Features

- **Real-time collaboration** — Multiple people can edit the same document at once, with live sync via WebSockets
- **Rich text editing** — Formatting, tables, images, and links
- **Smart editing tools**
  - Autocomplete suggestions
  - Improve text clarity
  - Rephrase content
  - Translate text
  - Summarize documents
  - Generate FAQs from content
- **Presence indicators** — See who else is editing, with per-user colors
- **Table of contents** — Auto-generated outline for quick navigation
- **Auto-save** — Documents persist automatically to the database

## Tech Stack

**Frontend:** React, TipTap editor, Socket.io Client
**Backend:** Node.js, Express, Socket.io, MongoDB (Mongoose)

## Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Cerebras API key (for the editing features)

## Project Structure

```
writeFlow/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── services/
│       └── ...
├── server/                 # Node/Express backend
│   ├── controller/
│   ├── routes/
│   ├── services/
│   ├── schema/
│   ├── db/
│   └── index.js
└── README.md
```

## API Overview

| Endpoint                   | Method | Description                 |
| -------------------------- | ------ | --------------------------- |
| `/api/documents/:id`       | GET    | Fetch a document            |
| `/api/documents`           | POST   | Create a document           |
| `/api/documents/:id`       | PUT    | Update a document           |
| `/api/editor/autocomplete` | POST   | Get autocomplete suggestion |
| `/api/editor/improve`      | POST   | Improve text                |
| `/api/editor/rephrase`     | POST   | Rephrase text               |
| `/api/editor/translate`    | POST   | Translate text              |
| `/api/editor/summarize`    | POST   | Summarize content           |
| `/api/editor/faq`          | POST   | Generate FAQ from content   |
| `/api/health`              | GET    | Health check                |

Real-time sync is handled over WebSockets (Socket.io) on the same server/port as the API — no separate hosting needed.
