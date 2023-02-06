class Interval {
  static createAutoCorrect(bound1, bound2) {
    if (bound1 <= bound2) return new Interval(bound1, bound2);
    return new Interval(bound2, bound1);
  }

  constructor(start, end) {
    if (end < start) {
      // entartet (start===end) "noch erlaubt"
      throw new Error(`invalid interval bounds: start: ${start}, end: ${end}`);
    }
    this.start = start;
    this.end = end;
  }

  intersects(other) {
    if (this.end < other.start || this.start > other.end) return false;
    return true;
  }

  includes(point) {
    return point >= this.start && point <= this.end;
  }
  // Not needed as of yet
  /*
  merge(other) {
    if (other.start < this.start) {
      if (other.end < this.start) {
        return false; // Intervall other liegt vor diesem
      }
      this.start = other.start;
      if (other.end <= this.end) {
        return true; // Ende von Intervall other liegt in diesem -> Merge
      }
      this.end = other.end;
      return true; // Von Intervall other "verschluckt"
    }
    if (other.start > this.end) {
      return false; // Intervall other liegt hinter diesem 
    }
    // Start von Intervall other liegt in diesem
    if (this.end > other.end) {
      return true; // Intervall other von diesem "geschluckt"
    }
    this.end = other.end;
    return true; // Ende von Intervall other liegt hinter diesem -> Merge
  }
  */
}

export default Interval;
