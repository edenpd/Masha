/**
 * Authenticated User Model
 */
export interface AuthUser {
    firstName: string;
    lastName: string;
    nickname: string;
    gender: 1 | 2; // 1 = Male, 2 = Female
    number: string;
    imageUrl: string;
    departmentName: string;
    isDarkMode: boolean; // Add dark mode preference
    authEmployees?: AuthorizedEmployee[];
}

/**
 * Authorized Employee - employees the user can query
 */
export interface AuthorizedEmployee {
    name: string;
    nickname: string;
    gender: 1 | 2;
    number: string;
    imageUrl: string;
    hativaName: string;
    departmentName: string;
    branchName: string;
    roleName: string;
    id?: string;
}

/**
 * Full Employee Data - detailed information
 */
export interface EmployeeData {
    id: string;
    personalInfo: {
        name: string;
        firstName?: string;
        lastName?: string;
        nickname: string;
        gender: 1 | 2;
        number: string;
        email: string;
        phone: string;
        address: string;
        birthDate: string;
        startDate: string;
        hativaName: string;
        departmentName: string;
        branchName: string;
        roleName: string;
        manager: string;
        imageUrl: string;
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
