import { Component, inject } from '@angular/core';

import { AppStore } from '../../store/app.store';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [
    ChatWindowComponent,
  ],
  template: `
    <div class="h-screen bg-slate-50 dark:bg-deep-900 bg-mesh-gradient flex flex-col overflow-hidden transition-colors duration-300">
      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Chat Area -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <app-chat-window />
        </main>
        
        <!-- Sidebar (Removed for Generic Chat) -->
        <!-- Future generic sidebar can go here -->
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class ChatShellComponent {
  protected readonly store = inject(AppStore);

  // Configuration to toggle sidebar visibility
  protected readonly showSidebar = false;
}
