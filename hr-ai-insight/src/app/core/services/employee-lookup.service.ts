import { Injectable } from '@angular/core';
import { AuthorizedEmployee } from '../../models';

/**
 * Mock Employee Lookup Service
 * Provides list of authorized employees the current user can query
 */
@Injectable({
    providedIn: 'root'
})
export class EmployeeLookupService {

    /**
     * Mock list of authorized employees with Hebrew names
     */
    private readonly mockEmployees: AuthorizedEmployee[] = [
        {
            id: '1',
            name: 'דני כהן',
            nickname: 'דני',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=dani&backgroundColor=059669',
            department: 'פיתוח',
            role: 'מפתח בכיר'
        },
        {
            id: '2',
            name: 'שרה לוי',
            nickname: 'שרה',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=sarah&backgroundColor=d946ef',
            department: 'שיווק',
            role: 'מנהלת שיווק'
        },
        {
            id: '3',
            name: 'יוסי אברהם',
            nickname: 'יוסי',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=yossi&backgroundColor=f59e0b',
            department: 'מכירות',
            role: 'איש מכירות'
        },
        {
            id: '4',
            name: 'מיכל רוזנברג',
            nickname: 'מיכל',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=michal&backgroundColor=ec4899',
            department: 'משאבי אנוש',
            role: 'רכזת גיוס'
        },
        {
            id: '5',
            name: 'אבי גולדשטיין',
            nickname: 'אבי',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=avi&backgroundColor=6366f1',
            department: 'פיתוח',
            role: 'ארכיטקט תוכנה'
        },
        {
            id: '6',
            name: 'נועה בן דוד',
            nickname: 'נועה',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=noa&backgroundColor=14b8a6',
            department: 'עיצוב',
            role: 'מעצבת UX'
        },
        {
            id: '7',
            name: 'עמית פרידמן',
            nickname: 'עמית',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=amit&backgroundColor=8b5cf6',
            department: 'כספים',
            role: 'חשב'
        },
        {
            id: '8',
            name: 'רונית שפירא',
            nickname: 'רונית',
            photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=ronit&backgroundColor=f43f5e',
            department: 'תפעול',
            role: 'מנהלת תפעול'
        }
    ];

    /**
     * Fetch all authorized employees
     * Simulates API call with delay
     */
    async getAuthorizedEmployees(): Promise<AuthorizedEmployee[]> {
        // Simulate network delay
        await this.delay(1500);
        return [...this.mockEmployees];
    }

    /**
     * Fuzzy search for employee by name or nickname
     * Supports partial Hebrew matching
     */
    findEmployee(query: string, employees: AuthorizedEmployee[]): AuthorizedEmployee | null {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) return null;

        // First, try exact match on name or nickname
        let found = employees.find(emp =>
            emp.name === normalizedQuery ||
            emp.nickname?.toLowerCase() === normalizedQuery
        );

        if (found) return found;

        // Then try partial match
        found = employees.find(emp =>
            emp.name.includes(normalizedQuery) ||
            emp.nickname?.includes(normalizedQuery) ||
            normalizedQuery.includes(emp.name) ||
            (emp.nickname && normalizedQuery.includes(emp.nickname))
        );

        if (found) return found;

        // Fuzzy match - check if any word in query matches
        const queryWords = normalizedQuery.split(/\s+/);
        for (const word of queryWords) {
            if (word.length < 2) continue;

            found = employees.find(emp =>
                emp.name.includes(word) ||
                emp.nickname?.includes(word)
            );

            if (found) return found;
        }

        return null;
    }

    /**
     * Extract employee name from natural language query
     */
    extractEmployeeFromQuery(query: string, employees: AuthorizedEmployee[]): AuthorizedEmployee | null {
        // Common Hebrew question patterns to remove
        const patterns = [
            /כמה ימי חופש(ה)? (יש ל|נשארו ל|של)/,
            /מה (ה)?שכר (של|ל)/,
            /מה (ה)?משכורת (של|ל)/,
            /כמה ימי מחלה (יש ל|נשארו ל|של)/,
            /תן לי מידע על/,
            /ספר לי על/,
            /מי (זה|זאת)/,
            /מתי התחיל(ה)? לעבוד/,
            /באיזה מחלקה עובד(ת)?/,
        ];

        let cleanedQuery = query;

        // Try to find employee name in original query first
        for (const emp of employees) {
            if (query.includes(emp.name) || (emp.nickname && query.includes(emp.nickname))) {
                return emp;
            }
        }

        // Clean query and try again
        for (const pattern of patterns) {
            cleanedQuery = cleanedQuery.replace(pattern, '');
        }

        cleanedQuery = cleanedQuery.replace(/[?؟.,!]/g, '').trim();

        return this.findEmployee(cleanedQuery, employees);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
