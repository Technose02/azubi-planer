import Interval from "../../Interval";
import Service from "./Service";

class TableInteractionService extends Service {
  // Interne Konstanten
  _MOUSE_BUTTON_LEFT = 0;
  _MOUSE_BUTTON_RIGHT = 1;

  constructor() {
    super();
  }

  _init() {}

  //// WIDGETS
  _widgets = {
    container: {},
    headerCorner: {},
    visualizer: {},
    blockContextMenu: {},
    blockTypeMenu: {},
  };

  // forceUpdateHandle (Zu rufen aus Planner.vue)
  _forceUpdateViewHandle = {};
  setForceUpdate(forceUpdateViewHandle) {
    this._forceUpdateViewHandle = forceUpdateViewHandle;
  }

  // Zu rufen aus Planner.vue, sobald Document bereit
  setWidgets(
    container,
    headerCorner,
    visualizer,
    blockContextMenu,
    blockTypeMenu
  ) {
    this._widgets = {
      container,
      headerCorner,
      visualizer,
      blockContextMenu,
      blockTypeMenu,
    };
  }
  //// WIDGETS

  //// INTERACTION STATES (gemäß State-Pattern)
  _stateIdle = {
    name: () => "stateIdle",
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      return this._leftClickIdle(event, inDataRange, weekHeaderField);
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateIdle;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("hidden");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("hidden");

      // BlockTypeMenu
      this._widgets.blockTypeMenu.classList.add("hidden");
    },
  };

  _stateBlockSelected = {
    name: () => "stateBlockSelected",
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (event.target.classList.contains("action--delete")) {
        // lösche eintrag
        this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
        this._forceUpdateViewHandle();
        return this._stateIdle;
      } else if (event.target.classList.contains("action--edit")) {
        return this._stateChooseBlockTypeForEdit;
      } else if (event.target.classList.contains("planner-block")) {
        // click auf einen Daten-Block - ist es derselbe?
        const block_id = this._getIdOfSelectedPlannerBlock(event.target);
        if (block_id === this._curBlockId) {
          // click auf den bereits ausgewählten Block -> tue nichts!
          this._contextMenuReferencePoint = { x: event.x, y: event.y };
          return this._stateBlockSelected;
        } else {
          // click auf einen anderen Datenblock -> bleib im State aber ändere die BlockID und aktualisiere die Menus
          this._curBlockId = block_id;
          this._contextMenuReferencePoint = { x: event.x, y: event.y };
          return this._stateBlockSelected;
        }
      } else {
        // woanders hingeklickt
        return this._leftClickIdle(event, inDataRange, weekHeaderField);
      }
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      event.preventDefault();
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateBlockSelected;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("hidden");

      // BlockContextMenu
      const element = document.querySelector(
        `.planner-block--${this._curBlockId}`
      );
      if (element) {
        const bounds = element.getBoundingClientRect();
        const menuBounds =
          this._widgets.blockContextMenu.getBoundingClientRect();
        const offsets = this._widgets.container.getBoundingClientRect();
        this._widgets.blockContextMenu.style.top = `${
          bounds.top - offsets.top
        }px`;
        //this._widgets.blockContextMenu.style.left = `${
        //  bounds.left - offsets.left
        //}px`;
        //this._widgets.blockContextMenu.style.transform =
        //  "translate(-50%, -50%)";

        const { x: refX, y: refY } = this._contextMenuReferencePoint;
        let left = refX - menuBounds.right + menuBounds.left - 5;
        let right;
        const { spaceToTheLeftRem, spaceToTheRightRem } =
          this._getAvailableSpaceAroundPointInContainer(refX, refY);
        if (left <= spaceToTheLeftRem) {
          left = refX + 5;
          right = left + menuBounds.right - menuBounds.left;
          if (right > spaceToTheRightRem) {
            console.error(
              "fatal: the viewport is too small for to display the contextmenu accurately..."
            );
          } else {
            this._widgets.blockContextMenu.style.right = `${right}px`;
          }
        } else {
          this._widgets.blockContextMenu.style.left = `${left}px`;
        }

        this._widgets.blockContextMenu.classList.remove("hidden");
      } else {
        console.log(`error selecting block with id ${this._curBlockId}`);
        this._widgets.blockContextMenu.classList.add("hidden");
      }

      // BlockTypeMenu
      this._widgets.blockTypeMenu.classList.add("hidden");
    },
  };

  _stateSelectForCreate = {
    name: () => "stateSelectForCreate",
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (weekHeaderField) {
        this._toggleWeekHeaderFieldCollapseState(event);
        return this._stateSelectForCreate;
      }

      // Wenn der ausgewählte Bereich ungültig ist: nichts machen!
      if (this._curSelectionInvalid) {
        return this._stateSelectForCreate;
      }

      // Ansonsten: Ausgewählten Bereich übernehmen und entsprechenden Datenblock importieren
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

      this._curBlockId = this._serviceRegister.tableDataService.importBlockData(
        startDay.date_object,
        endDay.date_object,
        this._serviceRegister.tableDataService._UNSPECIFIED_TYPE,
        selectedRowKeys
      );

      this._hideVisualizerOverride = false;
      this._forceUpdateViewHandle();
      return this._stateChooseBlockTypeForCreate;
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      // aktion abbrechen, zurück zu INTERACTION_STATE_NOTHING
      event.preventDefault();
      this._hideVisualizerOverride = false;
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      if (!inDataRange) {
        this._hideVisualizerOverride = true;
        return this._stateSelectForCreate;
      }
      this._hideVisualizerOverride = false;

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

        /// prüfen auf kollidierende Blöcke
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
      }
      return this._stateSelectForCreate;
    },
    updateWidgets: () => {
      // Visualizer
      const area = this._calculateAbsolutArreaInPx();
      if (Number.isFinite(area.top) && Number.isFinite(area.bottom)) {
        this._widgets.visualizer.style.top = `${area.top}px`;
        this._widgets.visualizer.style.left = `${area.left}px`;
        this._widgets.visualizer.style.width = `${area.right - area.left}px`;
        this._widgets.visualizer.style.height = `${area.bottom - area.top}px`;

        this._widgets.visualizer.style.backgroundColor = this
          ._curSelectionInvalid
          ? "#B004"
          : "#0B03";
      }
      if (this._hideVisualizerOverride) {
        this._widgets.visualizer.classList.add("hidden");
      } else {
        this._widgets.visualizer.classList.remove("hidden");
      }

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("hidden");

      // BlockTypeMenu
      this._widgets.blockTypeMenu.classList.add("hidden");
    },
  };

  _stateChooseBlockTypeForCreate = {
    name: () => "stateChooseBlockTypeForCreate",
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (event.target.classList.contains("menu-item-block-type")) {
        const blockTypeToSet = this._getTypeOfSelectedBlockTypeMenuItem(
          event.target
        );
        if (blockTypeToSet) {
          this._serviceRegister.tableDataService.updateBlockType(
            this._curBlockId,
            blockTypeToSet
          );
        }
        this._forceUpdateViewHandle();
        return this._stateIdle;
      } else {
        // woanders hingeklickt, also Abbruch der Aktion (wie Rechtsklick)
        this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
        this._forceUpdateViewHandle();
        return this._leftClickIdle(event, inDataRange, weekHeaderField);
      }
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      // aktion abbrechen, zurück zu INTERACTION_STATE_NOTHING
      event.preventDefault();
      // ein Abbruch hier führt zum Abbruch des Block-Creation-Prozesses, also den bereits
      // importierten Datenblock wieder löschen:
      this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
      this._forceUpdateViewHandle();
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateChooseBlockTypeForCreate;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("hidden");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("hidden");

      // BlockTypeMenu
      // Verwende infos aus dem vorherigen Teil des Create-Block-Prozesses
      const blockArea = this._calculateAbsolutArreaInPx();
      this._widgets.blockTypeMenu.style.top = `${blockArea.top}px`;
      this._widgets.blockTypeMenu.style.left = `${blockArea.right + 5}px`;
      this._widgets.blockTypeMenu.style.transform = "translate(0%, -50%)";
      this._widgets.blockTypeMenu.classList.remove("hidden");
    },
  };

  _stateChooseBlockTypeForEdit = {
    name: () => "stateChooseBlockTypeForEdit",
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (event.target.classList.contains("menu-item-block-type")) {
        const blockTypeToSet = this._getTypeOfSelectedBlockTypeMenuItem(
          event.target
        );
        if (blockTypeToSet) {
          this._serviceRegister.tableDataService.updateBlockType(
            this._curBlockId,
            blockTypeToSet
          );
          this._forceUpdateViewHandle();
        }
        return this._stateIdle;
      } else {
        // woanders hingeklickt
        return this._leftClickIdle(event, inDataRange, weekHeaderField);
      }
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      // aktion abbrechen, zurück zu INTERACTION_STATE_NOTHING
      event.preventDefault();
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateChooseBlockTypeForEdit;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("hidden");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("hidden");

      // BlockTypeMenu
      const element = document.querySelector(
        `.planner-block--${this._curBlockId}`
      );
      if (element) {
        const bounds = element.getBoundingClientRect();
        const offsets = this._widgets.container.getBoundingClientRect();
        this._widgets.blockTypeMenu.style.top = `${bounds.top - offsets.top}px`;
        this._widgets.blockTypeMenu.style.left = `${
          bounds.right - offsets.left
        }px`;
        this._widgets.blockTypeMenu.style.transform = "translate(0%, -50%)";
        this._widgets.blockTypeMenu.classList.remove("hidden");
      } else {
        console.error(`no element found for blockId ${this._curBlockId}`);
        this._widgets.blockTypeMenu.classList.add("hidden");
      }
    },
  };
  //// INTERACTION STATES

  //// INTERNAL STATE
  _startDayOfYearIdx = -1;
  _curDayOfYearIdx = -1;
  _startRowKey = "";
  _curRowKey = "";
  _curSelectionInvalid = false;
  _curBlockId = {};
  _hideVisualizerOverride = false;
  _contextMenuReferencePoint = {
    x: -1,
    y: -1,
  };

  _currentState = this._stateIdle;
  //// INTERNAL STATE

  //// HELPERS
  _getAvailableSpaceAroundPointInContainer(x, y) {
    const { left, right } = this._widgets.container.getBoundingClientRect();
    const spaceToTheLeftRem = (x - left) / 10;
    const spaceToTheRightRem = (right - y) / 10;
    return {
      spaceToTheLeftRem,
      spaceToTheRightRem,
    };
  }
  _calculateAbsolutArreaInPx() {
    const { left: leftOffset, top: topOffset } =
      this._widgets.container.getBoundingClientRect();

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
  _inDataRange(event) {
    if (this._widgets.headerCorner) {
      const { x, y } = event;
      const { right, bottom } =
        this._widgets.headerCorner.getBoundingClientRect();
      return x > right && y > bottom;
    }
  }
  //// HELPERS

  //// ACTIONS (unabhängig von STATE!)
  _leftClickIdle(event, inDataRange, weekHeaderField) {
    const { x, y, target } = event;
    if (weekHeaderField) {
      this._toggleWeekHeaderFieldCollapseState(event);
      return this._stateIdle;
    }
    if (
      target.classList.contains("planner-block") &&
      !target.classList.contains("unspecified")
    ) {
      this._curBlockId = this._getIdOfSelectedPlannerBlock(target);
      this._contextMenuReferencePoint = { x: event.x, y: event.y };
      return this._stateBlockSelected;
    } else if (inDataRange) {
      const cellInfo = this.getCellInfo(x, y, target);
      // je nach Mausgeschwindigkeit schlägt hier die Erfassung manchmal fehl, dann lassen wir den Schritt aus ;-)
      if (cellInfo) {
        [this._startRowKey, this._startDayOfYearIdx] = cellInfo;
        [this._curRowKey, this._curDayOfYearIdx] = [
          this._startRowKey,
          this._startDayOfYearIdx,
        ];
        return this._stateSelectForCreate;
      }
    }
    return this._stateIdle;
  }
  _toggleWeekHeaderFieldCollapseState(event) {
    const target_classList = event.target.classList;

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
    this._forceUpdateViewHandle();
  }
  //// ACTIONS (unabhängig von STATE!)

  // Technische Eventhandler Planner.vue
  onPlannerContainerClick(e) {
    this.onMouseClick(e, this._MOUSE_BUTTON_LEFT);
  }
  onPlannerContainerContextMenu(e) {
    this.onMouseClick(e, this._MOUSE_BUTTON_RIGHT);
  }
  onMouseClick(e, mouseButton) {
    const prev = this._currentState.name();
    const inDataRange = this._inDataRange(e);
    const weekHeaderField =
      !inDataRange && e.target.classList.contains("planner-header-row-week");

    if (mouseButton === this._MOUSE_BUTTON_LEFT) {
      this._currentState = this._currentState.onLeftClick(
        e,
        inDataRange,
        weekHeaderField
      );
    } else if (mouseButton === this._MOUSE_BUTTON_RIGHT) {
      this._currentState = this._currentState.onRightClick(
        e,
        inDataRange,
        weekHeaderField
      );
    }
    e.stopPropagation();
    this._currentState.updateWidgets();
    if (this._currentState.name() !== prev)
      console.log(`state-transition: ${prev} -> ${this._currentState.name()}`);
  }
  onPlannerContainerMouseMove(e) {
    const prev = this._currentState.name();
    this._currentState.updateWidgets();
    const inDataRange = this._inDataRange(e);
    this._currentState = this._currentState.onMouseMove(e, inDataRange);
    e.stopPropagation();
    if (this._currentState.name() !== prev)
      console.log(`state-transition: ${prev} -> ${this._currentState.name()}`);
  }
  //

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
