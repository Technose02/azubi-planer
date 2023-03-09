import { INTERNAL_ID_PREFIX } from "./services/Constants.js";

class DifferentialState {
  static _TYPE_ADD = "add";
  static _TYPE_UPDATE = "update";
  static _TYPE_DELETE = "delete";

  constructor(planner_view, blockData, description, type) {
    this._planner_view = planner_view;
    this._blockData = blockData;
    this._description = description;
    this._type = type;
  }

  get blockData() {
    return this._blockData.copy();
  }

  redo() {}
  undo() {}
}

class BlockAddedDiffState extends DifferentialState {
  constructor(planner_view, blockData) {
    super(
      planner_view,
      blockData,
      `block ${blockData.blockId} added`,
      DifferentialState._TYPE_ADD
    );
  }
  redo() {
    this._planner_view.addBlockData(this._blockData);
  }
  undo() {
    console.log(this);
    this._planner_view.deleteBlock(this._blockData.blockId);
  }
}

class BlockDeletedDiffState extends DifferentialState {
  constructor(planner_view, blockData) {
    super(
      planner_view,
      blockData,
      `block ${blockData.blockId} deleted`,
      DifferentialState._TYPE_DELETE
    );
  }
  redo() {
    this._planner_view.deleteBlock(this._blockData.blockId);
  }
  undo() {
    this._planner_view.addBlockData(this._blockData);
  }
}

class BlockUpdatedDiffState extends DifferentialState {
  _blockDataBefore;

  constructor(planner_view, blockData, blockDataBefore) {
    super(
      planner_view,
      blockData,
      `updated type of block ${blockData.blockId}`,
      DifferentialState._TYPE_UPDATE
    );
    this._blockDataBefore = blockDataBefore;
  }

  redo() {
    this._planner_view.deleteBlock(this._blockDataBefore.blockId);
    this._planner_view.addBlockData(this._blockData);
  }
  undo() {
    this._planner_view.deleteBlock(this._blockDataBefore.blockId);
    this._planner_view.addBlockData(this._blockDataBefore);
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

  pushBlockAddedDiffState(blockdata) {
    this._push(new BlockAddedDiffState(this._planner_view, blockdata));
  }

  pushBlockDeletedDiffState(block_data) {
    this._push(new BlockDeletedDiffState(this._planner_view, block_data));
  }

  pushBlockUpdatedDiffState(block_data_after, block_data_before) {
    this._push(
      new BlockUpdatedDiffState(
        this._planner_view,
        block_data_after,
        block_data_before
      )
    );
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
        deletions.push(ds.blockData.copy());
      } else if (ds._type === DifferentialState._TYPE_UPDATE) {
        updates.push(ds.blockData.copy());
      } else if (ds._type === DifferentialState._TYPE_ADD) {
        additions.push(ds.blockData.copy());
      } else {
        console.err("error: unknown differentialState has unknown type!");
      }
    }

    this._head = -1;
    this._stack = [];

    // clean internal deletions
    // Blöcke mit interner ID wurden im Rahmen der Transaktion erstellt. Sie sind
    // also nicht zu entfernen, sondern sollen gar nicht erst erstellt werden und
    // auch nicht verändert werden
    deletions
      .filter((d) => d.blockId.startsWith(INTERNAL_ID_PREFIX))
      .forEach((d) => {
        updates = updates.filter((u) => u.blockId !== d.blockId);
        additions = additions.filter((a) => a.blockId !== d.blockId);
      });
    deletions = deletions.filter(
      (d) => !d.blockId.startsWith(INTERNAL_ID_PREFIX)
    );
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
      .filter((u) => u.blockId.startsWith(INTERNAL_ID_PREFIX))
      .forEach((u) => {
        const idx = additions.findIndex((a) => a.blockId === u.blockId);
        if (idx >= 0) {
          additions[idx] = u;
        }
      });
    updates = updates.filter((u) => !u.blockId.startsWith(INTERNAL_ID_PREFIX));

    return {
      deletions,
      updates,
      additions,
    };
  }

  async apply(api = undefined) {
    const { deletions, updates, additions } = this._prepareTasks();
    console.log("deletions:", deletions);
    console.log("updates:", updates);
    console.log("additions:", additions);
    if (api) {
      const deleteTasks = [];
      deletions.forEach(function (blockData) {
        deleteTasks.push(api.delete(blockData.blockId));
      });

      const updateTasks = [];
      updates.forEach(function (blockData) {
        updateTasks.push(api.update(blockData));
      });

      const createTasks = [];
      additions.forEach(function (blockData) {
        createTasks.push(api.create(blockData));
      });

      await Promise.all(deleteTasks);
      await Promise.all(updateTasks);
      await Promise.all(createTasks);

      api.getAll().then((data) => this._planner_view.resetBlockData(data));
    }
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
