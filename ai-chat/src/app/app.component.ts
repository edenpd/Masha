import { Component } from '@angular/core';
import { AiChatComponent } from 'ai-chat';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AiChatComponent],
  template: `
    <ai-chat [config]="chatConfig" [style]="{ height: '100vh', width: '100%', display: 'block' }" />
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent {
  protected chatConfig = {
    model: {
      systemPrompt: 'אתה עוזר משאבי אנוש מקצועי',
      apiKey: environment.cohereApiKey,
    },
    design: {
      mode: 'popover' as const,
      isDarkMode: false,
      width: '450px',
      height: '600px'
    },
    chat: {
      title: 'AI Chat Library',
      questionSuggestions: [
        'איך עושים תיאום מס?',
        'מהן ההפרשות לפנסיה?',
        'איך מעדכנים פרטי בנק?'
      ]
    }
  };
}
