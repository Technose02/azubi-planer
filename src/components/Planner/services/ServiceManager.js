import createCalenderService from "./CalenderService";
import createTableStructureService from "./TableStructureService";
import createTableDataService from "./TableDataService";

/*
Der Service Manager hält alle Service-Instanzen in seinem Service-Register. Ferner kanalisiert
er die Instanziierung der benötigten Service-Konfiguration über die Init-Function.
Er stellt sicher, dass jede Service instanz Zugriff auf das Register hat und ist *der einzige*
reactive-Anteil, der zwischen den Komponenten geteilt wird
*/

const initServices = function (year, dataHeaders) {
  const calenderService = createCalenderService(year);
  const tableStructureService = createTableStructureService();
  const tableDataService = createTableDataService(dataHeaders);
  //...

  const serviceRegister = {
    calenderService,
    tableStructureService,
    tableDataService,
    //...
  };

  calenderService._serviceRegister = serviceRegister;
  tableStructureService._serviceRegister = serviceRegister;
  tableDataService._serviceRegister = serviceRegister;
  //...

  return serviceRegister;
};

export default initServices;
