import Service from "./Service";

class Rect {
  top;
  left;
  right;
  bottom;

  constructor(top, right, bottom, left) {
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
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

class TableInteractionService extends Service {
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
      event.x > headerCornerRect.right && event.y > headerCornerRect.bottom
    );
  }

  // Technische Eventhandler Planner.vue
  onPlannerContainerClick(event, container, visualizer, headerCorner) {
    const target_classList = event.target.classList;
    const headerCornerRect = Rect.fromRect(
      headerCorner.getBoundingClientRect()
    );

    // Wählen des zuständigen Eventhandlers
    if (this._isInDataRange(event, headerCornerRect)) {
      this.onDataCellRangeClick(
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
    //event.preventDefault();
    const target_classList = event.target.classList;
    const headerCornerRect = Rect.fromRect(
      headerCorner.getBoundingClientRect()
    );

    // Wählen des zuständigen Eventhandlers
    if (this._isInDataRange(event, headerCornerRect)) {
      this.onDataCellRangeClick(
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
    const headerCornerRect = Rect.fromRect(
      headerCorner.getBoundingClientRect()
    );

    if (this._isInDataRange(event, headerCornerRect)) {
      // Achtung: hier wird implizit das Wissen über die Anzahl der Header-Rows und der Header-Columns verwendet!!
      this.onDataCellRangeMove(event, container, visualizer, headerCornerRect);
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

  onDataCellRangeClick(event, container, visualizer, headerCornerRect, button) {
    if (this._interactionState === this._INTERACTION_STATE_NOTHING) {
      if (button === this._MOUSE_BUTTON_LEFT) {
        this._interactionState = this._INTERACTION_STATE_SELECTING;

        /* TODO: - Aus Mouse-Position und event.target die Grid-Column identifizieren
                 - Aus der Grid-Column den Day-Of-Year bestimmen und als Start Day-Of-Year speichern
        */

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

        const containerRect = Rect.fromRect(container.getBoundingClientRect());

        visualizer.style.top = `${
          startHeaderRowCellRect.top - containerRect.top
        }px`;
        visualizer.style.left = `${
          startHeaderDayCellRect.left - containerRect.left
        }px`;
        visualizer.style.width = `${startHeaderDayCellRect.width()}px`;
        visualizer.style.height = `${startHeaderRowCellRect.height()}px`;
      }
    } else if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      if (button === this._MOUSE_BUTTON_RIGHT) {
        // creating-data-state verlassen
        visualizer.classList.add("hidden");
        this._interactionState = this._INTERACTION_STATE_NOTHING;
      } else if (button === this._MOUSE_BUTTON_LEFT) {
        // VORERST AUCH HIER: creating-data-state verlassen
        visualizer.classList.add("hidden");
        this._interactionState = this._INTERACTION_STATE_NOTHING;
      }
    }
  }

  onDataCellRangeMove(event, container, visualizer, headerCornerRect) {
    console.log(this.getCellInfo(event));

    if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      /* TODO: - Aus Mouse-Position und event.target die Grid-Column identifizieren
                 - Aus Start-Day-Of-Year über die Start-Grid-Column bestimmen
                 - Den Visualizer entsprechend der ermittelten GridColumns zeichnen
        */

      const [headerDayCell, headerRowCell] = this._determineRelatedHeaderCells(
        event,
        headerCornerRect
      );

      const headerDayCellRect = Rect.fromRect(
        headerDayCell.getBoundingClientRect()
      );
      const headerRowCellRect = Rect.fromRect(
        headerRowCell.getBoundingClientRect()
      );

      const [startHeaderDayCellRect, startHeaderRowCellRect] =
        this._resolveRelatedStartHeaderRects(headerCornerRect);

      const containerRect = Rect.fromRect(container.getBoundingClientRect());

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
  ///////////////// Get CellInfo from event (and event.target)
  getCellInfo(event) {
    // Daten-Zelle ermitteln:
    const { x, y } = event;
    const { left, top, bottom } = event.target.getBoundingClientRect();
    const borderWidth = Number.parseFloat(
      getComputedStyle(event.target)["border-right-width"].split("px")[0]
    );
    const borderHeight = Number.parseInt(
      getComputedStyle(event.target)["border-bottom-width"].split("px")[0]
    );
    const colOffset =
      this._serviceRegister.tableStructureService.HEADER_COLUMNS;
    const rowOffset = this._serviceRegister.tableStructureService.HEADER_ROWS;

    // Offset-Dimensions:
    const left_offset = Math.floor(left);
    const right_offset = left_offset + event.target.offsetWidth - borderWidth;
    const xRatio = (x - left_offset) / (right_offset - left_offset);

    const top_offset = Math.floor(top);
    const bottom_offset = top_offset + event.target.offsetHeight - borderHeight;
    const yRatio = (y - top_offset) / (bottom_offset - top_offset);

    const cols = event.target.style.gridColumn
      .split("/")
      .map((s) => Number.parseInt(s.trim()));
    cols[1] = cols[1] ?? cols[0] + 1;

    const rows = event.target.style.gridRow
      .split("/")
      .map((s) => Number.parseInt(s.trim()));
    rows[1] = rows[1] ? rows[1] : rows[0] + 1;

    // Ermittle die Grid-Column der Mausposition:
    const column = Math.floor(cols[0] + xRatio * (cols[1] - cols[0]));
    const row = Math.floor(rows[0] + yRatio * (rows[1] - rows[0]));

    const [dayOfYearIdx, dayOfYear] =
      this._serviceRegister.tableStructureService.getDayOfYearFromGridColumn(
        column - colOffset
      );
    console.log(dayOfYearIdx, dayOfYear);

    // TODO: DataHeader-Row ermitteln und zurückgeben

    return `Zeile: ${row}, Spalte: ${column}`;
    ////
  }
}

const createTableInteractionService = function () {
  return new TableInteractionService();
};

export default createTableInteractionService;
