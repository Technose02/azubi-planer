import Service from "./Service";

class CacheService extends Service {
  constructor() {
    super();
  }

  _caches = {
    entityArraysForYearCache: new Map(),
  };

  _init() {}

  // Hash-Generators
  _hashKeyGeneratorFromNumber = (n) => Number(n);

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
}

const createCacheService = function () {
  return new CacheService();
};

export default createCacheService;
