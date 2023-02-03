import Service from "./Service";

class Rect {
  _top;
  _left;
  _right;
  _bottom;

  constructor(top, right, bottom, left) {
    this._top = top;
    this._right = right;
    this._bottom = bottom;
    this._left = left;
  }

  static fromRect(rect) {
    return new Rect(
      Number(rect.top),
      Number(rect.right),
      Number(rect.bottom),
      Number(rect.left)
    );
  }

  moveLeft(amount) {
    this._left += amount;
    this._right -= amount;
  }
  moveRight(amount) {
    this._left -= amount;
    this._right += amount;
  }
  moveUp(amount) {
    this._top -= amount;
    this._bottom += amount;
  }
  moveDown(amount) {
    this._top += amount;
    this._bottom -= amount;
  }

  width() {
    return this.right - this.left;
  }

  height() {
    return this.bottom - this.top;
  }
}

class InteractionService extends Service {
  // Interne Konstanten
  _MOUSE_BUTTON_LEFT = 0;
  _MOUSE_BUTTON_RIGHT = 1;
  _INTERACTION_STATE_NOTHING = 10;
  _INTERACTION_STATE_SELECTING = 11;

  // State
  _interactionState = this._INTERACTION_STATE_NOTHING;

  //  _selectionStartCell = {};
  _selectionStartHeaderDayCell = {};
  _selectionStartHeaderRowCell = {};

  _relativeStartHeaderDayCellRect = [];
  _relativeStartHeaderRowCellRect = [];

  constructor() {
    super();
  }

  _init() {}

  _determineRelatedHeaderCells(event, headerCornerRect) {
    const headerDayCell = document.elementFromPoint(
      event.x,
      headerCornerRect.bottom - 1
    );
    const headerRowCell = document.elementFromPoint(
      headerCornerRect.right - 1,
      event.y
    );
    return [headerDayCell, headerRowCell];
  }

  _resolveRelatedStartHeaderRects(headerCornerRect) {
    const relativeStartHeaderDayCellRect = this._relativeStartHeaderDayCellRect;
    relativeStartHeaderDayCellRect.moveLeft(headerCornerRect.left);

    const relativeStartHeaderRowCellRect = this._relativeStartHeaderRowCellRect;
    relativeStartHeaderRowCellRect.moveDown(headerCornerRect.top);

    return [relativeStartHeaderDayCellRect, relativeStartHeaderRowCellRect];
  }

  _setSelectionStartHeaderCells(
    startHeaderDayCell,
    startHeaderRowCell,
    headerCornerRect
  ) {
    this._selectionStartHeaderDayCell = startHeaderDayCell;
    this._selectionStartHeaderRowCell = startHeaderRowCell;

    const startHeaderDayCellRect = Rect.fromRect(
      startHeaderDayCell.getBoundingClientRect()
    );
    this._relativeStartHeaderDayCellRect = startHeaderDayCellRect;
    this._relativeStartHeaderDayCellRect.moveRight(headerCornerRect.left);

    const startHeaderRowCellRect = Rect.fromRect(
      startHeaderRowCell.getBoundingClientRect()
    );
    this._relativeStartHeaderRowCellRect = Rect.fromRect(
      startHeaderRowCellRect
    );
    this._relativeStartHeaderRowCellRect.moveUp(headerCornerRect.top);

    return [startHeaderDayCellRect, startHeaderRowCellRect];
  }

  _isInDataRange(event, headerCornerRect) {
    return (
      event.x >= headerCornerRect.right && event.y > headerCornerRect.bottom
    );
  }

