/**
 * Authenticated User Model
 */
export interface AuthUser {
    userId: string;
    name: string;
    photoUrl: string;
    role?: string;
}

/**
 * Authorized Employee - employees the user can query
 */
export interface AuthorizedEmployee {
    id: string;
    name: string;      // Full name in Hebrew e.g., "דני כהן"
    nickname?: string; // Short name e.g., "דני"
    photoUrl: string;
    department?: string;
    role?: string;
}

/**
 * Full Employee Data - detailed information
 */
export interface EmployeeData {
    id: string;
    personalInfo: {
        name: string;
        nickname?: string;
        email: string;
        phone: string;
        address: string;
        birthDate: string;
        startDate: string;
        department: string;
        role: string;
        manager: string;
        photoUrl: string;
    };
    timeOff: {
        vacationBalance: number;
        sickLeaveBalance: number;
        vacationUsed: number;
        sickLeaveUsed: number;
        personalDays: number;
        pendingRequests: TimeOffRequest[];
    };
    salaryHistory: SalaryRecord[];
    performanceRating?: number;
}

export interface TimeOffRequest {
    id: string;
    type: 'vacation' | 'sick' | 'personal';
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
}

export interface SalaryRecord {
    year: number;
    month: number;
    grossSalary: number;
    netSalary: number;
    bonus?: number;
}

/**
 * Chat Message Model
 */
export interface ChatMessage {
    id: string;
    content: string;
    type: 'user' | 'assistant' | 'system';
    timestamp: Date;
    isTyping?: boolean;
    relatedEmployee?: AuthorizedEmployee;
}

/**
 * App State Enum
 */
export type AppState = 'initializing' | 'authenticating' | 'loading-data' | 'ready' | 'error';

/**
 * Loading Step for animation
 */
export interface LoadingStep {
    id: string;
    text: string;
    completed: boolean;
    icon: string;
}
