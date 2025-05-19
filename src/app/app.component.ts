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
