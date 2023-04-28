const fs = require('fs');
const beautify = require('json-beautify');

let statusFilename = './ipm-status.json';

function setStatusFilename (fname) {
	statusFilename = fname;
}

async function run () {
	
	// attempt to resume status
	if (!loadStatus(this)) {
		// otherwise start at the beginning
		this.currPos = [{ i: -1 }];
		moveToNextNode(this);
	}

	// loop until done or fail
	do
	{
		// run current node
		let result = await runCurrNode(this);

		// stop if it failed
		if (result === false) {
			break;
		}

		// move on and save our current status
		moveToNextNode(this);
		await saveStatus(this);
	}
	while (this.currPos.length);

	return this;
}

function moveToSiblingOrNextIteration (tree) {
	// try to just increment current position
	let pos = tree.currPos.pop();
	if (pos.iter !== undefined) {
		pos.iter++;
	}
	else {
		pos.i++;
	}
	tree.currPos.push(pos);
	//console.log('after simple inc, pos is', tree.currPos);
}

function moveToNextNode (tree) {
	//console.log('\nstarting on', tree.currPos);
	for (;;) {
		//console.log('first line in loop');

		moveToSiblingOrNextIteration(tree);

		// see if we landed on a valid node
		//console.log('at', tree.currPos);
		let node = getCurrNode(tree.head, tree.currPos);
		if (node) {

			if (isLoop(node)) {
				if (hasIterations(tree, node)) {

					// just starting the loop
					if (currIteration(tree, node) === null) {
						setCurrIteration(tree, node, 0);
						let totalIterations = numIterations(tree, node);
						//console.log('entering loop ' + node.loopVar + ' (' + totalIterations + ' iterations)');
						tree.currPos[tree.currPos.length - 1].iter = 0;
						tree.currPos.push({i: -1});
						continue;
					}

					// continuining the loop
					else {
						let iteration = currIteration(tree, node);
						let totalIterations = numIterations(tree, node);
						iteration++;
						if (iteration >= totalIterations) {
							//console.log('exiting loop ' + node.loopVar);
							deleteIterationVar(tree, node);
							delete (tree.currPos[tree.currPos.length - 1].iter);
							continue;
						}
						else {
							//console.log('continuing loop ' + node.loopVar + ' (' + iteration + '/' + totalIterations + ')');
							setCurrIteration(tree, node, iteration);
							tree.currPos.push({ i: -1 });
							continue;
						}
					}
				}
				else {
					continue;
				}
			}
			else {
				//console.log('landed on valid node, so done'); 
				return;
			}
		}
		else {
			let res = goUp(tree);
			if (!res) {
				return;
			}
		}
	}
}

function deleteIterationVar (tree, node)
{
	let instanceVar = node.loopVar + '.index';
	del.bind(tree)(instanceVar);
}

function setCurrIteration (tree, node, iteration) {
	//console.log('setting curr iteration', node.loopVar + '.index', 'to', iteration);
	let indexVar = node.loopVar + '.index';
	(set.bind(tree))(indexVar, iteration);
	let array = (get.bind(tree))(node.loopVar);
	//console.log('setting', node.loopInstance,'to',array[iteration]);
	(set.bind(tree))(node.loopInstance, array[iteration]);
}

function currIteration (tree, node) {
	//console.log('getting curr iteration var', node.loopVar + '.index');
	//console.log('tree globals:', tree.globals);
	let instanceVar = node.loopVar + '.index';
	let instance = (get.bind(tree))(instanceVar);
	//console.log('it is', (instance !== undefined) ? instance : null);
	return ((instance !== undefined) ? instance : null);
}

function goUp (tree) {
	// go back up one level
	tree.currPos.pop();
	//console.log('went back up a level, now at', tree.currPos); 

	// if empty, we're totally done
	if (!tree.currPos.length) {
		//console.log('\ndone with the entire tree'); 
		return (false);
	}

	return (true);
}

function hasIterations (tree, node) {
	let loopVar = tree.get(node.loopVar);
	return ((loopVar && loopVar.length) ? true : false);
}

function numIterations(tree, node) {
	let loopVar = tree.get(node.loopVar);
	return loopVar.length;
}

function isLoop (node) {
	return (node.loopVar ? true : false);
}

function isCallback (node) {
	return (node.callback ? true : false);
}

function getCurrNode (startNode, posArray) {
	let pos = posArray[0];
	let node = startNode;
	for (let i = 0; i < pos.i; i++) {
		node = node.next;
		if (!node) {
			return (null);
		}
	}
	posArray = posArray.slice(1);
	if (posArray.length) {
		return getCurrNode(node.body, posArray);
	} else {
		return node;
	}
}

async function runCurrNode(tree) {
	//console.log('\n', tree.currPos);
	let node = getCurrNode(tree.head, tree.currPos);
	let result = await runNode(tree, node);
	return result;
}

function loadStatus (tree) {
	try {
		const statusRaw = fs.readFileSync(statusFilename).toString('utf8');
		const status = JSON.parse(statusRaw);
		tree.globals = status.globals;
		if (status.currPos && status.currPos.length) {
			tree.currPos = status.currPos;
			return (true);
		}
		else {
			return (false);
		}
	}
	catch (error) {
		return (false);
	}
}

async function saveStatus (tree) {
	fs.writeFileSync(statusFilename, beautify({
		//structure: tree.head,
		globals: tree.globals,
		currPos: tree.currPos,
	}, null, 2, 80));
}

async function runNode (tree, node) {
	if (isCallback(node)) {
		let result = await runCallbackNode(tree, node);
		if (result === false) {
			return (false);
		}
	} else {
		console.log('Unrecognized node type:', node);
	}
	return (true);
}

async function runCallbackNode (tree, node) {
	let result = await node.callback({
		get: tree.get, 
		set: tree.set,
	});
	if (result === false) {
		return (false);
	}
	return (true);
}

function del (name) {
/*
	if (name[0] === '@') {
*/
		delete (this.globals[name]);
/*
	} else {
		// look up in hierarchy, find closest match
	}
*/
}

function get(name) {
/*
	if (name[0] === '@') {
*/
		return this.globals[name];
/*
	} else {
		// look up in hierarchy, find closest match
	}
*/
}

function set (name, val) {
/*
	if (name[0] === '@') {
*/
		this.globals[name] = val;
/*
	}
	else {
		// look up in hierarchy, find closest match
	}
*/
}

module.exports = {run, get, set, del, setStatusFilename};
