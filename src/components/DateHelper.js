const weekDayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const monthNames = [
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

const table_data = (year, column_offset) => {
  const res = {
    table_data: {
      months: [],
      weeks: [],
    },

    days: [],

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
        res.days.push({
          day_of_year: d,
          day_of_month: dm,
          day_of_week: weekDayNames[weekDay],
          in_month: m + 1 /* offset damit Januar === 1 etc. */,
          in_week: w,
          style_: `grid-column: ${d + column_offset} / ${
            d + column_offset + 1
          };`,
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

const weeksForRender = (table_data, column_offset) => {
  const weeks = [];
  table_data.weeks.forEach((_, idx) => {
    const days = table_data.weeks[idx];
    const week_number = table_data.week_0 ? idx : idx + 1;
    const week_name =
      week_number >= 1 && week_number <= 53
        ? `KW ${week_number.toString().padStart(2, "0")}`
        : "";
    weeks.push({
      name: week_name,
      style_: `grid-column: ${days[0] + column_offset} / ${
        days.at(-1) + column_offset + 1
      };`,
    });
  });
  return weeks;
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
    daysForRender: td.days,
    monthNames: monthNames,
    weeksForRender: weeksForRender(td.table_data, column_offset),
    dayOfYearFromDate: dayOfYearFromDate.bind(td.table_data),
  };
};

export default {
  init,
};
