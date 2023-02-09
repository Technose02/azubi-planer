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
        :types="[
          {
            type: 'urlaub',
            data: {
              color: '#999',
              labels: ['Urlaub'],
            },
          },
          {
            type: 'anwendungsentwicklung',
            data: {
              color: '#0FF',
              labels: ['Anwendungsentwicklung', 'AE'],
            },
          },
          {
            type: 'userhelpdesk',
            data: {
              color: '#AC8',
              labels: ['User Help Desk', 'UHD'],
            },
          },
          {
            type: 'berufschule',
            data: {
              color: '#FF0',
              labels: ['Berufschule', 'Schule'],
            },
          },
          {
            type: 'abschlussprojekt',
            data: {
              color: '#9BE',
              labels: ['Abschlussprojekt', 'Projekt'],
            },
          },
          {
            type: 'projektmanagement',
            data: {
              color: '#08F',
              labels: ['Projektmanagement', 'PJM'],
            },
          },
          {
            type: 'einkauf_it_controlling_lizenzmanagement',
            data: {
              color: '#048',
              labels: [
                'Einkauf, IT-Controlling, Lizenzmanagement',
                'Einkauf',
                'ECL',
              ],
            },
          },
        ]"
      >
        <planner-entry
          :start-date="new Date(this.year, 1, 1)"
          :end-date="new Date(this.year, 1, 28)"
          type="anwendungsentwicklung"
          :row-keys="['ffarina', 'ssebastian', 'iingo']"
        ></planner-entry>
        <planner-entry
          :start-date="new Date(this.year, 0, 23)"
          :end-date="new Date(this.year, 0, 31)"
          type="userhelpdesk"
          :row-keys="['ddennis', 'iingo']"
        ></planner-entry>
        <planner-entry
          :start-date="new Date(this.year, 0, 31)"
          :end-date="new Date(this.year, 1, 19)"
          type="berufschule"
          :row-keys="['vvigo', 'iilse']"
        ></planner-entry>
        <planner-entry
          :start-date="new Date(this.year, 1, 1)"
          :end-date="new Date(this.year, 3, 30)"
          type="abschlussprojekt"
          :row-keys="['ddennis']"
        ></planner-entry>
        <planner-entry
          :start-date="new Date(this.year, 0, 2)"
          :end-date="new Date(this.year, 0, 4)"
          type="projektmanagement"
          :row-keys="['ffarina']"
        ></planner-entry>
        <planner-entry
          :start-date="new Date(this.year, 11, 25)"
          :end-date="new Date(this.year, 11, 31)"
          type="einkauf_it_controlling_lizenzmanagement"
          :row-keys="['ffarina']"
        ></planner-entry>
        <planner-entry
          :start-date="new Date(this.year, 11, 25)"
          :end-date="new Date(this.year, 11, 30)"
          type="einkauf_it_controlling_lizenzmanagement"
          :row-keys="['iingo', 'iilse', 'ddennis']"
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
