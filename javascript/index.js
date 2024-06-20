// Description: This file contains the main logic for the Turing machine simulator.

document.addEventListener("DOMContentLoaded", function () {
  //Define global variable(Current Selected Edge)
  var currentEdge = null;

  //define global variables for tm
  var input = [];
  var initialState = null;
  var acceptState = null;
  var rejectState = null;

  var transitionFunction = {};

  // Cytoscape initialisation
  var cy = (window.cy = cytoscape({
    wheelSensitivity: 0.075,
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
    ele.style("border-color", "red");
    ele.style("border-width", "3");

    if (ele.id() === initialState) {
      initialState = null;
    } else if (ele.id() === rejectState) {
      rejectState = null;
    }

    acceptState = ele.id();
  }

  
  function makeRejectState(ele) {
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
    

  //Function to clear the state of a node, meaning that it is no longer a start, accept or reject state
    function clearState(ele) {

        ele.data("start", false);
        ele.data("accept", false);
        ele.data("reject", false);
        ele.style("border-color", "black");
        ele.style("border-width", "1");

        //Check if the checkbox elements are in the DOM(control panel) before unchecking, this 
        //is because the control panel is only displayed when a node is clicked, and this shortcut can be used when no node is clicked

        if(document.getElementById("start-state") !== null){
            document.getElementById("start-state").checked = false;
            }
        if(document.getElementById("accept-state") !== null){
            document.getElementById("accept-state").checked = false;
            }
        if(document.getElementById("reject-state") !== null){
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
But we dont need to delete the transitions stored in the edge's data because the edge is being deleted, so the data is also deleted. The transition function is the main data structure that stores the transitions in the Turing machine, so it is important that it is always up to date with the transitions in the Turing machine.
   */
  function deleteEdge(ele) {
    ele.remove();

    //delete the transition from the transition function, but all the transitions that have the same source and symbol
    var transitions = ele.style("label").split(",");
    console.log("transitions", transitions)
    console.log("transitions length", transitions.length)
    //delete all transitions, not just the 0th one
    for (var i = 0; i < transitions.length; i++) {
      var transitionId = ele.source().id() + "," + transitions[i].split("(")[1];
      delete transitionFunction[transitionId];
    }

    
    console.log(transitionFunction);
    console.log("transition stored in edge", ele.data("transitions"));
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
    console.log("transition stored in edge", ele.data("transitions"));
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
  

    console.log(transitionFunction);
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
        content: '<p class="text-xs">Edit transition</p>',
        select: function (ele) {
          console.log(ele.id());
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
        content: '<p class="text-xs">Delete node</p>',
        select: function (ele) {
          deleteNode(ele);
        },
      },
      {
        content: '<p class="text-xs">Clear state</p>',

        select: function (ele) {
        clearState(ele);
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
      {
        content: '<p class="text-xs">State mode</p>',
        //change the direction of egde to opposite
        select: function (ele) {
          addingState = !addingState;

          if (addingState) {
            // Enable node adding mode
            cy.on("click tap", addNodeHandler);

            addStateButton.textContent = "Disable state mode";
          } else {
            // Disable node adding mode
            cy.off("click tap", addNodeHandler);
            addStateButton.textContent = "Enable state mode";
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
      cy.on("click tap", addNodeHandler);
      addStateButton.textContent = "Disable state mode";
    } else {
      // Disable node adding mode
      cy.off("click tap", addNodeHandler);
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
    snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
    snapThreshold: 15, // the target node must be less than or equal to this many pixels away from the cursor/finger
    snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
    noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
    disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    snapDelay: 2000,
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
  cy.on("click tap", "node", function (e) {
    var clickedNode = e.target;

    //Check if the node is a start, accept or reject state since this was stored in the data of the node
    var startBool = clickedNode.data("start");
    var acceptBool = clickedNode.data("accept");
    var rejectBool = clickedNode.data("reject");

    
    //The html for the control panel with the details of the node that was clicked, including the name of the node, and the type of state it has
    var nodeDetails = `
<div class="p-2 t" id="${clickedNode.id()}">
<p class="text-lg text-center font-bold text-black">State panel</p>
<label for="stateName" class="block text-sm font-bold text-black">State:</label>
<input type="text" id="stateName" name="stateName" class="mt-1 p-2 w-full border-gray-300 focus:ring-blue-300 bg-[white] rounded-sm text-black  font-bold" value="${clickedNode.data(
      "name"
    )}">

<fieldset class="mt-4">
<legend class="sr-only">State Type</legend>

<div class="flex items-center mb-4">
  <input id="start-state" type="radio" name="stateType" value="start" class="w-4 h-4 m-2 border-gray-300 focus:ring-2 focus:ring-blue-300 ${
    startBool ? "selected" : ""
  }" ${startBool ? "checked" : ""}>
  <label for="start-state" class="block ms-2 text-sm font-medium text-black">
    Start State
  </label>
</div>

<div class="flex items-center mb-4">
  <input id="accept-state" type="radio" name="stateType" value="accept" class="w-4 h-4 m-2 border-gray-300 focus:ring-2 focus:ring-blue-300 ${
    acceptBool ? "selected" : ""
  }" ${acceptBool ? "checked" : ""}>
  <label for="accept-state" class="block ms-2 text-sm font-medium text-black">
    Accept State
  </label>
</div>

<div class="flex items-center mb-4">
  <input id="reject-state" type="radio" name="stateType" value="reject" class="w-4 h-4 m-2 border-gray-300 focus:ring-2 focus:ring-blue-300 ${
    rejectBool ? "selected" : ""
  }" ${rejectBool ? "checked" : ""}>
  <label for="reject-state" class="block ms-2 text-sm font-medium text-black">
    Reject State
  </label>
</div>

</fieldset>

<div class="flex justify-center">
<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2" type="button" id="clearState" >Clear State Type</button>
</div>

<div class="flex justify-center">
<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2" type="button" id="deleteStateControl" >Delete State</button>
</div>
</div>

`;
  //Adding the html to the control div(container for the control panel)
  document.getElementById("control").innerHTML = nodeDetails;

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

  });



  //Control panel for the edges
  cy.on("click tap", "edge", function (e) {
    var clickedEdge = e.target;

    currentEdge = clickedEdge;

    //The html for the control panel when an edge is clicked, this includes the option to add a transition, delete a transition or delete the edge
    var edgeDetails = `
<div class="p-2" id="${clickedEdge.id()}">

<p class="text-lg text-center font-bold text-black">Edge panel</p>

<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2" type="button" id="addTransition" >Add Transition</button>

<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2" type="button" id="deleteTransitions" >Delete Transitions</button>

<button class="text-white bg-[#111827] hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#111827] dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 m-2" type="button" id="deleteEdge" >Delete Edge</button>

</div>
`;

    //Adding the html to the control div(container for the control panel)
    document.getElementById("control").innerHTML = edgeDetails;

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
  });


  /*
  
    Event listeners for the modal that appears when the user wants to add transitions, delete transitions or delete an edge.

  */



  // Handle delete transitions button
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

      // Update the edge label to show all transitions
      var label = transitions
        .map((t) => `(${t.currentSymbol}, ${t.nextSymbol}, ${t.direction})`)
        .join(", ");
      currentEdge.style("label", label);

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
      content: `<img src='./assets/stateModeGif.gif' alt='Tour Gif'' /><br/> Welcome to the tour guide! In order to create a state, enable state mode by clicking on the highlighted button. Then click anywhere on the canvas to create a state. For as long as state mode is enabled, you can create as many states as you want. Click next to continue the tour.`,
      title: "State Mode",
      target: "#addState",
      order: 1,
      group: "my-first-tour",
    },

    {
      content: `<img src='./assets/stateModeGif2.gif' alt='Tour Gif'' /><br/> Draw mode allows you to create transitions between states. You can enable draw mode by clicking on the highlighted button. Then click on a state and drag to another state to create a transition. You are able to create self loops by dragging from a state to itself.`,
      title: "Draw Mode",
      target: "#drawMode",
      order: 2,
      group: "my-first-tour",
    },

    //Fit content button
    {
      content: `This button allows you to fit the content of the canvas to the screen. Click next to continue the tour.`,
      title: "Fit Content",
      target: "#fitContent",
      order: 3,
      group: "my-first-tour",
    },

    {
      content: `This is where you create transition functions for your Turing machine. You can also rename states, set the start state, accept state and reject state.To see what you can do here, click on a state to see the control panel options for that state,and click on an edge to see the control panel options for that edge. Click next to continue the tour.`,
      title: "Control panel",
      target: "#control",
      order: 4,
      group: "my-first-tour",
    },

    //Canvas tour
    {
      content: `This is the canvas where you can create your Turing machine. You can zoom in and out of the canvas using the mouse wheel. You can also pan the canvas by clicking and dragging. Click next to continue the tour.`,
      title: "Canvas",
      target: "#cy",
      order: 5,
      group: "my-first-tour",
    },

    //The smaller div that will show the tape
    {
      content: `This is the tape where you can see how the Turing machine processes input. The tape is infinite in both directions. You can now start playing with this platform on your own. Enjoy!`,
      title: "Tape",
      target: "#tape",
      order: 6,
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
  cy.on("click tap", function (e) {
    if (e.target === cy) {
      document.getElementById(
        "control"
      ).innerHTML = `<p class="text-center text-lg font-bold">Control Panel</p>`;
      console.log("Current state of transition function", transitionFunction);
      console.log("Current state of initial state", initialState);
      console.log("Current state of accept state", acceptState);
      console.log("Current state of reject state", rejectState);
    }
  });

  /////Extra things end here////

 
});///document ready end here
