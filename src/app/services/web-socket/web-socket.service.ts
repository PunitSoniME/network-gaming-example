import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  ws: WebSocket;
  socketIsOpen = 1;

  constructor() { }

  createObservableSocket(url: string): Observable<any> {
    this.ws = new WebSocket(url);

    return new Observable(
      observer => {

        this.ws.onmessage = (event) => {
          observer.next(JSON.parse(event.data));
        }

        this.ws.onerror = (event) => {
          observer.error(event);
        }

        this.ws.onclose = (event) => {
          this.ws.close();
          // observer.complete();
        }

        return () => {
          this.ws.close();
        }
      }
    );
  }

  close() {
    this.ws.close();
  }
}
