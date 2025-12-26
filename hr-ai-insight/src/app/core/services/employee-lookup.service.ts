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
            name: 'דני כהן',
            nickname: 'דני',
            gender: 1,
            number: 'EMP-101',
            imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=dany',
            hativaName: 'טכנולוגיה',
            departmentName: 'פיתוח',
            branchName: 'תל אביב',
            roleName: 'מפתח בכיר'
        },
        {
            name: 'שרה לוי',
            nickname: 'שרה',
            gender: 2,
            number: 'EMP-102',
            imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=sarah',
            hativaName: 'מטה',
            departmentName: 'שיווק',
            branchName: 'תל אביב',
            roleName: 'מנהלת שיווק'
        },
        {
            name: 'יוסי אברהם',
            nickname: 'יוסי',
            gender: 1,
            number: 'EMP-103',
            imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=yossi',
            hativaName: 'מכירות',
            departmentName: 'מכירות פנים',
            branchName: 'חיפה',
            roleName: 'איש מכירות'
        },
        {
            name: 'מיכל רוזנברג',
            nickname: 'מיכל',
            gender: 2,
            number: 'EMP-104',
            imageUrl: 'https://api.dicebear.com/7.x/bitmoji/svg?seed=michal',
            hativaName: 'מטה',
            departmentName: 'משאבי אנוש',
            branchName: 'נתניה',
            roleName: 'רכזת גיוס'
        },
        {
            name: 'אבי גולדשטיין',
            nickname: 'אבי',
            gender: 1,
            number: 'EMP-105',
            imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=avi',
            hativaName: 'טכנולוגיה',
            departmentName: 'פיתוח',
            branchName: 'תל אביב',
            roleName: 'ארכיטקט תוכנה'
        }
    ];

    /**
     * Fetch all authorized employees
     * Simulates API call with delay
     */
    async getAuthorizedEmployees(): Promise<AuthorizedEmployee[]> {
        // Simulate network delay
        await this.delay(1000);
        return this.mockEmployees.map((e, idx) => ({ ...e, id: `emp-${idx}` }));
    }

    /**
     * Fuzzy search for employee by name
     * Supports partial Hebrew matching
     */
    findEmployee(query: string, employees: AuthorizedEmployee[]): AuthorizedEmployee | null {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) return null;

        // First, try exact match on name
        let found = employees.find(emp =>
            emp.name === normalizedQuery
        );

        if (found) return found;

        // Then try partial match
        found = employees.find(emp =>
            emp.name.toLowerCase().includes(normalizedQuery) ||
            normalizedQuery.includes(emp.name.toLowerCase())
        );

        if (found) return found;

        // Fuzzy match - check if any word in query matches
        const queryWords = normalizedQuery.split(/\s+/);
        for (const word of queryWords) {
            if (word.length < 2) continue;

            found = employees.find(emp =>
                emp.name.toLowerCase().includes(word)
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
            if (query.toLowerCase().includes(emp.name.toLowerCase())) {
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
