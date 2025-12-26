import { Component, OnInit, inject } from '@angular/core';
import { MashaChatComponent } from './components/masha-chat.component';
import { MashaChatConfig } from './models';
import { MockDataService } from './services/mock-data.service';
import { CohereService } from './services/cohere.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MashaChatComponent],
  template: `
    <div class="demo-page">
      <!-- Header -->
      <header class="demo-header">
        <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="logo-box">🤖</div>
            <div>
              <h1 class="text-xl font-bold gradient-text">Masha Chat Demo</h1>
              <p class="text-sm opacity-70">Angular 21 Standalone</p>
            </div>
          </div>
          <button (click)="toggleMode()" class="toggle-btn">
            {{ currentMode === 'embedded' ? 'Switch to Popover' : 'Switch to Embedded' }}
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        @if (currentMode === 'embedded') {
          <div class="demo-card h-[800px]">
            <masha-chat [config]="embeddedConfig" />
          </div>
        } @else {
          <div class="p-10 text-center">
             <h2 class="text-2xl font-bold mb-4 text-white">Popover Mode Active</h2>
             <p class="text-gray-400">Interact with the button in the bottom-left corner.</p>
             <masha-chat [config]="popoverConfig" />
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .demo-page {
      min-height: 100vh;
      background: #020617; /* deeply dark */
      color: white;
    }
    .demo-header {
      background: rgba(30, 41, 59, 0.5);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
    }
    .logo-box {
      width: 3rem; height: 3rem;
      background: linear-gradient(135deg, #0c8ce9, #d946ef);
      border-radius: 0.5rem;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
    }
    .toggle-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      cursor: pointer;
    }
    .toggle-btn:hover { background: rgba(255,255,255,0.2); }
    .demo-card {
      background: #0f172a;
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.05);
      overflow: hidden;
      height: 700px;
      position: relative;
    }
    .max-w-7xl { max-width: 80rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
  `]
})
export class AppComponent implements OnInit {
  // ... existing logic ...
  private mockDataService = inject(MockDataService);
  private cohereService = inject(CohereService);

  currentMode: 'embedded' | 'popover' = 'embedded';
  embeddedConfig!: MashaChatConfig;
  popoverConfig!: MashaChatConfig;

  ngOnInit(): void {
    const currentUser = this.mockDataService.getCurrentUser();
    const authorizedEmployees = this.mockDataService.getAuthorizedEmployees();

    this.cohereService.configure(
      'YOUR_COHERE_API_KEY',
      'command-a-03-2025',
      async (toolName: string, parameters: any) => {
        if (toolName === 'get_employee_detailed_data') {
          return await this.mockDataService.getEmployeeData(parameters.employee_id);
        }
        return null;
      }
    );

    this.embeddedConfig = {
      apiKey: 'YOUR_COHERE_API_KEY',
      modelName: 'command-a-03-2025',
      mode: 'embedded',
      dimensions: { width: '100%', height: '100%' },
      currentUser,
      authorizedEmployees
    };

    this.popoverConfig = {
      apiKey: 'YOUR_COHERE_API_KEY',
      modelName: 'command-a-03-2025',
      mode: 'popover',
      dimensions: { width: '400px', height: '600px' },
      currentUser,
      authorizedEmployees
    };
  }

  toggleMode(): void {
    this.currentMode = this.currentMode === 'embedded' ? 'popover' : 'embedded';
  }
}
