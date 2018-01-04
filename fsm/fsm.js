/**
 * Copyright Karsten Juschus
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
		"use strict";

	function FSMNode(n) {
		// Create a RED node
		RED.nodes.createNode(this,n);

		this.topic = n.topic;
		this.condition = n.condition;
		this.initstate = n.initstate;
		this.inittran = n.inittran;
		this.entry = n.entry;
		this.exit = n.exit;
		this.tran = n.tran;
		this.state = 'unknown';
		this.rules = n.rules;

		var node = this;
		//node.warn("Rules: "+this.rules.length);
		//node.warn("State: "+this.state);

		if (!node.entry && !node.exit && !node.tran) {
				node.tran = true;
		}

		setTimeout( function() { node.emit("input",{}); }, 100 );

		// respond to inputs....
		this.on('input', function (msg) {
			if (msg.fsm == null) {
				//node.warn("Init");
				//var outMsg = {};
				msg.fsm = {
					"condition_state": true,
					"condition": ""
				}
				//msg.fsm.condition = node.topic;
				node.state = node.initstate;
				if (node.tran) {
						msg.fsm.condition_state = node.inittran
						msg.fsm.condition_state_phase = true
						node.send(msg);
				}
				if (node.entry) {
						msg.fsm.condition_state = node.state + '_entry';
						msg.fsm.condition_state_phase = true
						node.send(msg);
				}
				node.status({fill:"green",shape:"dot",text:node.state});
			} else {
				//node.warn("Condition topic: "+msg.topic);
				//node.warn("Condition payload: "+ msg.payload);
				//node.warn("state: "+node.state + "  payload: " + msg.payload);
				//node.state
				if (typeof msg.fsm.condition_state === "boolean") {
					var found = false;
					for (var i = 0; i < node.rules.length; i++) {
						if (node.rules[i].s == node.state && node.rules[i].c == msg.fsm.condition && msg.fsm.condition_state && node.rules[i].t) {

							//node.last_state = node.rules[i].s;
							//node.next_state = node.rules[i].d;
							msg.fsm.last_state = node.rules[i].s;
							msg.fsm.next_state = node.rules[i].d;
							node.state = node.rules[i].d;

							//node.status({fill:"green",shape:"dot",text:node.rules[i].s+" => "+node.rules[i].d});
							// node.warn(
							// 	"Rule: " + i +
							// 	" node.rules[i].source: "+ node.rules[i].s +
							// 	" node.rules[i].destination: "+ node.rules[i].d +
							// 	" node.rules[i].condition: "+ node.rules[i].c +
							// 	" node.rules[i].condition_status: "+ node.rules[i].t
							// );
							// node.warn("condition: " + msg.fsm.condition)
							// node.warn("condition_state: " + msg.fsm.condition_state)

							//var outMsg = {};
							//msg.fsm.condition_state = node.topic; //NOT SURE WHY IT WAS THERE...
							if (node.exit) {
								msg.fsm.condition_state = node.rules[i].s + '_exit';
								msg.fsm.condition_state_phase = '_exit';
								node.status({fill:"green",shape:"dot",text:node.rules[i].s+"_exit"});
								node.send(msg);
							}
							else if (node.tran) {
								msg.fsm.condition_state = node.rules[i].n + '_transition';
								msg.fsm.condition_state_phase = '_transition';
								node.status({fill:"green",shape:"dot",text:node.rules[i].s+" => "+node.rules[i].d});
								//node.warn("transition!")
								node.send(msg);
							}
							else if (node.entry) {
								msg.fsm.condition_state = node.rules[i].d + '_entry';
								msg.fsm.condition_state_phase = '_entry';
								node.status({fill:"green",shape:"dot",text:node.state + "_entry"});
								node.send(msg);
							}
							found = true;
							break;
						}
					}
					if (!found) {
						node.status({fill:"gray",shape:"ring",text:"Act: "+node.state+" - NoTr: " + msg.fsm.condition + " " + msg.fsm.condition_state});
					}
				} else {
					//Need to validate if needs to trigger an other output.. (_exit, _transition, _entry)
					//node.warn("node.state: " + node.state)
					//node.warn("msg.fsm.condition_state: " + msg.fsm.condition_state)
					//node.warn("State_phase: " + msg.fsm.condition_state_phase)

					if(msg.fsm.condition_state_phase === "_entry"){
						node.status({fill:"green",shape:"dot",text:node.state});
					}
					if(msg.fsm.condition_state_phase === "_transition"){
						if (node.entry) {
							node.status({fill:"green", shape:"dot", text:msg.fsm.next_state + "_entry"});
							msg.fsm.condition_state = node.state + '_entry';
							msg.fsm.condition_state_phase = '_entry';
							node.send(msg);
						}
						else{
							node.status({fill:"green", shape:"dot", text:msg.fsm.next_state});
						}
					}
					if(msg.fsm.condition_state_phase === "_exit"){
						if (node.tran) {
							node.status({fill:"green",shape:"dot",text:msg.fsm.last_state+" => "+msg.fsm.next_state});
							msg.fsm.condition_state = node.state + '_transition';
							msg.fsm.condition_state_phase = '_transition';
							node.send(msg);
						}
						else if(node.entry){
							node.status({fill:"green",shape:"dot",text:msg.fsm.next_state + "_entry"});
							msg.fsm.condition_state = node.state + '_entry';
							msg.fsm.condition_state_phase = '_entry';
							node.send(msg);
						}
						else{
							node.status({fill:"green", shape:"dot", text:msg.fsm.next_state});
						}
						//node.status({fill:"green",shape:"dot",text:node.state});
					}



					// if(0){
					// 	//Enable empty condition to pass through
					// 	for (var i = 0; i < node.rules.length; i++) {
					// 		if(node.rules[i].s == node.state && node.rules[i].c === ""){
					// 			//on node.entry only, check if there is no condition to go to next state
					// 			node.state = node.rules[i].d;
					// 			node.warn(
					// 				"Rule: " + i +
					// 				" node.rules[i].s: "+ node.rules[i].s +
					// 				" node.rules[i].c: "+ node.rules[i].c +
					// 				" node.rules[i].d: "+ node.rules[i].d +
					// 				" node.rules[i].t: "+ node.rules[i].t
					// 			);
					// 			node.warn("msg: " + msg.topic + " " + msg.payload)
					// 			if (node.entry) {
					// 				msg.fsm.condition = node.rules[i].d;
					// 				msg.fsm.condition_state = true;
					// 				node.send(msg);
					// 				node.warn("Entering a state with no condition to transition, going to next state");
					// 			}
					// 		}
					// 	}
					// }


					//node.status({fill:"green",shape:"dot",text:node.state});
				}
			}
		});

		this.on("close", function() {
				// Called when the node is shutdown - eg on redeploy.
				// Allows ports to be closed, connections dropped etc.
				// eg: node.client.disconnect();
		});
	}
	RED.nodes.registerType("FSM", FSMNode);




	function FSMinput(n) {
		// Create a RED node
		RED.nodes.createNode(this,n);
		var node = this;
		var handler = function(msg) {
			msg._event = n.event;
			node.receive(msg);
		}
		RED.events.on(event,handler);
		this.on("input", function(msg) {
		    this.send(msg);
		});
		this.on("close",function() {
		    RED.events.removeListener(event,handler);
		});
	}
	RED.nodes.registerType("FSMinput", FSMinput);




	function FSMoutput(n) {
		//here we want to send to the fsmNode. that's it...
		// Create a RED node
		RED.nodes.createNode(this,n);
        var node = this;
        var event = "node:"+n.id;
        this.on("input", function(msg) {
            msg._event = event;
            RED.events.emit(event,msg)
            this.send(msg);
        });
	}
	RED.nodes.registerType("FSMoutput", FSMoutput);
}
