import { Injectable } from '@angular/core';
import { EmployeeData, SalaryRecord, TimeOffRequest } from '../../models';

/**
 * Mock Employee Data Service
 * Provides detailed employee information including time off and salary
 */
@Injectable({
    providedIn: 'root'
})
export class EmployeeDataService {

    /**
     * Detailed mock data for each employee
     */
    private readonly employeeDataMap: Record<string, EmployeeData> = {
        'emp-0': {
            id: 'emp-0',
            personalInfo: {
                name: 'דני כהן',
                firstName: 'דני',
                lastName: 'כהן',
                nickname: 'דני',
                gender: 1,
                number: 'EMP-101',
                email: 'dani.cohen@company.co.il',
                phone: '050-1234567',
                address: 'רחוב הרצל 15, תל אביב',
                birthDate: '1988-03-15',
                startDate: '2019-06-01',
                hativaName: 'טכנולוגיה',
                departmentName: 'פיתוח',
                branchName: 'תל אביב',
                roleName: 'מפתח בכיר',
                manager: 'אבי גולדשטיין',
                imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=dany'
            },
            timeOff: {
                vacationBalance: 12,
                sickLeaveBalance: 8,
                vacationUsed: 6,
                sickLeaveUsed: 2,
                personalDays: 2,
                pendingRequests: [
                    {
                        id: 'req1',
                        type: 'vacation',
                        startDate: '2025-01-05',
                        endDate: '2025-01-08',
                        status: 'pending',
                        reason: 'חופשה משפחתית'
                    }
                ]
            },
            salaryHistory: this.generateSalaryHistory(25000, 28500),
            performanceRating: 4.5
        },
        'emp-1': {
            id: 'emp-1',
            personalInfo: {
                name: 'שרה לוי',
                firstName: 'שרה',
                lastName: 'לוי',
                nickname: 'שרה',
                gender: 2,
                number: 'EMP-102',
                email: 'sarah.levi@company.co.il',
                phone: '052-9876543',
                address: 'שדרות רוטשילד 42, תל אביב',
                birthDate: '1990-11-22',
                startDate: '2020-02-15',
                hativaName: 'מטה',
                departmentName: 'שיווק',
                branchName: 'תל אביב',
                roleName: 'מנהלת שיווק',
                manager: 'רונית שפירא',
                imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=sarah'
            },
            timeOff: {
                vacationBalance: 15,
                sickLeaveBalance: 10,
                vacationUsed: 3,
                sickLeaveUsed: 1,
                personalDays: 1,
                pendingRequests: []
            },
            salaryHistory: this.generateSalaryHistory(22000, 26000),
            performanceRating: 4.8
        },
        'emp-2': {
            id: 'emp-2',
            personalInfo: {
                name: 'יוסי אברהם',
                firstName: 'יוסי',
                lastName: 'אברהם',
                nickname: 'יוסי',
                gender: 1,
                number: 'EMP-103',
                email: 'yossi.avraham@company.co.il',
                phone: '054-5551234',
                address: 'רחוב דיזנגוף 100, תל אביב',
                birthDate: '1985-07-08',
                startDate: '2018-01-10',
                hativaName: 'מכירות',
                departmentName: 'מכירות פנים',
                branchName: 'חיפה',
                roleName: 'איש מכירות',
                manager: 'שרה לוי',
                imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=yossi'
            },
            timeOff: {
                vacationBalance: 8,
                sickLeaveBalance: 12,
                vacationUsed: 10,
                sickLeaveUsed: 0,
                personalDays: 3,
                pendingRequests: []
            },
            salaryHistory: this.generateSalaryHistory(18000, 22000),
            performanceRating: 4.2
        },
        'emp-3': {
            id: 'emp-3',
            personalInfo: {
                name: 'מיכל רוזנברג',
                firstName: 'מיכל',
                lastName: 'רוזנברג',
                nickname: 'מיכל',
                gender: 2,
                number: 'EMP-104',
                email: 'michal.rosenberg@company.co.il',
                phone: '053-7778899',
                address: 'רחוב בן יהודה 55, רמת גן',
                birthDate: '1992-04-30',
                startDate: '2021-09-01',
                hativaName: 'מטה',
                departmentName: 'משאבי אנוש',
                branchName: 'נתניה',
                roleName: 'רכזת גיוס',
                manager: 'מנהל משאבי אנוש',
                imageUrl: 'https://api.dicebear.com/7.x/bitmoji/svg?seed=michal'
            },
            timeOff: {
                vacationBalance: 14,
                sickLeaveBalance: 9,
                vacationUsed: 4,
                sickLeaveUsed: 3,
                personalDays: 1,
                pendingRequests: [
                    {
                        id: 'req2',
                        type: 'sick',
                        startDate: '2025-01-02',
                        endDate: '2025-01-02',
                        status: 'approved',
                        reason: 'מחלה'
                    }
                ]
            },
            salaryHistory: this.generateSalaryHistory(15000, 18000),
            performanceRating: 4.0
        },
        'emp-4': {
            id: 'emp-4',
            personalInfo: {
                name: 'אבי גולדשטיין',
                firstName: 'אבי',
                lastName: 'גולדשטיין',
                nickname: 'אבי',
                gender: 1,
                number: 'EMP-105',
                email: 'avi.goldstein@company.co.il',
                phone: '050-1112233',
                address: 'רחוב הירקון 20, תל אביב',
                birthDate: '1980-12-05',
                startDate: '2015-03-20',
                hativaName: 'טכנולוגיה',
                departmentName: 'פיתוח',
                branchName: 'תל אביב',
                roleName: 'ארכיטקט תוכנה',
                manager: 'מנהל פיתוח',
                imageUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=avi'
            },
            timeOff: {
                vacationBalance: 20,
                sickLeaveBalance: 15,
                vacationUsed: 5,
                sickLeaveUsed: 2,
                personalDays: 2,
                pendingRequests: []
            },
            salaryHistory: this.generateSalaryHistory(35000, 42000),
            performanceRating: 4.9
        }
    };

    /**
     * Get full employee data by ID
     */
    async getEmployeeData(employeeId: string): Promise<EmployeeData | null> {
        // Simulate API delay
        await this.delay(500);
        debugger;
        return this.employeeDataMap[employeeId] || null;
    }

    /**
     * Get all employees data
     */
    async getAllEmployeesData(): Promise<EmployeeData[]> {
        // Simulate API delay
        await this.delay(1000);

        return Object.values(this.employeeDataMap);
    }

    /**
     * Generate mock salary history for the past 12 months
     */
    private generateSalaryHistory(startGross: number, currentGross: number): SalaryRecord[] {
        const history: SalaryRecord[] = [];
        const now = new Date();
        const increment = (currentGross - startGross) / 12;

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const gross = Math.round(startGross + (increment * (12 - i)));
            const hasBonus = date.getMonth() === 8 || date.getMonth() === 2; // Sep and March bonuses

            history.push({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                grossSalary: gross,
                netSalary: Math.round(gross * 0.7), // ~30% tax approximation
                bonus: hasBonus ? Math.round(gross * 0.5) : undefined
            });
        }

        return history;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
