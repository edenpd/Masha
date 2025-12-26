import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../../store/app.store';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-deep-900 transition-colors duration-1000 flex flex-col items-center justify-center relative overflow-hidden font-outfit">
      
      <!-- Premium Background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-neural-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div class="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-synapse-500/10 rounded-full blur-[140px] animate-pulse-slow" style="animation-delay: -2s"></div>
      </div>

      <!-- Center Piece -->
      <div class="relative z-10 flex flex-col items-center max-w-sm w-full px-6">
        
        <!-- Spinner Element -->
        <div class="relative mb-16 scale-125">
          <!-- Multi-layered glow -->
          <div class="absolute inset-0 bg-neural-500 rounded-full blur-3xl opacity-10 dark:opacity-20 animate-pulse-slow"></div>
          
          <!-- Modern Spinner -->
          <div class="relative w-32 h-32 flex items-center justify-center">
            <svg class="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--neural-500);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:var(--synapse-500);stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="url(#spinner-gradient)" 
                stroke-width="3" 
                stroke-linecap="round"
                stroke-dasharray="180 100"
              />
            </svg>
            <!-- HR AI Smart Animation (Profile & Data Insight) -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-24 h-24 rounded-full border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-sm">
                <svg viewBox="0 0 100 100" class="w-16 h-16 text-neural-500">
                  <!-- Profile Silhouette -->
                  <circle cx="50" cy="40" r="12" fill="currentColor" opacity="0.4" />
                  <path d="M50 55 C30 55, 20 75, 20 90 L80 90 C80 75, 70 55, 50 55 Z" fill="currentColor" opacity="0.4" />
                  
                  <!-- Scanning Bar -->
                  <rect x="15" y="30" width="70" height="2" fill="var(--synapse-500)" opacity="0.8">
                    <animate attributeName="y" values="30;85;30" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
                  </rect>

                  <!-- Pulsing AI Chat Bubble -->
                  <g class="animate-bounce" style="animation-duration: 3s">
                    <path d="M75 25 C75 20, 85 20, 85 25 L85 35 C85 40, 75 40, 75 35 Z" fill="var(--synapse-500)" opacity="0.6" />
                    <circle cx="80" cy="30" r="8" fill="var(--synapse-500)" opacity="0.8">
                      <animate attributeName="r" values="7;9;7" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  <!-- Floating Data Particles (HR Symbols) -->
                  <text x="25" y="45" font-size="10" fill="currentColor" opacity="0.6" class="animate-pulse">₪</text>
                  <text x="65" y="75" font-size="10" fill="currentColor" opacity="0.6" class="animate-pulse" style="animation-delay: 0.5s">📅</text>
                  <text x="35" y="70" font-size="8" fill="currentColor" opacity="0.6" class="animate-pulse" style="animation-delay: 1s">👔</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Typography -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold mb-3 gradient-text tracking-tight animate-fade-in">
            HR AI
          </h1>
          <div class="flex items-center justify-center gap-2 text-gray-400 dark:text-neural-400 font-medium tracking-wide">
            <span class="w-1.5 h-1.5 rounded-full bg-neural-500 animate-pulse"></span>
            @for (msg of [store.currentLoadingMessage()]; track msg) {
              <span class="animate-fade-in inline-block">
                {{ msg }}
              </span>
            }
          </div>
        </div>

        <!-- Rotating Tip -->
        <div class="h-6 flex items-center justify-center">
            @for (tip of [randomTip()]; track tip) {
              <p class="text-gray-400 dark:text-gray-500 text-sm font-light animate-fade-in text-center italic">
                {{ tip }}
              </p>
            }
        </div>
      </div>

      <!-- Bottom Branding -->
      <div class="absolute bottom-12 text-gray-300 dark:text-gray-600 text-[10px] uppercase tracking-[0.2em] font-bold">
        Secure Intelligent Core
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0); }
      50% { transform: translateY(-10px) rotate(5deg); }
    }
    .animate-spin-slow {
      animation: spin 3s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 8s ease-in-out infinite;
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.1; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.1); }
    }
    .animate-fade-in {
      animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    :host {
      --neural-500: #10b981;
      --synapse-500: #3b82f6;
    }
  `]
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  protected readonly store = inject(AppStore);

  // Random tips in Hebrew
  private tips = [
    '💡 טיפ: תוכל לשאול על ימי חופש, משכורות ופרטי עובדים',
    '🔒 כל הנתונים מוצפנים ומאובטחים',
    '🚀 מערכת AI מתקדמת לעיבוד שפה טבעית',
    '📊 גישה מיידית לנתוני משאבי אנוש',
    '🌐 מותאם לעברית מלאה',
  ];

  protected currentTipIndex = signal(0);
  private tipInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Rotate tips every 3 seconds
    this.tipInterval = setInterval(() => {
      this.currentTipIndex.update(i => (i + 1) % this.tips.length);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.tipInterval) clearInterval(this.tipInterval);
  }

  // Get current tip
  randomTip = () => this.tips[this.currentTipIndex()];
}
