import { reactive } from "vue";
export const plannerStore = reactive({
  year: 0,
  column_offset: 0,
  row_offset: 0,
  row_keys: [],
  date_helper: {},
  block_data: {},
  addBlockedDataRange(row, daysBlockedStart, daysBlockedEnd) {
    // TODO
    console.log(
      `added blockedDataRange for row ${row} from days ${daysBlockedStart} to ${daysBlockedEnd}`
    );
  },
});