  // Technische Eventhandler Planner.vue
  onPlannerContainerClick(event, container, visualizer, headerCorner) {
    const target_classList = event.target.classList;
    const headerCornerRect = headerCorner.getBoundingClientRect();

    // Wählen des zuständigen Eventhandlers
    if (this._isInDataRange(event, headerCornerRect)) {
      this.onDataRangeClicked(
        event,
        container,
        visualizer,
        headerCornerRect,
        this._MOUSE_BUTTON_LEFT
      );
    } else if (target_classList.contains("planner-header-row-week")) {
      this.weekHeaderFieldClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_LEFT
      );
    }
    event.stopPropagation();
  }
  onPlannerContainerContextMenu(event, container, visualizer, headerCorner) {
    event.preventDefault();
    const target_classList = event.target.classList;
    const headerCornerRect = headerCorner.getBoundingClientRect();

    // Wählen des zuständigen Eventhandlers
    if (this._isInDataRange(event, headerCornerRect)) {
      this.onDataRangeClicked(
        event,
        container,
        visualizer,
        headerCornerRect,
        this._MOUSE_BUTTON_RIGHT
      );
    } else if (target_classList.contains("planner-header-row-week")) {
      this.weekHeaderFieldClicked(
        event,
        container,
        visualizer,
        this._MOUSE_BUTTON_RIGHT
      );
    }
    event.stopPropagation();
  }
  onPlannerContainerMouseMove(event, container, visualizer, headerCorner) {
    const target_classList = event.target.classList;

    const headerCornerRect = headerCorner.getBoundingClientRect();

    if (this._isInDataRange(event, headerCornerRect)) {
      // Achtung: hier wird implizit das Wissen über die Anzahl der Header-Rows und der Header-Columns verwendet!!
      this.onMoveDataCellRange(event, container, visualizer, headerCornerRect);
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

  onDataRangeClicked(event, container, visualizer, headerCornerRect, button) {
    if (this._interactionState === this._INTERACTION_STATE_NOTHING) {
      if (button === this._MOUSE_BUTTON_LEFT) {
        this._interactionState = this._INTERACTION_STATE_SELECTING;

        // _determineRelatedHeaderCells
        const [startHeaderDay, startHeaderRow] =
          this._determineRelatedHeaderCells(event, headerCornerRect);

        const [startHeaderDayCellRect, startHeaderRowCellRect] =
          this._setSelectionStartHeaderCells(
            startHeaderDay,
            startHeaderRow,
            headerCornerRect
          );

        visualizer.classList.remove("hidden");

        const containerRect = container.getBoundingClientRect();

        visualizer.style.top = `${
          startHeaderRowCellRect.top - containerRect.top
        }px`;
        visualizer.style.left = `${
          startHeaderDayCellRect.left - containerRect.left
        }px`;
        visualizer.style.width = `${startHeaderDayCellRect.width}px`;
        visualizer.style.height = `${startHeaderRowCellRect.height}px`;
      }
    } else if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      if (button === this._MOUSE_BUTTON_RIGHT) {
        // creating-data-state verlassen
        visualizer.classList.add("hidden");
        this._interactionState = this._INTERACTION_STATE_NOTHING;
      }
    }
  }

  onMoveDataCellRange(event, container, visualizer, headerCornerRect) {
    if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      const [headerDayCell, headerRowCell] = this._determineRelatedHeaderCells(
        event,
        headerCornerRect
      );
      const headerDayCellRect = headerDayCell.getBoundingClientRect();
      const headerRowCellRect = headerRowCell.getBoundingClientRect();

      const [startHeaderDayCellRect, startHeaderRowCellRect] =
        this._resolveRelatedStartHeaderRects(headerCornerRect);

      const containerRect = container.getBoundingClientRect();

      if (headerDayCellRect.left >= startHeaderDayCellRect.left) {
        visualizer.style.left = `${
          startHeaderDayCellRect.left - containerRect.left
        }px`;
        visualizer.style.width = `${
          headerDayCellRect.right - startHeaderDayCellRect.left
        }px`;
      } else {
        visualizer.style.left = `${
          headerDayCellRect.left - containerRect.left
        }px`;
        visualizer.style.width = `${
          startHeaderDayCellRect.right - headerDayCellRect.left
        }px`;
      }

      if (headerRowCellRect.top >= startHeaderRowCellRect.top) {
        visualizer.style.top = `${
          startHeaderRowCellRect.top - containerRect.top
        }px`;
        visualizer.style.height = `${
          headerRowCellRect.bottom - startHeaderRowCellRect.top
        }px`;
      } else {
        visualizer.style.top = `${headerRowCellRect.top - containerRect.top}px`;
        visualizer.style.height = `${
          startHeaderRowCellRect.bottom - headerRowCellRect.top
        }px`;
      }
    }
  }
}

const createInteractionService = function () {
  return new InteractionService();
};

export default createInteractionService;
