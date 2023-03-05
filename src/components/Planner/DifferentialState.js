class DifferentialState {
  static _TYPE_ADD = "add";
  static _TYPE_UPDATE = "update";
  static _TYPE_DELETE = "delete";

  static _copyString(data) {
    return `${data}`;
  }

  static _copyDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  constructor(planner_view, block_data, description, type) {
    this._planner_view = planner_view;
    this._block_data = block_data;
    this._description = description;
    this._type = type;
  }

  _copyData() {
    return {
      blockId: DifferentialState._copyString(this._block_data.blockId),
      type: DifferentialState._copyString(this._block_data.type),
      startDate: DifferentialState._copyDate(this._block_data.startDate),
      endDate: DifferentialState._copyDate(this._block_data.endDate),
      rowKeys: this._block_data.rowKeys.map((k) => k),
    };
  }

  redo() {}
  undo() {}
}

class BlockAddedDiffState extends DifferentialState {
  constructor(planner_view, block_data) {
    super(
      planner_view,
      block_data,
      `block ${block_data.blockId} added`,
      DifferentialState._TYPE_ADD
    );
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
    super(
      planner_view,
      block_data,
      `block ${block_data.blockId} deleted`,
      DifferentialState._TYPE_DELETE
    );
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
      `updated type of block ${block_data.blockId}`,
      DifferentialState._TYPE_UPDATE
    );
  }
  _copyData() {
    return {
      blockId: DifferentialState._copyString(this._block_data.blockId),
      oldType: DifferentialState._copyString(this._block_data.oldType),
      newType: DifferentialState._copyString(this._block_data.newType),
    };
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

  _prepareTasks() {
    let deletions = [];
    let updates = [];
    let additions = [];

    for (let i = 0; i <= this._head; i++) {
      const ds = this._stack[i];
      if (ds._type === DifferentialState._TYPE_DELETE) {
        deletions.push(ds._copyData());
      } else if (ds._type === DifferentialState._TYPE_UPDATE) {
        updates.push(ds._copyData());
      } else if (ds._type === DifferentialState._TYPE_ADD) {
        additions.push(ds._copyData());
      } else {
        console.err("error: unknown differentialState has unknown type!");
      }
    }

    console.log(updates);

    // clean internal deletions
    // Blöcke mit interner ID wurden im Rahmen der Transaktion erstellt. Sie sind
    // also nicht zu entfernen, sondern sollen gar nicht erst erstellt werden und
    // auch nicht verändert werden
    deletions
      .filter((d) => d.blockId.startsWith("internal-"))
      .forEach((d) => {
        updates = updates.filter((u) => u.blockId !== d.blockId);
        additions = additions.filter((a) => a.blockId !== d.blockId);
      });
    deletions = deletions.filter((d) => !d.blockId.startsWith("internal-"));
    ////

    // clean internal updates
    // Zunächst interessiert stets nur die letzte Änderung
    const updatedBlockIds = [...new Set(updates.map((u) => u.blockId))];

    updates = updatedBlockIds.map((id) => {
      const lastIndexOfUpdate = updates.map((u) => u.blockId).lastIndexOf(id);
      console.log(lastIndexOfUpdate);
      return updates[lastIndexOfUpdate];
    });

    updates
      .filter((u) => u.blockId.startsWith("internal-"))
      .forEach(
        (u) => (additions.find((a) => a.blockId === u.blockId).type = u.newType)
      );
    updates = updates.filter((u) => !u.blockId.startsWith("internal-"));

    console.log("deletions:", deletions);
    console.log("updates:", updates);
    console.log("additions:", additions);
  }

  apply() {
    const tasks = this._prepareTasks();
  }

  print() {
    console.log(`-----\n`);
    this._stack.forEach((diffState, idx) => {
      console.log(
        `\t${idx}\t${diffState._description}${
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
