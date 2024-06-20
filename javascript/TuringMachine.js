class TuringMachine {
    constructor(tape, initialState, transitionFunction, finalStates) {
        this.tape = tape.split('');
        this.currentIdx = 0;
        this.currentState = initialState;
        this.transitionFunction = transitionFunction;
        this.finalStates = finalStates;
    }

    step() {
        const currentSymbol = this.tape[this.currentIdx];
        const stateSymbolPair = `${this.currentState},${currentSymbol}`;
        
        if (stateSymbolPair in this.transitionFunction) {
            const [nextState, writeSymbol, move] = this.transitionFunction[stateSymbolPair];
            this.tape[this.currentIdx] = writeSymbol;
            this.currentIdx += move === 'R' ? 1 : -1;
            this.currentState = nextState;
        } else {
            return false;  // No valid transition, halt
        }
        
        return true;
    }

    run() {
        while (!this.finalStates.includes(this.currentState)) {
            if (!this.step()) {
                break;
            }
        }
    }

    getTape() {
        return this.tape.join('');
    }
}

// // Define the tape, initial state, transition function, and final states
// const tape = "aaaa";
// const initialState = 'q4';
// const finalStates = ['q_accept', 'q_reject'];

// // Define the transition function as an object
// // Format: "current_state,current_symbol": [next_state, write_symbol, move]
// const transitionFunction = {
//     'q4,a': ['q5', 'a', 'R'],
//     'q4,b': ['q6', 'b', 'R'],
//     'q5,a': ['q_accept', 'a', 'R'],
//     'q5,b': ['q_reject', 'b', 'R'],
//     'q6,a': ['q_reject', 'a', 'R'],
//     'q6,b': ['q_accept', 'b', 'R']
// };

// // Initialize the Turing machine
// const tm = new TuringMachine(tape, initialState, transitionFunction, finalStates);

// // Run the Turing machine
// tm.run();

// // Print the final tape and state
// console.log("Final tape:", tm.getTape());
// console.log("Final state:", tm.currentState);
