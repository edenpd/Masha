import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiChatStore } from '../../store/ai-chat.store';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'ai-chat-window',
  standalone: true,
  imports: [CommonModule, MessageListComponent, MessageInputComponent],
  template: `
    <div class="flex-1 flex flex-col h-full">
      <div class="flex-1 min-h-0 overflow-hidden">
        <ai-message-list />
      </div>
      
      <div class="border-t border-black/5 ai-dark:border-white/5 p-4 bg-slate-200/50 ai-dark:bg-deep-800/50 transition-colors duration-300">
        <ai-message-input />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      flex: 1;
    }
  `]
})
export class ChatWindowComponent {
  protected readonly store = inject(AiChatStore);
}
