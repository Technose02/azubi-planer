import Service from "./Service";

class CacheService extends Service {
  constructor() {
    super();
  }

  _caches = {
    entityArraysForYearCache: new Map(),
    dataGridColumnsForDayOfYearForCollapsedStateCache: new Map(),
    numberOfLogicalDataColumnsForCollapsedStateCache: new Map(),
  };

  _init() {}

  // Hash-Generators
  _hashKeyGeneratorFromNumber = (n) => Number(n);
  _hashKeyGeneratorFromArrayOfBooleans = (bools) =>
    bools.map((b) => (b ? "+" : "-")).join(".");

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
}

const createCacheService = function () {
  return new CacheService();
};

export default createCacheService;
