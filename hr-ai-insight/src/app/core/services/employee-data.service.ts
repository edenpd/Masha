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
        '1': {
            id: '1',
            personalInfo: {
                name: 'דני כהן',
                nickname: 'דני',
                email: 'dani.cohen@company.co.il',
                phone: '050-1234567',
                address: 'רחוב הרצל 15, תל אביב',
                birthDate: '1988-03-15',
                startDate: '2019-06-01',
                department: 'פיתוח',
                role: 'מפתח בכיר',
                manager: 'אבי גולדשטיין',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=dani&backgroundColor=059669'
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
        '2': {
            id: '2',
            personalInfo: {
                name: 'שרה לוי',
                nickname: 'שרה',
                email: 'sarah.levi@company.co.il',
                phone: '052-9876543',
                address: 'שדרות רוטשילד 42, תל אביב',
                birthDate: '1990-11-22',
                startDate: '2020-02-15',
                department: 'שיווק',
                role: 'מנהלת שיווק',
                manager: 'רונית שפירא',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=sarah&backgroundColor=d946ef'
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
        '3': {
            id: '3',
            personalInfo: {
                name: 'יוסי אברהם',
                nickname: 'יוסי',
                email: 'yossi.avraham@company.co.il',
                phone: '054-5551234',
                address: 'רחוב דיזנגוף 100, תל אביב',
                birthDate: '1985-07-08',
                startDate: '2018-01-10',
                department: 'מכירות',
                role: 'איש מכירות',
                manager: 'שרה לוי',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=yossi&backgroundColor=f59e0b'
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
        '4': {
            id: '4',
            personalInfo: {
                name: 'מיכל רוזנברג',
                nickname: 'מיכל',
                email: 'michal.rosenberg@company.co.il',
                phone: '053-7778899',
                address: 'רחוב בן יהודה 55, רמת גן',
                birthDate: '1992-04-30',
                startDate: '2021-09-01',
                department: 'משאבי אנוש',
                role: 'רכזת גיוס',
                manager: 'מנהל משאבי אנוש',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=michal&backgroundColor=ec4899'
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
        '5': {
            id: '5',
            personalInfo: {
                name: 'אבי גולדשטיין',
                nickname: 'אבי',
                email: 'avi.goldstein@company.co.il',
                phone: '050-1112233',
                address: 'רחוב הירקון 20, תל אביב',
                birthDate: '1980-12-05',
                startDate: '2015-03-20',
                department: 'פיתוח',
                role: 'ארכיטקט תוכנה',
                manager: 'מנהל פיתוח',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=avi&backgroundColor=6366f1'
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
        },
        '6': {
            id: '6',
            personalInfo: {
                name: 'נועה בן דוד',
                nickname: 'נועה',
                email: 'noa.bendavid@company.co.il',
                phone: '052-4445566',
                address: 'רחוב אלנבי 80, תל אביב',
                birthDate: '1995-08-18',
                startDate: '2022-07-01',
                department: 'עיצוב',
                role: 'מעצבת UX',
                manager: 'אבי גולדשטיין',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=noa&backgroundColor=14b8a6'
            },
            timeOff: {
                vacationBalance: 16,
                sickLeaveBalance: 10,
                vacationUsed: 2,
                sickLeaveUsed: 1,
                personalDays: 0,
                pendingRequests: []
            },
            salaryHistory: this.generateSalaryHistory(16000, 19000),
            performanceRating: 4.3
        },
        '7': {
            id: '7',
            personalInfo: {
                name: 'עמית פרידמן',
                nickname: 'עמית',
                email: 'amit.friedman@company.co.il',
                phone: '054-9998877',
                address: 'רחוב ויצמן 30, הרצליה',
                birthDate: '1987-02-14',
                startDate: '2017-11-01',
                department: 'כספים',
                role: 'חשב',
                manager: 'סמנכ״ל כספים',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=amit&backgroundColor=8b5cf6'
            },
            timeOff: {
                vacationBalance: 10,
                sickLeaveBalance: 8,
                vacationUsed: 8,
                sickLeaveUsed: 4,
                personalDays: 2,
                pendingRequests: []
            },
            salaryHistory: this.generateSalaryHistory(28000, 33000),
            performanceRating: 4.6
        },
        '8': {
            id: '8',
            personalInfo: {
                name: 'רונית שפירא',
                nickname: 'רונית',
                email: 'ronit.shapira@company.co.il',
                phone: '050-6667788',
                address: 'רחוב הנביאים 12, ירושלים',
                birthDate: '1983-06-25',
                startDate: '2016-04-15',
                department: 'תפעול',
                role: 'מנהלת תפעול',
                manager: 'מנכ״ל',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=ronit&backgroundColor=f43f5e'
            },
            timeOff: {
                vacationBalance: 18,
                sickLeaveBalance: 12,
                vacationUsed: 7,
                sickLeaveUsed: 2,
                personalDays: 1,
                pendingRequests: [
                    {
                        id: 'req3',
                        type: 'vacation',
                        startDate: '2025-02-10',
                        endDate: '2025-02-14',
                        status: 'pending',
                        reason: 'חופשה בחו״ל'
                    }
                ]
            },
            salaryHistory: this.generateSalaryHistory(30000, 38000),
            performanceRating: 4.7
        }
    };

    /**
     * Get full employee data by ID
     */
    async getEmployeeData(employeeId: string): Promise<EmployeeData | null> {
        // Simulate API delay
        await this.delay(500);

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
