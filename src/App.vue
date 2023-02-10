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
        selection-color-valid="#0000FF0F"
        selection-color-invalid="#FF000030"
        :types="[
          {
            type: 'urlaub',
            data: {
              color: '#FFFF00',
              labels: ['Urlaub'],
            },
          },
          {
            type: 'anwendungsentwicklung',
            data: {
              color: '#E2EFDA',
              labels: ['Anwendungsentwicklung', 'AE'],
            },
          },
          {
            type: 'userhelpdesk',
            data: {
              color: '#F4B084',
              labels: ['User Help Desk', 'UHD'],
            },
          },
          {
            type: 'berufschule',
            data: {
              color: '#FEB0E8',
              labels: ['Berufschule', 'Schule'],
            },
          },
          {
            type: 'applikationsbetrieb',
            data: {
              color: '#FF3399',
              labels: ['Applikationsbetrieb'],
            },
          },
          {
            type: 'abschlussprojekt',
            data: {
              color: '#8EA9DB',
              labels: ['Abschlussprojekt', 'Projekt'],
            },
          },
          {
            type: 'backoffice',
            data: {
              color: '#FFEB9C',
              labels: ['Backoffice'],
            },
          },
          {
            type: 'personalmanagement',
            data: {
              color: '#2F75B5',
              labels: ['Personalmanagement', 'HR'],
            },
          },
          {
            type: 'projektmanagement',
            data: {
              color: '#FFF2CC',
              labels: ['Projektmanagement', 'PJM'],
            },
          },
          {
            type: 'einkauf_it_controlling_lizenzmanagement',
            data: {
              color: '#548235',
              labels: [
                'Einkauf, IT-Controlling, Lizenzmanagement',
                'Einkauf',
                'ECL',
              ],
            },
          },
          {
            type: 'it_security',
            data: {
              color: '#5B9BD5',
              labels: ['IT-Security'],
            },
          },
          {
            type: 'it_strategy',
            data: {
              color: '#BF8F00',
              labels: ['IT-Strategy'],
            },
          },
          {
            type: 'recht_compliance_managementsysteme',
            data: {
              color: '#7030A0',
              labels: ['Recht, Compliance und Managementsysteme', 'RCM'],
            },
          },
          {
            type: 'datenbanken_middleware_appliances',
            data: {
              color: '#FCE4D6',
              labels: ['Datenbanken, Middleware und Appliances', 'DMA'],
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
