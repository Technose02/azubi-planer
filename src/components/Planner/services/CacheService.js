import Service from "./Service";

class CacheService extends Service {
  constructor() {
    super();
  }

  _caches = {
    entityArraysForYearCache: new Map(),
    dataGridColumnsForDayOfYearForCollapsedStateCache: new Map(),
    numberOfLogicalDataColumnsForCollapsedStateCache: new Map(),
    gridAssistantForCollapsedStateCache: new Map(),
    dataHeaderColumnObjectsForTextTesterCache: new Map(),
  };

  _init() {}

  // Hash-Generators
  _hashKeyGeneratorFromNumber = (n) => Number(n);
  _hashKeyGeneratorFromArrayOfBooleans = (bools) =>
    bools.map((b) => (b ? "+" : "-")).join(".");
  _hashKeyGeneratorFromDocElement = (element) => `${element}`;

  // CACHES

  // EntityArraysForYear
  saveEntityArraysForYear(year, cacheValue) {
    const hash = this._hashKeyGeneratorFromNumber(year);
    this._caches.entityArraysForYearCache.set(hash, cacheValue);
  }
  restoreEntityArraysForYear(year) {
    const hash = this._hashKeyGeneratorFromNumber(year);
    if (!this._caches.entityArraysForYearCache.has(hash)) return null; // es sollte ein falsy Wert sein, damit es sich leicht prüfen lässt
    return this._caches.entityArraysForYearCache.get(hash);
  }
  //

  // DataGridColumnsForDayOfYearForCollapsedState
  saveDataGridColumnsForDayOfYearForCollapsedState(
    calenderWeeksCollapsedState,
    cacheValue
  ) {
    const hash = this._hashKeyGeneratorFromArrayOfBooleans(
      calenderWeeksCollapsedState
    );
    this._caches.dataGridColumnsForDayOfYearForCollapsedStateCache.set(
      hash,
      cacheValue
    );
  }
  restoreDataGridColumnsForDayOfYearForCollapsedState(
    calenderWeeksCollapsedState
  ) {
    const hash = this._hashKeyGeneratorFromArrayOfBooleans(
      calenderWeeksCollapsedState
    );
    if (
      !this._caches.dataGridColumnsForDayOfYearForCollapsedStateCache.has(hash)
    )
      return null;
    return this._caches.dataGridColumnsForDayOfYearForCollapsedStateCache.get(
      hash
    );
  }
  //

  //NumberOfLogicalDataColumns
  saveNumberOfLogicalDataColumnsForCollapsedState(
    calenderWeeksCollapsedState,
    cacheValue
  ) {
    const hash = this._hashKeyGeneratorFromArrayOfBooleans(
      calenderWeeksCollapsedState
    );
    this._caches.numberOfLogicalDataColumnsForCollapsedStateCache.set(
      hash,
      cacheValue
    );
  }
  restoreNumberOfLogicalDataColumnsForCollapsedState(
    calenderWeeksCollapsedState
  ) {
    const hash = this._hashKeyGeneratorFromArrayOfBooleans(
      calenderWeeksCollapsedState
    );
    if (
      !this._caches.numberOfLogicalDataColumnsForCollapsedStateCache.has(hash)
    )
      return null;
    return this._caches.numberOfLogicalDataColumnsForCollapsedStateCache.get(
      hash
    );
  }
  //

  // GridAssistant
  saveGridAssistantForCollapsedState(calenderWeeksCollapsedState, cacheValue) {
    const hash = this._hashKeyGeneratorFromArrayOfBooleans(
      calenderWeeksCollapsedState
    );
    this._caches.gridAssistantForCollapsedStateCache.set(hash, cacheValue);
  }
  restoreGridAssistantForCollapsedState(calenderWeeksCollapsedState) {
    const hash = this._hashKeyGeneratorFromArrayOfBooleans(
      calenderWeeksCollapsedState
    );
    if (!this._caches.gridAssistantForCollapsedStateCache.has(hash))
      return null;
    return this._caches.gridAssistantForCollapsedStateCache.get(hash);
  }
  //

  // DataHeaderColumnObjects
  saveDataHeaderColumnObjectsForTextTesterElement(
    textTesterElement,
    cacheValue
  ) {
    const hash = this._hashKeyGeneratorFromDocElement(textTesterElement);
    this._caches.dataHeaderColumnObjectsForTextTesterCache.set(
      hash,
      cacheValue
    );
  }
  restoreDataHeaderColumnObjectsForTextTesterElement(textTesterElement) {
    const hash = this._hashKeyGeneratorFromDocElement(textTesterElement);
    if (!this._caches.dataHeaderColumnObjectsForTextTesterCache.has(hash))
      return null;
    return this._caches.dataHeaderColumnObjectsForTextTesterCache.get(hash);
  }
  //
}

const createCacheService = function () {
  return new CacheService();
};

export default createCacheService;
