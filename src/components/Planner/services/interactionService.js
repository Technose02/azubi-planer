import Service from "./Service";

class InteractionService extends Service {
  // Interne Konstanten
  _MOUSE_BUTTON_RIGHT = 0;
  _MOUSE_BUTTON_RIGHT = 1;
  _INTERACTION_STATE_NOTHING = 10;
  _INTERACTION_STATE_SELECTING = 11;

  // State
  _interactionState = this._INTERACTION_STATE_NOTHING;
  _selectionStartCell = {};

  constructor() {
    super();
  }

  _init() {}

  // Technische Eventhandler Planner.vue
  onPlannerContainerClick(event, container, visualizer) {
    const target_classList = event.target.classList;

    // Wählen des zuständigen Eventhandlers
    if (target_classList.contains("planner-header-row-week")) {
      this.weekHeaderFieldClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_LEFT
      );
    } else if (target_classList.contains("free-day")) {
      this.freeDayFieldClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_LEFT
      );
    } else if (target_classList.contains("create-block-visualizer")) {
      this.blockVisualizerClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_LEFT
      );
    }
    event.stopPropagation();
  }
  onPlannerContainerContextMenu(event, container, visualizer) {
    event.preventDefault();
    const target_classList = event.target.classList;

    // Wählen des zuständigen Eventhandlers
    if (target_classList.contains("planner-header-row-week")) {
      this.weekHeaderFieldClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_RIGHT
      );
    } else if (target_classList.contains("free-day")) {
      this.freeDayFieldClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_RIGHT
      );
    } else if (target_classList.contains("create-block-visualizer")) {
      this.blockVisualizerClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_RIGHT
      );
    }
    event.stopPropagation();
  }
  onPlannerContainerMouseMove(event, container, visualizer) {
    const target_classList = event.target.classList;

    if (target_classList.contains("free-day")) {
      this.onMoveOverFreeDay(event, container, visualizer);
    } else if (target_classList.contains("create-block-visualizer")) {
      this.onMoveOverBlockVisualizer(event, container, visualizer);
    }
    event.stopPropagation();
  }

  // Fachliche Eventhandler -- click
  weekHeaderFieldClicked(event, container, visualizer, button) {
    const target_classList = event.target.classList;

    if (button === this._MOUSE_BUTTON_RIGHT) return;

    // bestimme den Kalenderwochen-Index des angeklickten KW-HeaderField über classList-Eintrag 'planner-header-row-week--??'
    const kwIdx = Number(
      Array.from(target_classList)
        .find((c) => c.startsWith("planner-header-row-week--"))
        ?.split("--")[1]
    );
    if (!Number.isFinite(kwIdx)) {
      console.error("error: unable to determine the week to collapse/expand");
      return;
    }

    if (
      this._serviceRegister.tableStateService.toggleCalenderWeekCollapseState(
        kwIdx
      )
    ) {
      target_classList.add("collapsed");
    } else {
      target_classList.remove("collapsed");
    }
  }
  freeDayFieldClicked(event, container, visualizer, button) {
    if (this._interactionState === this._INTERACTION_STATE_NOTHING) {
      if (button === this.MOUSE_BUTTON_LEFT) {
        this._interactionState = this._INTERACTION_STATE_SELECTING;
        this._selectionStartCell = event.target;
        visualizer.classList.remove("hidden");

        const containerRect = container.getBoundingClientRect(); // das Bezugselement
        const startCellRect = this._selectionStartCell.getBoundingClientRect();

        visualizer.style.top = `${startCellRect.top - containerRect.top}px`;
        visualizer.style.left = `${startCellRect.left - containerRect.left}px`;
        visualizer.style.width = `${startCellRect.width}px`;
        visualizer.style.height = `${startCellRect.height}px`;
      }
    } else if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      if (button === this.MOUSE_BUTTON_RIGHT) {
        // creating-data-state verlassen
        visualizer.classList.add("hidden");
        this._interactionState = this._INTERACTION_STATE_NOTHING;
      }
    }
  }
  blockVisualizerClicked(event, container, visualizer, button) {
    if (button === this._MOUSE_BUTTON_RIGHT) {
      // creating-data-state verlassen
      visualizer.classList.add("hidden");
      this._interactionState = this._INTERACTION_STATE_NOTHING;
    }
  }

  // Fachliche Eventhandler -- move
  onMoveOverBlockVisualizer(event, container, visualizer) {
    visualizer.classList.add("hidden");
    const target = document.elementFromPoint(event.x, event.y);
    visualizer.classList.remove("hidden");
    this.onSelectingOver(target, container, visualizer);
  }
  onMoveOverFreeDay(event, container, visualizer) {
    if (this._interactionState !== this._INTERACTION_STATE_SELECTING) return;

    this.onSelectingOver(event.target, container, visualizer);
  }

  // Fachliche Eventhandler -- actionBased
  onSelectingOver(target, container, visualizer) {
    const containerRect = container.getBoundingClientRect(); // das Bezugselement
    const startCellRect = this._selectionStartCell.getBoundingClientRect(); // das Startelement
    const currentCellRect = target.getBoundingClientRect(); // das aktuell berührte Element

    if (currentCellRect.left >= startCellRect.left) {
      visualizer.style.left = `${startCellRect.left - containerRect.left}px`;
      visualizer.style.width = `${
        currentCellRect.right - startCellRect.left
      }px`;
    } else {
      visualizer.style.left = `${currentCellRect.left - containerRect.left}px`;
      visualizer.style.width = `${
        startCellRect.right - currentCellRect.left
      }px`;
    }
    if (currentCellRect.top >= startCellRect.top) {
      visualizer.style.top = `${startCellRect.top - containerRect.top}px`;
      visualizer.style.height = `${
        currentCellRect.bottom - startCellRect.top
      }px`;
    } else {
      visualizer.style.top = `${currentCellRect.top - containerRect.top}px`;
      visualizer.style.height = `${
        startCellRect.bottom - currentCellRect.top
      }px`;
    }
  }
}

const createInteractionService = function () {
  return new InteractionService();
};

export default createInteractionService;
