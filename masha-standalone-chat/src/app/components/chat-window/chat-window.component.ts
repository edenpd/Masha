import { Component, inject } from '@angular/core';
import { ChatStore } from '../../store/chat.store';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'masha-chat-window',
  standalone: true,
  imports: [MessageListComponent, MessageInputComponent],
  template: `
    <div class="chat-layout">
      <!-- Messages Area -->
      <div class="chat-messages">
        <masha-message-list />
      </div>
      
      <!-- Input Area -->
      <div class="chat-footer">
        <masha-message-input />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .chat-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .chat-messages {
      flex: 1;
      display: flex; /* Make this a flex container too */
      flex-direction: column;
      min-height: 0; /* CRITICAL: Allows scrolling inside flex item */
      position: relative;
      z-index: 1; 
    }
    .chat-footer {
      flex-shrink: 0;
      width: 100%;
      position: relative;
      z-index: 10;
    }
    
    masha-message-list {
      flex: 1;
      width: 100%;
      height: 100%;
      /* The list component handles its own overflow */
    }
  `]
})
export class ChatWindowComponent {
  protected readonly store = inject(ChatStore);
}
