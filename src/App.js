import React, { Component } from 'react';
import Game from './Game';
import Board from './Board';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";
import shortid from 'shortid';
import './Game.css';

import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
	constructor(props) {
		super(props);

		this.pubnub = new PubNubReact({
			publishKey: "pub-c-427927c5-c4c8-4335-89be-be8ed0e6ff70",
			subscribeKey: "pub-c-427927c5-c4c8-4335-89be-be8ed0e6ff70"
		});

		this.state = {
			piece: '', // X or O
			isPlaying: false, // Set to true when 2 players are in a channel
			isRoomCreator: false,
			isDisabled: false,
			myTurn: false,
		};

		this.lobbyChannel = null; // Lobby channel
		this.gameChannel = null; // Game channel
		this.roomId = null; // Unique id when player creates a room

		this.pubnub.init(this); // Initialize PubNub
	}

	// Create a room channel
	onPressCreate = (e) => {
		// Create a random name for the channel
		this.roomId = shortid.generate().substring(0, 5);
		this.lobbyChannel = 'tictactoelobby--' + this.roomId; // Lobby channel name
		this.pubnub.subscribe({
			channels: [this.lobbyChannel],
			withPresence: true // Checks the number of people in the channel
		});

		// display modal
		Swal.fire({
			position: 'top',
			allowOutsideClick: false,
			title: 'Share this room ID with your friend',
			text: this.roomId,
			width: 275,
			padding: '0.7em',
			// Custom CSS to change the size of the modal
			customClass: {
				heightAuto: false,
				title: 'title-class',
				popup: 'popup-class',
				confirmButton: 'button-class'
			}
		})

		// change state values to reflect new state of app
		this.setState({
			piece: 'X',
			isRoomCreator: true,
			isDisabled: true, // Disable the 'Create' button
			myTurn: true, // Player X makes the 1st move
		});
	}

	// Press to join a room channel
	onPressJoin = (e) => {
		this.pubnub.subscribe({
			channels: [this.lobbyChannel],
			withPresence: true // Checks the number of people in the channel
		});

		// display modal
		Swal.fire({
			position: 'top',
			input: 'text',
			allowOutsideClick: false,
			inputPlaceholder: 'Enter the room id',
			showCancelButton: true,
			confirmButtonColor: 'rgb(208,33,41)',
			confirmButtonText: 'OK',
			width: 275,
			padding: '0.7em',
			customClass: {
				heightAuto: false,
				popup: 'popup-class',
				confirmButton: 'join-button-class',
				cancelButton: 'join-button-class'
			}
		}).then((result) => {
			// Check if the user typed a value in the input field
			if (result.value) {
				this.joinRoom(result.value);
			}
		})



	}

	// Join a room channel
	joinRoom = (value) => {
		this.roomId = value;
		this.lobbyChannel = 'tictactoelobby--' + this.roomId;

		// Check the number of people in the channel
		this.pubnub.hereNow({
			channels: [this.lobbyChannel],
		})
			.then((response) => {
				if (response.totalOccupancy < 2) {
					// new game
					this.pubnub.subscribe({
						channels: [this.lobbyChannel],
						withPresence: true
					});

					this.setState({
						piece: 'O', // set the second player to 'O'
					});

					this.pubnub.publish({
						message: {
							notRoomCreator: true,
						},
						channel: this.lobbyChannel
					});
				}
				else {
					// in progress game
					Swal.fire({
						position: 'top',
						allowOutsideClick: false,
						title: 'Error',
						text: 'Game in progress. Try another room.',
						width: 275,
						padding: '0.7em',
						customClass: {
							heightAuto: false,
							title: 'title-class',
							popup: 'popup-class',
							confirmButton: 'button-class'
						}
					})
				}
			})
			.catch((error) => {
				console.log(error);
			});
	}

	componentDidUpdate() {
		// Check that the player is connected to a channel
		if (this.lobbyChannel != null) {
			this.pubnub.getMessage(this.lobbyChannel, (msg) => {
				// Start the game once an opponent joins the channel
				if (msg.message.notRoomCreator) {
					// Create a different channel for the game
					this.gameChannel = 'tictactoegame--' + this.roomId;
					this.pubnub.subscribe({
						channels: [this.gameChannel]
					});
				}
			});

			// set game to be in progress
			this.setState({
				isPlaying: true
			});
			// Close the modals if they are opened
			Swal.close();
		}
	}

	render() {
		return (
			<div>
				<div className="title">
					<p> React Tic Tac Toe </p>
				</div>
				{
					!this.state.isPlaying &&
					<div className="game">
						<div className="board">
							<Board
								squares={0}
								onClick={index => null}
							/>
							<div className="button-container">
								<button
									className="create-button "
									disabled={this.state.isDisabled}
									onClick={(e) => this.onPressCreate()}
								>
									Create
								</button>
								<button
									className="join-button"
									onClick={(e) => this.onPressJoin()}
								>
									Join
								</button>
							</div>
						</div>
					</div>
				}
				{
					this.state.isPlaying &&
					<Game
						pubnub={this.pubnub}
						gameChannel={this.gameChannel}
						piece={this.state.piece}
						isRoomCreator={this.state.isRoomCreator}
						myTurn={this.state.myTurn}
						xUsername={this.state.xUsername}
						oUsername={this.state.oUsername}
						endGame={this.endGame}
					/>
				}
			</div>
		);
	}
}
export default App;

