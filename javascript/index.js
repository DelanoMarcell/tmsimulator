// Description: This file contains the main logic for the Turing machine simulator.



document.addEventListener("DOMContentLoaded", function () {
  //Define global variable(Current Selected Edge)
  var currentEdge = null;

  //
  let notifier = new AWN();


  //define global variables for tm
  var input = [];
  var initialState = null;
  var acceptState = null;
  var rejectState = null;

  var headPosition = 0;

  var transitionFunction = {};

  // Cytoscape initialisation
  var cy = (window.cy = cytoscape({
    wheelSensitivity: 0.075,
    zoom: 1.75,
    // selectionType: 'additive',
    boxSelectionEnabled: true, //shift, ctrl to box select
    container: document.getElementById("cy"),

    layout: {
      name: "grid",
      rows: 2,
      cols: 2,
    },

    style: [
      {
        selector: "node[name]",
        style: {
          content: "data(name)",
          "text-valign": "center",
          "text-halign": "center",
          "font-size": "8px",
          "font-weight": "bold",
          "border-width": 1,
          "border-color": "#111827",
          "text-wrap": "wrap",
          "text-max-width": 10,
          width: "30px",
          height: "30px",
        },
      },

      {
        selector: "edge",
        style: {
          width: 1.5,
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "font-size": "10px",
        },
      },

      // some style for the extension

      {
        selector: ".eh-handle",
        style: {
          "background-color": "#111287",
          width: 12,
          height: 12,
          shape: "ellipse",
          "overlay-opacity": 0,
          "border-width": 12, // makes the handle easier to hit
          "border-opacity": 0,
        },
      },

      {
        selector: ".eh-hover",
        style: {
          "background-color": "#111287",
        },
      },

      {
        selector: ".eh-source",
        style: {
          "border-width": 2,
          "border-color": "#111287",
        },
      },

      {
        selector: ".eh-target",
        style: {
          "border-width": 2,
          "border-color": "#111287",
        },
      },

      {
        selector: ".eh-preview, .eh-ghost-edge",
        style: {
          "background-color": "#111287",
          "line-color": "#111287",
          "target-arrow-color": "#111287",
          "source-arrow-color": "#111287",
        },
      },

      {
        selector: ".eh-ghost-edge.eh-preview-active",
        style: {
          opacity: 0,
        },
      },
    ],

    elements: {
      nodes: [
        // { data: { id: 'q0', name: 'q0' } },
        // { data: { id: 'q1', name: 'q1' } },
      ],
      edges: [
        // { data: { source: 'q0', target: 'q1' } },
      ],
    },
  }));

  /*
Alert functionality, to show users messages when they perform certain actions
  */
  function showAlert(title, message) {




    document.getElementById("alert").innerHTML = ` <div class="relative z-10" aria-labelledby="modal-title" role="dialog" id="modalAlert" aria-modal="true">
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          class="relative transform overflow-hidden rounded-lg bg-[#faf0e6] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
  
          <!-- Cross Icon for Closing -->
          <div class="absolute top-0 right-0 pt-4 pr-4">
            <button type="button" id="closeModalAlert"
              class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Close">
              <span class="sr-only">Close</span>
              <!-- Cross Icon (SVG) -->
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          <div class="bg-[#faf0e6] px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            
              <h2 class="text-lg text-center font-semibold leading-6 text-gray-900" id="alertTitle">${title}</h2>
  
              <div class="mt-2" id="alertBody">
              <p class="text-center text-lg font-bold">${message}</p>
              
              </div>
  
              
        <div class="bg-[#faf0e6] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button type="button" id="alertSubmit"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
            OK
          </button>

        </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
  `;


    //Close the alert modal button
    var closeModalAlert = document.getElementById("closeModalAlert");
    closeModalAlert.addEventListener("click", function () {
      document.getElementById("modalAlert").remove();
    });

    //Submit button for the alert modal
    var alertSubmit = document.getElementById("alertSubmit");
    alertSubmit.addEventListener("click", function () {
      document.getElementById("modalAlert").remove();
    });




  }



  /*
   Functions for reusability
  */
  function makeStartState(ele) {
    //check if some other node is already a start state, if it is then remove the start state property from that node and update the style to normal
    cy.nodes().forEach((node) => {
      if (node !== ele && node.data("start") === true) {
        node.data("start", false);
        node.style("border-color", "black");
        node.style("border-width", "1");
      }
    });
    ele.data("start", true);
    ele.data("accept", false);
    ele.data("reject", false);
    ele.style("border-color", "green");
    ele.style("border-width", "3");

    //Remove this node as the accept or reject state if it is, since it will now be the start state
    if (ele.id() === rejectState) {
      rejectState = null;
    } else if (ele.id() === acceptState) {
      acceptState = null;
    }

    //make the start state variable equal to the nodes id
    initialState = ele.id();
  }


  function makeAcceptState(ele) {
    //Before making accept state, check if there are any outgoing edges from this state, because an accept state should not have any outgoing edges
    var outgoingEdges = cy.edges(`[source = "${ele.id()}"]`);

    if (outgoingEdges.length > 0) {

      notifier.info("Accept states cannot have outgoing edges. Remove any outgoing edges from this state first.", { durations: { info: 3000 }, labels: { info: "Oops!" } });


      //clear the control panel selected radios
      document.getElementById("accept-state").checked = false;
      return;

    }




    cy.nodes().forEach((node) => {
      if (node !== ele && node.data("accept") === true) {
        node.data("accept", false);
        node.style("border-color", "black");
        node.style("border-width", "1");
      }
    });
    ele.data("accept", true);
    ele.data("start", false);
    ele.data("reject", false);
    ele.style("border-color", "blue");
    ele.style("border-width", "3");

    if (ele.id() === initialState) {
      initialState = null;
    } else if (ele.id() === rejectState) {
      rejectState = null;
    }

    acceptState = ele.id();


  }


  function makeRejectState(ele) {
    //Before making reject state, check if there are any outgoing edges from this state, because a reject state should not have any outgoing edges
    var outgoingEdges = cy.edges(`[source = "${ele.id()}"]`);

    if (outgoingEdges.length > 0) {
      notifier.info("Reject states cannot have outgoing edges. Remove any outgoing edges from this state first.", { durations: { info: 3000 }, labels: { info: "Oops!" } });


      //clear the control panel selected radios
      document.getElementById("reject-state").checked = false;
      return;
    }
    cy.nodes().forEach((node) => {
      if (node !== ele && node.data("reject") === true) {
        node.data("reject", false);
        node.style("border-color", "black");
        node.style("border-width", "1");
      }
    });
    ele.data("reject", true);

    ele.data("start", false);
    ele.data("accept", false);
    ele.style("border-color", "red");
    ele.style("border-width", "3");

    if (ele.id() === initialState) {
      initialState = null;
    } else if (ele.id() === acceptState) {
      acceptState = null;
    }

    rejectState = ele.id();
  }

  function scrollToCurrentCell() {
    const container = document.getElementById('tape-container');
    const currentCell = document.querySelector('.current-cell');

    if (currentCell) {
      const containerRect = container.getBoundingClientRect();
      const currentCellRect = currentCell.getBoundingClientRect();

      // Check if the current cell is outside the visible area of the container
      if (currentCellRect.left < containerRect.left || currentCellRect.right > containerRect.right) {
        // Scroll the container to center the current cell
        container.scrollLeft = currentCell.offsetLeft - (container.clientWidth / 2) + (currentCell.clientWidth / 2);
      }
    }
  }




  //Function to clear the state of a node, meaning that it is no longer a start, accept or reject state
  function clearState(ele) {

    ele.data("start", false);
    ele.data("accept", false);
    ele.data("reject", false);
    ele.style("border-color", "black");
    ele.style("border-width", "1");

    //Check if the checkbox elements are in the DOM(control panel) before unchecking, this 
    //is because the control panel is only displayed when a node is clicked, and this shortcut can be used when no node is clicked

    if (document.getElementById("start-state") !== null) {
      document.getElementById("start-state").checked = false;
    }
    if (document.getElementById("accept-state") !== null) {
      document.getElementById("accept-state").checked = false;
    }
    if (document.getElementById("reject-state") !== null) {
      document.getElementById("reject-state").checked = false;
    }


    //Update the global variables
    if (ele.id() === initialState) {
      initialState = null;
    } else if (ele.id() === acceptState) {
      acceptState = null;
    } else if (ele.id() === rejectState) {
      rejectState = null;
    }
  }


  /*
Note about these two things below. Delete edge and cy.on(remove , edge)
We remove the edge transitions from the global transition function when an edge is deleted. This is because the transition function is a global variable that stores all the transitions in the Turing machine. When an edge is deleted, the transitions that were stored in that edge are also deleted from the transition function. This is to ensure that the transition function is always up to date with the transitions in the Turing machine.
But we dont need to delete the transitions stored in the edge's data because the edge is being deleted, so the data is also deleted.
  */
  function deleteEdge(ele) {
    ele.remove();

    //delete the transition from the transition function, but all the transitions that have the same source and symbol
    var transitions = ele.style("label").split(",");

    //delete all transitions, not just the 0th one
    for (var i = 0; i < transitions.length; i++) {
      var transitionId = ele.source().id() + "," + transitions[i].split("(")[1];
      delete transitionFunction[transitionId];
    }

    //Show main control panel after deleting edge
    showMainControlPanel();


    console.log("transitionFunction after edge deleted", transitionFunction);
    //console.log("transition stored in edge", ele.data("transitions"));
  }

  //check that at any given time that an edge goes away, the transition function is updated, this cant be done in the delete edge function because an edge doesnt only go away when it is deleted, it can also go away when nodes are removed
  cy.on("remove", "edge", function (e) {
    var ele = e.target;

    //delete the transition from the transition function, but all the transitions that have the same source and symbol
    var transitions = ele.style("label").split(",");
    //delete all transitions, not just the 0th one
    for (var i = 0; i < transitions.length; i++) {
      var transitionId = ele.source().id() + "," + transitions[i].split("(")[1];
      delete transitionFunction[transitionId];
    }
    console.log(transitionFunction);
    //console.log("transition stored in edge", ele.data("transitions"));
  });

  function deleteNode(ele) {
    //if that node was a start state, reject state or accept state, then remove it from the global variables
    if (ele.data("start")) {
      initialState = null;
    }
    if (ele.data("accept")) {
      acceptState = null;
    }
    if (ele.data("reject")) {
      rejectState = null;
    }

    ele.remove();

    //Show main control panel after deleting node
    showMainControlPanel();


    console.log(transitionFunction);
  }

  // function RenderTape(input, currentIndex = 0){


  //   var tapeContainer = document.getElementById('tape');
  //   var tape = input;

  //   tapeContainer.innerHTML = ''; // Clear the existing tape display

  //   tape.forEach((symbol, index) => {
  //     const cell = document.createElement('div');
  //     cell.className = 'tape-cell';
  //     cell.textContent = symbol;
  //     if (index === currentIndex) {
  //       cell.classList.add('current-cell');
  //     }
  //     tapeContainer.appendChild(cell);
  //   });
  // }

  //renderTape method but instead of taking in an array, it takes in a map, since my turing machien uses a map to store the tape
  function RenderTape(input, currentIndex = 0) {
    var tapeContainer = document.getElementById('tape');
    tapeContainer.innerHTML = ''; // Clear the existing tape display

    // Convert map to an array of entries and sort them by keys
    const sortedEntries = Array.from(input.entries()).sort(([keyA], [keyB]) => keyA - keyB);

    sortedEntries.forEach(([index, symbol]) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell';
      cell.textContent = symbol;
      if (index === currentIndex) {
        cell.classList.add('current-cell');
      }
      tapeContainer.appendChild(cell);
    });
  }


  cy.style()
    .selector('.highlightedEdge')
    .style({
      'line-color': 'red',
      'target-arrow-color': 'red'
    })
    .update();

  cy.style()
    .selector('.highlightedNode')
    .style({
      'background-color': 'red',

    })

  function RenderCurrentOnTm(currentState, nextState, currentSymbol, delay) {
    // Get edge based on currentState and nextState
    var Edge = cy.edges(`[source = "${currentState}"][target = "${nextState}"]`);
    var Source = cy.nodes(`[id = "${currentState}"]`);

    // Highlight the edge
    Edge.addClass('highlightedEdge');

    //Highlight the current state
    Source.addClass('highlightedNode');

    // Save the original label style
    const originalLabel = Edge.style("label");
    const originalTextBackgroundColor = Edge.style("text-background-color");

    // Highlight the label on the edge corresponding to the current symbol
    var transitions = originalLabel.split(",");
    for (var i = 0; i < transitions.length; i += 3) {
      var transition = transitions[i];
      if (transition.includes(currentSymbol)) {
        Edge.style({
          "label": transitions[i] + "," + transitions[i + 1] + "," + transitions[i + 2],
          "text-background-color": "red"
        });
      }
    }


    // Unhighlight the edge and revert to original label styles after a short time
    setTimeout(() => {
      Edge.removeClass('highlightedEdge');
      Source.removeClass('highlightedNode');
      Edge.style({
        "label": originalLabel,
        "text-background-color": originalTextBackgroundColor
      });
    }, delay);
  }


  function showMainControlPanel() {

    var tmInput = "";

    if (document.getElementById("tminput") !== null) {
      tmInput = document.getElementById("tminput").value;
    }

    document.getElementById("control").innerHTML = ` <p class="text-center text-lg font-bold">Control Panel</p>

      

      <div class="flex flex-col p-2">
      
        <label for="tm" class="text-center text-lg font-semibold">Tape input:</label>
        <input type="text" name="tm" id="tminput" autocomplete="tm" value="${tmInput}"
          class="mt-1 p-2 w-full border-gray-300 focus:ring-blue-500 bg-gray-50 rounded-sm text-black font-bold">

          <label for="speed" class="text-center text-lg font-semibold mt-2">Animation Speed:</label>
          <select id="speed" class="mt-1 p-2 w-full border-gray-300 focus:ring-blue-500 bg-gray-50 rounded-sm text-black font-bold">
            <option value="3500">Slower</option>
            <option value="1000">Slow</option>
            <option value="500">Medium</option>
            <option value="250" selected>Fast</option>
            <option value="150">Faster</option>
            <option value="50">Fastest</option>
            <option value="0">Instant</option>
          </select>
          
        <button
          class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2"
          type="button" id="runtm">Run</button>
          <button
          class="hidden text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2"
          type="button" id="tmhalt">Stop</button>
      </div>
      
      <div id="tmStatusDiv" class=" border-[#FAF0E6] border-2 border-dashed m-2 rounded-md">
      <p class="text-center text-lg font-semibold" id="tmStatus"></p>
    </div>

    

`;

    // //Add event listener to the stop tm button
    // var stopTm = document.getElementById("tmhalt");

    //Create function out of this code




    //Run tm machine button
    var runTm = document.getElementById("runtm");


    runTm.addEventListener("click", function () {
      // Get the input string from the input field  
      var input = document.getElementById("tminput").value;

      var TapeInput = input.split("");



      if (input === "") {

        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
      Please enter an input string.
      </p>`;
        return;
      }

      // RenderTape(TapeInput);


      if (initialState === null || initialState === undefined) {
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
        Please select a start state.
        </p>`;

        return;
      }
      if (acceptState === null || acceptState === undefined) {
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
        Please select an accept state.
        </p>`;

        return;
      }
      if (rejectState === null || rejectState === undefined) {
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
        Please select a reject state.
        </p>`;
        return;
      }

      //Reset the status div
      document.getElementById("tmStatus").innerHTML = "";
      document.getElementById("tmStatusDiv").style.borderColor = "#FAF0E6";


      var initState = initialState;
      var finalStates = [acceptState, rejectState];
      var transitions = transitionFunction;

      var speed = document.getElementById("speed").value;

      var tm = new TuringMachine(input, initState, transitions, finalStates, speed);


      tm.run();

      var stopTm = document.getElementById("tmhalt");

      //Add a halt button to stop the turing machine
      document.getElementById("tmhalt").classList.remove("hidden");

      //Add event listener to the stop tm button
      stopTm.addEventListener("click", function () {
        tm.halt(true);
        tm.haltFlag = true;

        //Clear the tape
        RenderTape([], 0);

        //Remove the halt button
        document.getElementById("tmhalt").classList.add("hidden");
      });



    });

  }

  function showEdgeControlPanel(ele) {
    var clickedEdge = ele;

    currentEdge = clickedEdge;

    //The html for the control panel when an edge is clicked, this includes the option to add a transition, delete a transition or delete the edge
    var edgeDetails = `
<div class="p-2 m-2" id="${clickedEdge.id()}">

<div class="flex items-center mb-2">
<svg class="w-6 h-6 mr-2 cursor-pointer" fill="none" id="mainControlPanel" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
</svg>
<p class="text-lg text-center font-bold text-black">Edge panel</p>
</div>

<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-full mb-2" type="button" id="addTransition" >Add Transition</button>

<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-full mb-2" type="button" id="deleteTransitions" >Delete Transitions</button>

<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-full mb-2" type="button" id="deleteEdge" >Delete Edge</button>



</div>
`;



    //Adding the html to the control div(container for the control panel)
    document.getElementById("control").innerHTML = edgeDetails;

    //Add event listener to the main control panel button
    document.getElementById("mainControlPanel").addEventListener("click", function () {
      showMainControlPanel();
      cy.edges().forEach((edge) => {
        edge.unselect();
      });
    });

    // Add event listener to the add transition button
    document
      .getElementById("addTransition")
      .addEventListener("click", function () {
        document.getElementById("modalTransition").classList.remove("hidden");
      });

    // Add event listener to the delete transition button
    document.getElementById("deleteTransitions").addEventListener("click", function () {

      document.getElementById("modalTransitionDelete").classList.remove("hidden");
      const sourceState = clickedEdge.source().data("name");
      const targetState = clickedEdge.target().data("name");
      const modalTitle = `Transitions: "${sourceState}" to "${targetState}"`;
      deleteTransitionsTitle.textContent = modalTitle;

      //get all transitions stored in the edge
      var transitions = currentEdge.data("transitions");
      console.log(transitions);

      var innerHtmlDeleteTransitions = "";

      if (transitions === undefined || transitions.length === 0) {
        document.getElementById(
          "deleteTransitionsBody"
        ).innerHTML = `<p class="text-center text-lg font-bold">No transitions to delete</p>`;
        document
          .getElementById("deleteTransitionsSubmit")
          .classList.add("hidden");
        return;
      }

      document.getElementById("deleteTransitionsSubmit").classList.remove("hidden");

      for (var i = 0; i < transitions.length; i++) {
        var transition = transitions[i];
        innerHtmlDeleteTransitions += `
<div class="transition-item">
  <input type="checkbox" id="transition${i}" data-index="${i}">
  <label for="transition${i}">(${transition.currentSymbol}, ${transition.nextSymbol}, ${transition.direction})</label>
</div>
`;
      }

      document.getElementById("deleteTransitionsBody").innerHTML =
        innerHtmlDeleteTransitions;
    });

    // Add event listener to the delete edge button
    document
      .getElementById("deleteEdge")
      .addEventListener("click", function () {
        deleteEdge(clickedEdge);
      });

  }


  function showNodeControlPanel(ele) {
    var clickedNode = ele;

    //Check if the node is a start, accept or reject state since this was stored in the data of the node
    var startBool = clickedNode.data("start");
    var acceptBool = clickedNode.data("accept");
    var rejectBool = clickedNode.data("reject");


    //The html for the control panel with the details of the node that was clicked, including the name of the node, and the type of state it has
    var nodeDetails = `
<div class="p-2 t" id="${clickedNode.id()}">
<div class="flex items-center mb-2">
<svg class="w-6 h-6 mr-2 cursor-pointer" fill="none" id="mainControlPanel" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
</svg>
<p class="text-lg text-center font-bold text-black">State panel</p>
</div>
<label for="stateName" class="block text-md font-bold text-black">State:</label>
<input type="text" id="stateName" name="stateName" class="mt-1 p-2 w-full border-gray-300 focus:ring-blue-300 bg-[white] rounded-sm text-black  font-bold" value="${clickedNode.data(
      "name"
    )}">

<fieldset class="mt-4">
<legend class="sr-only">State Type</legend>

<div class="flex items-center mb-4">
<input id="start-state" type="radio" name="stateType" value="start" class="w-4 h-4 m-2 border-gray-300 focus:ring-2 focus:ring-blue-300 ${startBool ? "selected" : ""
      }" ${startBool ? "checked" : ""}>
<label for="start-state" class="block ms-2 text-sm font-medium text-black">
  Start State
</label>
</div>

<div class="flex items-center mb-4">
<input id="accept-state" type="radio" name="stateType" value="accept" class="w-4 h-4 m-2 border-gray-300 focus:ring-2 focus:ring-blue-300 ${acceptBool ? "selected" : ""
      }" ${acceptBool ? "checked" : ""}>
<label for="accept-state" class="block ms-2 text-sm font-medium text-black">
  Accept State
</label>
</div>

<div class="flex items-center mb-4">
<input id="reject-state" type="radio" name="stateType" value="reject" class="w-4 h-4 m-2 border-gray-300 focus:ring-2 focus:ring-blue-300 ${rejectBool ? "selected" : ""
      }" ${rejectBool ? "checked" : ""}>
<label for="reject-state" class="block ms-2 text-sm font-medium text-black">
  Reject State
</label>
</div>

</fieldset>

<div class="flex justify-center">
<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 mb-2 w-full" type="button" id="clearState" >Clear State Type</button>
</div>

<div class="flex justify-center">
<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 mb-2 w-full" type="button" id="deleteStateControl" >Delete State</button>
</div>


</div>

`;

    //Adding the html to the control div(container for the control panel)
    document.getElementById("control").innerHTML = nodeDetails;

    //Add event listener to the main control panel button
    document.getElementById("mainControlPanel").addEventListener("click", function () {
      showMainControlPanel();
      cy.nodes().forEach((node) => {
        node.unselect();
      });
    });

    // Add event listeners to the radio buttons
    document
      .getElementById("start-state")
      .addEventListener("change", function () {
        makeStartState(clickedNode);
      });

    document
      .getElementById("accept-state")
      .addEventListener("change", function () {
        makeAcceptState(clickedNode);
      });

    document
      .getElementById("reject-state")
      .addEventListener("change", function () {
        makeRejectState(clickedNode);
      });

    // Add event listener to the input field and change the node id when the input field changes
    document.getElementById("stateName").addEventListener("input", function () {
      clickedNode.data("name", this.value);
      clickedNode.style("content", this.value);
    });

    // Add event listener to the clear state button, the clear state button removes the start, accept or reject state from the node
    document
      .getElementById("clearState")
      .addEventListener("click", function () {
        clearState(clickedNode);

      });

    // Add event listener to the delete button, the delete button removes the node from the graph
    document
      .getElementById("deleteStateControl")
      .addEventListener("click", function () {
        deleteNode(clickedNode);
      });
  }




  /*
   Cytoscape context menu for nodes, edges and core. This allows for the user to perform certain shortcuts on the graph 
   by holding down the right click button on the mouse, and selecting the desired option from the context menu that appears.
  */

  // Cytoscape context menu edge
  cy.cxtmenu({
    selector: "edge",
    menuRadius: 80,
    commands: [
      {
        content: '<p class="text-xs">Add transition</p>',
        select: function (ele) {
          // currentEdge = ele;

          //select the current edge(deselect any other edge that is selected)
          cy.edges().forEach((edge) => {
            if (edge !== ele) {
              edge.unselect();
            }
          });

          //deselect any other node that is selected
          cy.nodes().forEach((node) => {
            node.unselect();
          });
          ele.select();

          //show modal after a short time because there was a right click event causing a glitch
          setTimeout(() => {
            document.getElementById("modalTransition").classList.remove("hidden");
          }, 50);

          //Todo,control panel update with the edge that was clicked(did it when an edge is selected in general)



        },
      },
      {
        content: '<p class="text-xs">Delete edge</p>',
        //change the direction of egde to opposite
        select: function (ele) {
          deleteEdge(ele);
        },
      },
    ],
    fillColor: "rgba(0, 0, 0, 0.55)",
    activeFillColor: "rgb(17, 24, 39)",
    activePadding: 20,
    indicatorSize: 24,
    separatorWidth: 3,
    spotlightPadding: 4,
    adaptativeNodeSpotlightRadius: false,
    minSpotlightRadius: 24,
    maxSpotlightRadius: 38,
    openMenuEvents: "cxttapstart taphold",
    itemColor: "white",
    itemTextShadowColor: "transparent",
    zIndex: 9999,
    atMouse: true,
    outsideMenuCancel: false,
  });

  // Cytoscape context menu node
  cy.cxtmenu({
    selector: "node",
    menuRadius: 50,
    commands: [

      {
        content: '<p class="text-xs">Clear State</p>',

        select: function (ele) {
          clearState(ele);
        },
      },
      {
        content: '<p class="text-xs">Delete State</p>',
        select: function (ele) {
          deleteNode(ele);
        },
      },
    ],
    fillColor: "rgba(0, 0, 0, 0.55)",
    activeFillColor: "rgb(17, 24, 39)",
    activePadding: 20,
    indicatorSize: 24,
    separatorWidth: 3,
    spotlightPadding: 4,
    adaptativeNodeSpotlightRadius: false,
    minSpotlightRadius: 24,
    maxSpotlightRadius: 38,
    openMenuEvents: "cxttapstart taphold",
    itemColor: "white",
    itemTextShadowColor: "transparent",
    zIndex: 9999,

    outsideMenuCancel: false,
  });

  cy.cxtmenu({
    selector: "core",
    menuRadius: 70,
    commands: [

      {
        content: '<p class="text-xs">State mode</p>',
        //change the direction of egde to opposite
        select: function (ele) {
          addingState = !addingState;

          if (addingState) {
            // Enable node adding mode
            cy.on("tap", addNodeHandler);

            addStateButton.textContent = "Disable state mode";
          } else {
            // Disable node adding mode
            cy.off("tap", addNodeHandler);
            addStateButton.textContent = "Enable state mode";
          }
        },
      },
      {
        content: '<p class="text-xs">Draw mode</p>',
        select: function (ele) {
          if (drawMode) {
            drawMode = false;
            eh.disableDrawMode();
            document.getElementById("drawMode").textContent =
              "Enable draw mode";
          } else {
            drawMode = true;
            eh.enableDrawMode();
            document.getElementById("drawMode").textContent =
              "Disable draw mode";
          }
        },
      },
    ],
    fillColor: "rgba(0, 0, 0, 0.55)",
    activeFillColor: "rgb(17, 24, 39)",
    activePadding: 20,
    indicatorSize: 24,
    separatorWidth: 3,
    spotlightPadding: 4,
    adaptativeNodeSpotlightRadius: false,
    minSpotlightRadius: 24,
    maxSpotlightRadius: 38,
    openMenuEvents: "cxttapstart taphold",
    itemColor: "white",
    itemTextShadowColor: "transparent",
    zIndex: 9999,

    outsideMenuCancel: false,
  });

  /*
    Event listeners for the buttons above the canvas
  */

  //fit content button
  document.getElementById("fitContent").addEventListener("click", function () {
    cy.fit();
  });

  //Enable state mode button
  var addStateButton = document.getElementById("addState");
  var addingState = false;

  addStateButton.addEventListener("click", function () {
    addingState = !addingState;

    if (addingState) {
      // Enable node adding mode
      cy.on("tap", addNodeHandler);
      addStateButton.textContent = "Disable state mode";
    } else {
      // Disable node adding mode
      cy.off("tap", addNodeHandler);
      addStateButton.textContent = "Enable state mode";
    }
  });

  // Generate a unique ID for a new node(used in addNodeHandler function when adding a new node to the graph)
  function generateUniqueId() {
    let i = 0;
    while (cy.$(`#q${i}`).length !== 0) {
      i++;
    }
    return "q" + i;
  }

  //handler for adding states to the graph
  function addNodeHandler(event) {
    // Check if the click event target is the background (core) and not a node
    if (event.target === cy) {
      var newNodeId = generateUniqueId();
      cy.add({
        group: "nodes",
        data: { id: newNodeId, name: newNodeId },
        position: { x: event.position.x, y: event.position.y },
      });
    }
  }

  //The parameters for the edgehandles extension in cytoscape. This extension allows for the user to draw edges between nodes by dragging from one node to another
  let defaults = {
    canConnect: function (sourceNode, targetNode) {
      if (sourceNode.data("reject") || sourceNode.data("accept")) {
        return false;
      }

      // Check if there is an existing edge from sourceNode to targetNode
      let existingEdgeFromSourceToTarget =
        sourceNode.edgesTo(targetNode).length > 0;

      // Allow connection if no edge exists from sourceNode to targetNode
      return !existingEdgeFromSourceToTarget;
    },


    edgeParams: function (sourceNode, targetNode) {
      // for edges between the specified source and target
      // return element object to be passed to cy.add() for edge
      return {};
    },
    preview: true, // whether to show added edges preview before releasing selection
    hoverDelay: 150, // time spent hovering over a target node before it is considered selected
    snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
    snapThreshold: 10, // the target node must be less than or equal to this many pixels away from the cursor/finger
    snapFrequency: 30, // the number of times per second (Hz) that snap checks done (lower is less expensive)
    noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
    disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom

  };

  //Initialise the edgehandles extension that allows for the user to draw edges between nodes by dragging from one node to another
  var eh = cy.edgehandles(defaults);


  //Enable draw mode button
  var drawMode = false;
  document.getElementById("drawMode").addEventListener("click", function () {
    if (!drawMode) {
      drawMode = true;

      eh.enableDrawMode();
      //change text of button
      document.getElementById("drawMode").textContent = "Disable draw mode";
    } else {
      drawMode = false;
      eh.disableDrawMode();
      //change text of button
      document.getElementById("drawMode").textContent = "Enable draw mode";
    }
  });


  //Some edgehandles stuff//
  function setHandleOn(node) {
    removeHandle(); // rm old handle

    cy.on("mouseover", "node", function (e) {
      setHandleOn(e.target);
    });

    cy.on("grab", "node", function () {
      removeHandle();
    });

    cy.on("tap", function (e) {
      if (e.target === cy) {
        removeHandle();
      }
    });

    cy.on("zoom pan", function () {
      removeHandle();
    });

    window.addEventListener("mouseup", function (e) {
      stop();
    });

    cy.on("ehstart", function (event, sourceNode) {
      started = true;
      console.log("ehstart", sourceNode.id());
      alert("ehstart", sourceNode.id());
    });

    cy.on("ehstop", function () {
      started = false;
    });
  }
  //end of edgehandles stuff//



  /*
  This handle the control panel logic for the nodes and edges. When a node or edge is clicked, 
  the control panel is updated with the details of the node or edge that was clicked.
  */

  //Control panel for the nodes
  cy.on("tap", "node", function (e) {
    showNodeControlPanel(e.target);
  });



  //Control panel for the edges
  cy.on("tap", "edge", function (e) {
    showEdgeControlPanel(e.target);
  });


  /*
  
    Event listeners for the modals that appears when the user wants to add transitions, delete transitions or delete an edge.

  */

  function getAllElementStyles(cy) {
    const elements = cy.elements();
    elements.forEach(ele => {
      ele.data('style', ele.style());
    });
  }


  // Handle delete transitions button submit
  document.getElementById("deleteTransitionsSubmit").addEventListener("click", function () {
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    if (checkboxes.length === 0) {
      //Hide the delete button
      document
        .getElementById("deleteTransitionsSubmit")
        .classList.add("hidden");
      return;
    }

    var checked = Array.from(checkboxes).filter(
      (checkbox) => checkbox.checked
    );

    //   console.log("checked", checked);

    if (checked.length === 0) {
      document.getElementById("modal-alert-delete").classList.remove("hidden");
      document.getElementById("modal-alert-delete").textContent = "Please select at least one transition to delete";
      return;
    }

    document.getElementById("modal-alert-delete").classList.add("hidden");

    // Get the indices of the transitions to delete
    var transitionsToDelete = checked.map((checkbox) =>
      parseInt(checkbox.getAttribute("data-index"))
    );

    //   console.log("transitionsToDelete", transitionsToDelete);

    // Get the transitions from the edge
    var transitions = currentEdge.data("transitions");

    // Sort the indices in descending order to avoid index shifting issues
    transitionsToDelete
      .sort((a, b) => b - a)
      .forEach((index) => {
        // Update the transition function
        var transitionId = currentEdge.source().id() + "," + transitions[index].currentSymbol;
        delete transitionFunction[transitionId];

        // Remove the transition from the edge's transitions array stored in the edge
        transitions.splice(index, 1);
      });

    // Update the transitions in the edge data
    currentEdge.data("transitions", transitions);

    console.log("transitions", transitions);
    console.log("transitionFunction", transitionFunction);

    // Update the edge label
    var label = transitions
      .map((t) => `(${t.currentSymbol}, ${t.nextSymbol}, ${t.direction})`)
      .join(", ");
    currentEdge.style("label", label);

    // Close the modal
    document.getElementById("modalTransitionDelete").classList.add("hidden");
  });



  //Handle modal closing button(add transition)
  document
    .getElementById("closeModalTransition")
    .addEventListener("click", function () {
      document.getElementById("modalTransition").classList.add("hidden");

      //clear form
      document.getElementById("current-symbol").value = "";
      document.getElementById("next-symbol").value = "";
      document.getElementById("direction").value = "";

      //Remove alert
      document.getElementById("modal-alert").classList.add("hidden");
    });

  //Handle modal closing button(delete transitions)
  document
    .getElementById("closeModalTransitionDelete")
    .addEventListener("click", function () {
      document.getElementById("modalTransitionDelete").classList.add("hidden");

      //Remove alert
      document.getElementById("modal-alert-delete").classList.add("hidden");
    });


  //Handle add transition submit form
  document
    .getElementById("addTransitionSubmit")
    .addEventListener("click", function () {
      var currentSymbol = document.getElementById("current-symbol").value;
      var nextSymbol = document.getElementById("next-symbol").value;
      var direction = document.getElementById("direction").value;

      if (currentSymbol === "" || nextSymbol === "" || direction === "") {
        document.getElementById("modal-alert").classList.remove("hidden");
        document.getElementById("modal-alert").textContent =
          "Please fill in all fields";
        return;
      }

      document.getElementById("modal-alert").classList.add("hidden");

      //Check if direction is valid
      if (direction !== "L" && direction !== "R") {
        document.getElementById("modal-alert").classList.remove("hidden");
        document.getElementById("modal-alert").textContent =
          "Direction must be L or R";
        return;
      }

      //Check if transition doesnt already exist in transition function
      transitionId = currentEdge.source().id() + "," + currentSymbol;

      if (transitionFunction[transitionId] != undefined) {
        document.getElementById("modal-alert").classList.remove("hidden");
        document.getElementById(
          "modal-alert"
        ).textContent = `Transition already exists from state "${currentEdge
          .source()
          .data("name")}" with symbol "${currentSymbol}" `;
        return;
      }

      // Assuming currentEdge is the edge being edited
      if (!currentEdge.data("transitions")) {
        currentEdge.data("transitions", []);
      }

      // Add the new transition to the edge's transition array
      var transitions = currentEdge.data("transitions");

      transitions.push({
        currentSymbol: currentSymbol,
        nextSymbol: nextSymbol,
        direction: direction,
      });

      currentEdge.data("transitions", transitions);

      //// Determine offset based on edge direction so that nodes dont overlap, one way is to get the id digit, if the source id digit is less than the target id digit, then offset is 10, else offset is -10
      //   var offsetX = 0;
      //   var offsetY = 0;

      //   if(currentEdge.source().id().charAt(1) < currentEdge.target().id().charAt(1)){
      //     offsetX = 15;
      //     offsetY = 15;
      //     }
      //     else{
      //         offsetX = -15;
      //         offsetY = -15;
      //     }

      // Update the edge label to show all transitions, dont add it perfectly in center of edge, add a few pixels away from center
      var label = transitions
        .map((t) => `(${t.currentSymbol}, ${t.nextSymbol}, ${t.direction})`)
        .join(", ");
      currentEdge.style({
        "label": label,
        "text-wrap": "wrap",
        "text-background-shape": "roundrectangle",

        "font-size": "8px",  // Adjust font size
        "font-family": "Arial, sans-serif",  // Choose a legible font
        "text-background-color": "#999999",  // Set background color for the text
        "text-background-opacity": 0.8,  // Set background opacity

        //   "text-margin-x": offsetX,  // Offset in x-direction
        //   "text-margin-y": offsetY   // Offset in y-direction
      });



      //clear the form
      document.getElementById("current-symbol").value = "";
      document.getElementById("next-symbol").value = "";
      document.getElementById("direction").value = "";

      //add the transition to the transition function
      // currentState, currentSymbol = [nextState, nextSymbol, direction]
      var transitionId = currentEdge.source().id() + "," + currentSymbol;
      transitionFunction[transitionId] = [
        currentEdge.target().id(),
        nextSymbol,
        direction,
      ];

      console.log(transitionFunction);

      //close the modal
      document.getElementById("modalTransition").classList.add("hidden");
    });


  /*

  Handle the tour guide functionality. The tour guide is a feature that allows the user to be guided through the platform by a series of steps that show the user how to use the platform. The user can start the tour by clicking on the "Take a tour" button. 
  The tour guide will then show the user a series of steps that they can follow to learn how to use the platform. 

  */

  //create states tour
  const steps = [
    {
      content: `<img src='./assets/stateModeGif.gif' alt='Tour Gif'' /><br/> Welcome to the tour guide! To create a state, click the highlighted button to enable state mode, then click anywhere on the canvas to create a state. Disable state mode when you're finished to <b>avoid accidental creation of more states.</b> Click next to continue the tour.`,
      title: "State Mode",
      target: "#addState",
      order: 1,
      group: "my-first-tour",
    },

    {
      content: `<img src='./assets/stateModeGif2.gif' alt='Tour Gif'' /><br/> In draw mode, you can draw edges between states by clicking on a state and dragging to another state. To create an edge from a state to itself, click and drag from the state back to itself.`,
      title: "Draw Mode",
      target: "#drawMode",
      order: 2,
      group: "my-first-tour",
    },

    //Fit content button
    {
      content: `Adjusts the canvas to display all content within the visible area.`,
      title: "Fit Content",
      target: "#fitContent",
      order: 3,
      group: "my-first-tour",
    },

    //Import button tour
    {
      content: `The import button lets you bring in a Turing machine from a JSON file exported from this platform previously.`,
      title: "Import",
      target: "#importJson",
      order: 4,
      group: "my-first-tour",
    },
    
    //Export button tour
    {
      content: `The export button allows you to save the Turing machine as a JSON file, which you can later import back into the platform. You can also export as an image`,
      title: "Export",
      target: "#dropdownMenuButton",
      order: 5,
      group: "my-first-tour",
    },
    




    {
      content: `The control panel is where you can enter the input for the Turing machine, set the speed of the Turing machine, and see the status of the Turing machine. The control panel is updated with the details of the node or edge that you click on. Click next to continue the tour.`,
      title: "Control panel",
      target: "#control",
      order: 5,
      group: "my-first-tour",
    },

    //Canvas tour
    {
      content: `This canvas is where you create states and draw edges between them to build your Turing machine. You can pan by clicking and dragging, and zoom in and out using your scroll wheel.`,
      title: "Canvas",
      target: "#cy",
      order: 6,
      group: "my-first-tour",
    },

    //The smaller div that will show the tape
    {
      content: `This is the tape where you can observe how the Turing machine processes input. The tape extends infinitely in both directions. Feel free to explore the platform on your own now!`,
      title: "Tape",
      target: "#tape",
      order: 7,
      group: "my-first-tour",
    },
  ];

  //initialize tour guide
  const tg = new tourguide.TourGuideClient({
    steps: steps,
  });

  //Take a tour button
  document.getElementById("tour").addEventListener("click", function () {
    tg.start();
  });


  /*
   Some extra things such as keyboard shorcuts and ensuring the control panel is empty when no node or edge is selected
  */


  //Delete functionality keyboard shortcut
  document.addEventListener("keydown", function (e) {
    // Check if the 'Delete' key is pressed
    if (e.key === "Delete" || e.key === "Del") {
      //Check if node or edge selected and call the respective delete function
      var selected = cy.$(":selected");
      if (selected.length > 0) {
        selected.forEach((ele) => {
          if (ele.isNode()) {
            deleteNode(ele);
          } else if (ele.isEdge()) {
            deleteEdge(ele);
          }
        });
      }
    }
  });



  //Make it so that no node being selected means that the control div is empty
  cy.on("tap", function (e) {
    if (e.target === cy) {

      showMainControlPanel();




      console.log("Current state of transition function", transitionFunction);
      console.log("Current state of initial state", initialState);
      console.log("Current state of accept state", acceptState);
      console.log("Current state of reject state", rejectState);


    }

  });

  //When an edge is selected in general(not through a tap neccessarily), set the current edge to the edge that was selected 
  cy.on("select", "edge", function (e) {
    currentEdge = e.target;

    //Update control panel
    showEdgeControlPanel(currentEdge);
  });

  cy.on("select", function (e) {
    //if the number nodes selected is greater than 1, then show a single delete button that deletes all in control panel, make sure button is centered
    if (cy.$(":selected").length > 1) {
      document.getElementById("control").innerHTML = `
        <p class="text-center text-lg font-bold">Control Panel</p>
        <div class="flex justify-center">
        <button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2" type="button" id="deleteSelected" >Delete Selected</button>
        </div>
        `;

      //Add event listener to the delete selected button
      document.getElementById("deleteSelected").addEventListener("click", function () {
        var selected = cy.$(":selected");
        if (selected.length > 0) {
          selected.forEach((ele) => {
            if (ele.isNode()) {
              deleteNode(ele);
            } else if (ele.isEdge()) {
              deleteEdge(ele);
            }
          });
          //clear the control panel
          showMainControlPanel();
        }
      });
    }
  });

  async function getEdgeTransition(currentState, currentSymbol, writeSymbol, move) {
    const edge = cy.edges().filter(
      edge => edge.source().id() === this.currentState && edge.data('transitions').some(
        transition => transition.currentSymbol === currentSymbol && transition.nextSymbol === writeSymbol && transition.direction === move
      ))[0];

    return edge;
  }

  //Define tm class
  class TuringMachine {
    constructor(tape, initialState, transitionFunction, finalStates, delay) {
      this.tape = new Map();
      tape.split('').forEach((symbol, index) => this.tape.set(index, symbol));
      // for (let i = 0; i < tape.length; i++) {
      //     this.tape.set(i, tape[i]);
      // }
      this.currentIdx = 0;
      this.currentState = initialState;
      this.transitionFunction = transitionFunction;
      this.finalStates = finalStates;
      this.delay = delay;
      this.haltFlag = false;

    }


    async step() {


      var currentSymbol = this.tape.get(this.currentIdx);
      if (currentSymbol === undefined) {

        this.tape.set(this.currentIdx, '_');
        currentSymbol = '_';
      }
      const stateSymbolPair = `${this.currentState},${currentSymbol}`;



      if (stateSymbolPair in this.transitionFunction) {
        const [nextState, writeSymbol, move] = this.transitionFunction[stateSymbolPair];


        //Update the tape but should have a delay to show the user the transition

        //console.log("Delay is ", this.delay)

        if (this.delay != 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        if (this.haltFlag) {
          return;
        }

        //Change the tape to be sent to render to right array format
        // Change the tape to be sent to render to the right array format
        // var tapeArray = [];
        // const keys = Array.from(this.tape.keys()).sort((a, b) => a - b); // Convert keys iterator to array and sort

        // keys.forEach((key) => {
        //   tapeArray.push(this.tape.get(key));
        // });



        if (this.delay != 0) {
          // console.log("Tape being rendered", this.tape)
          // console.log("Tape being rendered Joined", this.tape.join(''))
          RenderTape(this.tape, this.currentIdx);
          RenderCurrentOnTm(this.currentState, nextState, currentSymbol, this.delay);
        }



        this.tape.set(this.currentIdx, writeSymbol);
        this.currentIdx += move === 'R' ? 1 : -1;

        this.currentState = nextState;

       




      } else {

        return false;  // No valid transition, halt
      }

      return true;
    }

    async halt(manualHalt) {

      //Enable user interaction 
      document.getElementById('cy').style.pointerEvents = 'auto';
      document.getElementById("tminput").style.pointerEvents = 'auto';
      document.getElementById("runtm").style.pointerEvents = 'auto';





      const finalTape = this.getTape();
      const finalState = this.currentState;
      const stateName = cy.getElementById(finalState).data('name');
      var stateStatus = "";
      if (cy.getElementById(finalState).data('accept')) {
        stateStatus = "accept";
        document.getElementById("tmStatusDiv").style.borderColor = "green";
        document.getElementById("tmStatus").innerHTML = `
          <p class="text-center text-green-600 text-lg font-semibold break-words" id="tmStatus">
              <span class="text-xl font-bold">Turing machine halted.</span><br>
              Final tape: ${finalTape}<br>
              Final state: ${stateStatus.toUpperCase()} 
          </p>`;

        // //Clear the tape
        // RenderTape([], 0);

        //Render the final tape after the delay to make the transition smooth
        setTimeout(() => {
          RenderTape(this.tape, this.currentIdx);
        }, this.delay);

        //Hide the halt button
        document.getElementById("tmhalt").classList.add("hidden");




      } else if (cy.getElementById(finalState).data('reject')) {
        stateStatus = "reject";
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `
          <p class="text-center text-red-600 text-lg font-semibold break-words" id="tmStatus">
          <span class="text-xl font-bold">Turing machine halted.</span><br>
          Final tape: ${finalTape}<br>
          Final state: ${stateStatus.toUpperCase()}
      </p>`;

        // //Clear the tape
        // RenderTape([], 0);

        //Render the final tape after the delay to make the transition smooth
        setTimeout(() => {
          RenderTape(this.tape, this.currentIdx);
        }, this.delay);
       

        //Hide the halt button
        document.getElementById("tmhalt").classList.add("hidden");



      } else if (!cy.getElementById(finalState).data('accept') && !cy.getElementById(finalState).data('reject') && !manualHalt) {
        stateStatus = "halt";
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `
        
          <p class="text-center text-red-600 text-lg font-semibold break-words" id="tmStatus">The turing machine halted. No valid transition for state "${stateName}" and symbol "${this.tape.get(this.currentIdx)}".</p>
          <p class="text-center text-red-600 text-lg font-semibold break-words" id="tmStatus">
              Final tape: ${finalTape}<br>
              Final state: ${stateName}<br>
              Status: REJECT
          </p>`;

        //Clear the tape
        RenderTape([], 0);

        //Hide the halt button
        document.getElementById("tmhalt").classList.add("hidden");




      } else if (manualHalt) {
        stateStatus = "halt";
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `
          <p class="text-center text-red-600 text-lg font-semibold break-words" id="tmStatus">The turing machine was manually halted.</p>
          <p class="text-center text-red-600 text-lg font-semibold break-words" id="tmStatus">
              Final tape: ${finalTape}<br>
              Final state: ${stateName}
          </p>`;

      }


      //ALREADY CLEARED AND REMOVED HALT BUTTON IN THE ONCLICK EVENT OF THE HALT BUTTON

    }


    async run() {

      //Disable user interaction with cytoscape
      document.getElementById('cy').style.pointerEvents = 'none';
      document.getElementById("tminput").style.pointerEvents = 'none';
      document.getElementById("runtm").style.pointerEvents = 'none';

      var count = 0;
      var maxCount = 500000;


      while (!this.finalStates.includes(this.currentState) && !this.haltFlag) {

        count++;

        if (count > maxCount) {
          break;
        }

        const result = await this.step();
        if (!result) {
          break;
        }
      }

      if (!this.haltFlag && count <= maxCount) {
        this.halt(false);
      } else if (count > maxCount && !this.haltFlag) {
        //Show in the status div that the turing machine was halted because it took too long
        document.getElementById("tmStatusDiv").style.borderColor = "red";
        document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
            The turing machine was halted because it took too long to process the input. The turing machine may be in an infinite loop. 500,000 steps were executed.
            </p>`;

        //Enable user interaction
        document.getElementById('cy').style.pointerEvents = 'auto';
        document.getElementById("tminput").style.pointerEvents = 'auto';
        document.getElementById("runtm").style.pointerEvents = 'auto';

        //Hide the halt button
        document.getElementById("tmhalt").classList.add("hidden");

      }



    }

    getTape() {

      const tape = [];
      const keys = Array.from(this.tape.keys()).sort((a, b) => a - b);

      keys.forEach(index => {
        tape.push(this.tape.get(index));
      });

      return tape.join('');

    }

  }





  var runTm = document.getElementById("runtm");


  runTm.addEventListener("click", function () {



    // Get the input string from the input field  
    var input = document.getElementById("tminput").value;

    var TapeInput = input.split("");

    if (input === "") {

      document.getElementById("tmStatusDiv").style.borderColor = "red";
      document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
        Please enter an input string.
        </p>`;
      return;
    }

    // RenderTape(TapeInput);


    if (initialState === null || initialState === undefined) {
      document.getElementById("tmStatusDiv").style.borderColor = "red";
      document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
          Please select a start state.
          </p>`;

      return;
    }
    if (acceptState === null || acceptState === undefined) {
      document.getElementById("tmStatusDiv").style.borderColor = "red";
      document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
          Please select an accept state.
          </p>`;

      return;
    }
    if (rejectState === null || rejectState === undefined) {
      document.getElementById("tmStatusDiv").style.borderColor = "red";
      document.getElementById("tmStatus").innerHTML = `<p class="text-center text-red-600 text-lg font-semibold" id="tmStatus">
          Please select a reject state.
          </p>`;
      return;
    }

    //Reset the status div
    document.getElementById("tmStatus").innerHTML = "";
    document.getElementById("tmStatusDiv").style.borderColor = "#FAF0E6";







    var initState = initialState;
    var finalStates = [acceptState, rejectState];
    var transitions = transitionFunction;

    var speed = document.getElementById("speed").value;

    var tm = new TuringMachine(input, initState, transitions, finalStates, speed);

    tm.run();

    var stopTm = document.getElementById("tmhalt");

    //Add a halt button to stop the turing machine
    document.getElementById("tmhalt").classList.remove("hidden");





    //Add event listener to the halt button
    stopTm.addEventListener("click", function () {
      tm.halt(true);
      tm.haltFlag = true;

      //Clear the tape
      RenderTape([], 0);

      //Remove the halt button
      document.getElementById("tmhalt").classList.add("hidden");
    });


  });



  /////Extra things end here////


  document.getElementById("dropdownMenuButton").addEventListener("click", function () {
    document.getElementById("dropdownMenuArea").classList.toggle("hidden");
  });


  window.addEventListener('click', function (event) {
    if (!event.target.matches('#dropdownMenuButton')) {
      if (!document.getElementById("dropdownMenuArea").classList.contains('hidden')) {
        document.getElementById("dropdownMenuArea").classList.add('hidden');
      }


    }
  });

  //export as png
  document.getElementById("exportAsPng").addEventListener("click", function () {

    if (cy.elements().length === 0) {
      notifier.info("The canvas is empty. Please create a Turing machine before exporting.", { durations: { info: 3000 }, labels: { info: "Empty Canvas" } });
      return;
    }

    var png64 = cy.jpeg();
    var a = document.createElement("a");
    a.href = png64;
    a.download = "turing-machine.png";
    a.click();

    notifier.info("PNG exported successfully!", { durations: { info: 2000 }, labels: { info: "Exported" } });
  }
  );


  //export as json
  document.getElementById("exportAsJson").addEventListener("click", function () {
    //Check if the graph is empty
    if (cy.elements().length === 0) {
      notifier.info("The canvas is empty. Please create a Turing machine before exporting.", { durations: { info: 3000 }, labels: { info: "Empty Canvas" } });
      return;
    }

    // // Function to get the current styles of all elements
    // function getAllElementStyles(cy) {
    //   cy.elements().forEach(ele => {
    //     ele.data('style', ele.style());
    //   });
    // }

    // // Get the current styles for all elements
    // getAllElementStyles(cy);

    // Extract nodes and edges
    const elements = cy.elements().jsons();

    // Create the JSON object to export
    const json = {
      identifier: "tmSimulatorDelanoMartin",
      elements: elements,
      transitionFunction: transitionFunction,
      startState: initialState,
      acceptState: acceptState,
      rejectState: rejectState
    };

    // Convert the JSON object to a string and create a downloadable link
    var a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
    a.download = "turing-machine.json";
    a.click();

    notifier.info("JSON exported successfully", { durations: { info: 2000 }, labels: { info: "Exported" } });

  });


  function showLoader() {
    document.getElementById('overlay').style.display = 'flex';
  }

  function hideLoader() {
    document.getElementById('overlay').style.display = 'none';
  }

  //Import json
  document.getElementById('importJson').addEventListener('click', function () {
    document.getElementById('importJsonBtn').click();
  });

  document.getElementById("importJsonBtn").addEventListener("change", async function (e) {

    // Show loader
    showLoader();

    const fileInput = e.target;
    const file = fileInput.files[0];

    if (!file) {
      hideLoader();
      return;
    }

    // Check if the file is a JSON file
    if (file.type !== "application/json") {
      notifier.info("The selected file is not a JSON file. Please select a valid JSON file.", {
        durations: { info: 5000 },
        labels: { info: "Invalid File Type" }
      });
      hideLoader();
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const json = JSON.parse(e.target.result);

        // Check if the JSON file is a tm simulator json file
        if (json.identifier !== "tmSimulatorDelanoMartin") {
          notifier.info("The imported JSON file is not recognized. Please make sure you are using a file exported from our platform that contains the necessary Turing machine data.", {
            durations: { info: 5000 },
            labels: { info: "Invalid File" }
          });
          hideLoader();
          return;
        }

        // Check if tm data is empty
        if (json.elements.length === 0) {
          notifier.info("The imported JSON file does not contain any Turing machine data. Please make sure you are using a file exported from our platform that contains the necessary Turing machine data.", {
            durations: { info: 5000 },
            labels: { info: "Empty File" }
          });
          hideLoader();
          return;
        }

        // Make start state
        initialState = json.startState;
        acceptState = json.acceptState;
        rejectState = json.rejectState;

        // Clear the graph first if elements exist
        if (cy.elements().length > 0) {
          await cy.elements().remove();
        }

        // Add the transition function
        transitionFunction = json.transitionFunction;

        await cy.json(json);


        // Add the transition function to the edges
        cy.edges().forEach((edge) => {
          var sourceId = edge.source().id();
          var targetId = edge.target().id();

          if (edge.data("transitions")) {
            // Get all transitions for this edge
            var transitions = edge.data("transitions").map(t => {
              var transitionId = sourceId + "," + t.currentSymbol;
              var transition = transitionFunction[transitionId];
              return {
                currentSymbol: t.currentSymbol,
                nextSymbol: transition[1],
                direction: transition[2],
              };
            });

            // Update the edge data with all transitions
            edge.data("transitions", transitions);

            // Update the edge label
            var label = transitions
              .map((t) => `(${t.currentSymbol}, ${t.nextSymbol}, ${t.direction})`)
              .join(", ");
            edge.style({
              "label": label,
              "text-wrap": "wrap",
              "text-background-shape": "roundrectangle",
              "font-size": "8px",
              "font-family": "Arial, sans-serif",
              "text-background-color": "#999999",
              "text-background-opacity": 0.8,
            });
          }
        });

        if (initialState != null) {
          makeStartState(cy.$("#" + initialState));
        }
        if (acceptState != null) {
          makeAcceptState(cy.$("#" + acceptState));
        }
        if (rejectState != null) {
          makeRejectState(cy.$("#" + rejectState));
        }

        notifier.info("Turing machine imported successfully", { durations: { success: 2000 }, labels: { info: "Imported" } });

      } catch (error) {
        notifier.info("An error occurred while importing the JSON file. Please make sure the file is in the correct format.", {
          durations: { info: 5000 },
          labels: { info: "Import Error" }
        });
      } finally {
        await cy.fit();
        hideLoader();

        // //make layout circle
        // var CircleLayout = cy.layout({
        //   name: "circle",
        //   radius: 100,
        //   startAngle: 3 / 2 * Math.PI,
        // });

        // CircleLayout.run();







        // var layout = cy.layout({
        //   name: "grid",
        //   rows: 1,
        // });
        // layout.run();



      }
    };

    reader.readAsText(file);

    // Reset the value of the file input after processing the file
    fileInput.value = null;
  });



  //Make navbar collapsable on mobile
  document.getElementById("navbarToggle").addEventListener("click", function () {
    document.getElementById("navbarMobile").classList.toggle("hidden");
  }
  );


});///document ready end here
