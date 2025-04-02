
# HomiAI – Smart Inventory Prototype

This is the first prototype (MVP) of **HomiAI**, a local-first smart assistant that helps users manage personal inventory and reminders at home.

## 🧠 What It Does

- Add items with:
  - Name, room, furniture
  - Quantity, status, tags
- Add reminders with:
  - Title, due date, priority, type
- Data is **stored locally** (via `localforage`) and **persisted across reloads**
- Uses Zustand store for efficient global state
- Tags & filters are supported
- Built with React / Next.js + Tailwind

## ⚙️ Tech Stack

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [localForage](https://github.com/localForage/localForage)
- [uuid](https://github.com/uuidjs/uuid)
- [immer](https://github.com/immerjs/immer)
- [TailwindCSS](https://tailwindcss.com/)

## 🚀 Getting Started

To run the app locally:

```bash
npm install
npm run dev
```
