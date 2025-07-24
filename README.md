# Pexip Conference Management Dashboard

This project is a modern, real-time web dashboard for managing Pexip video conferences. It was built by converting a static HTML/vanilla JavaScript sample into a robust React single-page application (SPA). The dashboard provides hosts with a comprehensive set of tools to control participants and conference-wide settings through the Pexip Client API v2.

The user interface is styled using the TailAdmin template, providing a professional, dark-themed, and responsive experience.

## Features

-   **Real-Time Updates:** Utilizes Server-Sent Events (SSE) to provide a live view of the conference state.
-   **Participant Roster:** View a live list of all participants in the conference.
-   **Participant-Level Controls:**
    -   Mute/Unmute Audio and Video
    -   Disconnect Participant
    -   Set Role (Host/Guest)
    -   Spotlight Participant
    -   Manage Personal Layouts (Create, Configure, Delete)
    -   Control Presentation Viewing Permissions
-   **Conference-Wide Controls:**
    -   Lock/Unlock Conference
    -   Mute/Unmute All Guests
    -   Toggle "Guests Can Unmute" Setting
    -   Set & Get Broadcast Messages
-   **Advanced Layout Management:**
    -   Override the main conference layout.
    -   Apply layout transformations (e.g., enable/disable text overlay, active speaker indication).
    -   Set and clear pre-defined pinning configurations.
-   **Live Chat:** A real-time chat panel for messaging within the conference.
-   **Presentation Viewing:** View the active presentation stream directly in the dashboard.
-   **Dial Out:** Dial a new participant into the conference.
-   **Session Management:** Automatic token refresh to maintain an active session and graceful disconnect on browser close.

## Tech Stack

-   **Frontend:** React, Vite
-   **Styling:** Tailwind CSS (using the TailAdmin template)
-   **Routing:** React Router
-   **Deployment:** Docker, Nginx (as a reverse proxy)
-   **Package Management:** Yarn / npm

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [Yarn](https://yarnpkg.com/) or npm
-   [Docker](https://www.docker.com/)
-   Access to a Pexip Infinity conference environment.

## Development Setup

To run the application locally for development:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    # Using Yarn
    yarn install
    
    # Or using npm
    npm install
    ```

3.  **Configure the Nginx Proxy:**
    For local development, you will need a local Nginx instance configured as a reverse proxy to avoid CORS issues. Create an `nginx.conf` file with the following content, replacing `internal.lorist.org` with your Pexip node's address.

    ```nginx
    server {
      listen 8080; # Or any other available port
      server_name localhost;
    
      location / {
        # Proxy requests to the Vite development server
        proxy_pass http://localhost:5173; 
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
      }
    
      location /api/ {
        proxy_pass https://confnode.company.com;;
        proxy_set_header Host confnode.company.com;
        # ... other proxy headers ...
      }
    }
    ```

4.  **Start the development server:**
    ```bash
    # Using Yarn
    yarn dev
    
    # Or using npm
    npm run dev
    ```
    The application will be running at `http://localhost:5173`, but you should access it through your Nginx proxy (e.g., `http://localhost:8080`).

## Production Deployment

This application is designed to be deployed as a Docker container, which includes the built React app and the Nginx reverse proxy.

1.  **Create `nginx.conf`:**
    In the root of your project, create a file named `nginx.conf` with the final production configuration:

    ```nginx
    server {
      listen 80;
      server_name localhost;
    
      location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
      }
    
      location /api/ {
        proxy_pass [https://internal.lorist.org](https://internal.lorist.org); # Your Pexip node address
        proxy_set_header Host internal.lorist.org;
        # ... other proxy headers ...
        proxy_buffering off; # Important for real-time events
      }
    }
    ```

2.  **Create `Dockerfile`:**
    In the root of your project, create a file named `Dockerfile` with the following content:

    ```dockerfile
    # Stage 1: Build the React App
    FROM node:lts-alpine AS builder
    WORKDIR /app
    COPY package.json yarn.lock ./
    RUN yarn install --frozen-lockfile
    COPY . .
    RUN yarn build
    
    # Stage 2: Serve the App with Nginx
    FROM nginx:stable-alpine
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80
    ```

3.  **Build the Docker Image:**
    From your project's root directory, run:
    ```bash
    docker build -t pexip-dashboard .
    ```

4.  **Run the Docker Container:**
    ```bash
    docker run -d -p 8080:80 --name pexip-dashboard-container pexip-dashboard
    ```
    The application will now be accessible at `http://localhost:8080`.

## Project Structure

````

/
├── dist/               \# Production build output
├── node\_modules/       \# Project dependencies
├── src/
│   ├── components/     \# Reusable UI components
│   │   ├── conference/ \# Components specific to the conference dashboard
│   │   └── forms/      \# The main connection form
│   ├── layout/         \# Main dashboard layout (from TailAdmin)
│   ├── App.jsx         \# Main application component (state and logic)
│   └── main.jsx        \# Application entry point
├── Dockerfile          \# Instructions for building the production container
├── nginx.conf          \# Nginx configuration for the reverse proxy
└── package.json        \# Project metadata and dependencies
