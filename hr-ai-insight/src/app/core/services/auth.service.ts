import { Injectable, signal, computed } from '@angular/core';
import { AuthUser, AuthorizedEmployee } from '../../models';

/**
 * Mock Authentication Service  
 * Simulates user authentication and data fetching for HR AI        
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // State signals
    private readonly _currentUser = signal<AuthUser | null>(null);
    private readonly _isLoading = signal(false);
    private readonly _error = signal<string | null>(null);

    // Public computed signals
    readonly currentUser = computed(() => this._currentUser());
    readonly isLoading = computed(() => this._isLoading());
    readonly isAuthenticated = computed(() => this._currentUser() !== null);
    readonly error = computed(() => this._error());

    /**
     * Get Current User Details
     * Fast request to get basic profile and theme preferences
     */
    async getCurrentUser(): Promise<AuthUser> {
        this._isLoading.set(true);
        this._error.set(null);

        try {
            // Fast simulate network delay
            await this.delay(300);

            const mockUser: AuthUser = {
                firstName: 'משה',
                lastName: 'לוי',
                nickname: 'מושיקו',
                gender: 1,
                number: '12345',
                imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=hr-manager&backgroundColor=0c8ce9',
                departmentName: 'הנהלת משאבי אנוש',
                isDarkMode: true,
            };

            this._currentUser.set(mockUser);
            return mockUser;
        } catch (error) {
            this._error.set('שגיאה בזיהוי המשתמש.');
            throw error;
        } finally {
            this._isLoading.set(false);
        }
    }

    /**
     * Get Authorized Employees
     * Potentially slower request to fetch the list of managed employees
     */
    async getAuthorizedEmployees(): Promise<AuthorizedEmployee[]> {
        this._isLoading.set(true);

        try {
            // Slower simulate network delay
            await this.delay(2000);

            const employees: AuthorizedEmployee[] = [
                {
                    name: 'דני כהן',
                    nickname: 'דני',
                    gender: 1,
                    number: 'EMP-101',
                    imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=danny',
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
                },
                {
                    name: 'נועה ברק',
                    nickname: 'נועוש',
                    gender: 2,
                    number: 'EMP-106',
                    imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=noa',
                    hativaName: 'כספים',
                    departmentName: 'הנהלת חשבונות',
                    branchName: 'ירושלים',
                    roleName: 'חשבת'
                }
            ].map((emp, index) => ({
                ...emp,
                id: `emp-${index}`
            } as AuthorizedEmployee));

            // Update local state if needed
            const current = this._currentUser();
            if (current) {
                this._currentUser.set({ ...current, authEmployees: employees });
            }

            return employees;
        } catch (error) {
            this._error.set('שגיאה בטעינת רשימת העובדים.');
            throw error;
        } finally {
            this._isLoading.set(false);
        }
    }

    /**
     * Simulate authentication process
     */
    async authenticate(): Promise<AuthUser> {
        const user = await this.getCurrentUser();
        const employees = await this.getAuthorizedEmployees();
        return { ...user, authEmployees: employees };
    }

    /**
     * Logout the current user
     */
    logout(): void {
        this._currentUser.set(null);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
