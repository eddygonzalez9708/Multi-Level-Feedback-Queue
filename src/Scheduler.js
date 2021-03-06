const Queue = require('./Queue');
const {
    QueueType,
    PRIORITY_LEVELS,
} = require('./constants/index');

// A class representing the scheduler
// It holds a single blocking queue for blocking processes and three running queues 
// for non-blocking processes
class Scheduler {
    constructor() {
        this.clock = Date.now();
        this.blockingQueue = new Queue(this, 50, 0, QueueType.BLOCKING_QUEUE);
        this.runningQueues = [];
        // Initialize all the CPU running queues
        for (let i = 0; i < PRIORITY_LEVELS; i++) {
            this.runningQueues[i] = new Queue(this, 10 + i * 20, i, QueueType.CPU_QUEUE);
        }
    }

    // Executes the scheduler in an infinite loop as long as there are processes in any of the queues
    // Calculate the time slice for the next iteration of the scheduler by subtracting the current
    // time from the clock property. Don't forget to update the clock property afterwards.
    // On every iteration of the scheduler, if the blocking queue is not empty, blocking work
    // should be done. Once the blocking work has been done, perform some CPU work in the same iteration.

    run() {
        while (this.allQueuesEmpty() === false) {
            const time = Date.now(); 
            const workTime = time - this.clock; 
            this.clock = time; 
            
            if (this.blockingQueue.isEmpty() === false) {
                this.blockingQueue.doBlockingWork(workTime);
            }
            else if (this.runningQueues[0].isEmpty() === false) {
                this.runningQueues[0].doCPUWork(workTime);
            }
            else if (this.runningQueues[1].isEmpty() === false) {
                this.runningQueues[1].doCPUWork(workTime);
            }
            else if (this.runningQueues[2].isEmpty() === false) {
                this.runningQueues[2].doCPUWork(workTime);
            }
        }
    }

    allQueuesEmpty() {

        // Check if blocking queue is empty 
        if (this.blockingQueue.isEmpty() === false) {
            return false;
        }

        // Check if all the cpu queues are empty
        for (let i = 0; i < this.runningQueues.length; i++) {
            if (this.runningQueues[i].isEmpty() === false) {
                return false;
            }
        }

        // Return true if all the queues are empty 
        return true;
    }

    addNewProcess(process) {
        if (process.blockingTimeNeeded !== 0) {
            this.blockingQueue.enqueue(process);
        }
        else {
            this.runningQueues[0].enqueue(process);
        }
    }

    // The scheduler's interrupt handler that receives a queue, a process, and an interrupt string constant
    // Should handle PROCESS_BLOCKED, PROCESS_READY, and LOWER_PRIORITY interrupts.
    handleInterrupt(queue, process, interrupt) {
        
        let process_in_queue; 

        for (let index = 0; index < queue.processes.length; index++) {
            if (queue.processes[index]._pid === process._pid) {
                queue.processes.splice(index, 1); 
                process_in_queue = true; 
                break; 
            }
        }

        if (interrupt === "PROCESS_BLOCKED") {

            this.blockingQueue.enqueue(process);
        }
        else if (interrupt === "PROCESS_READY") {

            if (process_in_queue) {
                if (queue.priorityLevel >= 0 && queue.priorityLevel < 2) {
                    this.runningQueues[queue.priorityLevel + 1].enqueue(process); 
                }
                else if (queue.priorityLevel === 2) {
                    queue.enqueue(process); 
                } 
            }
            else {
                this.addNewProcess(process)
            }
        }
        else if (interrupt === "LOWER_PRIORITY") {
            if (queue.getQueueType() === "BLOCKING_QUEUE") {
                queue.enqueue(process);
            }
            else if (queue.getPriorityLevel() === PRIORITY_LEVELS - 1) {
                queue.enqueue(process);
            }
            else {
                this.runningQueues[queue.getPriorityLevel() + 1].enqueue(process);
            }
        }
    }

    // Private function used for testing; DO NOT MODIFY
    _getCPUQueue(priorityLevel) {
        return this.runningQueues[priorityLevel];
    }

    // Private function used for testing; DO NOT MODIFY
    _getBlockingQueue() {
        return this.blockingQueue;
    }
}

module.exports = Scheduler;
