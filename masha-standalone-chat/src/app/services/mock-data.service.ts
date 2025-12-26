import { Injectable } from '@angular/core';
import { AuthUser, AuthorizedEmployee, EmployeeData } from '../models';

/**
 * Mock Data Service
 * Provides sample data for testing the chat component
 */
@Injectable({
    providedIn: 'root'
})
export class MockDataService {

    /**
     * Get mock current user
     */
    getCurrentUser(): AuthUser {
        return {
            firstName: 'שרה',
            lastName: 'כהן',
            nickname: 'שרה',
            gender: 2,
            number: '12345',
            imageUrl: 'https://i.pravatar.cc/150?img=47',
            departmentName: 'משאבי אנוש',
            isDarkMode: false
        };
    }

    /**
     * Get mock authorized employees
     */
    getAuthorizedEmployees(): AuthorizedEmployee[] {
        return [
            {
                name: 'דוד לוי',
                nickname: 'דודו',
                gender: 1,
                number: '10001',
                imageUrl: 'https://i.pravatar.cc/150?img=12',
                hativaName: 'חטיבת טכנולוגיה',
                departmentName: 'פיתוח',
                branchName: 'מרכז',
                roleName: 'מפתח בכיר',
                id: 'emp-001'
            },
            {
                name: 'רחל אברהם',
                nickname: 'רחלי',
                gender: 2,
                number: '10002',
                imageUrl: 'https://i.pravatar.cc/150?img=45',
                hativaName: 'חטיבת שיווק',
                departmentName: 'שיווק דיגיטלי',
                branchName: 'מרכז',
                roleName: 'מנהלת שיווק',
                id: 'emp-002'
            },
            {
                name: 'יוסי מזרחי',
                nickname: 'יוסי',
                gender: 1,
                number: '10003',
                imageUrl: 'https://i.pravatar.cc/150?img=33',
                hativaName: 'חטיבת מכירות',
                departmentName: 'מכירות ארגוניות',
                branchName: 'צפון',
                roleName: 'נציג מכירות',
                id: 'emp-003'
            },
            {
                name: 'מיכל שפירא',
                nickname: 'מיכל',
                gender: 2,
                number: '10004',
                imageUrl: 'https://i.pravatar.cc/150?img=48',
                hativaName: 'חטיבת משאבי אנוש',
                departmentName: 'גיוס',
                branchName: 'מרכז',
                roleName: 'מגייסת',
                id: 'emp-004'
            },
            {
                name: 'אבי כהן',
                nickname: 'אבי',
                gender: 1,
                number: '10005',
                imageUrl: 'https://i.pravatar.cc/150?img=15',
                hativaName: 'חטיבת כספים',
                departmentName: 'חשבונאות',
                branchName: 'מרכז',
                roleName: 'רואה חשבון',
                id: 'emp-005'
            }
        ];
    }

    /**
     * Get detailed employee data by ID
     */
    async getEmployeeData(employeeId: string): Promise<EmployeeData | null> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const employees = this.getAuthorizedEmployees();
        const employee = employees.find(e => e.id === employeeId);

        if (!employee) return null;

        return {
            id: employee.id!,
            personalInfo: {
                name: employee.name,
                firstName: employee.name.split(' ')[0],
                lastName: employee.name.split(' ')[1],
                nickname: employee.nickname,
                gender: employee.gender,
                number: employee.number,
                email: `${employee.nickname.toLowerCase()}@company.com`,
                phone: '050-1234567',
                address: 'תל אביב, ישראל',
                birthDate: '1990-01-15',
                startDate: '2020-03-01',
                hativaName: employee.hativaName,
                departmentName: employee.departmentName,
                branchName: employee.branchName,
                roleName: employee.roleName,
                manager: 'מנהל ישיר',
                imageUrl: employee.imageUrl
            },
            timeOff: {
                vacationBalance: 15,
                sickLeaveBalance: 8,
                vacationUsed: 5,
                sickLeaveUsed: 2,
                personalDays: 3,
                pendingRequests: []
            },
            salaryHistory: [
                {
                    year: 2024,
                    month: 12,
                    grossSalary: 25000,
                    netSalary: 18500,
                    bonus: 5000
                }
            ],
            performanceRating: 4.5
        };
    }
}
