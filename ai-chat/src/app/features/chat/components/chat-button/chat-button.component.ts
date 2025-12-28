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
      class="w-16 h-16 rounded-full bg-gradient-to-br from-synapse-500 to-neural-500 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group relative ring-4 ring-white/10 dark:ring-black/20"
      [attr.aria-label]="store.isOpen() ? 'סגור צאט' : 'פתח צאט'"
    >
      <div class="absolute inset-0 rounded-full bg-synapse-400 opacity-20 group-hover:animate-ping"></div>
      
      @if (store.isOpen()) {
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white transition-transform duration-300 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      } @else {
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      }
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
