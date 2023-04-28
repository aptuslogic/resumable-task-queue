const {run, get, set, del} = require('./run.js');

function $(func) {
	return new createTreeWithCallback(func);
}

function $each(loopVar, loopInstance, body) {
	return new createTreeWithLoop(loopVar, loopInstance, body);
}

function createTreeWithCallback (func) {
	// begin tree
	this.head = createCallbackNode(func);
	this.tail = this.head;
	this.globals = {};
	this.get = get.bind(this);
	this.set = set.bind(this);
	this.del = del.bind(this);

	// attach utility functions
	attach(this);
	return this;
}

function createTreeWithLoop (loopVar, loopInstance, body) {
	// begin tree
	this.head = createLoopNode(loopVar, loopInstance, body);
	this.tail = this.head;
	this.globals = {};
	this.get = get.bind(this);
	this.set = set.bind(this);
	this.del = del.bind(this);
	
	// attach utility functions
	attach(this);
	return this;
}

function attach (tree) {
	tree.run = run;
	tree.then = createThen;
	tree.each = createLoop;
}

function createThen (callback) {
	let node = createCallbackNode(callback);
	this.tail.next = node;
	this.tail = node;

	// attach utility functions
	attach(this);
	return this;
}

function createLoop (loopVar, loopInstance, body) {
	// create the node and attach it
	let node = createLoopNode(loopVar, loopInstance, body);
	this.tail.next = node;
	this.tail = node;

	// attach utility functions
	attach(this);
	return this;
}

function createCallbackNode (callback) { 
	return {
		callback,
	};
}

function createLoopNode (loopVar, loopInstance, body) {
	return {
		loopVar,
		loopInstance,
		body: body.head,
	};
}

module.exports = {$, $each};
