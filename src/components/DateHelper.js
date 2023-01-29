const table_data = (year, column_offset) => {
  const res = {
    table_data: {
      months: [],
      weeks: [],
      days: [],
    },

    /* wenn week_0 === true:  es gibt eine 'KW0' und der Index des
                            Arrays entspricht dem 'KW-Name'
     wenn week_0 === false: das Array beginnt mit der KW1,
                            der Index des Arrays entspricht
                            dem 'KW-Name-1'
  */
    week_0: true,
  };

  let d = 0;
  let w = 0;

  res.table_data.weeks[w] = [];
  for (let m = 0; m < 12; m++) {
    res.table_data.months[m] = [];
    for (let dm = 1; dm <= 31; dm++) {
      let _date = new Date(year, m, dm);
      if (_date.getMonth() === m && _date.getDate() === dm) {
        const weekDay = _date.getDay();
        if (weekDay === 1 /* 0:So, 1:Mo etc. */) {
          // Es ist ein Montag, also beginnt eine neue Woche
          w += 1;
          res.table_data.weeks[w] = [];
        }
        d += 1;
        res.table_data.days.push({
          day_of_year: d,
          day_of_month: dm,
          day_of_week: weekDay,
          in_week: w,
          in_month: m,
        });
        res.table_data.weeks[w].push(d);
        res.table_data.months[m].push(d);
      }
    }
  }

  if (res.table_data.weeks[0].length === 0) {
    res.table_data.weeks.shift();
  }

  /* Konvention (EU): die 1.KW ist die, die den 4.Januar enthält */
  if (res.table_data.weeks[0].includes(4)) {
    res.table_data.week_0 = false;
  }

  return res;
};

const dayOfYearFromDate = function (date) {
  const month = date.getMonth(); /* 0,...,11 */
  const dayOfMonth = date.getDate(); /* 1,...,31 */
  return this.months[month][dayOfMonth - 1];
};

const init = (year, column_offset) => {
  const td = table_data(year, column_offset);
  return {
    table_data: td.table_data,
    monthNames: [
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
    ],
    weekDayNames: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    dayOfYearFromDate: dayOfYearFromDate.bind(td.table_data),
  };
};

export default {
  init,
};
