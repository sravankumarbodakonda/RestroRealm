import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client?: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) {
    // Only initialize WebSocket on browser
    if (isPlatformBrowser(this.platformId)) {
      // Fix for SockJS in browser
      (window as any).global = window;
      
      this.initializeWebSocketConnection();
    }
  }

  private initializeWebSocketConnection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Import SockJS dynamically to avoid the global reference error
    import('sockjs-client').then(SockJS => {
      this.client = new Client({
        webSocketFactory: () => new SockJS.default(`${environment.imageUrl}/ws`),
        debug: function (str) {
          console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectHeaders: {
          'Authorization': 'Bearer ' + this.authService.getRefreshToken()
        }
      });

      this.client.onConnect = () => {
        console.log('WebSocket Connected');
        this.connected$.next(true);
      };

      this.client.onDisconnect = () => {
        console.log('WebSocket Disconnected');
        this.connected$.next(false);
      };

      this.client.onStompError = (frame) => {
        console.error('STOMP error', frame);
      };

      this.client.activate();
    }).catch(error => {
      console.error('Error loading SockJS:', error);
    });
  }

  public subscribe<T>(topic: string, callback: (data: T) => void): void {
    if (!isPlatformBrowser(this.platformId)) return;
  
    this.connected$.subscribe((connected) => {
      if (connected && this.client && !this.subscriptions.has(topic)) {
        this.doSubscribe(topic, callback);
      }
    });
  }

  private doSubscribe<T>(topic: string, callback: (data: T) => void): void {
    if (!this.client || !isPlatformBrowser(this.platformId)) return;
    
    const subscription = this.client.subscribe(topic, (message) => {
      console.log('Raw WebSocket message:', message.body);
      if (message.body) {
        callback(JSON.parse(message.body));
      }
    });
    this.subscriptions.set(topic, subscription);
  }

  public unsubscribe(topic: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  public disconnect(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.client) {
      this.client.deactivate();
    }
  }
}
