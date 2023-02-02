<template>
  <header>
    <h1>Azubi-Blockplanung für {{ this.year }}</h1>
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
        :year="this.year"
      >
        <planner-entry
          :row-keys="['ffarina', 'ssebastian', 'iingo']"
          :start-date="new Date(this.year, 1, 1)"
          :end-date="new Date(this.year, 1, 28)"
          color="#0FF"
          name="Anwendungsentwicklung"
        ></planner-entry>
        <planner-entry
          :row-keys="['ddennis', 'iingo']"
          :start-date="new Date(this.year, 0, 23)"
          :end-date="new Date(this.year, 0, 31)"
          color="#AC8"
          name="UHD"
        ></planner-entry>
        <planner-entry
          :row-keys="['vvigo', 'ddanzo', 'iilse']"
          :start-date="new Date(this.year, 0, 30)"
          :end-date="new Date(this.year, 1, 19)"
          color="#FF0"
          name="Berufschule"
        ></planner-entry>
        <planner-entry
          :row-keys="['ddennis']"
          :start-date="new Date(this.year, 1, 1)"
          :end-date="new Date(this.year, 3, 30)"
          color="#9BE"
          name="Abschlussprojekt"
        ></planner-entry>
        <planner-entry
          :row-keys="['ffarina']"
          :start-date="new Date(this.year, 0, 2)"
          :end-date="new Date(this.year, 0, 4)"
          color="#08F"
          name="PJM"
        ></planner-entry>
        <planner-entry
          :row-keys="['ffarina']"
          :start-date="new Date(this.year, 11, 25)"
          :end-date="new Date(this.year, 11, 31)"
          color="#048"
          name="ECL"
        ></planner-entry>
        <planner-entry
          :row-keys="['iingo', 'iilse', 'ddennis']"
          :start-date="new Date(this.year, 11, 25)"
          :end-date="new Date(this.year, 11, 30)"
          color="#048"
          name="ECL"
        ></planner-entry>
      </planner>
    </div>
  </main>
</template>
<script>
import Planner from "./components/Planner/Planner.vue";
import PlannerEntry from "./components/Planner/PlannerEntry.vue";
export default {
  data() {
    return {
      year: 2023,
    };
  },
  components: {
    Planner,
    PlannerEntry,
  },
};
</script>

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
