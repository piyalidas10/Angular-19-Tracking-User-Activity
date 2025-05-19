import { TrackEventValue } from './track-event-value';

export class TrackEvent {
  sequence: number = 0;
  clientTye: string = '';
  url: string = '';
  customValue: string = '';
  key: string = '';
  value?: TrackEventValue;
  created: number = 0;
}
