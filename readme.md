# Drone Survey Backend

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Setup and Installation](#setup-and-installation)
4. [Running the Application](#running-the-application)
5. [Design Decisions and Architecture](#design-decisions-and-architecture)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [AI Tools Integration](#ai-tools-integration)

---

## Project Overview
The Drone Survey Backend is a RESTful API designed to manage drone-based survey operations. It handles user authentication, drone management, survey data storage, and analytics.

---
![alt text](<Drone survey management system design.drawio.svg>)
---
## Project Structure
```
/drone-survey-backend
├── src
|   ├── config
|   |    ├── db.js
│   |    └── Keys.js
|   |
|   | 
│   ├── controllers
|   ├── middleware
│   ├── models
│   ├── routes
│   ├── sockets
│   ├── types
│   ├── utils
│   ├── validators
│   └── index.ts
│
│
├── package.json
├── .gitIgnore
└── readme.md
```

- **`src/config`**: Configuration files for database and environment variables.
- **`src/controllers`**: Contains logic for handling API requests.
- **`src/middlewares`**: Middleware functions for request validation and authentication.
- **`src/models`**: Defines database schemas and models.
- **`src/routes`**: Maps endpoints to controllers.
- **`src/sockets`**: Contains socket-related logic for real-time communication.
- **`src/types/express`**: Type definitions for Express middleware.
- **`src/utils`**: Utility functions for various tasks.
- **`src/validators`**: Zod schema validators for request data validation.
- **`src/index.ts`**: Entry point of the application.
- **`package.json`**: Contains project metadata and dependencies.
- **`.gitIgnore`**: Specifies files and directories to be ignored by Git.
- **`readme.md`**: Documentation for the project.
- **`tsconfig.json`**: TypeScript configuration file.

---

## Setup and Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/pavansingh888/drone-survey-management-system-Flytbase.git
    cd drone-survey-backend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Configure environment variables:
    - Create a `.env` file in the root directory.
    - Add the following variables:
      ```
      PORT=5000
      MONGO_URI=<your_mongo_uri> 
      JWT_SECRET=<your_jwt_secret>
      NODE_ENV=<development/production>
      ROOM_SECRET=<your_room_secret>
      ```

---

## Running the Application

- Start the development server:
  ```bash
  npm run dev
  ```
---

## Design Decisions and Architecture

1. **Modular Architecture**: The project is divided into controllers, models, routes, middleware, and validators to ensure separation of concerns and scalability.
2. **Database**: MongoDB is used for its flexibility in handling unstructured survey data with indexing capabilities for efficient querying.
3. **Authentication**: Bcrypt is used for password hashing, and JWT is used for token-based authentication.
4. **Error Handling**: try-catch blocks are implemented to handle errors gracefully and provide meaningful feedback to users.
5. **Typescript**: The project is built using TypeScript for type safety and better development experience.
6. **Socket.io**: Real-time communication is implemented using Socket.io for live updates and notifications.
7. **Zod**: Zod is used for request validation to ensure data integrity and prevent invalid data from being processed.
8. **Environment Variables**: dotenv is used to manage environment variables for different environments (development, production).
9. **Cron jobs**: Used for scheduling tasks such as scheduling drone surveys.


---

## Database Models

### Drone
```javascript
{
  id: String,
  name: String,
  location: String,
  status: 'available' | 'in-mission' | 'maintenance',
  batteryLevel: Number, // 0 to 100
  isActive: Boolean,
  currentMissionId: String | null,
  createdAt: Date,
  updatedAt: Date
}
```


### Mission
```javascript
{
  id: String,
  name: String,
  location: String,
  flightPath: [
    {
      lat: Number,
      lng: Number,
      altitude: Number
    }
  ],
  pattern: 'crosshatch' | 'perimeter' | 'custom',
  dataCollectionFrequency: Number, // in minutes
  sensors: [String],
  altitude: Number,
  overlap: Number,
  schedule: {
    type: 'one-time' | 'recurring',
    cron: String,
    date: Date
  },
  createdBy: String, // userId
  createdAt: Date,
  updatedAt: Date
}
```

### MissionStatus/LaunchedMissions
```javascript
{
  id: String,
  mission: String,
  droneId: String | null,
  status: 'not_started' | 'starting' | 'in_progress' | 'paused' | 'completed' | 'aborted',
  progress: Number, // percentage
  estimatedTimeRemaining: Number | null, // in minutes
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Survey Report
```javascript
{
  id: String,
  missionId: String,
  droneId: String,
  duration: Number, // in minutes
  distance: Number, // in meters/km
  coverage: Number, // in square meters/hectares
  status: 'completed' | 'failed',
  generatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### User
```javascript
{
  id: String,
  name: String,
  email: String,
  password: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication
- **POST /api/auth/signup**: Register a new user.
- **POST /api/auth/signin**: Authenticate a user.

### Drones
- **GET /api/drones**: List all drones.
- **GET /api/drones/:id**: Get drone details by ID.
- **POST /api/drones**: Add a new drone.
- **PUT /api/drones/:id**: Update drone details.
- **DELETE /api/drones/:id**: Remove a drone.

### Missions
- **GET /api/missions**: List all missions.
- **GET /api/missions/:id**: Get mission details.
- **POST /api/missions**: Create a new mission.
- **DELETE /api/missions/:id**: Delete a mission.

### Mission Status
- **POST /api/mission-status/create**: Launch a mission.
- **GET /api/mission-status/:id**: Get mission status.
- **PUT /api/mission-status/:id**: Update mission status.

### Reports
- **GET /api/reports**: List all reports.
- **GET /api/reports/:id**: Get report details.
- **POST /api/reports**: Create a mock survey report.
- **GET /api/reports/statistics**: Get report statistics.

---

## AI Tools Integration

1. **Code Assistance**:
    - Used ChatGPT, Claude, GitHub Copilot for faster development and code suggestions.
    - Impact: Reduced development time and improved code quality.


---