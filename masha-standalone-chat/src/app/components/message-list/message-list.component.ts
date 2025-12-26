import { Component, inject, ElementRef, ViewChild, AfterViewChecked, effect } from '@angular/core';
import { ChatStore } from '../../store/chat.store';

@Component({
  selector: 'masha-message-list',
  standalone: true,
  imports: [],
  template: `
    <div #scrollContainer class="message-scroller custom-scrollbar">
      <div class="message-content-wrapper">
        @for (message of store.messages(); track message.id) {
          
          <div 
            class="message-row animate-slide-up"
            [class.user]="message.type === 'user'"
            [class.assistant]="message.type !== 'user'"
            [style.justify-content]="message.type === 'user' ? 'flex-end' : 'flex-start'"
          >
            
            <!-- Assistant Avatar -->
            @if (message.type !== 'user') {
              <div class="avatar-container">
                <div class="avatar-img avatar-bot shadow-lg">
                  <span>🤖</span>
                </div>
              </div>
            }

            <!-- Message Bubble -->
            <div 
              class="bubble shadow-lg"
              [class.bubble-user]="message.type === 'user'"
              [class.bubble-assistant]="message.type !== 'user'"
            >
              
              <!-- Assistant Header -->
              @if (message.type !== 'user' && !message.isTyping && message.relatedEmployee) {
                <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 opacity-70">
                   <img [src]="message.relatedEmployee.imageUrl" class="w-5 h-5 rounded-full object-cover">
                   <span class="text-xs">מידע על: {{ message.relatedEmployee.name }}</span>
                </div>
              }

              <!-- Content -->
              @if (message.isTyping) {
                 <div class="typing-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                 </div>
              } @else {
                <div class="whitespace-pre-wrap text-sm leading-relaxed" [innerHTML]="formatMessage(message.content)"></div>
                <span class="bubble-timestamp text-right">{{ formatTime(message.timestamp) }}</span>
              }
            </div>

            <!-- User Avatar -->
            @if (message.type === 'user' && store.currentUser(); as user) {
              <div class="avatar-container">
                 <img [src]="user.imageUrl" [alt]="user.firstName" class="avatar-img shadow-lg ring-2 ring-white/10" />
              </div>
            }

          </div>
        } @empty {
           <!-- Empty State -->
           <div class="flex flex-col items-center justify-center h-full py-20 text-center opacity-70">
              <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-3xl">💬</div>
              <h3 class="text-xl font-bold mb-2">התחל שיחה</h3>
              <p class="text-sm max-w-xs mx-auto">שאל שאלה על נתוני משאבי אנוש</p>
           </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden; /* Hide overflow on host, let child scroll */
    }
    .message-scroller {
      height: 100%;
      overflow-y: auto;
      padding: 1.5rem 1rem;
      scroll-behavior: smooth;
    }
    .message-content-wrapper {
      max-width: 56rem; /* max-w-4xl */
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 2rem; /* Add specific padding at bottom for better scroll feel */
    }
    
    .w-5 { width: 1.25rem; }
    .h-5 { height: 1.25rem; }
    .rounded-full { border-radius: 9999px; }
    .object-cover { object-fit: cover; }
  `]
})
export class MessageListComponent implements AfterViewChecked {
  protected readonly store = inject(ChatStore);
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private shouldScroll = true;

  constructor() {
    effect(() => {
      const messages = this.store.messages();
      if (messages.length > 0) this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer?.nativeElement?.scrollTo({ top: this.scrollContainer.nativeElement.scrollHeight, behavior: 'smooth' });
    } catch (err) { }
  }

  protected formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  protected formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/^• /gm, '<span class="text-neural-400">•</span> ');
  }
}
