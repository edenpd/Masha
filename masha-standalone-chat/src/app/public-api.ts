/**
 * Public API for Masha Standalone Chat
 * Import from this file when using the chat component in other projects
 */

// Main Component
export { MashaChatComponent } from './components/masha-chat.component';

// Models & Interfaces
export type {
    MashaChatConfig,
    AuthUser,
    AuthorizedEmployee,
    EmployeeData,
    ChatMessage,
    TimeOffRequest,
    SalaryRecord,
    AppState,
    LoadingStep
} from './models';

// Services
export { CohereService } from './services/cohere.service';

// Store
export { ChatStore } from './store/chat.store';
