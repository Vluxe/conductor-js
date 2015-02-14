window.Conductor = class Conductor {
	constructor(url, authToken, connectionStatus) {
		this.channels = {};
		this.isConnected = false;
		this.kAllMessages = "*";
		this.ConOpCode = Object.freeze({Bind: 1, Unbind: 2, Write: 3, Info: 4, Server: 7, Invite: 8});
		var param = "?Token";
		if(url.indexOf(param) > -1) {
			param = "&";
		}

		self = this;
		this.socket = new WebSocket(url + param + "=" + authToken);
		this.socket.onopen = function(e) {
			self.isConnected = true;
			if(connectionStatus != null) {
				connectionStatus(self.isConnected);
			}
		}
		this.socket.onclose = function(e) {
			self.isConnected = false;
			if(connectionStatus != null) {
				connectionStatus(self.isConnected);
			}
		}
		this.socket.onerror = function(error) {
			console.log('Error detected: ' + error); // need to change this for per method.
		}
		this.socket.onmessage = function(e) {
			self.processMessage(e.data);
		}
	}

	//bind to a channel by its name and get messages from it
	bind(channelName, messages) {
		this.channels[channelName] = messages;
		if(channelName != this.kAllMessages) {
			this.writeMessage("",channelName,this.ConOpCode.Bind, null);
		}
	}

	//Unbind from a channel by its name and stop getting messages from it
	unbind(channelName) {
		delete this.channels[channelName];
		if(channelName != this.kAllMessages) {
			this.writeMessage("",channelName,this.ConOpCode.Unbind, null);
		}
	}

	//bind to the "server channel" and get messages tha are of the server opcode
	serverBind(messages) {
		this.serverChannel = messages;
	}

	//UnBind from the "server channel" and stop get messages that are of the server opcode
	serverUnBind(channelName) {
		this.serverChannel = null;
	}

	//send a message to a channel with the write opcode
	sendMessage(body, channelName, additional) {
		this.writeMessage(body,channelName,this.ConOpCode.Write,additional);
	}

	//send a message to a channel with the info opcode
	sendInfo(body, channelName, additional) {
		this.writeMessage(body,channelName,this.ConOpCode.Info,additional);
	}

	//send a invite to a channel to a user
	sendInvite(body, channelName, additional) {
		this.writeMessage(body,channelName,this.ConOpCode.Invite,additional);
	}

	//send a message to a channel with the server opcode.
	//note that channelName is optional in this case and is only used for context.
	sendServerMessage(body, channelName, additional) {
		this.writeMessage(body,channelName,this.ConOpCode.Server,additional);
	}

	//connect to the stream, if not connected
	connect() {
		if(!this.isConnected) {
			this.channels = {};
		}
	}

	//disconnect from the stream, if connected
	disconnect() {
		if(this.isConnected) {
			this.channels = {};
			this.socket.close();
		}
	}

	//wish these could be private...

	//writes the message to the websocket
	writeMessage(body, channelName, opcode, additional) {
		var msg = {
			body: body,
			channel_name: channelName,
			opcode: opcode,
			additional: additional
		};
		this.socket.send(JSON.stringify(msg));
	}

	//process incoming messages
	processMessage(json) {
		var message = JSON.parse(json);
		if(message.opcode == this.ConOpCode.Server || message.opcode == this.ConOpCode.Invite) {
			if(this.serverChannel != null) {
				this.serverChannel(message);
			}
		} else {
			if(this.channels[message.channel_name] != null) {
				this.channels[message.channel_name](message);
			}
			if(this.channels[this.kAllMessages] != null) {
				this.channels[this.kAllMessages](message);
			}
		}
	}
}