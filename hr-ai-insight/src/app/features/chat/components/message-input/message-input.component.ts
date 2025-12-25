import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../../../store/app.store';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <form (submit)="onSubmit($event)" class="relative">
        <!-- Main Input Container -->
        <div class="relative group">
          <!-- Glow effect on focus -->
          <div 
            class="absolute -inset-1 bg-gradient-to-r from-neural-500/20 via-synapse-500/20 to-matrix-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
          ></div>
          
          <div class="relative flex items-end gap-3 bg-white dark:bg-deep-700/50 rounded-2xl border border-black/10 dark:border-white/10 focus-within:border-neural-500/50 transition-all duration-300 p-2 shadow-lg">
            
            <!-- Text Input -->
            <div class="flex-1 relative">
              <textarea
                #inputField
                [(ngModel)]="inputValue"
                name="message"
                [placeholder]="'שאל אותי משהו על העובדים...'"
                [disabled]="store.isProcessing()"
                (keydown)="onKeyDown($event)"
                rows="1"
                class="w-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 max-h-32 min-h-[48px]"
                [class.opacity-50]="store.isProcessing()"
              ></textarea>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center gap-2 pb-2 pl-2">
              <!-- Sample Questions Dropdown -->
              <div class="relative">
                <button 
                  type="button"
                  (click)="showSuggestions.set(!showSuggestions())"
                  class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400 dark:text-gray-500 hover:text-neural-600 dark:hover:text-white"
                  title="שאלות לדוגמה"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </button>

                @if (showSuggestions()) {
                  <div 
                    class="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-deep-800/80 backdrop-blur-xl rounded-xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden z-10"
                  >
                    <div class="p-3 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-transparent">
                      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">שאלות לדוגמה</p>
                    </div>
                    <div class="p-2 space-y-1">
                      @for (suggestion of suggestions; track suggestion) {
                        <button
                          type="button"
                          (click)="useSuggestion(suggestion)"
                          class="w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-neural-50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300 hover:text-neural-600 dark:hover:text-white"
                        >
                          {{ suggestion }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Control Button (Send or Stop) -->
              @if (store.isProcessing()) {
                <button
                  type="button"
                  (click)="onStop()"
                  class="p-3 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30 
                         hover:bg-rose-400 hover:shadow-rose-500/50
                         transition-all duration-300 group flex items-center justify-center"
                  title="עצור יצירה"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              } @else {
                <button
                  type="submit"
                  [disabled]="!inputValue().trim()"
                  class="p-3 rounded-xl bg-gradient-to-r from-neural-500 to-synapse-500 text-white shadow-lg shadow-neural-500/30 
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                         hover:from-neural-400 hover:to-synapse-400 hover:shadow-neural-500/50
                         transition-all duration-300 group"
                >
                  <svg class="w-5 h-5 flip-x-rtl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcut Hint -->
        <div class="flex justify-between items-center mt-2 px-2">
          <p class="text-xs text-gray-400">
            <kbd class="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-400">Enter</kbd>
            לשליחה •
            <kbd class="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-400">Shift+Enter</kbd>
            לשורה חדשה
          </p>
          
          @if (store.isProcessing()) {
            <p class="text-xs text-synapse-500 dark:text-synapse-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-synapse-500 dark:bg-synapse-400 animate-pulse"></span>
              מעבד בקשה...
            </p>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    textarea {
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }

    textarea::-webkit-scrollbar {
      width: 4px;
    }

    textarea::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
    }
  `]
})
export class MessageInputComponent {
  protected readonly store = inject(AppStore);

  @ViewChild('inputField') private inputField!: ElementRef<HTMLTextAreaElement>;

  protected inputValue = signal('');
  protected showSuggestions = signal(false);

  protected suggestions = [
    'כמה ימי חופש נשארו לדני?',
    'מה המשכורת של שרה לוי?',
    'באיזה מחלקה עובד יוסי?',
    'מתי התחילה מיכל לעבוד?',
    'כמה ימי מחלה יש לאבי?',
    'מי המנהל של נועה?',
    'תן לי פרטים על עמית',
    'מה דירוג הביצועים של רונית?',
  ];

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  protected onStop(): void {
    this.store.stopRequest();
  }

  protected useSuggestion(suggestion: string): void {
    this.inputValue.set(suggestion);
    this.showSuggestions.set(false);
    this.inputField?.nativeElement?.focus();
  }

  private sendMessage(): void {
    const value = this.inputValue().trim();
    if (!value || this.store.isProcessing()) return;

    this.store.processMessage(value);
    this.inputValue.set('');

    // Auto-resize textarea
    if (this.inputField?.nativeElement) {
      this.inputField.nativeElement.style.height = 'auto';
    }
  }
}
