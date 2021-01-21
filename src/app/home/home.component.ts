import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IResponse } from '../services/http/http.classes';
import { HttpService } from '../services/http/http.service';
import { WebSocketService } from '../services/web-socket/web-socket.service';
import { IPlayedRound, IPlayers, IUser } from './home.interface';
import * as orderBy from 'lodash.orderby';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  gameWaiting = "Game Waiting";
  countdownStarted = "Countdown Started";
  countingDown = "Counting Down";
  gameStarted = "Game Started";
  playedRound = "Played Round";
  gameCompleted = "Game Completed";
  gameReset = "Game Reset";

  playerJoined = "Player Joined";
  playerRegistered = "Player Registered";

  joinButtonText = "Join Game";
  joiningText = "Joining, Please Wait..."

  countingDownModel = null;
  serverError: string = null;
  rounds: IPlayedRound[] = [];
  players: IPlayers[] = [];
  wsSubscription: Subscription;

  currentGameStatus: string = null;

  form: FormGroup;
  name: string = null;
  lastGameWinnerList: string[] = [];
  toastMessage: { type: string, message: string } = null;

  isServerOffline: boolean = false;
  serverOfflineMessage: string = "Server is offline. Please check server.";

  constructor(
    private wsService: WebSocketService,
    private httpService: HttpService
  ) {
    this.connectUsingWebsocket();
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null, [Validators.required]),
      first: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^-?(0|[1-9]\d*)?$/)]),
      second: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^-?(0|[1-9]\d*)?$/)]),
    })
  }

  connectUsingWebsocket() {
    this.wsSubscription =
      this.wsService.createObservableSocket(`${environment.socketToConnect}/subscribe`)
        .subscribe(
          jsonData => {
            console.log(jsonData);

            // let jsonData = JSON.parse(data);
            this.currentGameStatus = jsonData.type;

            switch (this.currentGameStatus) {
              case this.gameReset:
                this.rounds = [];
                // this.players = Object.keys(jsonData.data.players);
                break;

              case this.countdownStarted:
              case this.countingDown:
                this.countingDownModel = jsonData;
                break;

              case this.playerJoined:
                this.players = [...this.players, ...jsonData.data.map(d => { return { ...d, joined: false } })];
                this.toastMessage = {
                  type: "success",
                  message: `${jsonData.data.map(d => { return d.name }).join(", ")} has joined the game`
                };

                break;

              case this.playerRegistered:
                break;

              case this.playedRound:

                if (jsonData.data.round == 1 || this.players.length == 0) {
                  this.players = jsonData.data.leader_board.map(d => { return { name: d.name, upper: d.upper, lower: d.lower, joined: true } });
                }
                this.rounds.push(jsonData.data);

                break;

              case this.gameCompleted:

                const lastRoundLeaderBoard = this.rounds[this.rounds.length - 1].leader_board;
                this.lastGameWinnerList = orderBy(lastRoundLeaderBoard, ['score', 'upper', 'lower', 'name'], ['desc', 'desc', 'desc', 'asc']);

                break;
            }

          },
          err => {
            this.isServerOffline = true;
            // this.toastMessage = { type: "danger", message: "Server is offline" };
            console.log('err', err);
          },
          () => console.log('The observable stream is complete')
        );
  }

  sortedRoundsData = () => { return orderBy(this.rounds, ['round'], ['desc']) }

  joinGame() {

    if (this.form.valid) {
      const user = this.form.value;
      this.joinButtonText = this.joiningText;

      this.httpService.post<IUser>(`${environment.apiToConnect}/join`, user)
        .subscribe((res: IResponse) => {
          this.serverError = null;
          this.form.disable();
          this.name = user.name;

          this.joinButtonText = "Joined";
          this.toastMessage = { type: "success", message: res.detail };
          this.isServerOffline = false;

        }, (err: HttpErrorResponse) => {
          this.joinButtonText = "Join Game";

          if (err.error.status) {
            this.serverError = err.error.detail;
          }
          else {
            this.isServerOffline = true;
            this.toastMessage = { type: "danger", message: this.serverOfflineMessage };
          }

        });
    }
  }

  closeSocket() {
    this.wsService.close();
  }

  ngOnDestroy() {
    this.closeSocket();
  }
}
