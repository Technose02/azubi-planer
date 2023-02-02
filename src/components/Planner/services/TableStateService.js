import Service from "./Service";

class TableStateService extends Service {
  _calenderWeeksCollapsedStates;
  _year;

  constructor() {
    super();
  }

  _init() {
    const entityArrays =
      this._serviceRegister.tableStructureService.getEntityArrays();

    // Die Anzahl der enthaltenen Kalenderwochen erhalten wir z.B. aus der Länge des Array daysInWeekAsDayOfYear
    this._calenderWeeksCollapsedStates = Array(
      entityArrays.daysInWeekAsDayOfYear.length
    ).fill(false);
  }

  getCalenderWeekCollapsedStates() {
    return this._calenderWeeksCollapsedStates;
  }

  getCalenderWeekCollapsedState(calenderWeekNumber) {
    return this._calenderWeeksCollapsedStates[calenderWeekNumber];
  }

  setCalenderWeekCollapsedState(calenderWeekNumber, state) {
    this._calenderWeeksCollapsedStates[calenderWeekNumber] = state;
  }

  toggleCalenderWeekCollapseState(calenderWeekNumber) {
    if (this.getCalenderWeekCollapsedState(calenderWeekNumber)) {
      this.setCalenderWeekCollapsedState(calenderWeekNumber, false);
      return false;
    } else {
      this.setCalenderWeekCollapsedState(calenderWeekNumber, true);
      return true;
    }
  }
}

const createTableStateService = function () {
  return new TableStateService();
};

export default createTableStateService;
