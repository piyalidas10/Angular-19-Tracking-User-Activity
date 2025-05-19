import { inject, Injectable } from '@angular/core';
import { Endpoint } from '../config/endpoint';
import { WINDOW } from '../config/browser-token';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private readonly window = inject(WINDOW);
  private setSessionstorageItem(key: string, value: string) {
    this.window.sessionStorage.setItem(key, value);
  }

  private getSessionstorageItem(key: string) {
    return this.window.sessionStorage.getItem(key);
  }

  getCurrentTime(): number {
    return Math.round(new Date().getSeconds() / 1000);
  }

  setTrackingSequence(sequence: string) {
    this.setSessionstorageItem('TRACK_SEQ', sequence);
  }
  getTrackingSequence(): number {
    let sequence = this.getSessionstorageItem('TRACK_SEQ');
    if (!sequence) {
      this.setSessionstorageItem('TRACK_SEQ', '0');
      sequence = this.getSessionstorageItem('TRACK_SEQ');
    }
    const newSequence = +Number(sequence) + 1;
    this.setSessionstorageItem('TRACK_SEQ', newSequence.toString());
    return newSequence;
  }
  getTrackingUrl() {
    return `${Endpoint.originApi}${Endpoint.trackingUrl}`;
  }
}
