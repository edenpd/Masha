import { Component, inject } from '@angular/core';

import { AppStore } from '../../../../store/app.store';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MessageListComponent, MessageInputComponent],
  template: `
    <div class="flex-1 flex flex-col h-full">
      <!-- Messages Area -->
      <div class="flex-1 overflow-hidden">
        <app-message-list />
      </div>
      
      <!-- Input Area -->
      <div class="border-t border-black/5 dark:border-white/5 p-4 bg-slate-200/50 dark:bg-deep-800/50 transition-colors duration-300">
        <app-message-input />
        
        <!-- Hint text -->
        <!-- <div class="text-center mt-3">
          <p class="text-xs text-gray-500 dark:text-gray-600">
            💡 נסה לשאול: "{{ store.suggestedQuestions()[0] }}" או "{{ store.suggestedQuestions()[1] }}"
          </p>
        </div> -->
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `]
})
export class ChatWindowComponent {
  protected readonly store = inject(AppStore);
}
