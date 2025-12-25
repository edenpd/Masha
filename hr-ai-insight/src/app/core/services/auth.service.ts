import { Injectable, signal, computed } from '@angular/core';
import { AuthUser } from '../../models';

/**
 * Mock Authentication Service
 * Simulates user authentication for HR AI Insight
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // State signals
    private readonly _currentUser = signal<AuthUser | null>(null);
    private readonly _isAuthenticating = signal(false);
    private readonly _authError = signal<string | null>(null);

    // Public computed signals
    readonly currentUser = computed(() => this._currentUser());
    readonly isAuthenticating = computed(() => this._isAuthenticating());
    readonly isAuthenticated = computed(() => this._currentUser() !== null);
    readonly authError = computed(() => this._authError());

    /**
     * Simulate authentication process
     * Returns mock HR manager user after a delay
     */
    async authenticate(): Promise<AuthUser> {
        this._isAuthenticating.set(true);
        this._authError.set(null);

        try {
            // Simulate network delay
            await this.delay(800);

            const mockUser: AuthUser = {
                userId: '999',
                name: 'מנהל משאבי אנוש',
                photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=hr-manager&backgroundColor=0c8ce9',
                role: 'מנהל HR'
            };

            this._currentUser.set(mockUser);
            return mockUser;

        } catch (error) {
            this._authError.set('שגיאה בהתחברות. נסה שנית.');
            throw error;
        } finally {
            this._isAuthenticating.set(false);
        }
    }

    /**
     * Logout the current user
     */
    logout(): void {
        this._currentUser.set(null);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
