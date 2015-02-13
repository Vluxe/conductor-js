class Conductor {
	constructor(url, authToken) {
		this.channels = {};
		this.isConnected = false;
		this.connectionStatus = null;
		this.kAllMessages = "*";
		this.ConOpCode = Object.freeze({Bind: 1, Unbind: 2, Write: 3, Info: 4, Server: 7, Invite: 8});
		this.MessageType = Object.freeze({name: "name", channelName: "channel_name", body: "body", opCode: "opcode", additional: "additional"});
		var param = "?";
		if(url.indexOf(param) > -1) {
			param = "&";
		}
		this.socket = new WebSocket(url + param + "=" + authToken);
		this.socket.onopen = function() {
			this.isConnected = true;
			if(this.connectionStatus != null) {
				this.connectionStatus(this.isConnected);
			}
		};
		this.socket.onclose = function() {
			this.isConnected = false;
			if(this.connectionStatus != null) {
				this.connectionStatus(this.isConnected);
			}
		};
		this.socket.onerror = function() {
			console.log('Error detected: ' + error);
		};
		this.socket.onmessage = function(e) {
			this.processMessage(e.data);
		};
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
			this.socket.open();
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
		var message = {
			this.MessageType.body: body, 
			this.MessageType.channelName: channelName,
			this.MessageType.opCode: opcode,
			this.MessageType.additional: additional
			};
		this.socket.send(JSON.stringify(messages));
	}
	
	//process incoming messages
	processMessage(json) {
		var message = JSON.parse(json);
		if(message[this.MessageType.opCode] == this.ConOpCode.Server || message[this.MessageType.opCode] == this.ConOpCode.Invite) {
			if(self.serverChannel != null) {
				self.serverChannel(message);
			}
		} else {
			if(self.channels[message.channelName] != null) {
				self.channels[message.channelName](message);
			}
			if(self.channels[this.kAllMessages] != null) {
				self.channels[this.kAllMessages](message);
			}
		}
	}
}