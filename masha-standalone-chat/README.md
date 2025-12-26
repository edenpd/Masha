# Masha Standalone Chat

A standalone, configurable AI chat component extracted from the hr-ai-insight project. Built with Angular 21, Signals, and Tailwind CSS with full RTL (Hebrew) support.

## Features

✨ **Dual Mode Support**
- **Embedded Mode**: Full-page chat interface
- **Popover Mode**: Floating chat button with popup window

🎨 **Modern Design**
- Beautiful gradient UI with glassmorphism effects
- Dark/Light theme support
- Smooth animations and transitions
- Full RTL (Right-to-Left) support for Hebrew

🤖 **AI-Powered**
- Cohere API integration with streaming responses
- Tool calling support for data fetching
- Context-aware conversations
- Mock mode for testing without API key

⚡ **Built with Modern Stack**
- Angular 21 with Standalone Components
- @ngrx/signals for state management
- Tailwind CSS for styling
- TypeScript 5.9

## Installation

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Usage

### Basic Setup

```typescript
import { MashaChatComponent } from './components/masha-chat.component';
import { MashaChatConfig } from './models';

// In your component
config: MashaChatConfig = {
  apiKey: 'YOUR_COHERE_API_KEY',
  modelName: 'command-a-03-2025',
  mode: 'embedded', // or 'popover'
  dimensions: {
    width: '100%',
    height: '600px'
  },
  currentUser: {
    firstName: 'John',
    lastName: 'Doe',
    nickname: 'John',
    gender: 1,
    number: '12345',
    imageUrl: 'https://example.com/avatar.jpg',
    departmentName: 'HR',
    isDarkMode: false
  },
  authorizedEmployees: [
    // Array of employees the user can query
  ]
};
```

### Embedded Mode

```html
<masha-chat [config]="config" />
```

### Popover Mode

```typescript
config: MashaChatConfig = {
  ...otherConfig,
  mode: 'popover',
  dimensions: {
    width: '400px',
    height: '600px'
  }
};
```

```html
<masha-chat [config]="config" />
```

The chat will appear as a floating button in the bottom-left corner.

## Configuration Options

### MashaChatConfig Interface

```typescript
export interface MashaChatConfig {
  // Required
  apiKey: string;                    // Cohere API key
  
  // Optional
  modelName?: string;                // Default: 'command-a-03-2025'
  systemPrompt?: string;             // Custom system prompt
  tools?: any[];                     // Custom tools for AI
  
  // UI Configuration
  mode?: 'embedded' | 'popover';     // Default: 'embedded'
  dimensions?: {
    width?: string;                  // CSS width value
    height?: string;                 // CSS height value
  };
  showAvatars?: boolean;             // Show user avatars
  currentUserPhoto?: string;         // Custom user photo URL
  theme?: {
    primaryColor?: string;           // Custom primary color
    backgroundColor?: string;        // Custom background color
  };
  
  // Data
  currentUser?: AuthUser;            // Current logged-in user
  authorizedEmployees?: AuthorizedEmployee[];  // Employees to query
}
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── chat-window/          # Main chat window
│   │   ├── message-list/         # Message display component
│   │   ├── message-input/        # Input component
│   │   └── masha-chat.component.ts  # Main configurable component
│   ├── models/
│   │   └── index.ts              # TypeScript interfaces
│   ├── services/
│   │   ├── cohere.service.ts     # AI service
│   │   └── mock-data.service.ts  # Mock data for testing
│   ├── store/
│   │   └── chat.store.ts         # Signal store for state
│   └── app.ts                    # Demo application
├── styles.scss                   # Global styles
└── index.html                    # HTML template
```

## Key Components

### MashaChatComponent
The main component that accepts configuration and renders the chat interface.

### ChatStore
SignalStore managing:
- Chat messages
- User state
- Processing state
- Theme
- Popover state

### CohereService
Handles:
- AI streaming responses
- Tool calling
- Mock responses for testing
- Request cancellation

## Customization

### Changing Colors

Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  'neural': { /* your colors */ },
  'synapse': { /* your colors */ },
  'matrix': { /* your colors */ }
}
```

### Adding Custom Tools

Configure the Cohere service with a tool callback:

```typescript
cohereService.configure(
  apiKey,
  modelName,
  async (toolName: string, parameters: any) => {
    if (toolName === 'your_custom_tool') {
      return await yourDataFetcher(parameters);
    }
    return null;
  }
);
```

## Mock Mode

If no valid API key is provided, the chat automatically switches to mock mode with simulated responses. Perfect for development and testing!

## RTL Support

The entire application is built with RTL (Right-to-Left) support for Hebrew:
- All text flows from right to left
- Layouts are mirrored appropriately
- Hebrew fonts (Heebo) are loaded by default

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Future Library Conversion

This project is structured to be easily converted into an Angular library:
1. All components are standalone
2. Clear public API through MashaChatComponent
3. Configurable through MashaChatConfig
4. No hard dependencies on external services

## License

MIT

## Credits

Extracted and refactored from the hr-ai-insight project.
Built with ❤️ using Angular and Cohere AI.
