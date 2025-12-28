import { Component, inject, signal } from '@angular/core';

import { AppStore } from '../../../../store/app.store';
import { AuthorizedEmployee } from '../../../../models';

@Component({
  selector: 'app-employee-sidebar',
  standalone: true,
  imports: [],
  template: `
    <div class="h-full flex flex-col bg-slate-100/50 dark:bg-deep-800/30 backdrop-blur-sm transition-colors duration-300">
      <!-- Header -->
      <div class="p-6 border-b border-black/5 dark:border-white/5">
        <h3 class="font-bold text-lg mb-1 dark:text-white">עובדים מורשים</h3>
        <p class="text-sm text-gray-500">{{ store.employeeCount() }} עובדים בהרשאה שלך</p>
        
        <!-- Search -->
        <div class="mt-4 relative">
          <input
            type="text"
            [value]="searchQuery()"
            (input)="onSearch($event)"
            placeholder="חיפוש עובד..."
            class="w-full bg-white dark:bg-deep-700/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm
                   placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-neural-500/50 transition-colors
                   text-gray-900 dark:text-white"
          />
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- Employee List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        @for (employee of filteredEmployees(); track employee.id) {
          <button
            (click)="selectEmployee(employee)"
            [class]="'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 group text-right border ' + 
                     (selectedEmployee()?.id === employee.id ? 'bg-neural-500/10 border-neural-500/30' : 'border-transparent')"
          >
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <img 
                [src]="employee.imageUrl" 
                [alt]="employee.name"
                class="w-12 h-12 rounded-xl object-cover ring-2 ring-black/5 dark:ring-white/10 group-hover:ring-neural-500/30 transition-all"
              />
              <div class="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-matrix-500 border-2 border-slate-100 dark:border-deep-800"></div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate group-hover:text-neural-600 dark:group-hover:text-white transition-colors text-gray-900 dark:text-gray-100">
                {{ employee.name }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ employee.roleName }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                  {{ employee.departmentName }}
                </span>
              </div>
            </div>

            <!-- Arrow -->
            <svg class="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-neural-500 dark:group-hover:text-neural-400 transition-colors flip-x-rtl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        } @empty {
          <div class="text-center py-8">
            <div class="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-sm text-gray-500">לא נמצאו עובדים</p>
          </div>
        }
      </div>

      <!-- Selected Employee Quick Actions -->
      @if (selectedEmployee(); as emp) {
        <div class="p-4 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-deep-800/50">
          <div class="flex items-center gap-3 mb-4">
            <img 
              [src]="emp.imageUrl" 
              [alt]="emp.name"
              class="w-10 h-10 rounded-lg"
            />
            <div>
              <p class="font-medium text-sm text-gray-900 dark:text-white">{{ emp.name }}</p>
              <p class="text-xs text-gray-500">{{ emp.departmentName }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <button 
              (click)="askAbout(emp, 'חופש')"
              class="px-3 py-2 text-xs rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-transparent hover:bg-neural-50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-neural-600 dark:hover:text-white"
            >
              🌴 ימי חופשה
            </button>
            <button 
              (click)="askAbout(emp, 'שכר')"
              class="px-3 py-2 text-xs rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-transparent hover:bg-neural-50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-neural-600 dark:hover:text-white"
            >
              💰 משכורת
            </button>
            <button 
              (click)="askAbout(emp, 'פרטים')"
              class="px-3 py-2 text-xs rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-transparent hover:bg-neural-50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-neural-600 dark:hover:text-white"
            >
              👤 פרטים אישיים
            </button>
            <button 
              (click)="askAbout(emp, 'ביצועים')"
              class="px-3 py-2 text-xs rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-transparent hover:bg-neural-50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-neural-600 dark:hover:text-white"
            >
              📊 ביצועים
            </button>
          </div>
        </div>
      }

      <!-- Footer Stats -->
      <div class="p-4 border-t border-black/5 dark:border-white/5">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>עודכן לאחרונה: היום</span>
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-matrix-500 animate-pulse"></span>
            מחובר
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class EmployeeSidebarComponent {
  protected readonly store = inject(AppStore);

  protected searchQuery = signal('');
  protected selectedEmployee = signal<AuthorizedEmployee | null>(null);

  protected filteredEmployees = () => {
    const query = this.searchQuery().toLowerCase();
    const employees = this.store.authorizedEmployees();

    if (!query) return employees;

    return employees.filter(emp =>
      emp.name.toLowerCase().includes(query) ||
      emp.nickname.toLowerCase().includes(query) ||
      emp.departmentName.toLowerCase().includes(query) ||
      emp.roleName.toLowerCase().includes(query)
    );
  };

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected selectEmployee(employee: AuthorizedEmployee): void {
    this.selectedEmployee.set(
      this.selectedEmployee()?.id === employee.id ? null : employee
    );
  }

  protected askAbout(employee: AuthorizedEmployee, topic: string): void {
    const queries: Record<string, string> = {
      'חופש': `כמה ימי חופש נשארו ל${employee.name}?`,
      'שכר': `מה המשכורת של ${employee.name}?`,
      'פרטים': `תן לי פרטים אישיים על ${employee.name}`,
      'ביצועים': `מה דירוג הביצועים של ${employee.name}?`,
    };

    const query = queries[topic];
    if (query) {
      this.store.processMessage(query);
    }
  }
}
