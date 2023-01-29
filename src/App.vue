<script>
import Planner from "./components/Planner/Planner.vue";
import PlannerEntry from "./components/Planner/PlannerEntry.vue";

export default {
  components: {
    Planner,
    PlannerEntry,
  },
};
</script>

<template>
  <header>
    <h1>Planungsübersicht</h1>
  </header>

  <main>
    <div class="planner-container">
      <planner
        :rows="[
          { title: 'Farina Fachinformatikerin', key: 'ffarina' },
          { title: 'Ingo Ingenial', key: 'iingo' },
          { title: 'Sebastian Software', key: 'ssebastian' },
          { title: 'Vigo Virtuell', key: 'vvigo' },
          { title: 'Danzo Daten', key: 'ddanzo' },
          { title: 'Ilse Inzidenz', key: 'iilse' },
          { title: 'Dennis Decrypter', key: 'ddennis' },
        ]"
        :year="2023"
      >
        <planner-entry
          :row-keys="['ffarina', 'ssebastian', 'iingo']"
          :start-date="new Date(2023, 1, 1)"
          :end-date="new Date(2023, 1, 28)"
          color="#0FF"
          >Anwendungsentwicklung</planner-entry
        >
        <planner-entry
          :row-keys="['vvigo', 'ddanzo', 'iilse']"
          :start-date="new Date(2023, 0, 30)"
          :end-date="new Date(2023, 1, 19)"
          color="#FF0"
          >Berufschule</planner-entry
        >
        <planner-entry
          :row-keys="['ddennis']"
          :start-date="new Date(2023, 1, 1)"
          :end-date="new Date(2023, 3, 30)"
          color="#9BE"
          >Abschlussprojekt</planner-entry
        >
      </planner>
    </div>
  </main>
</template>

<style scoped>
h1 {
  display: inline-block;
  margin-bottom: 2rem;
}

.planner-container {
  width: 100%;
  margin: 0 auto;
}
</style>
