import { Directive, HostListener, Input } from '@angular/core';
import { TrackingService } from '../services/tracking.service';

@Directive({
  selector: '[appTracking]',
  standalone: true,
})
export class TrackingDirective {
  @Input() componentName: string = '';
  @Input() trackingId?: string;

  constructor(private trackingService: TrackingService) {}

  @HostListener('click', ['$event']) clickEvent(event: any) {
    this.trackingService.track(
      event.type,
      this.trackingId ? this.trackingId : this.componentName
    );
  }
}
