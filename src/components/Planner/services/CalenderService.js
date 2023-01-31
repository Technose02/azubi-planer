import Service from "./Service";

class CalenderService extends Service {
  MONTH_NAMES = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  WEEKDAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // Simple Iterator-Methode um den Folge-Tag zu ermitteln. Die Korrektur beim Monats-Überlauf
  // erfolgt intern (getestet!)
  _nextDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  constructor() {
    super();
  }

  _init() {}

  // STATELESS
  createDaysOfYearList(year) {}

  determineFirstDayForTable(year) {
    let firstDayForTable = new Date(year, 0, 1);

    // Date::getDay gibt den Wochentag als Zahl (0..6) zurück
    //              der Wert 0 steht dabei für Sonntag!!!
    const weekDayOfFirstDay = firstDayForTable.getDay();
    if (weekDayOfFirstDay !== 1) {
      // Kein Montag, also zu übernehmende Tage aus Vorjahr ermitteln:
      //    0: Sonntag  -> 6 Tage -> 26.12 - 31.12
      //    6: Samstag  -> 5 Tage -> 27.12 - 31.12
      //                   ...
      //    2: Dienstag -> 1 Tag  -> 31.12
      //
      // -> x-> (x + 6) % 7 ergibt Anzahl der Tage, die rückblickend hinzuzuziehen sind
      const numberOfDaysFromPreviousYear = (weekDayOfFirstDay + 6) % 7;
      firstDayForTable = new Date(
        year - 1,
        11,
        31 - numberOfDaysFromPreviousYear + 1
      );
    }
    return firstDayForTable;
  }

  determineLastDayForTable(year) {
    let lastDayForTable = new Date(year, 11, 31);

    const weekDayOfLastDay = lastDayForTable.getDay();
    if (weekDayOfLastDay !== 0) {
      // Kein Sonntag, also zu übernehmende Tage aus Folgejahr ermitteln:
      //    1: Montag   -> 6 Tage -> 01.01 - 06.01
      //    2: Dienstag -> 5 Tage -> 01.01 - 05.01
      //                   ...
      //    6: Samstag  -> 1 Tag  -> 01.01
      //
      // -> x-> 7-x ergibt Anzahl der Tage, die aus dem Januar des Folgejahres hinzuzuziehen sind
      const numberOfDaysFromNextYear = 7 - weekDayOfLastDay;
      lastDayForTable = new Date(year + 1, 0, numberOfDaysFromNextYear);
    }
    return lastDayForTable;
  }

  distanceInDays(date1, date2) {
    if (date2 < date1) return -this.distanceInDays(date2, date1);
    if (!date2 > date1) return 0;
    let dist = 0;
    for (let d = date1; d < date2; d = this._nextDay(d)) dist += 1;
    return dist;
  }

  generateEntityArraysForYear(year) {
    const entityArrays = {
      daysInWeekAsIndicesOfDayStructure: [],
      daysInWeekAsDayOfYear: [],
      dayStructures: [],
      indicesOfDayStructure: [],
      daysInMonthAsIndicesOfDayStructure: [],
      daysInMonthAsDayOfYear: [],
    };

    // Behandlung eventuell zu berücksichtigender KW 0 und KW 53
    const firstDayForTable = this.determineFirstDayForTable(year);
    const lastDayForTable = this.determineLastDayForTable(year);

    // ist der 4.1 in der ersten Woche des Zeitraums?
    const janFourInFirstWeek =
      this.distanceInDays(firstDayForTable, new Date(year, 0, 4)) < 7;

    // For-Schleife über alle Tage des relevanten Bereichs
    // Offset für dayOfYear-Index berücksichtigen. Konvention: der erste Januar muss Index 0 haben
    let dayOfYearCounter = this.distanceInDays(
      new Date(year, 0, 1),
      firstDayForTable
    );

    // Offset für die Wochennummer korrekt setzen
    let weekCounter = janFourInFirstWeek ? 1 : 0;
    let subCounterWeeks = 0;
    let idx = 0;

    for (let d = firstDayForTable; d <= lastDayForTable; d = this._nextDay(d)) {
      let month = d.getMonth() + 1; // in Date ist der Monat als Index kodiert (0..11)
      let monthIdx = month;
      let dayInMonth = d.getDate();
      let dayOfYear = dayOfYearCounter++;
      if (weekCounter <= 1 && dayInMonth > 20) {
        month = 12;
        monthIdx = 0;
      } else if (weekCounter >= 52 && dayInMonth < 8) {
        month = 1;
        monthIdx = 13;
      }

      const dayStructure = {
        day_of_year: dayOfYear,
        in_month: month,
        day_of_month: dayInMonth,
        in_week: weekCounter,
        day_of_week: (d.getDay() + 6) % 7, // in den Entities sollen Wochen mit einem Montag und Index 0 beginnen
      };

      if (!entityArrays.daysInWeekAsIndicesOfDayStructure[weekCounter])
        entityArrays.daysInWeekAsIndicesOfDayStructure[weekCounter] = [];
      entityArrays.daysInWeekAsIndicesOfDayStructure[weekCounter].push(idx);

      if (!entityArrays.daysInMonthAsIndicesOfDayStructure[monthIdx])
        entityArrays.daysInMonthAsIndicesOfDayStructure[monthIdx] = [];
      entityArrays.daysInMonthAsIndicesOfDayStructure[monthIdx].push(idx);

      if (!entityArrays.daysInWeekAsDayOfYear[weekCounter])
        entityArrays.daysInWeekAsDayOfYear[weekCounter] = [];
      entityArrays.daysInWeekAsDayOfYear[weekCounter].push(dayOfYear);

      if (!entityArrays.daysInMonthAsDayOfYear[monthIdx])
        entityArrays.daysInMonthAsDayOfYear[monthIdx] = [];
      entityArrays.daysInMonthAsDayOfYear[monthIdx].push(dayOfYear);

      entityArrays.dayStructures.push(dayStructure);
      entityArrays.indicesOfDayStructure.push(idx);

      weekCounter += subCounterWeeks++ % 7 === 6;
      idx++;
    }

    return entityArrays;
  }
}

const createCalenderService = function () {
  return new CalenderService();
};

export default createCalenderService;
