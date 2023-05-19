# resumable-task-queue

### Purpose

A simple zero-dependency framework for creating asynchronous task runner services in NodeJS.  It facilitates creating an asynchronous, structured chain of events that occur repeatedly with the need to handle periodic interruption and resuming in a graceful manner.  If you need to perform a synchronization task with an external API, where a rate limit could be hit and you need to pick up at exactly the same spot one hour later, for example, this module makes that job much easier.

### Environment

This module is intended to be used in a server-side environment, in which the application has access to the file system.

### Installation

	npm install resumable-task-queue

### Usage

To use this library, you perform the following steps:

- Instantiate a "task queue structure" that links together your tasks that need to be queued, in the form of task functions.  These can be sequential tasks or looped.
- Ensure your task functions are defined as async when they execute functionality such as communicating with a database or external API.  
- Call the `run` function to start the process.  When this function is called, the engine will start calling your task functions in order, and will keep running until completion, unless one of your task functions explicitly returns `false`, in which case the engine will stop calling your functions.
- Any time the engine moves to the next step in your queue, it updates a status file in the local file system so that it can resume the process later at the same point.
- In your task functions, you can set variables via the engine, which are saved to the status file.  These variables can be set or queried to implement whatever functionality you need in your queue.

### Example

This is an example that interacts with the Atlassian Trello API to fetch a list of boards on an account, and then for each board, fetch a list of actions on that board, and finally, perform some handling step on each action.  Assume the `getBoards`, `getBoardActions`, and `handleBoardAction` functions are defined somewhere.

	import {$} from 'resumable-task-queue';

	$(getBoards)
	.each('boards', 'board',
		$(getBoardActions)
		.each('boardActions', 'boardAction',
			$(handleBoardAction)
		)
	)
	.run();

Here's a breakdown of what happens in this example:

- The `$(getBoards)` call adds a task to the queue that calls your `getBoards` function, in which it's assumed that you'll be setting the `boards` variable.
- A task is added to the queue that loops through the `boards` array and upon each iteration, sets the variable `board` equal to that array element.
- The `$(getBoardActions)` call adds a task to the queue that calls your `getBoardActions` function, in which it's assumed that you'll be setting the `boardActions` variable.  This happens inside the body of the loop on `boards`.
- A task is added to the queue that loops through the `boardActions` array and upon each iteration, sets the variable `boardAction` equal to that array element.
- The `$(handleBoardAction)` call adds a task to the queue that calls your `handleBoardAction` function.

### Importing with an Alias

If you need to import this library under a different name than `$`, you can change your import statement to this:

	import {$ as rtq} from 'resumable-task-queue';

Or, if you are using require statements, you can use this:

	const {$:rtq} = require('resumable-task-queue');

### Warnings

- This library doesn't perform any kind of scheduling whatsoever.  It's up to you to determine how often, and under what conditions, you'll be running your task queue.
- If you change the structure of your task queue in any way, it's important that you delete your status file (named `rtq-status.json` by default).  This library uses that file to store the current position in the queue the last time it was run.  So, if you insert or remove any tasks, or change the position of any tasks, the current position will be corrupted.  So it's best to delete the file and then let it run from the start next time in that case.

### Functions

- $
- $each
- setStatusFilename
- run
- then
- each
- get
- set

//ega finish this section