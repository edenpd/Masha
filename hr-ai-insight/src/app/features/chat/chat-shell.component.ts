import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../store/app.store';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { EmployeeSidebarComponent } from './components/employee-sidebar/employee-sidebar.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [
    CommonModule,
    ChatWindowComponent,
    EmployeeSidebarComponent,
    HeaderComponent,
  ],
  template: `
    <div class="h-screen bg-slate-50 dark:bg-deep-900 bg-mesh-gradient flex flex-col overflow-hidden transition-colors duration-300">
      <!-- Header -->
      <app-header />
      
      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Chat Area -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <app-chat-window />
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
}
