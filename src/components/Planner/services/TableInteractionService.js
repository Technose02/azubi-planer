import Interval from "../../Interval";
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
  _startDayOfYearIdx = -1;
  _curDayOfYearIdx = -1;
  _startRowKey = "";
  _curRowKey = "";
  _curSelectionInvalid = false;

  constructor() {
    super();
  }

  _init() {}

  _isInDataRange(event, headerCornerRect) {
    return (
      event.x > headerCornerRect.right && event.y > headerCornerRect.bottom
    );
  }

  _getSelectedRowKeys() {
    const registeredRowKeys =
      this._serviceRegister.tableDataService.getRegisteredRowKeys();
    let startRow = registeredRowKeys.indexOf(this._startRowKey);
    let endRow = registeredRowKeys.indexOf(this._curRowKey);
    if (startRow > endRow) {
      const tmp = startRow;
      startRow = endRow;
      endRow = tmp;
    }
    const selectedRowKeys = [];
    for (let r = startRow; r <= endRow; r++) {
      selectedRowKeys.push(registeredRowKeys[r]);
    }
    return selectedRowKeys;
  }

  _getFieldBoundsByDayOfYearIdx(dayOfYearIdx) {
    const dayStructure =
      this._serviceRegister.tableStructureService.getEntityArrays()
        .dayStructures[dayOfYearIdx];
    const dayOfYear = dayStructure.day_of_year;
    const weekIdx = dayStructure.in_week;
    const dayOfWeek = dayStructure.day_of_week;

    // try to get field by day of year (day in non-collapsed week)
    let field = document.querySelector(
      `.planner-header-row-day.day-year--${dayOfYear}`
    );
    if (field) {
      const { left, right } = field.getBoundingClientRect();
      return [left, right];
    }
    // day belongs to a collapsed week
    field = document.querySelector(
      `.collapsed.planner-header-row-day.week--${weekIdx}`
    );
    const { left, right } = field.getBoundingClientRect();
    const left_ = left + (dayOfWeek / 7) * (right - left);
    const right_ = left + ((dayOfWeek + 1) / 7) * (right - left);
    return [left_, right_];
  }

  _getFieldBoundsByRowKey(rowKey) {
    const field = document.querySelector(`.planner-header-column--${rowKey}`);
    if (field) {
      const { top, bottom } = field.getBoundingClientRect();
      return [top, bottom];
    }
  }

  _updateVisualizer(container, visualizer) {
    const { left: leftOffset, top: topOffset } =
      container.getBoundingClientRect();

    let [left0, right0] = this._getFieldBoundsByDayOfYearIdx(
      this._startDayOfYearIdx
    );
    let [left1, right1] = this._getFieldBoundsByDayOfYearIdx(
      this._curDayOfYearIdx
    );

    if (this._curDayOfYearIdx < this._startDayOfYearIdx) {
      let tmp = left0;
      left0 = left1;
      left1 = tmp;
      tmp = right0;
      right0 = right1;
      right1 = tmp;
    }

    if (this._startRowKey && this._curRowKey) {
      let [top0, bottom0] = this._getFieldBoundsByRowKey(this._startRowKey);
      let [top1, bottom1] = this._getFieldBoundsByRowKey(this._curRowKey);

      if (top1 < top0) {
        let tmp = top0;
        top0 = top1;
        top1 = tmp;
        tmp = bottom0;
        bottom0 = bottom1;
        bottom1 = tmp;
      }

      visualizer.style.top = `${top0 - topOffset}px`;
      visualizer.style.left = `${left0 - leftOffset}px`;
      visualizer.style.width = `${right1 - left0}px`;
      visualizer.style.height = `${bottom1 - top0}px`;

      visualizer.style.backgroundColor = this._curSelectionInvalid
        ? "#B004"
        : "#0B03";
    }

    // show / hide visualizer:
    if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      visualizer.classList.remove("hidden");
    } else {
      visualizer.classList.add("hidden");
    }
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
      this.onDataCellRangeMove(event, container, visualizer);
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
    visualizer.classList.add("hidden");
  }

  onDataCellRangeClick(event, container, visualizer, button) {
    const { x, y, target } = event;
    if (this._interactionState === this._INTERACTION_STATE_NOTHING) {
      if (button === this._MOUSE_BUTTON_LEFT) {
        const cellInfo = this.getCellInfo(x, y, target);
        // je nach Mausgeschwindigkeit schlägt hier die Erfassung manchmal fehl, dann lassen wir den Schritt aus ;-)
        if (cellInfo) {
          this._interactionState = this._INTERACTION_STATE_SELECTING;

          [this._startRowKey, this._startDayOfYearIdx] = cellInfo;
          [this._curRowKey, this._curDayOfYearIdx] = [
            this._startRowKey,
            this._startDayOfYearIdx,
          ];

          this._updateVisualizer(container, visualizer);
        }
      }
    } else if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      if (button === this._MOUSE_BUTTON_RIGHT) {
        event.preventDefault();
        // creating-data-state verlassen
        this._interactionState = this._INTERACTION_STATE_NOTHING;
        this._updateVisualizer(container, visualizer);
      } else if (button === this._MOUSE_BUTTON_LEFT) {
        // Wenn der ausgewählte Bereich ungültig ist: nichts machen!
        if (this._curSelectionInvalid) return;
        this._interactionState = this._INTERACTION_STATE_NOTHING;

        // Informationen zusammentragen, neuen Block anlegen und selecting-state verlassen
        const dayStructures =
          this._serviceRegister.tableStructureService.getEntityArrays()
            .dayStructures;
        let startDay = dayStructures[this._startDayOfYearIdx];
        let endDay = dayStructures[this._curDayOfYearIdx];
        if (startDay.date_object > endDay.date_object) {
          const tmp = startDay;
          startDay = endDay;
          endDay = tmp;
        }

        //console.log(
        //  `Selected Time-Range: ${startDay.date_object} to ${endDay.date_object}`
        //);
        //console.log(`Selected rowKeys: ${selectedRowKeys.join(",")}`);

        this._serviceRegister.tableDataService.importBlockData(
          startDay.date_object,
          endDay.date_object,
          this._serviceRegister.tableDataService.UNSPECIFIED_TYPE,
          this._getSelectedRowKeys()
        );

        this._updateVisualizer(container, visualizer);
      }
    }
  }

  onDataCellRangeMove(event, container, visualizer) {
    if (this._interactionState === this._INTERACTION_STATE_SELECTING) {
      const { x, y, target } = event;
      let cellElement = target;

      if (cellElement.classList.contains("create-block-visualizer")) {
        const allElementsAtPos = document.elementsFromPoint(x, y);
        cellElement = Array.from(allElementsAtPos).at(1); // direkt unter dem Visualizer-Element
      }
      const cellInfo = this.getCellInfo(x, y, cellElement);
      // je nach Mausgeschwindigkeit schlägt hier die Erfassung manchmal fehl, dann lassen wir den Schritt aus ;-)
      if (cellInfo) {
        [this._curRowKey, this._curDayOfYearIdx] = cellInfo;

        const startRowIdx = this._serviceRegister.tableDataService
          .getRegisteredRowKeys()
          .findIndex((k) => k === this._startRowKey);
        const curRowIdx = this._serviceRegister.tableDataService
          .getRegisteredRowKeys()
          .findIndex((k) => k === this._curRowKey);
        const rowIntervalToCheck = Interval.createAutoCorrect(
          startRowIdx,
          curRowIdx
        );

        /// Check if intercepting with existing blocks
        const dayIntervalToCheck = Interval.createAutoCorrect(
          this._startDayOfYearIdx,
          this._curDayOfYearIdx
        );
        this._curSelectionInvalid = this._serviceRegister.tableDataService
          .getAssignedBlocks()
          .filter((b) =>
            Interval.createAutoCorrect(
              b.startDayOfYearIdx,
              b.endDayOfYearIdx
            ).intersects(dayIntervalToCheck)
          )
          .flatMap((b) => b.rowKeys)
          .map((rowKey) =>
            this._serviceRegister.tableDataService
              .getRegisteredRowKeys()
              .findIndex((k) => k === rowKey)
          )
          .some((p) => rowIntervalToCheck.includes(p));

        this._updateVisualizer(container, visualizer);
      }
    }
  }
  ///////////////// Get CellInfo from event (and event.target)
  getCellInfo(x, y, target) {
    // Daten-Zelle ermitteln:
    const { left } = target.getBoundingClientRect();
    const borderWidth = Number.parseFloat(
      getComputedStyle(target)["border-right-width"].split("px")[0]
    );
    const colOffset =
      this._serviceRegister.tableStructureService.HEADER_COLUMNS;
    const rowOffset = this._serviceRegister.tableStructureService.HEADER_ROWS;

    // Offset-Dimensions:
    const left_offset = Math.floor(left);
    const right_offset = left_offset + target.offsetWidth - borderWidth;
    const xRatio = (x - left_offset) / (right_offset - left_offset);

    if (!target.style.gridColumn) return undefined;

    const cols = target.style.gridColumn
      .split("/")
      .map((s) => Number.parseInt(s.trim()));
    cols[1] = cols[1] ?? cols[0] + 1;

    // Ermittle die Grid-Column der Mausposition:
    const column = Math.floor(cols[0] + xRatio * (cols[1] - cols[0]));

    const [dayOfYearIdx, dayOfYear] =
      this._serviceRegister.tableStructureService.getDayOfYearFromGridColumn(
        column - colOffset
      );

    // Spezialbehandlung für rows: hier sind in Blocks die Zeilen nicht immer gleich hoch!
    // Daher: bestimmen der exakten Zeile über Position und class-selector

    let rowKey;

    if (target.classList.contains("free-day")) {
      rowKey = Array.from(target.classList)
        .filter((c) => c.startsWith("planner-row--"))
        .map((c) => c.split("--")[1])[0];
    } else {
      const rowKeys = Array.from(target.classList)
        .filter((c) => c.startsWith("planner-rows--"))
        .map((c) => c.split("--")[1])
        .flatMap((l) => l.split("-"));
      if (rowKeys.length === 1) {
        rowKey = rowKeys[0];
      } else {
        for (const k of rowKeys) {
          const headerField = document.querySelector(
            `.planner-header-column--${k}`
          );
          const { top, bottom } = headerField.getBoundingClientRect();
          if (y >= top && y <= bottom) {
            rowKey = k;
            break;
          }
        }
      }
    }

    //console.log(
    //  `Zeile: ${
    //    this._serviceRegister.tableStructureService.getRowIdxFromRowKey(
    //      rowKey
    //    ) + rowOffset
    //  }, Spalte: ${column}`
    //);

    return [rowKey, dayOfYearIdx];
  }
}

const createTableInteractionService = function () {
  return new TableInteractionService();
};

export default createTableInteractionService;
