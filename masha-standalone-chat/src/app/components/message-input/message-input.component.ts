import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../store/chat.store';

@Component({
  selector: 'masha-message-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="input-wrapper">
      <form (submit)="onSubmit($event)" class="relative">
        
        <!-- Input Box -->
        <div class="input-box">
          
          <!-- Suggestions Trigger -->
          <div class="relative">
             <button 
                type="button" 
                (click)="showSuggestions.set(!showSuggestions())"
                class="icon-btn"
                title="שאלות לדוגמה"
             >
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
             </button>

             @if (showSuggestions()) {
               <div class="suggestions-menu animate-slide-up">
                 <div class="p-3 text-xs font-bold opacity-50 border-b border-white/10 uppercase tracking-wider">שאלות לדוגמה</div>
                 @for (suggestion of store.suggestedQuestions(); track suggestion) {
                   <button type="button" (click)="useSuggestion(suggestion)" class="suggestion-btn">
                     {{ suggestion }}
                   </button>
                 }
               </div>
             }
          </div>

          <!-- Text Input -->
          <textarea
            #inputField
            [(ngModel)]="inputValue"
            name="message"
            placeholder="שאל אותי משהו על העובדים..."
            [disabled]="store.isProcessing()"
            (keydown)="onKeyDown($event)"
            rows="1"
            class="chat-input"
            [class.opacity-50]="store.isProcessing()"
          ></textarea>

          <!-- Send/Stop Button -->
          @if (store.isProcessing()) {
            <button type="button" (click)="onStop()" class="send-btn stop" title="עצור">
               <svg class="icon-svg" viewBox="0 0 24 24" fill="currentColor">
                 <rect x="6" y="6" width="12" height="12" rx="2" />
               </svg>
            </button>
          } @else {
            <button type="submit" [disabled]="!inputValue().trim()" class="send-btn">
               <!-- Send Icon (Mirrored for RTL) -->
               <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: scaleX(-1);">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
            </button>
          }

        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center mt-2 px-2 text-xs opacity-50 select-none">
           <div>Shift+Enter לשורה חדשה</div>
           @if (store.isProcessing()) {
             <div class="flex items-center gap-2 text-neural-400">
               <span class="dot" style="width:6px; height:6px; background:currentColor;"></span>
               מעבד בקשה...
             </div>
           }
        </div>

      </form>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class MessageInputComponent {
  protected readonly store = inject(ChatStore);
  @ViewChild('inputField') private inputField!: ElementRef<HTMLTextAreaElement>;
  protected inputValue = signal('');
  protected showSuggestions = signal(false);

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
    if (this.inputField?.nativeElement) this.inputField.nativeElement.style.height = 'auto';
  }
}
