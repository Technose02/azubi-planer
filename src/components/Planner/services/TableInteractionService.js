import Interval from "../../Interval";
import Service from "./Service";
import { createBlock } from "../Block.js";

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

  //// EventHandlers
  _onBlockAddedHandler = undefined;
  setOnBlockAddedHandler(onBlockAddedHandler) {
    this._onBlockAddedHandler = onBlockAddedHandler;
  }

  _onBlockDeletedHandler = undefined;
  setOnBlockDeletedHandler(onBlockDeletedHandler) {
    this._onBlockDeletedHandler = onBlockDeletedHandler;
  }

  _onBlockUpdatedHandler = undefined;
  setOnBlockUpdatedHandler(onBlockUpdatedHandler) {
    this._onBlockUpdatedHandler = onBlockUpdatedHandler;
  }

  onDeleteKeyPressed() {
    const prev = this._currentState.name();
    const next = this._currentState.onDeleteKeyPressed();
    if (next) this._currentState = next;
    if (this._currentState.name() !== prev)
      console.log(`state-transition: ${prev} -> ${this._currentState.name()}`);
  }
  //// EventHandlers

  //// PROPERTIES
  _setMenuReferencePoint(event) {
    const containerBounds = this._widgets.container.getBoundingClientRect();
    this._menuReferencePoint.x = event.clientX - containerBounds.left;
    this._menuReferencePoint.y = event.clientY - containerBounds.top;
  }

  setSelectionColors(colorSelectionValid, colorSelectionInvalid) {
    this._colorSelectionValid = colorSelectionValid;
    this._colorSelectionInvalid = colorSelectionInvalid;
  }
  //// PROPERTIES

  //// INTERACTION STATES (gem???? State-Pattern)
  _stateIdle = {
    name: () => "stateIdle",
    onDeleteKeyPressed: () => {},
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
      this._widgets.visualizer.classList.add("invisible");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("invisible");

      // BlockTypeMenu
      this._widgets.blockTypeMenu.classList.add("invisible");
    },
  };

  _stateBlockSelected = {
    name: () => "stateBlockSelected",
    _delete: () => {
      // hole noch einmal Blockdaten und rowKeys um diese ggf. noch an den onBlockDeletedHandler ??bergeben zu k??nnen
      const blockData = this._serviceRegister.tableDataService
        .getBlockData(this._curBlockId)
        .copy();

      // l??sche eintrag
      this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);

      // fire onBlockDeletedHandler if set
      if (this._onBlockDeletedHandler) {
        this._onBlockDeletedHandler({ block_data: blockData });
      }
      //

      this._deselectAllBlocks();
      this._forceUpdateViewHandle();
      return this._stateIdle;
    },
    onDeleteKeyPressed: () => {
      const newState = this._stateBlockSelected._delete();
      newState.updateWidgets();
      return newState;
    },
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (event.target.classList.contains("action--delete")) {
        return this._stateBlockSelected._delete();
      } else if (event.target.classList.contains("action--edit")) {
        this._setMenuReferencePoint(event);
        return this._stateChooseBlockTypeForEdit;
      } else {
        // woanders hingeklickt
        this._deselectAllBlocks();
        return this._leftClickIdle(event, inDataRange, weekHeaderField);
      }
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      event.preventDefault();
      this._deselectAllBlocks();
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateBlockSelected;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("invisible");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.remove("invisible");
      const menuBounds = this._widgets.blockContextMenu.getBoundingClientRect();

      const { x: refX, y: refY } = this._menuReferencePoint;
      const left = refX - menuBounds.right + menuBounds.left - 5;
      const top = refY - menuBounds.bottom + menuBounds.top - 5;
      this._widgets.blockContextMenu.style.left = `${left}px`;
      this._widgets.blockContextMenu.style.top = `${top}px`;

      // BlockTypeMenu
      this._widgets.blockTypeMenu.classList.add("invisible");
    },
  };

  _stateSelectForCreate = {
    name: () => "stateSelectForCreate",
    onDeleteKeyPressed: () => {},
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (weekHeaderField) {
        this._toggleWeekHeaderFieldCollapseState(event);
        return this._stateSelectForCreate;
      }

      // Wenn der ausgew??hlte Bereich ung??ltig ist: nichts machen!
      if (this._curSelectionInvalid) {
        return this._stateSelectForCreate;
      }

      // Ansonsten: Ausgew??hlten Bereich ??bernehmen und entsprechenden Datenblock importieren
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
        createBlock(
          this._serviceRegister.tableDataService._UNSPECIFIED_TYPE,
          startDay.date_object,
          endDay.date_object,
          selectedRowKeys
        )
      );

      this._setMenuReferencePoint(event);

      this._hideVisualizerOverride = false;

      // hacky: use a 30ms delay to select the newly created block-object, since it won't be "queryable"
      //        instantly
      new Promise((res, _) => {
        this._forceUpdateViewHandle();
        setTimeout(res, 30);
      }).then(() => this._selectAllPlannerBlockOfCurrentBlockId());

      return this._stateChooseBlockTypeForCreate;
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      // aktion abbrechen, zur??ck zu INTERACTION_STATE_NOTHING
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
      // je nach Mausgeschwindigkeit schl??gt hier die Erfassung manchmal fehl, dann lassen wir den Schritt aus ;-)
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

        /// pr??fen auf kollidierende Bl??cke
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
          ? this._colorSelectionInvalid
          : this._colorSelectionValid;
      }
      if (this._hideVisualizerOverride) {
        this._widgets.visualizer.classList.add("invisible");
      } else {
        this._widgets.visualizer.classList.remove("invisible");
      }

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("invisible");

      // BlockTypeMenu
      this._widgets.blockTypeMenu.classList.add("invisible");
    },
  };

  _stateChooseBlockTypeForCreate = {
    name: () => "stateChooseBlockTypeForCreate",
    onDeleteKeyPressed: () => {},
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

          // fire onBlockAddedHandler if set
          if (this._onBlockAddedHandler) {
            const blockData = this._serviceRegister.tableDataService
              .getBlockData(this._curBlockId)
              .copy();

            this._onBlockAddedHandler({ block_data: blockData });
          }
          //
        }
        this._deselectAllBlocks();
        this._forceUpdateViewHandle();
        return this._stateIdle;
      } else {
        // woanders hingeklickt, also Abbruch der Aktion (wie Rechtsklick)
        this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
        this._deselectAllBlocks();
        this._forceUpdateViewHandle();
        return this._leftClickIdle(event, inDataRange, weekHeaderField);
      }
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      // aktion abbrechen, zur??ck zu INTERACTION_STATE_NOTHING
      event.preventDefault();
      // ein Abbruch hier f??hrt zum Abbruch des Block-Creation-Prozesses, also den bereits
      // importierten Datenblock wieder l??schen:
      this._serviceRegister.tableDataService.deleteBlock(this._curBlockId);
      this._forceUpdateViewHandle();
      this._deselectAllBlocks();
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateChooseBlockTypeForCreate;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("invisible");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("invisible");

      // BlockTypeMenu
      const menuBounds = this._widgets.blockTypeMenu.getBoundingClientRect();
      const { x: refX, y: refY } = this._menuReferencePoint;
      const left = refX - menuBounds.right + menuBounds.left - 5;
      const top = refY - (menuBounds.bottom - menuBounds.top) / 2;
      this._widgets.blockTypeMenu.style.left = `${left}px`;
      this._widgets.blockTypeMenu.style.top = `${top}px`;
      this._widgets.blockTypeMenu.classList.remove("invisible");
    },
  };

  _stateChooseBlockTypeForEdit = {
    name: () => "stateChooseBlockTypeForEdit",
    onDeleteKeyPressed: () => {},
    onLeftClick: (event, inDataRange, weekHeaderField) => {
      if (event.target.classList.contains("menu-item-block-type")) {
        const blockTypeToSet = this._getTypeOfSelectedBlockTypeMenuItem(
          event.target
        );
        if (blockTypeToSet) {
          const blockDataBefore = this._serviceRegister.tableDataService
            .getBlockData(this._curBlockId)
            .copy();
          const blockDataAfter = blockDataBefore.copy();
          blockDataAfter.type = blockTypeToSet;

          this._serviceRegister.tableDataService.updateBlockType(
            this._curBlockId,
            blockTypeToSet
          );

          // fire onBlockUpdatedHandler if set
          if (this._onBlockUpdatedHandler) {
            this._onBlockUpdatedHandler({
              block_data_after: blockDataAfter,
              block_data_before: blockDataBefore,
            });
          }
          //

          this._forceUpdateViewHandle();
        }
        this._deselectAllBlocks();
        return this._stateIdle;
      } else {
        // woanders hingeklickt
        this._deselectAllBlocks();
        return this._leftClickIdle(event, inDataRange, weekHeaderField);
      }
    },
    onRightClick: (event, inDataRange, weekHeaderField) => {
      // aktion abbrechen, zur??ck zu INTERACTION_STATE_NOTHING
      event.preventDefault();
      this._deselectAllBlocks();
      return this._stateIdle;
    },
    onMouseMove: (event, inDataRange) => {
      return this._stateChooseBlockTypeForEdit;
    },
    updateWidgets: () => {
      // Visualizer
      this._widgets.visualizer.classList.add("invisible");

      // BlockContextMenu
      this._widgets.blockContextMenu.classList.add("invisible");

      // BlockTypeMenu
      const menuBounds = this._widgets.blockTypeMenu.getBoundingClientRect();
      const { x: refX, y: refY } = this._menuReferencePoint;
      const left = refX - menuBounds.right + menuBounds.left - 5;
      const top = refY - (menuBounds.bottom - menuBounds.top) / 2;
      this._widgets.blockTypeMenu.style.left = `${left}px`;
      this._widgets.blockTypeMenu.style.top = `${top}px`;
      this._widgets.blockTypeMenu.classList.remove("invisible");
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
  _menuReferencePoint = {
    x: -1,
    y: -1,
  };
  _colorSelectionValid = "#FFF";
  _colorSelectionInvalid = "#000";

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
    console.log(element);
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
    const weekDayMask =
      this._serviceRegister.tableStructureService.getWeekdayMask();
    const wdIdx = weekDayMask.indexOf(dayStructure.day_of_week);

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
    const left_ = left + (wdIdx / weekDayMask.length) * (right - left);
    const right_ = left + ((wdIdx + 1) / weekDayMask.length) * (right - left);
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

  //// ACTIONS (unabh??ngig von STATE!)
  _selectAllPlannerBlockOfCurrentBlockId() {
    // add selected-class to all "boxes" belonging to this block
    Array.from(
      document.querySelectorAll(`.planner-block--${this._curBlockId}`)
    ).forEach((el) => el.classList.add("selected"));
  }
  _deselectAllBlocks() {
    // add selected-class to all "boxes" belonging to this block
    Array.from(document.querySelectorAll(`.planner-block.selected`)).forEach(
      (el) => el.classList.remove("selected")
    );
  }
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
      const { type } = this._serviceRegister.tableDataService.getBlockData(
        this._curBlockId
      );
      if (this._serviceRegister.tableDataService.isBlockTypeLocked(type))
        return this._stateIdle;

      this._setMenuReferencePoint(event);

      this._selectAllPlannerBlockOfCurrentBlockId();

      return this._stateBlockSelected;
    } else if (inDataRange) {
      const cellInfo = this.getCellInfo(x, y, target);
      // je nach Mausgeschwindigkeit schl??gt hier die Erfassung manchmal fehl, dann lassen wir den Schritt aus ;-)
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

    // bestimme den Kalenderwochen-Index des angeklickten KW-HeaderField ??ber classList-Eintrag 'planner-header-row-week--??'
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
  //// ACTIONS (unabh??ngig von STATE!)

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

    // Spezialbehandlung f??r rows: hier sind in Blocks die Zeilen nicht immer gleich hoch!
    // Daher: bestimmen der exakten Zeile ??ber Position und class-selector

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
