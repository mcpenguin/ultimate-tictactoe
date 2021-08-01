import React, { Component } from 'react';
import Game from './Game';
import Board from './Board';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";
import shortid from 'shortid';
import './Game.css';

class App extends Component {
	constructor(props) {
		super(props);
		// REPLACE with your keys
		this.pubnub = new PubNubReact({
			publishKey: "YOUR_PUBLISH_KEY_HERE",
			subscribeKey: "YOUR_SUBSCRIBE_KEY_HERE"
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
	render() {
		return ();
	}
}
export default App;

