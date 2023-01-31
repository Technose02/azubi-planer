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

  getCalenderWeeksCollapsedStates() {
    return this._calenderWeeksCollapsedStates;
  }

  getCalenderWeeksCollapsedState(calenderWeekNumber) {
    return this._calenderWeeksCollapsedStates[calenderWeekNumber];
  }
  setCalenderWeeksCollapsedState(calenderWeekNumber, state) {
    this._calenderWeeksCollapsedStates[calenderWeekNumber] = state;
  }
}

const createTableStateService = function () {
  return new TableStateService();
};

export default createTableStateService;
