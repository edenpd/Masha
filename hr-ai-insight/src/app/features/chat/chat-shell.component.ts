import { Component, inject, computed } from '@angular/core';

import { AppStore } from '../../store/app.store';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { EmployeeSidebarComponent } from './components/employee-sidebar/employee-sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { AiChatComponent, AiChatConfig } from 'ngx-gen-ai-chat';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [
    EmployeeSidebarComponent,
    HeaderComponent,
    AiChatComponent
  ],
  template: `
    <div class="h-screen bg-slate-50 dark:bg-deep-900 bg-mesh-gradient flex flex-col overflow-hidden transition-colors duration-300">
      <!-- Header -->
      <app-header />
      
      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Chat Area -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <ai-chat [config]="chatConfig()" style="width: 100%; height: 100%;" />
        </main>
        
        <!-- Sidebar -->
        @if (showSidebar) {
          <aside class="hidden lg:block w-80 xl:w-96 border-r border-white/5">
            <app-employee-sidebar />
          </aside>
        }
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

  protected readonly chatConfig = computed<AiChatConfig>(() => ({
    model: {
      systemPrompt: this.store.getSystemPrompt(),
      apiKey: environment.cohereApiKey,
      tools: this.store.getTools(),
    },
    design: {
      mode: 'embedded',
      isDarkMode: this.store.theme() === 'dark',
    },
    chat: {
      title: 'HR Assistant',
      startMessage: this.store.startMessage(),
      questionSuggestions: this.store.suggestedQuestions(),
      userPhoto: this.store.currentUser()?.imageUrl,
      inputPlaceholder: 'שאל אותי משהו על אחד העובדים שלך...',
    }
  }));
}
