# GitHub Deployer Service (SPA Edition)

This is a Node.js web application built as a **Single Page Application (SPA)**. It allows users to connect their GitHub accounts, view their repositories, and simulate deploying them. The frontend is rendered entirely in the browser, while \`server.js\` acts as a backend API.

The application features a futuristic-themed dark UI.

## Architecture

- **Frontend (SPA):**
    - Managed by \`public/index.html\`, \`public/js/app.js\`, and \`public/css/style.css\`.
    - Client-side JavaScript handles UI rendering, hash-based routing, state management, and API interactions.
- **Backend (API Server):**
    - \`server.js\` using Express.js.
    - Serves the static SPA files (from the \`public\` directory).
    - Provides API endpoints for GitHub OAuth authentication (\`/auth/*\`) and data fetching (\`/api/*\`, e.g., user info, repositories).

## Prerequisites

- Node.js (v14.x or later recommended)
- npm (usually comes with Node.js)
- A GitHub account
- A GitHub OAuth Application

## Setup Instructions

1.  **Clone the Repository** (if applicable)
    \`\`\`bash
    # git clone <repository_url>
    # cd github-deployer-spa
    \`\`\`
    (For this environment, the files are already present.)

2.  **Install Dependencies**
    Navigate to the project directory and run:
    \`\`\`bash
    npm install
    \`\`\`

## Configuration

This application requires GitHub OAuth credentials and a session secret for the backend server. It's highly recommended to configure these using environment variables.

### 1. Create a GitHub OAuth App

- Go to your GitHub account settings.
- Navigate to "Developer settings" > "OAuth Apps".
- Click "New OAuth App".
- **Application name:** Anything you like (e.g., "My SPA Deployer").
- **Homepage URL:** \`http://localhost:3000\` (or your deployment URL).
- **Authorization callback URL:** \`http://localhost:3000/auth/github/callback\` (or your deployment URL + \`/auth/github/callback\`).
- After creation, you will get a **Client ID** and generate a **Client Secret**.

### 2. Set Environment Variables

Create a \`.env\` file in the root of your project (optional, for local development if you use a library like \`dotenv\`) or set the environment variables directly in your shell or deployment environment:

\`\`\`
GITHUB_CLIENT_ID="YOUR_GITHUB_APP_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_APP_CLIENT_SECRET"
SESSION_SECRET="A_VERY_STRONG_RANDOM_STRING_FOR_SESSIONS"
PORT="3000" # Optional, defaults to 3000
# NODE_ENV="production" # Optional, set to production for secure cookies by server.js
\`\`\`

- Replace placeholders with your actual GitHub OAuth App Client ID, Client Secret, and a strong random string for the session secret.
- The application includes fallback credentials in \`server.js\` for convenience during initial development, but these **should not be used for a deployed application**. You will see warnings in the console if default values are used.

## Running the Application

Once dependencies are installed and environment variables are set:

1.  **Start the server:**
    \`\`\`bash
    npm start
    \`\`\`
    This will run the command \`node server.js\`, which starts the backend server.

2.  **Access the application:**
    Open your web browser and go to \`http://localhost:3000\` (or the port you configured). The \`server.js\` will serve the \`index.html\` SPA.

## Usage

1.  The application loads, and if you're not authenticated, you'll see a login page.
2.  Click "Login with GitHub".
3.  You will be redirected to GitHub to authorize the application.
4.  After authorization, you will be redirected back to the application. Client-side JavaScript will detect your authenticated state and typically navigate you to the repositories view.
5.  A list of your GitHub repositories will be displayed.
6.  You can click the "Deploy" button next to a repository. This will simulate a deployment process with on-screen feedback (client-side).

## Project Structure

- \`server.js\`: Main backend server file (Express.js). Handles API requests, authentication, and serves static SPA files.
- \`package.json\`: Project metadata and dependencies.
- \`routes/\`: Contains backend route handlers.
    - \`auth.js\`: Handles GitHub OAuth authentication flow.
    - \`api.js\`: Handles API requests (e.g., fetching user info, repositories).
- \`public/\`: Contains all static assets and the SPA itself.
    - \`index.html\`: The main HTML file for the SPA.
    - \`js/app.js\`: Client-side JavaScript application logic (routing, rendering, API calls).
    - \`css/style.css\`: Stylesheets for the application.
- \`README.md\`: This file.

Enjoy using the GitHub Deployer SPA!
