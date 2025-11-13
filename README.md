# HeartGarden 💚

A mobile app designed to help users heal from breakups through guided activities and AI companion support.

## Features

- **AI Companion (Aegis)**: Chat with an empathetic AI companion powered by OpenAI that guides you through healing activities
- **Garden System**: Grow virtual seeds by completing healing tasks
- **Activity Categories**: 
  - Exercise
  - Emotional wellness
  - Social connection
  - Healthy eating
  - Sleep

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure API Key**

Create a `Secrets.js` file in the root directory:
```javascript
export const OPENAI_API_KEY = "your-openai-api-key-here";
```

3. **Run the app**
```bash
npm start
```

## Technology Stack

- React Native
- Expo
- React Navigation
- OpenAI API

## Project Structure

- `Home.js` - Main chat interface with AI companion
- `Garden.js` - Virtual garden display
- `Task.js` - Task list for different activity types
- `SeedsContext.js` - State management for seeds
- `Secrets.js` - API key configuration (not tracked in git)

## Security Note

Never commit your `Secrets.js` file. It's already added to `.gitignore` to prevent accidental exposure of your API key.

