"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

window.Conductor = (function () {
	function Conductor(url, authToken, connectionStatus) {
		_classCallCheck(this, Conductor);

		this.channels = {};
		this.isConnected = false;
		this.kAllMessages = "*";
		this.ConOpCode = Object.freeze({ Bind: 1, Unbind: 2, Write: 3, Info: 4, Server: 7, Invite: 8 });
		var param = "?Token";
		if (url.indexOf(param) > -1) {
			param = "&";
		}

		self = this;
		this.socket = new WebSocket(url + param + "=" + authToken);
		this.socket.onopen = function (e) {
			self.isConnected = true;
			if (connectionStatus != null) {
				connectionStatus(self.isConnected);
			}
		};
		this.socket.onclose = function (e) {
			self.isConnected = false;
			if (connectionStatus != null) {
				connectionStatus(self.isConnected);
			}
		};
		this.socket.onerror = function (error) {
			console.log("Error detected: " + error); // need to change this for per method.
		};
		this.socket.onmessage = function (e) {
			self.processMessage(e.data);
		};
	}

	_prototypeProperties(Conductor, null, {
		bind: {

			//bind to a channel by its name and get messages from it
			value: function bind(channelName, messages) {
				this.channels[channelName] = messages;
				if (channelName != this.kAllMessages) {
					this.writeMessage("", channelName, this.ConOpCode.Bind, null);
				}
			},
			writable: true,
			configurable: true
		},
		unbind: {

			//Unbind from a channel by its name and stop getting messages from it
			value: function unbind(channelName) {
				delete this.channels[channelName];
				if (channelName != this.kAllMessages) {
					this.writeMessage("", channelName, this.ConOpCode.Unbind, null);
				}
			},
			writable: true,
			configurable: true
		},
		serverBind: {

			//bind to the "server channel" and get messages tha are of the server opcode
			value: function serverBind(messages) {
				this.serverChannel = messages;
			},
			writable: true,
			configurable: true
		},
		serverUnBind: {

			//UnBind from the "server channel" and stop get messages that are of the server opcode
			value: function serverUnBind(channelName) {
				this.serverChannel = null;
			},
			writable: true,
			configurable: true
		},
		sendMessage: {

			//send a message to a channel with the write opcode
			value: function sendMessage(body, channelName, additional) {
				this.writeMessage(body, channelName, this.ConOpCode.Write, additional);
			},
			writable: true,
			configurable: true
		},
		sendInfo: {

			//send a message to a channel with the info opcode
			value: function sendInfo(body, channelName, additional) {
				this.writeMessage(body, channelName, this.ConOpCode.Info, additional);
			},
			writable: true,
			configurable: true
		},
		sendInvite: {

			//send a invite to a channel to a user
			value: function sendInvite(body, channelName, additional) {
				this.writeMessage(body, channelName, this.ConOpCode.Invite, additional);
			},
			writable: true,
			configurable: true
		},
		sendServerMessage: {

			//send a message to a channel with the server opcode.
			//note that channelName is optional in this case and is only used for context.
			value: function sendServerMessage(body, channelName, additional) {
				this.writeMessage(body, channelName, this.ConOpCode.Server, additional);
			},
			writable: true,
			configurable: true
		},
		connect: {

			//connect to the stream, if not connected
			value: function connect() {
				if (!this.isConnected) {
					this.channels = {};
				}
			},
			writable: true,
			configurable: true
		},
		disconnect: {

			//disconnect from the stream, if connected
			value: function disconnect() {
				if (this.isConnected) {
					this.channels = {};
					this.socket.close();
				}
			},
			writable: true,
			configurable: true
		},
		writeMessage: {

			//wish these could be private...

			//writes the message to the websocket
			value: function writeMessage(body, channelName, opcode, additional) {
				var msg = {
					body: body,
					channel_name: channelName,
					opcode: opcode,
					additional: additional
				};
				this.socket.send(JSON.stringify(msg));
			},
			writable: true,
			configurable: true
		},
		processMessage: {

			//process incoming messages
			value: function processMessage(json) {
				var message = JSON.parse(json);
				if (message.opcode == this.ConOpCode.Server || message.opcode == this.ConOpCode.Invite) {
					if (this.serverChannel != null) {
						this.serverChannel(message);
					}
				} else {
					if (this.channels[message.channel_name] != null) {
						this.channels[message.channel_name](message);
					}
					if (this.channels[this.kAllMessages] != null) {
						this.channels[this.kAllMessages](message);
					}
				}
			},
			writable: true,
			configurable: true
		}
	});

	return Conductor;
})();

