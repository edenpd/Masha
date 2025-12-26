import { Component, Input, OnInit, inject } from '@angular/core';
import { ChatStore } from '../store/chat.store';
import { MashaChatConfig } from '../models';
import { ChatWindowComponent } from './chat-window/chat-window.component';

@Component({
  selector: 'masha-chat',
  standalone: true,
  imports: [ChatWindowComponent],
  template: `
    @if (config && store.isReady()) {
      @if (config.mode === 'popover') {
        <!-- Popover Mode -->
        <div class="fixed bottom-0 left-0 z-50">
          
          <!-- Toggle Button -->
          <button 
            (click)="store.togglePopover()"
            class="popover-trigger" 
            [title]="store.isPopoverOpen() ? 'סגור' : 'פתח צאט'"
          >
            @if (store.isPopoverOpen()) {
              <span>✕</span>
            } @else {
              <span>💬</span>
            }
          </button>

          <!-- Window -->
          @if (store.isPopoverOpen()) {
            <div class="popover-window">
              <!-- Header -->
              <div class="popover-header">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
                  <div>
                    <h3 class="font-bold text-sm">HR AI Assistant</h3>
                    <p class="text-xs opacity-80">מחובר</p>
                  </div>
                </div>
              </div>

              <!-- Chat Content -->
              <div class="flex-1 overflow-hidden relative bg-white dark:bg-deep-900">
                <masha-chat-window />
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Embedded Mode -->
        <div class="masha-chat-wrapper" [style.width]="config.dimensions?.width" [style.height]="config.dimensions?.height">
           <masha-chat-window />
        </div>
      }
    } @else {
      <!-- Loading -->
      <div class="flex items-center justify-center h-full p-10">
        <div class="text-center">
           <div class="dot mb-4 mx-auto" style="width: 20px; height: 20px;"></div>
           <p class="text-gray-500 text-sm">טוען...</p>
        </div>
      </div>
    }
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class MashaChatComponent implements OnInit {
  protected readonly store = inject(ChatStore);
  @Input() config?: MashaChatConfig;

  ngOnInit(): void {
    if (this.config) this.store.initialize(this.config);
  }
}
