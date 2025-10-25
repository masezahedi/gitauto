# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Node.js application for automating GitHub tasks. The backend is built with Express.js and the frontend with React and Vite. It uses PostgreSQL for the database and Redis for caching and job queuing with BullMQ.

## Commands

### Development

- **Install dependencies**: `npm install`
- **Run frontend and backend concurrently**: `npm run dev`
- **Run backend only**: `npm run server`
- **Run frontend only**: `npm run client`

### Building and Production

- **Build for production**: `npm run build`
- **Run in production mode**: `npm run start`
- **Preview the production build**: `npm run preview`

## Code Architecture

The codebase is structured into two main parts: a server-side application and a client-side application.

### Backend (`src/server`)

The backend is an Express.js application responsible for handling API requests, authentication, and automation jobs.

- **`src/server/controllers`**: Contains the business logic for handling requests.
- **`src/server/routes`**: Defines the API endpoints and maps them to the corresponding controllers.
- **`src/server/jobs`**: Includes the scheduler and workers for handling asynchronous automation tasks using BullMQ.
- **`src/server/utils`**: Provides utility functions for database interactions, Redis caching, and Git operations.

### Frontend (`src/client`)

The frontend is a React application built with Vite that provides the user interface for the application.

- **`src/client/pages`**: Contains the main pages of the application.
- **`src/client/components`**: Contains reusable UI components.
- **`src/client/utils`**: Includes utility functions and helpers for the frontend.
