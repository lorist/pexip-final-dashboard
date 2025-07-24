# Pexip Conference Management Dashboard

This project is a modern, real-time web dashboard for managing Pexip video conferences. It was built by converting a static HTML/vanilla JavaScript sample into a robust React single-page application (SPA). The dashboard provides hosts with a comprehensive set of tools to control participants and conference-wide settings through the **Pexip Client API v2**.

The user interface is styled using the **TailAdmin** template, providing a professional, dark-themed, and responsive experience.
![alt connect to vmr](https://github.com/lorist/pexip-final-dashboard/blob/event-sink-addition/image1.png)
![alt active vmrs](https://github.com/lorist/pexip-final-dashboard/blob/event-sink-addition/image2.png)
![alt vmr control]([http://url/to/img.png](https://github.com/lorist/pexip-final-dashboard/blob/event-sink-addition/image3.png)
## Features

- **Real-Time Updates**: Utilizes Server-Sent Events (SSE) to provide a live view of the conference state.
- **Participant Roster**: View a live list of all participants in the conference.
- **Participant-Level Controls**:
  - Mute/Unmute Audio and Video  
  - Disconnect Participant  
  - Set Role (Host/Guest)  
  - Spotlight Participant  
  - Manage Personal Layouts (Create, Configure, Delete)  
  - Control Presentation Viewing Permissions
- **Conference-Wide Controls**:
  - Lock/Unlock Conference  
  - Mute/Unmute All Guests  
  - Toggle "Guests Can Unmute" Setting  
  - Set & Get Broadcast Messages
- **Advanced Layout Management**:
  - Override the main conference layout  
  - Apply layout transformations (e.g., enable/disable text overlay, active speaker indication)  
  - Set and clear pre-defined pinning configurations
- **Live Chat**: A real-time chat panel for messaging within the conference.
- **Dial Out**: Dial a new participant into the conference.
- **Session Management**: Automatic token refresh to maintain an active session and graceful disconnect on browser close.
- **Active Conferences Overview**: A dedicated page to view all active conferences, including participant details, with a direct link to manage a conference.
- ~~Role-Based Information~~ (Removed as per user request)  
- ~~Presentation Display~~ (Removed as per user request)

## Tech Stack

- **Frontend**: React, Vite, React Router  
- **Styling**: Tailwind CSS (using the TailAdmin template)  
- **Backend**: Node.js (Express.js)  
- **Database**: SQLite (for persistent conference/participant data)  
- **Real-time Communication**: Redis (Pub/Sub for internal event broadcasting), Server-Sent Events (SSE)  
- **Deployment**: Docker, Docker Compose, Nginx (as a reverse proxy)  
- **Package Management**: Yarn / npm

## Prerequisites

Ensure you have the following installed:

- Node.js (LTS version recommended)  
- Yarn or npm  
- Docker  
- Access to a Pexip Infinity conference environment

## Project Structure

```
.
├── backend/                  # Node.js Express backend service
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── conference/
│   │   │   ├── dashboard/
│   │   │   └── forms/
│   │   ├── layout/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml
├── .dockerignore
├── package.json
└── README.md
```

## Development Setup (Using Docker Compose)

The easiest way to run this application locally is using **Docker Compose**.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

### 2. Create `Dockerfile.frontend`

Create a file `frontend/Dockerfile.frontend` with the following content:

```dockerfile
# Stage 1: Build the React App
FROM node:lts-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ .
RUN yarn build

# Stage 2: Serve the App with Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 3. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - PEXIP_UPSTREAM_URL=https://node.yourcompany.com
    depends_on:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DB_PATH=/app/data/pexip_events.db
    volumes:
      - backend_data:/app/data
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: "redis:7-alpine"
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  backend_data:
```

Edit the nginx.conf file to set your Infinity node: `set $upstream_pexip`

### 4. Build and Run

```bash
docker-compose up --build -d
```

This will:

- Build the frontend and backend Docker images  
- Pull the Redis image  
- Create Docker network and volume  
- Start all services in detached mode

## Access the Application

- Dashboard: [http://localhost](http://localhost)  
- Active Conferences: [http://localhost/active-conferences](http://localhost/active-conferences)  
- Login: [http://localhost/login](http://localhost/login)

## Pexip Infinity Configuration (for Event Sink)

To enable real-time updates:

1. In Pexip Manager, go to **Conferencing Policy > Event Sinks**
2. Create a new **Event Sink**
3. Set the URL to:  
   `http://<YOUR_HOST_IP_OR_DOMAIN>/pexip-events-webhook`  
   Replace with your accessible backend host URL.
4. Select relevant event types:
   - `conference_started`  
   - `conference_ended`  
   - `conference_updated`  
   - `participant_connected`  
   - `participant_updated`  
   - `participant_disconnected`

## Testing Persistence

1. Start a conference in Pexip Infinity.  
2. Visit [http://localhost/active-conferences](http://localhost/active-conferences).  
   The conference should appear.
3. Stop containers:

```bash
docker-compose down
```

4. Restart containers:

```bash
docker-compose up -d
```

5. Refresh your browser — the conference should still appear.  
6. End the conference in Pexip Infinity — it should disappear.
