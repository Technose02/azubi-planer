class DifferentialState {
  constructor(planner_view, block_data, description) {
    this._planner_view = planner_view;
    this._block_data = block_data;
    this._description = description;
  }

  redo() {}
  undo() {}
}

class BlockAddedDiffState extends DifferentialState {
  constructor(planner_view, block_data) {
    super(planner_view, block_data, `block ${block_data.blockId} added`);
  }
  redo() {
    this._planner_view.addBlockData(this._block_data);
  }
  undo() {
    console.log(this);
    this._planner_view.deleteBlock(this._block_data.blockId);
  }
}

class BlockDeletedDiffState extends DifferentialState {
  constructor(planner_view, block_data) {
    super(planner_view, block_data, `block ${block_data.blockId} deleted`);
  }
  redo() {
    this._planner_view.deleteBlock(this._block_data.blockId);
  }
  undo() {
    this._planner_view.addBlockData(this._block_data);
  }
}

class BlockTypeUpdatedDiffState extends DifferentialState {
  constructor(planner_view, block_data) {
    super(
      planner_view,
      block_data,
      `updated type of block ${block_data.blockId}`
    );
  }
  redo() {
    this._planner_view.updateBlockType(
      this._block_data.blockId,
      this._block_data.newType
    );
  }
  undo() {
    this._planner_view.updateBlockType(
      this._block_data.blockId,
      this._block_data.oldType
    );
  }
}

class DifferentialStateManager {
  constructor(planner_view) {
    this._planner_view = planner_view;
    this._head = -1;
    this._stack = [];
  }

  _push(diffState) {
    if (this._head < this._stack.length - 1) {
      // head points to e previous state
      // -> truncate stack to this point before applying new state
      this._stack.splice(this._head + 1, this._stack.length - 1 - this._head);
    }
    this._stack.push(diffState);
    this._head = this._stack.length - 1;
  }

  pushBlockAddedDiffState(block_data) {
    this._push(new BlockAddedDiffState(this._planner_view, block_data));
  }

  pushBlockDeletedDiffState(block_data) {
    this._push(new BlockDeletedDiffState(this._planner_view, block_data));
  }

  pushBlockTypeUpdatedDiffState(block_data) {
    this._push(new BlockTypeUpdatedDiffState(this._planner_view, block_data));
  }

  rewind() {
    if (this._head >= 0) {
      this._stack[this._head].undo();
      this._head -= 1;
      return true;
    }
    return false;
  }

  forward() {
    if (this._head < this._stack.length - 1) {
      this._head += 1;
      this._stack[this._head].redo();
      return true;
    }
    return false;
  }

  print() {
    console.log(`-----\n`);
    this._stack.forEach((diffState, idx) => {
      console.log(
        `\t${idx}\t${diffState.description}${
          idx === this._head ? "\t[HEAD]" : ""
        }`
      );
    });
    console.log(`-----\n`);
  }
}

const createDifferentialStateManager = function (planner_view) {
  return new DifferentialStateManager(planner_view);
};

export default createDifferentialStateManager;
