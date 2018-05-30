export class Conductor {
	constructor(url, authToken, connectionStatus) {
		this.channels = {};
		this.isConnected = false;
		this.kAllMessages = "*"; 
		this.ConOpCode = Object.freeze({BindOpcode: 0, UnbindOpcode: 1, WriteOpcode: 2, ServerOpcode: 3, CleanUpOpcode: 4});
		var param = "?Token";
		if(url.indexOf(param) > -1) {
			param = "&";
		}

		var self = this;
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
			this.writeMessage(this.ConOpCode.BindOpcode, channelName, this.createUUID(), "");
		}
	}

	//Unbind from a channel by its name and stop getting messages from it
	unbind(channelName) {
		delete this.channels[channelName];
		if(channelName != this.kAllMessages) {
			this.writeMessage(this.ConOpCode.UnbindOpcode, channelName, this.createUUID(), "");
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
	sendMessage(channelName, body) {
		this.writeMessage(this.ConOpCode.WriteOpcode, channelName, this.createUUID(), body);
	}

	//send a message to a channel with the server opcode.
	//note that channelName is optional in this case and is only used for context.
	sendServerMessage(channelName, body) {
		this.writeMessage(this.ConOpCode.ServerOpcode, channelName, this.createUUID(), "");
	}

	//disconnect from the stream, if connected.
	disconnect() {
		if(this.isConnected) {
			this.channels = {};
			this.socket.close();
		}
	}

	//wish these could be private...

	//writes the message to the websocket
	writeMessage(opcode, channelName, uuid, body) {
		var codeSize = 2; //because we are using uint8 and this is twice that size at unint16
		var threeCodes = codeSize * 3; //we have 3 different size variables (opcode, uuid, channel name)
		var bodySize = 4; //is uint32 so 8 * 4 is 32
		var buffer = new ArrayBuffer(threeCodes + channelName.length + uuid.length + bodySize + body.length);
		var view = new DataView(buffer);
		var offset = 0;
		//opcode
		view.setUint16(offset, opcode, true);
		offset += codeSize;

		//uuid
		view.setUint16(offset, uuid.length, true);
		offset += codeSize;
		offset += this.stringToDataView(view, offset, uuid);

		//channel name
		view.setUint16(offset, channelName.length, true);
		offset += codeSize;
		offset += this.stringToDataView(view, offset, channelName)

		//body
		view.setUint32(offset, body.length, true);
		offset += bodySize;
		offset += this.stringToDataView(view, offset, body)
	
		this.socket.send(view);
	}

	createStringFromArray(uint8Array) {
		return this.Utf8ArrayToStr(uint8Array);
	}

	stringToDataView(view, offset, str) {
		for (var i = 0, strLen = str.length; i < strLen; i++) {
			view.setUint8(offset + i, str.charCodeAt(i), true);
		}
		return str.length;
	}

	dataViewToString(view, offset, length) {
		var sliced = new Int8Array(view.buffer.slice(offset, offset + length));
		return this.Utf8ArrayToStr(sliced);
		//return String.fromCharCode.apply(null, sliced);
	}

	Utf8ArrayToStr(array) {
		var out, i, len, c;
		var char2, char3;
	
		out = "";
		len = array.length;
		i = 0;
		while(i < len) {
		c = array[i++];
		switch(c >> 4)
		{ 
		  case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
			// 0xxxxxxx
			out += String.fromCharCode(c);
			break;
		  case 12: case 13:
			// 110x xxxx   10xx xxxx
			char2 = array[i++];
			out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
			break;
		  case 14:
			// 1110 xxxx  10xx xxxx  10xx xxxx
			char2 = array[i++];
			char3 = array[i++];
			out += String.fromCharCode(((c & 0x0F) << 12) |
						   ((char2 & 0x3F) << 6) |
						   ((char3 & 0x3F) << 0));
			break;
		}
		}
	
		return out;
	}

	parseMessage(buffer) {
		var view = new DataView(buffer);
		var codeSize = 2;
		var offset = 0;
		var opcode = view.getInt16(offset, true);
		offset += codeSize;

		//uuid
		var uuidSize = view.getInt16(offset, true);
		offset += codeSize;

		var uuid = this.dataViewToString(view, offset, uuidSize);
		offset += uuidSize;

		//channel name
		var nameSize = view.getInt16(offset, true);
		offset += codeSize;

		var channelName = this.dataViewToString(view, offset, nameSize);
		offset += nameSize;
		
		//body
		var bodySize = view.getInt32(offset, true);
		offset += codeSize * 2;

		var body = new Int8Array(view.buffer.slice(offset, offset + bodySize));
		offset += bodySize;

		return {opcode: opcode, uuid_size: uuidSize, uuid: uuid, 
			name_size: nameSize, channel_name: channelName, body_size: bodySize, body: body};
	}

	createUUID() {
		var S4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		 };
		 return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}

	//process incoming messages
	processMessage(blob) {
		var reader = new FileReader();
		var self = this;
		reader.addEventListener("loadend", function() {
			// reader.result contains the contents of blob as a typed array
			var message = self.parseMessage(reader.result);
			if(message.opcode == self.ConOpCode.ServerOpcode) {
				if(self.serverChannel != null) {
					self.serverChannel(message);
				}
			} else {
				if(self.channels[message.channel_name] != null) {
					self.channels[message.channel_name](message);
				}
				if(self.channels[self.kAllMessages] != null) {
					self.channels[self.kAllMessages](message);
				}
			}
		 });
		reader.readAsArrayBuffer(blob);
	}
}

window.Conductor = Conductor;