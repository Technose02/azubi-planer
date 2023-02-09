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
  _INTERACTION_STATE_CREATE_SELECT = 11;
  _INTERACTION_STATE_CREATE_CHOOSE_TYPE = 12;
  _INTERACTION_STATE_BLOCK_SELECTED = 13;
  _INTERACTION_STATE_EDIT_CHOOSE_TYPE = 14;

  // State
  _interactionState = this._INTERACTION_STATE_NOTHING;

  //  _selectionStartCell = {};
  _startDayOfYearIdx = -1;
  _curDayOfYearIdx = -1;
  _startRowKey = "";
  _curRowKey = "";
  _curSelectionInvalid = false;
  _curBlockId = {};

  constructor() {
    super();
  }

  _init() {}

  _updateInteractionState(newInteractionState) {
    console.log(
      `updating interaction state from ${this._interactionState} to ${newInteractionState}`
    );
    this._interactionState = newInteractionState;
  }

  _isInDataRange(event, headerCornerRect) {
    return (
      event.x > headerCornerRect.right && event.y > headerCornerRect.bottom
    );
  }

  _calculateAbsolutArreaInPx(container) {
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

      return {
        top: top0 - topOffset,
        left: left0 - leftOffset,
        right: right1 - leftOffset,
        bottom: bottom1 - topOffset,
      };
    }

    return {
      left: left0 - leftOffset,
      right: right1,
    };
  }

  _getIdOfSelectedPlannerBlock(element) {
    return Array.from(element.classList)
      .filter((c) => c.startsWith("planner-block--"))
      .flatMap((c) => c.split("--")[1])[0];
  }

  _getTypeOfSelectedBlockTypeMenuItem(element) {
    return Array.from(element.classList)
      .filter((c) => c.startsWith("block-type--"))
      .flatMap((c) => c.split("--")[1])[0];
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

  _updateBlockTypeMenu(container, blockTypeMenu) {
    const element = document.querySelector(
      `.planner-block--${this._curBlockId}`
    );
    if (element) {
      const bounds = element.getBoundingClientRect();
      const offsets = container.getBoundingClientRect();
      blockTypeMenu.style.top = `${bounds.top - offsets.top}px`;
      blockTypeMenu.style.left = `${bounds.right - offsets.left}px`;
      blockTypeMenu.style.transform = "translate(0%, -50%)";

      // show / hide blockTypeMenu:
      if (
        this._interactionState === this._INTERACTION_STATE_CREATE_CHOOSE_TYPE ||
        this._interactionState === this._INTERACTION_STATE_EDIT_CHOOSE_TYPE
      ) {
        blockTypeMenu.classList.remove("hidden");
      } else {
        blockTypeMenu.classList.add("hidden");
      }
    } else {
      // Block wurde gerade importiert und kann noch nicht aus dem Document ermittelt werden
      // Verwende infos
      const blockArea = this._calculateAbsolutArreaInPx(container);
      blockTypeMenu.style.top = `${blockArea.top}px`;
      blockTypeMenu.style.left = `${blockArea.right + 5}px`;
      blockTypeMenu.style.transform = "translate(0%, -50%)";

      blockTypeMenu.classList.remove("hidden");
    }
  }

  _updateBlockContextMenu(container, blockContextMenu) {
    if (this._interactionState === this._INTERACTION_STATE_BLOCK_SELECTED) {
      const element = document.querySelector(
        `.planner-block--${this._curBlockId}`
      );
      if (element) {
        const bounds = element.getBoundingClientRect();
        const offsets = container.getBoundingClientRect();
        blockContextMenu.style.top = `${bounds.top - offsets.top}px`;
        blockContextMenu.style.left = `${bounds.left - offsets.left}px`;
        blockContextMenu.style.transform = "translate(-50%, -50%)";

        blockContextMenu.classList.remove("hidden");
      } else {
        console.log(`error selecting block with id ${this._curBlockId}`);
      }
    } else {
      blockContextMenu.classList.add("hidden");
    }
  }

  _updateVisualizer(container, visualizer) {
    const area = this._calculateAbsolutArreaInPx(container);
    if (Number.isFinite(area.top) && Number.isFinite(area.bottom)) {
      visualizer.style.top = `${area.top}px`;
      visualizer.style.left = `${area.left}px`;
      visualizer.style.width = `${area.right - area.left}px`;
      visualizer.style.height = `${area.bottom - area.top}px`;

      visualizer.style.backgroundColor = this._curSelectionInvalid
        ? "#B004"
        : "#0B03";
    }

    // show / hide visualizer:
    if (this._interactionState === this._INTERACTION_STATE_CREATE_SELECT) {
      visualizer.classList.remove("hidden");
    } else {
      visualizer.classList.add("hidden");
    }
  }

  // Technische Eventhandler Planner.vue
  onPlannerContainerClick(
    event,
    container,
    visualizer,
    headerCorner,
    blockContextMenu,
    blockTypeMenu
  ) {
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
        blockContextMenu,
        blockTypeMenu,
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
  onPlannerContainerContextMenu(
    event,
    container,
    visualizer,
    headerCorner,
    blockContextMenu,
    blockTypeMenu
  ) {
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
        blockContextMenu,
        blockTypeMenu,
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
  onPlannerContainerMouseMove(
    event,
    container,
    visualizer,
    headerCorner,
    blockContextMenu,
    blockTypeMenu
  ) {
    const headerCornerRect = Rect.fromRect(
      headerCorner.getBoundingClientRect()
    );

    if (this._isInDataRange(event, headerCornerRect)) {
      // Achtung: hier wird implizit das Wissen über die Anzahl der Header-Rows und der Header-Columns verwendet!!
      this.onDataCellRangeMove(event, container, visualizer, blockContextMenu);
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

  onDataCellRangeClick(
    event,
    container,
    visualizer,
    blockContextMenu,
    blockTypeMenu,
    button
  ) {
    const { x, y, target } = event;
    if (this._interactionState === this._INTERACTION_STATE_NOTHING) {
      if (button === this._MOUSE_BUTTON_LEFT) {
        if (
          event.target.classList.contains("planner-block") &&
          !event.target.classList.contains("unspecified")
        ) {
          this._curBlockId = this._getIdOfSelectedPlannerBlock(event.target);
          this._updateInteractionState(this._INTERACTION_STATE_BLOCK_SELECTED);
          this._updateBlockContextMenu(container, blockContextMenu);
        } else {
          const cellInfo = this.getCellInfo(x, y, target);
          // je nach Mausgeschwindigkeit schlägt hier die Erfassung manchmal fehl, dann lassen wir den Schritt aus ;-)
          if (cellInfo) {
            this._updateInteractionState(this._INTERACTION_STATE_CREATE_SELECT);

            [this._startRowKey, this._startDayOfYearIdx] = cellInfo;
            [this._curRowKey, this._curDayOfYearIdx] = [
              this._startRowKey,
              this._startDayOfYearIdx,
            ];

            this._updateVisualizer(container, visualizer);
            this._updateBlockContextMenu(container, blockContextMenu);
          }
        }
      }
    } else if (
      this._interactionState === this._INTERACTION_STATE_CREATE_SELECT
    ) {
      if (button === this._MOUSE_BUTTON_RIGHT) {
        // aktion abbrechen, zurück zu INTERACTION_STATE_NOTHING
        event.preventDefault();
        this._updateInteractionState(this._INTERACTION_STATE_NOTHING);
        this._updateVisualizer(container, visualizer);
      } else if (button === this._MOUSE_BUTTON_LEFT) {
        // Wenn der ausgewählte Bereich ungültig ist: nichts machen!
        if (this._curSelectionInvalid) return;
        this._updateInteractionState(this._INTERACTION_STATE_NOTHING);

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

        this._curBlockId =
          this._serviceRegister.tableDataService.importBlockData(
            startDay.date_object,
            endDay.date_object,
            this._serviceRegister.tableDataService._UNSPECIFIED_TYPE,
            this._getSelectedRowKeys()
          );

        this._updateInteractionState(
          this._INTERACTION_STATE_CREATE_CHOOSE_TYPE
        );
        this._updateVisualizer(container, visualizer);
        this._updateBlockTypeMenu(container, blockTypeMenu);
      }
    } else if (
      this._interactionState === this._INTERACTION_STATE_CREATE_CHOOSE_TYPE ||
      this._interactionState === this._INTERACTION_STATE_EDIT_CHOOSE_TYPE
    ) {
      if (button === this._MOUSE_BUTTON_RIGHT) {
        // aktion abbrechen, zurück zu INTERACTION_STATE_NOTHING
        event.preventDefault();
        if (
          this._interactionState === this._INTERACTION_STATE_CREATE_CHOOSE_TYPE
        ) {
          // cancelling selection of type implies cancellation of block-creation at all
          this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
        }
        this._updateInteractionState(this._INTERACTION_STATE_NOTHING);
        this._updateBlockTypeMenu(container, blockTypeMenu);
      } else if (button === this._MOUSE_BUTTON_LEFT) {
        if (target.classList.contains("menu-item-block-type")) {
          const blockTypeToSet =
            this._getTypeOfSelectedBlockTypeMenuItem(target);
          if (blockTypeToSet) {
            this._serviceRegister.tableDataService.updateBlockType(
              this._curBlockId,
              blockTypeToSet
            );
          }
        } else if (
          this._interactionState === this._INTERACTION_STATE_CREATE_CHOOSE_TYPE
        ) {
          // cancelling selection of type implies cancellation of block-creation at all
          this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
        }
        this._updateInteractionState(this._INTERACTION_STATE_NOTHING);
        this._updateBlockTypeMenu(container, blockTypeMenu);
      }
    } else if (
      this._interactionState === this._INTERACTION_STATE_BLOCK_SELECTED
    ) {
      if (button === this._MOUSE_BUTTON_RIGHT) {
        event.preventDefault();
        this._updateInteractionState(this._INTERACTION_STATE_NOTHING);
        this._updateBlockContextMenu(container, blockContextMenu);
      } else if (button === this._MOUSE_BUTTON_LEFT) {
        if (target.classList.contains("action--delete")) {
          // lösche eintrag
          this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
          this._updateInteractionState(this._INTERACTION_STATE_NOTHING);
          this._updateBlockContextMenu(container, blockContextMenu);
        } else if (target.classList.contains("action--edit")) {
          this._updateInteractionState(
            this._INTERACTION_STATE_EDIT_CHOOSE_TYPE
          );
          this._updateBlockContextMenu(container, blockContextMenu);
          this._updateBlockTypeMenu(container, blockTypeMenu);
        } else if (target.classList.contains("planner-block")) {
          // click auf einen Daten-Block - ist es derselbe?
          const block_id = this._getIdOfSelectedPlannerBlock(target);
          if (block_id === this._curBlockId) {
            // click auf den bereits ausgewählten Block -> tue nichts!
          } else {
            // click auf einen anderen Datenblock -> bleib im State aber ändere die BlockID und aktualisiere die Menus
            this._curBlockId = block_id;
            this._updateBlockContextMenu(container, blockContextMenu);
          }
        } else {
          // woanders hingeklickt -> zurück in state NOTHING
          this._updateInteractionState(this._INTERACTION_STATE_NOTHING);
          this._updateBlockContextMenu(container, blockContextMenu);
        }
      }
    }
  }

  onDataCellRangeMove(event, container, visualizer, blockContextMenu) {
    if (this._interactionState === this._INTERACTION_STATE_CREATE_SELECT) {
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
