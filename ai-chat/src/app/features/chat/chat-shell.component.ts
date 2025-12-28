import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AppStore } from '../../store/app.store';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { ChatButtonComponent } from './components/chat-button/chat-button.component';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [
    CommonModule,
    ChatWindowComponent,
    ChatButtonComponent
  ],
  animations: [
    trigger('popoverScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8) translateY(40px)', transformOrigin: 'bottom left' }),
        animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'scale(0.8) translateY(40px)', transformOrigin: 'bottom left' }))
      ])
    ])
  ],
  template: `
    @if (store.mode() === 'embedded') {
      <div class="h-screen bg-slate-50 dark:bg-deep-900 bg-mesh-gradient flex flex-col overflow-hidden transition-colors duration-300">
        <div class="flex-1 flex overflow-hidden">
          <main class="flex-1 flex flex-col overflow-hidden">
            <app-chat-window />
          </main>
        </div>
      </div>
    } @else {
      <!-- Popover Mode -->
      <div class="fixed bottom-8 left-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
        @if (store.isOpen()) {
          <div 
            @popoverScale
            class="w-[600px] h-[600px] max-h-[calc(100vh-120px)] bg-white dark:bg-deep-900 rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 flex flex-col pointer-events-auto origin-bottom-left"
          >
            <!-- Popover Header -->
            <div class="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-synapse-500/10 to-neural-500/10 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-synapse-500 to-neural-500 flex items-center justify-center">
                  <span class="text-sm">🤖</span>
                </div>
                <span class="font-semibold text-gray-800 dark:text-white">{{ store.title() }}</span>
              </div>
              <button (click)="store.toggleChat()" class="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div class="flex-1 overflow-hidden">
              <app-chat-window />
            </div>
          </div>
        }
        
        <div class="pointer-events-auto">
          <app-chat-button />
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
export class ChatShellComponent {
  protected readonly store = inject(AppStore);
}
