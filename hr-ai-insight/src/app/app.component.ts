import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './store/app.store';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoadingScreenComponent],
    template: `
    @if (store.isLoading()) {
      <app-loading-screen />
    } @else if (store.appState() === 'error') {
      <div class="min-h-screen flex items-center justify-center bg-mesh-gradient">
        <div class="glass-dark rounded-3xl p-12 text-center max-w-md">
          <div class="text-6xl mb-6">⚠️</div>
          <h2 class="text-2xl font-bold mb-4 gradient-text">שגיאת מערכת</h2>
          <p class="text-gray-400 mb-6">{{ store.error() }}</p>
          <button 
            (click)="store.initialize()"
            class="btn-primary"
          >
            נסה שוב
          </button>
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
    protected readonly store = inject(AppStore);

    ngOnInit(): void {
        this.store.initialize();
    }
}
