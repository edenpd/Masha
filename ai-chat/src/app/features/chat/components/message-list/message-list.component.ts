import { Component, inject, ElementRef, ViewChild, AfterViewChecked, effect } from '@angular/core';

import { AppStore } from '../../../../store/app.store';
import { ChatMessage } from '../../../../models';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [],
  template: `
    <div 
      #scrollContainer
      class="h-full overflow-y-auto px-4 py-6 space-y-6 scroll-smooth transition-colors duration-300"
    >
      <div class="max-w-4xl mx-auto">
        @for (message of store.messages(); track message.id) {
          <div class="message-bubble mb-6">
            @if (message.type === 'user') {
              <!-- User Message - Right side, icon on far right -->
              <div class="flex gap-3 w-full justify-start">
                <div class="flex-shrink-0">
                    <img 
                      [src]="store.userPhoto()" 
                      alt="User"
                      class="w-10 h-10 rounded-full ring-2 ring-black/10 dark:ring-white/20 shadow-md"
                    />
                </div>
                <div class="max-w-[80%] bg-white dark:bg-gradient-to-br dark:from-neural-600 dark:to-neural-700 rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg border border-black/5 dark:border-transparent">
                  <p class="text-gray-800 dark:text-white whitespace-pre-wrap">{{ message.content }}</p>
                  <p class="text-xs text-gray-500 dark:text-neural-300 mt-2 opacity-70">{{ formatTime(message.timestamp) }}</p>
                </div>
              </div>
            } @else if (message.isTyping && !message.content) {
              <!-- Typing Indicator - Only show if NO content yet -->
              <div class="flex gap-3 w-full justify-end">
                <div class="inline-block bg-white dark:bg-deep-800/60 backdrop-blur-xl rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg border border-black/5 dark:border-white/5">
                  <div class="flex gap-1.5">
                    <div class="w-2.5 h-2.5 rounded-full bg-synapse-400 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-neural-400 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-matrix-400 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-synapse-500 to-neural-500 flex items-center justify-center shadow-lg">
                    <span class="text-lg">🤖</span>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Assistant Message - Left side, icon on far left -->
              <div class="flex gap-3 w-full justify-end">
                <div class="max-w-[85%] bg-white dark:bg-deep-800/60 backdrop-blur-xl rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg border border-black/5 dark:border-white/5">
                  <div 
                    class="text-gray-800 dark:text-gray-100 whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                    [innerHTML]="formatMessage(message.content)"
                  ></div>
                  <p class="text-xs text-gray-500 mt-3">{{ formatTime(message.timestamp) }}</p>
                </div>
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-synapse-500 to-neural-500 flex items-center justify-center shadow-lg shadow-synapse-500/25">
                    <span class="text-lg">🤖</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @empty {
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center h-full py-20 text-center">
            <div class="w-20 h-20 rounded-2xl bg-black/5 dark:bg-neural-500/20 flex items-center justify-center mb-6">
              <span class="text-4xl">💬</span>
            </div>
            <h3 class="text-xl font-semibold mb-2 gradient-text">{{ store.emptyChatTitle() }}</h3>
            <p class="text-gray-500 max-w-sm">{{ store.emptyChatSubtitle() }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .prose :deep(strong) {
      @apply text-neural-600 dark:text-neural-300 font-semibold;
    }

    .prose :deep(h2), .prose :deep(h3) {
      @apply text-gray-900 dark:text-white font-bold mb-2;
    }

    .prose :deep(ul), .prose :deep(ol) {
      @apply my-2 mr-4;
    }

    .prose :deep(li) {
      @apply my-1;
    }
  `]
})
export class MessageListComponent implements AfterViewChecked {
  protected readonly store = inject(AppStore);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private shouldScroll = true;

  constructor() {
    // Effect to scroll on new messages
    effect(() => {
      const messages = this.store.messages();
      if (messages.length > 0) {
        this.shouldScroll = true;
      }
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
      const container = this.scrollContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  protected formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  protected formatMessage(content: string): string {
    // Simple markdown-like formatting
    return content
      // Bold text **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Lists with bullets
      .replace(/^• /gm, '<span class="text-neural-400">•</span> ')
      // Emoji preservation
      .replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span class="text-2xl align-middle">$1</span>');
  }
}
