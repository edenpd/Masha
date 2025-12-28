import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../../../store/app.store';

@Component({
  selector: 'app-chat-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="store.toggleChat()"
      class="w-16 h-16 rounded-full bg-gradient-to-br from-synapse-500 to-neural-500 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group relative ring-4 ring-white/10 dark:ring-black/20 overflow-hidden"
      [attr.aria-label]="store.isOpen() ? 'סגור צאט' : 'פתח צאט'"
    >
      <div class="absolute inset-0 rounded-full bg-synapse-400 opacity-20 group-hover:animate-ping"></div>
      
      <!-- Icons Container -->
      <div class="relative w-8 h-8 flex items-center justify-center">
        <!-- Close Icon -->
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="w-8 h-8 text-white absolute transition-all duration-500 ease-out"
          [class.opacity-0]="!store.isOpen()"
          [class.scale-50]="!store.isOpen()"
          [class.rotate-90]="!store.isOpen()"
          [class.opacity-100]="store.isOpen()"
          [class.scale-100]="store.isOpen()"
          [class.rotate-0]="store.isOpen()"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>

        <!-- Chat Icon -->
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="w-8 h-8 text-white absolute transition-all duration-500 ease-out"
          [class.opacity-100]="!store.isOpen()"
          [class.scale-100]="!store.isOpen()"
          [class.rotate-0]="!store.isOpen()"
          [class.opacity-0]="store.isOpen()"
          [class.scale-50]="store.isOpen()"
          [class.rotate-[-90deg]]="store.isOpen()"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
    </button>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ChatButtonComponent {
  protected readonly store = inject(AppStore);
}
