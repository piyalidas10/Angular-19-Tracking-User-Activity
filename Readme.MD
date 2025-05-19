# Angular 19 : Tracking User Activity

User activity tracking is the process of monitoring, collecting, and analyzing visitor browsing behavior on a website or app.
Using this customize use activity tracker, you can track user's events like clicking, mouseover, API calling etc. You can modify further as per your requirements.

Also you can save the user activity data in database by calling tracking API.

There have two ways by which you can track user activities. 1. calling track function from TS file 2. Pass data through tracking directive

## Tracking directive

You can pass trackingId or componentName. calling track function using @HostListener for Click event

```
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
```

## Tacking from TS file

app.component.ts

```
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { TrackingService } from './services/tracking.service';
import { User } from './models/user';
import { TrackingDirective } from './directives/tracking.directive';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TrackingDirective],
  providers: [TrackingService, ApiService, SharedService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'angular-tracker';
  data?: User[];
  customValue = {
    statusText: '',
    message: '',
  };
  constructor(
    private apiService: ApiService,
    private trackingService: TrackingService
  ) {
    this.callAPI();
  }

  callAPI() {
    this.apiService
      .getUsers()
      .pipe(
        catchError((error) => {
          this.customValue = {
            statusText: error.statusText,
            message: error.message,
          };
          this.trackingService.track(
            'user-API',
            `user-API-error-${error.status}`,
            JSON.stringify(this.customValue)
          );
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (data) => {
          if (data?.length > 0) {
            console.log('API Response => ', data);
            this.customValue = {
              statusText: '200',
              message: 'Data found',
            };
            this.trackingService.track(
              'user-API',
              'user-API-success',
              JSON.stringify(this.customValue)
            );
            this.data = data;
          } else {
            this.customValue = {
              statusText: '200',
              message: 'Data not found',
            };
            this.trackingService.track(
              'user-API',
              `user-API-repone-blank`,
              JSON.stringify(this.customValue)
            );
            console.log('Blank reponse');
          }
        },
      });
  }
}

```

## Tracking Service

- Initialize tracking service using initialize() to be active when angular application is loaded.

* track function by passing actionName name, trackingId (component / action decription) and customValue (optional).

- track function is calling buildEventRequest function to create request body to call callToTrackAPI function
- callToTrackAPI stores data in database

```
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { timeout, catchError, tap } from 'rxjs/operators';
import { TrackEvent } from '../models/track-event';
import { TrackEventValue } from '../models/track-event-value';
import { SharedService } from './shared.service';
import { AppInfo } from '../config/appinfo';
import { Endpoint } from '../config/endpoint';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  public initialized = false;

  private trackingUrl = '';

  constructor(private sharedService: SharedService, private http: HttpClient) {
    this.initialize();
  }

  private initialize() {
    this.trackingUrl = this.sharedService.getTrackingUrl();
    this.initialized = true;
  }

  public track(actionName: string, trackingId: string, customValue?: string) {
    const event = this.buildEventRequest(
      actionName,
      trackingId,
      customValue ? customValue : ''
    );
    console.log('Track event => ', event);
    this.callToTrackAPI(event)
      ?.pipe(
        tap((data) => console.log('callToTrackAPI => ', event)),
        timeout(300),
        catchError((error) => of({ error }))
      )
      .subscribe();
  }

  private callToTrackAPI(event: TrackEvent) {
    if (
      !this.initialize ||
      this.trackingUrl.indexOf('undefined') >= 0 ||
      this.trackingUrl === Endpoint.originApi
    ) {
      return of({});
    }
    // Call API to save tracking data in database
    const headers = new HttpHeaders().set('Content-type', 'application/json');
    return this.http.post(this.trackingUrl, event, { headers });
  }

  private buildEventRequest(
    actionName: string,
    trackingId: string,
    customValue: string
  ) {
    const page = this.pageBuilder(location.pathname);
    if (!trackingId) {
      trackingId = 'component-undefined';
    }
    const key = this.keyBuilder(AppInfo.appName, actionName, trackingId, page);
    return this.createTrackEvent(
      key,
      actionName,
      trackingId,
      page,
      customValue
    );
  }

  private createTrackEvent(
    key: string,
    actionName: string,
    trackingId: string,
    page: string | null,
    customValue?: string
  ): TrackEvent {
    const result: TrackEvent = new TrackEvent();
    result.key = key;
    result.url = location.pathname;
    result.sequence = this.sharedService.getTrackingSequence();
    result.created = this.sharedService.getCurrentTime();
    result.customValue = customValue ? customValue : '';
    result.value = this.createTrackEventValue(actionName, trackingId, page);
    return result;
  }

  createTrackEventValue(
    actionName: string,
    trackingId: string,
    page: string | null
  ): TrackEventValue {
    const trackEventValue = new TrackEventValue();
    trackEventValue.action = actionName;
    trackEventValue.component = trackingId;
    trackEventValue.page = page;
    trackEventValue.app = AppInfo.appName;
    trackEventValue.appVersion = AppInfo.appVersion;
    return trackEventValue;
  }

  private keyBuilder(
    appName: string,
    actionName: string,
    trackingId: string,
    page: string | null
  ): string {
    return `${appName} -> ${page} -> ${actionName} -> ${trackingId}`;
  }

  pageBuilder(pageName: string) {
    const regex = /\/([a-zA-Z]+).*/;
    if (pageName === '/') {
      return 'home';
    } else {
      const pageNameBuilt = regex.exec(pageName);
      return pageNameBuilt ? pageNameBuilt[1] : null;
    }
  }
}
```

### Window sessionstorage

For better Coding quality, with Server Side Rendering I suggest you not only use window through token, but also create this token in SSR friendly manner, without referencing window at all. Angular has built-in DOCUMENT token for accessing document. Here's what I came up with for my projects to use window through tokens:

```
import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

export const WINDOW = new InjectionToken<Window>('window object', {
  factory: () => {
    const { defaultView } = inject(DOCUMENT);

    if (!defaultView) {
      throw new Error('Window is not available');
    }

    return defaultView;
  },
});
```
