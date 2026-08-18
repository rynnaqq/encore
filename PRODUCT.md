# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: Tech recruiters, engineering hiring managers, and prospective clients evaluating full-stack and frontend capabilities.
- Secondary: Fellow developers and interactive web enthusiasts exploring the live games, real-time multiplayer features, and guestbook.

## Product Purpose
- Serve as an immersive, production-grade developer portfolio that proves technical mastery through interactive, playable software rather than static resume text.
- Provide visitors with enjoyable, zero-friction interactive experiences (Grandmaster Chess, Fishing Game, UNO, Snake & Ladders, and real-time community guestbook).

## Positioning
- "Proof through Play & Craft" — Demonstrates high-complexity full-stack engineering (WebSockets, real-time matchmaking across 30+ countries, AI bots, canvas physics, responsive motion) directly in the browser interface.

## Operating Context
- Modern web desktop and mobile viewports with responsive touch and pointer physics.
- Client runs React 19 SPA powered by Vite and Tailwind CSS v4, connected to an Express + Socket.io backend with optional Supabase / Firebase persistency.
- Light and dark theme environments with seamless toggle support.

## Capabilities and Constraints
- **Full-Stack Architecture:** React 19 + TypeScript frontend with Express & Socket.io server (`server.ts`).
- **Interactive Game Suite:**
  - Grandmaster Chess (Socket.io multiplayer with country flags, Gemini/Stockfish-style VS AI Bot, local Pass & Play).
  - Interactive Fishing Game with simulated pond, bobber mechanics, and fish collection log.
  - Turn-based UNO Card Game (vs AI / multiplayer).
  - Interactive Snake and Ladders board.
- **Community & Moderation:** Real-time guestbook comment feed with emoji reactions, country identification, and role-gated Admin dashboard.
- **Motion & Styling:** Motion (`motion/react`) spring physics, Tailwind CSS v4, Plus Jakarta Sans display typography, JetBrains Mono code accents.

## Brand Commitments
- **Name:** Encore. (Ryan / rynnaqq)
- **Voice & Tone:** Playful, technically ambitious, confident, and delightfully interactive without sacrificing clarity or code rigor.
- **Aesthetic Identity:** Crisp pastel and slate dual-theme palette (Light `#F2F9FF` with rose/blush accents `#FFCCE1` / `#E195AB`; Dark `slate-950` with vibrant neon accents).

## Evidence on Hand
- Working live codebase with real-time socket server, game engines (`chess.js`, custom fishing engine), and authentication context.
- Static assets located in `/public/assets/` (custom fish sprites, audio effects, preview clips).
- Live guestbook comments repository in `comments.json`.

## Product Principles
1. **Show, Don't Just Tell:** Every capability claim is backed by an interactive, inspectable feature.
2. **Zero-Lag Tactility:** Micro-interactions, board moves, and UI transitions must feel snappy and responsive.
3. **Inclusive Playability:** Games and portfolio sections must gracefully handle both mobile touch and desktop mice.
4. **Resilient Degradation:** Real-time features must degrade cleanly to local/bot modes if server connection drops.
