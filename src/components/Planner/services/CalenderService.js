import Service from "./Service";

class CalenderService extends Service {
  constructor(year) {
    super();
    this.year = year;
  }
}

const createCalenderService = function (year) {
  return new CalenderService(year);
};

export default createCalenderService;
