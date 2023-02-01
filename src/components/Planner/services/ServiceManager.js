import createCalenderService from "./CalenderService";
import createTableStructureService from "./TableStructureService";
import createTableDataService from "./TableDataService";
import createCacheService from "./CacheService";
import createTableStateService from "./TableStateService";

/*
Der Service Manager hält alle Service-Instanzen in seinem Service-Register. Ferner kanalisiert
er die Instanziierung der benötigten Service-Konfiguration über die Init-Function.
Er stellt sicher, dass jede Service instanz Zugriff auf das Register hat und ist *der einzige*
reactive-Anteil, der zwischen den Komponenten geteilt wird
*/

const initServices = function (year, dataHeaderRows) {
  // Service-Instanzen erstellen
  const calenderService = createCalenderService();
  const tableStructureService = createTableStructureService(year);
  const tableDataService = createTableDataService(dataHeaderRows);
  const cacheService = createCacheService();
  const tableStateService = createTableStateService();
  //...

  // Service-Instanzen registrieren (1: Register aufbauen)
  const serviceRegister = {
    calenderService,
    tableStructureService,
    tableDataService,
    cacheService,
    tableStateService,
    //...
  };

  // Service-Instanzen registrieren (2: Register zuweisen)
  calenderService._serviceRegister = serviceRegister;
  tableStructureService._serviceRegister = serviceRegister;
  tableDataService._serviceRegister = serviceRegister;
  cacheService._serviceRegister = serviceRegister;
  tableStateService._serviceRegister = serviceRegister;
  //...

  // Instanzen initialisieren rufen. Hier ist ggf. eine feste Reihenfolge einzuhalten
  serviceRegister.calenderService._init();
  serviceRegister.tableDataService._init();
  serviceRegister.cacheService._init();
  serviceRegister.tableStructureService._init(); // benötigt in init: calenderService, cacheService
  serviceRegister.tableStateService._init(); // benötigt in init: tableStateService

  return serviceRegister;
};

export default initServices;
