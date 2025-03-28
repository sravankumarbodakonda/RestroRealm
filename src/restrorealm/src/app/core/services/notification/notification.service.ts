import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private audio: HTMLAudioElement;
  private notificationEnabled = true;

  constructor() {
    // Initialize audio with multiple fallback sources
    this.audio = this.createAudioElement();
  }

  private createAudioElement(): HTMLAudioElement {
    const audio = new Audio();
    
    // Add multiple source types for browser compatibility
    const sources = [
      { type: 'audio/ogg', src: 'assets/sounds/notification.ogg' },
      { type: 'audio/mp3', src: 'assets/sounds/notification.mp3' },
      { type: 'audio/wav', src: 'assets/sounds/notification.wav' }
    ];

    sources.forEach(({ type, src }) => {
      const source = document.createElement('source');
      source.type = type;
      source.src = src;
      audio.appendChild(source);
    });

    // Add error handling
    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
    });

    return audio;
  }

  async playNewOrderNotification(): Promise<void> {
    if (!this.notificationEnabled) return;

    try {
      // Reset audio to beginning in case it's already playing
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
      this.handlePlaybackError(error);
    }
  }

  toggleNotifications(enabled: boolean): void {
    this.notificationEnabled = enabled;
    if (!enabled) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  private handlePlaybackError(error: any): void {
    // Handle specific error scenarios
    if (error.name === 'NotSupportedError') {
      console.warn('Browser does not support audio playback');
    }
    
    // Optionally implement fallback notification methods here
    // e.g., Web Audio API fallback or visual notification
  }
}
