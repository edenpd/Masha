import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../../store/app.store';

@Component({
    selector: 'app-loading-screen',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-deep-900 bg-mesh-gradient flex flex-col items-center justify-center relative overflow-hidden">
      
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Neural network lines -->
        @for (line of neuralLines; track line.id) {
          <div 
            class="absolute bg-gradient-to-r from-transparent via-neural-500/20 to-transparent h-px animate-pulse"
            [style.top.%]="line.top"
            [style.left.%]="line.left"
            [style.width.%]="line.width"
            [style.transform]="'rotate(' + line.rotation + 'deg)'"
            [style.animation-delay]="line.delay + 'ms'"
          ></div>
        }
        
        <!-- Floating orbs -->
        <div class="absolute top-1/4 right-1/4 w-64 h-64 bg-neural-500/10 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/4 left-1/4 w-80 h-80 bg-synapse-500/10 rounded-full blur-3xl animate-float" style="animation-delay: -2s"></div>
        <div class="absolute top-1/2 left-1/2 w-48 h-48 bg-matrix-500/10 rounded-full blur-3xl animate-float" style="animation-delay: -4s"></div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 flex flex-col items-center">
        
        <!-- Logo / Brain Icon with Glow -->
        <div class="relative mb-12">
          <div class="absolute inset-0 bg-gradient-to-r from-neural-500 to-synapse-500 rounded-full blur-2xl opacity-50 animate-pulse-slow"></div>
          <div class="relative glass rounded-3xl p-8 border border-white/20">
            <div class="text-7xl animate-float">🧠</div>
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-4xl md:text-5xl font-bold mb-2 gradient-text text-glow">
          HR AI Insight
        </h1>
        <p class="text-gray-400 text-lg mb-12">מערכת AI חכמה לניהול משאבי אנוש</p>

        <!-- Loading Steps Card -->
        <div class="glass-dark rounded-2xl p-8 w-full max-w-md">
          
          <!-- Progress Bar -->
          <div class="h-1.5 bg-deep-700 rounded-full mb-8 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-neural-500 via-synapse-500 to-matrix-500 rounded-full transition-all duration-700 ease-out"
              [style.width.%]="progressPercent()"
            ></div>
          </div>

          <!-- Steps List -->
          <div class="space-y-4">
            @for (step of store.visibleLoadingSteps(); track step.id; let i = $index) {
              <div 
                class="flex items-center gap-4 transition-all duration-500"
                [class.opacity-100]="step.completed || i === store.currentLoadingStep()"
                [class.opacity-40]="!step.completed && i !== store.currentLoadingStep()"
                [style.animation-delay]="i * 100 + 'ms'"
              >
                <!-- Icon / Spinner -->
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                     [class]="step.completed ? 'bg-matrix-500/20 text-matrix-400' : 'bg-neural-500/20 text-neural-400'">
                  @if (step.completed) {
                    <span class="animate-fade-in">✓</span>
                  } @else if (i === store.currentLoadingStep()) {
                    <div class="w-5 h-5 border-2 border-neural-400 border-t-transparent rounded-full animate-spin"></div>
                  } @else {
                    <span>{{ step.icon }}</span>
                  }
                </div>
                
                <!-- Text -->
                <div class="flex-1">
                  <p class="font-medium" [class.text-matrix-400]="step.completed">
                    {{ step.text }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Neural Dots Animation -->
        <div class="flex gap-2 mt-12">
          @for (dot of [0,1,2,3]; track dot) {
            <div class="neural-dot" [style.animation-delay]="dot * 200 + 'ms'"></div>
          }
        </div>

        <!-- Subtitle -->
        <p class="text-sm text-gray-500 mt-8">
          {{ randomTip() }}
        </p>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
    protected readonly store = inject(AppStore);

    // Neural network lines for background
    neuralLines = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: -10 + Math.random() * 20,
        width: 40 + Math.random() * 60,
        rotation: -30 + Math.random() * 60,
        delay: Math.random() * 2000,
    }));

    // Random tips in Hebrew
    private tips = [
        '💡 טיפ: תוכל לשאול על ימי חופש, משכורות ופרטי עובדים',
        '🔒 כל הנתונים מוצפנים ומאובטחים',
        '🚀 מערכת AI מתקדמת לעיבוד שפה טבעית',
        '📊 גישה מיידית לנתוני משאבי אנוש',
        '🌐 מותאם לעברית מלאה',
    ];

    private currentTipIndex = signal(0);
    private tipInterval?: ReturnType<typeof setInterval>;

    ngOnInit(): void {
        // Rotate tips every 3 seconds
        this.tipInterval = setInterval(() => {
            this.currentTipIndex.update(i => (i + 1) % this.tips.length);
        }, 3000);
    }

    ngOnDestroy(): void {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
        }
    }

    // Computed progress percentage
    progressPercent = () => {
        const total = this.store.loadingSteps().length;
        const current = this.store.currentLoadingStep();
        const completed = this.store.loadingSteps().filter(s => s.completed).length;
        return Math.round((completed / total) * 100);
    };

    // Get current tip
    randomTip = () => this.tips[this.currentTipIndex()];
}
