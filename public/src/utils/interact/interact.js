export class Interact {
  constructor(actions = []) {
    this.actions = actions;
  }
  addCustomAction(action, callback) {
    this.actions[action] = callback;
  }

  addDefaultAction(action) {
    switch (action) {
      case "talk":
        this.actions[action] = () => {
          console.log("default action");
        };
        break;
      case "attack":
        this.actions[action] = () => {
          console.log("default action");
        };
        break;
      case "pickup":
        this.actions[action] = () => {
          console.log("default action");
        };
        break;
    }
  }

  setDefaultAction(action) {
    this.defaultAction = action;
    // Automatically add the default action if it doesn't exist
    if (!this.actions[action]) {
      this.addDefaultAction(action);
    }
  }

  getActionText(action) {
    switch (action) {
      case "talk":
        return "Talk";
      case "attack":
        return "Attack";
      case "pickup":
        return "Pick Up";
      case "grab":
        return "Grab";
      case "open":
        return "Open";
      default:
        return "Interact";
    }
  }

  getDefaultActionText() {
    return this.defaultAction ? this.getActionText(this.defaultAction) : "Interact";
  }

  interact(action = null) {
    // If no action specified, use the default action
    const actionToExecute = action || this.defaultAction;

    if (actionToExecute && this.actions[actionToExecute]) {
      this.actions[actionToExecute]();
    } else {
      console.log("No action found for:", actionToExecute);
    }
  }

  // setCursor(newCursor) {
  // if (this.currentCursor !== newCursor) {
  //     document.body.style.cursor = newCursor;
  //     // update text attached to mouse here body here
  //     //maybe on move, set top and left to mouse cursor
  //     this.currentCursor = newCursor;
  // }
}
