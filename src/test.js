const {$, $each, setStatusFilename} = require ('./index.js');

async function getBoards ($) {
	console.log('getBoards');
	try {
		let boards = await someTrelloApiCall();
		$.set('boards', boards);
	} catch (error) {
		return false;
	}
}

async function listBoards ($) {
	let boards = $.get('boards');
	console.log('listBoards', boards);
}

async function someTrelloApiCall () {
	return ([1,2,3]);
}

async function getActions ($) {
	$.set('actions', [4, 5, 6]);
	console.log('getActions');
}

async function handleAction ($) {
	console.log('handleAction, board is', $.get('board'), 'actions is', $.get('action'));
}

async function handlePlan () {
	console.log('handlePlan');
}

setStatusFilename('my-status.json');
$(getBoards)
.then(listBoards)
.each('boards', 'board', 
	$(getActions).each('actions', 'action',
		$(handleAction)
		// store latest timestamp per board and ref that
	)
)
.each('plans', 'plan', 
	$(handlePlan)
)
.run();

module.exports = {$, $each};
