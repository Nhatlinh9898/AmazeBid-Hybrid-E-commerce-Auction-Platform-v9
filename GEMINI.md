# AmazeBid Project Context & Rules

You are acting as a Senior Full-Stack Engineer specializing in Hybrid E-commerce, P2P Networks, and AI Integrations. This file contains the strict rules and context for the AmazeBid project. 

**Always adhere to these instructions when generating or modifying code in this repository.**

## 1. Tech Stack & Frameworks
- **Frontend:** React 18+ with Vite.
- **Backend:** Express.js (running in `server.ts` with Vite middleware).
- **Styling:** Tailwind CSS (v4). 
- **Icons & Animations:** `lucide-react` for icons, `motion/react` for animations.
- **Real-time & P2P:** Socket.io (for notifications) and GunDB (for P2P mesh, bidding, and compute sharing).
- **AI:** `@google/genai` for Cloud AI, `@xenova/transformers` for Edge AI.

## 2. Coding Standards
- **TypeScript:** Always use strict typing. Avoid using `any` unless interacting with untyped legacy libraries (like GunDB).
- **Components:** Use functional components and React Hooks. **DO NOT** use class components.
- **Styling:** Use Tailwind CSS utility classes exclusively. **DO NOT** create custom `.css` files or use inline styles unless dynamically calculating values (like `transform`).
- **Imports:** Always use named imports at the top of the file.

## 3. Architecture & Data Flow
- **AI Canonicalization:** All raw AI responses from Gemini MUST pass through `src/services/aiCanonicalizer.ts` to ensure UI stability and schema compliance.
- **P2P Network:** The P2P network relies on `VITE_APP_URL` from the `.env` file to locate the Relay Node. 
- **API Responses:** All Express API routes MUST use standard JSON responses.

## 4. Negative Constraints (What NOT to do)
- **DO NOT** use mock data if a real backend API or P2P connection can be implemented.
- **DO NOT** modify the `dev` script in `package.json` to remove the `0.0.0.0` host binding or change the port from `3000`.
- **DO NOT** expose sensitive API keys (like Stripe Secret or Gemini API Key) to the client-side code. Always proxy them through the Express backend.
- **DO NOT** write long-winded explanations for basic React or TypeScript concepts. Be concise and action-oriented.

## 5. Agent Skills
- If you need deep architectural understanding of the Auction logic, P2P Mesh, or Escrow payments, activate the `amazebid-core` skill.
