import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../../../store/app.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 border-b border-white/5 dark:border-white/5 bg-white/70 dark:bg-deep-800/60 backdrop-blur-xl flex items-center justify-between px-6 transition-colors duration-300">
      <!-- Logo & Title -->
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-neural-500 to-synapse-500 flex items-center justify-center shadow-lg shadow-neural-500/25">
          <span class="text-xl">🧠</span>
        </div>
        <div>
          <h1 class="font-bold text-lg gradient-text">HR AI Insight</h1>
          <p class="text-xs text-gray-400 dark:text-gray-500">מערכת AI לניהול משאבי אנוש</p>
        </div>
      </div>

      <!-- Center - Status -->
      <div class="hidden md:flex items-center gap-3">
        <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-matrix-500/10 border border-matrix-500/20">
          <div class="w-2 h-2 rounded-full bg-matrix-400 animate-pulse"></div>
          <span class="text-sm text-matrix-400">{{ store.employeeCount() }} עובדים מורשים</span>
        </div>
      </div>

      <!-- Actions Area -->
      <div class="flex items-center gap-2 md:gap-4">
        <!-- Theme Toggle -->
        <button 
          (click)="store.toggleTheme()"
          class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400 hover:text-neural-600 dark:hover:text-white"
          [title]="store.theme() === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'"
        >
          @if (store.theme() === 'dark') {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/>
            </svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          }
        </button>

        <!-- Clear Chat Button -->
        <button 
          (click)="store.clearChat()"
          class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          title="נקה שיחה"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>

        <!-- Mobile Sidebar Toggle -->
        <button 
          (click)="toggleMobileSidebar()"
          class="lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- User Avatar & Info -->
        @if (store.currentUser(); as user) {
          <div class="flex items-center gap-3 pl-2">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-medium">{{ user.name }}</p>
              <p class="text-xs text-gray-500 line-clamp-1">{{ user.role }}</p>
            </div>
            <img 
              [src]="user.photoUrl" 
              [alt]="user.name"
              class="w-10 h-10 rounded-full ring-2 ring-neural-500/50"
            />
          </div>
        }
      </div>
    </header>

    <!-- Mobile Sidebar Overlay -->
    @if (showMobileSidebar()) {
      <div 
        class="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        (click)="toggleMobileSidebar()"
      >
        <div 
          class="absolute left-0 top-0 bottom-0 w-80 bg-deep-800 border-l border-white/10 animate-slide-in-right p-6 overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <!-- Mobile sidebar content -->
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg">עובדים מורשים</h3>
            <button 
              (click)="toggleMobileSidebar()"
              class="p-2 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>
          
          <div class="space-y-3">
            @for (emp of store.authorizedEmployees(); track emp.id) {
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <img 
                  [src]="emp.photoUrl" 
                  [alt]="emp.name"
                  class="w-10 h-10 rounded-full"
                >
                <div>
                  <p class="font-medium text-sm">{{ emp.name }}</p>
                  <p class="text-xs text-gray-500">{{ emp.role }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HeaderComponent {
  protected readonly store = inject(AppStore);
  protected showMobileSidebar = signal(false);

  toggleMobileSidebar(): void {
    this.showMobileSidebar.update(v => !v);
  }
}
