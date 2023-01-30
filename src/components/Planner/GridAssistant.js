import Interval from "../Interval";

class GridAssistant {
  constructor(firstDataCol, lastDataCol, baseBlockSize) {
    this.firstDataCol = firstDataCol;
    this.lastDataCol = lastDataCol;
    this.baseBlockSize = baseBlockSize;
  }

  /* Erstellt eine Liste der zu füllenden Lücken anhand
     des Gitters und der übergebenen List von Block-Intervallen
  */
  determineGapsToFill(listOfDataBlockIntervals) {
    const gapsToFill = [];
    let k = this.firstDataCol;
    listOfDataBlockIntervals.forEach((i) => {
      if (k < i.start) {
        gapsToFill.push(new Interval(k, i.start));
      }
      k = i.end + 1;
    });
    const lastCol = this.lastDataCol;
    if (k < lastCol) {
      gapsToFill.push(new Interval(k, lastCol));
    }
    return gapsToFill;
  }

  /*
  Bestimmt die Block-Sizes für die Überbrückung des gebenen Intervalls
   */
  _determineGapBlockSizes(interval) {
    const gapBlockSizes = [];
    const iend = interval.end;
    let i = interval.start;
    let step = this.baseBlockSize - ((i - 1) % this.baseBlockSize);
    if (i + step > iend) {
      // step schon zu groß
      gapBlockSizes.push(iend - i);
      return gapBlockSizes;
    }
    gapBlockSizes.push(step);
    i += step;
    while (i + this.baseBlockSize <= iend) {
      gapBlockSizes.push(this.baseBlockSize);
      i += this.baseBlockSize;
    }
    if (i < iend) {
      gapBlockSizes.push(iend - i);
    }
    return gapBlockSizes;
  }

  /*
  Generiert aus einem Intervall des zu füllenden Bereichs
  eine Sequenz der zu wählenden Block-Ranges
   */
  generateBlockRangeSequenceFromInterval(interval) {
    const gapBlockSizes = this._determineGapBlockSizes(interval);
    const blockRangeSequence = [];
    let k = interval.start;
    gapBlockSizes.forEach((blocksize) => {
      blockRangeSequence.push([k, k + blocksize]);
      k += blocksize;
    });
    return blockRangeSequence;
  }
}

export default GridAssistant;
