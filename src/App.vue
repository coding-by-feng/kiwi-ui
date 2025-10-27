<template>
    <div id="app">
        <router-view></router-view>
        <TourSteps :enabled="tourEnabled" />
        <HelpTourButton :visible="helpIconVisible" />
    </div>
</template>

<script>
    import TourSteps from '@/components/TourSteps.vue'
    import HelpTourButton from '@/components/HelpTourButton.vue'
    import { getStore, setStore } from '@/util/store'
    import kiwiConsts from '@/const/kiwiConsts'
    export default {
        name: 'app',
        components: { TourSteps, HelpTourButton },
        data() {
          return {
            tourEnabled: true,
            helpIconVisible: true
          }
        },
        mounted() {
          // Initialize defaults if missing
          try {
            const t = getStore({ name: kiwiConsts.CONFIG_KEY.TOUR_ENABLED })
            if (t == null) setStore({ name: kiwiConsts.CONFIG_KEY.TOUR_ENABLED, content: kiwiConsts.TOUR_SETTING.ENABLE, type: 'local' })
            const icon = getStore({ name: kiwiConsts.CONFIG_KEY.SHOW_TOUR_ICON })
            if (icon == null) setStore({ name: kiwiConsts.CONFIG_KEY.SHOW_TOUR_ICON, content: kiwiConsts.TOUR_SETTING.ENABLE, type: 'local' })
          } catch (_) {}
          this.syncTourFlags()
          try { window.addEventListener('tour-settings-updated', this.syncTourFlags) } catch (_) {}
        },
        beforeDestroy() {
          try { window.removeEventListener('tour-settings-updated', this.syncTourFlags) } catch (_) {}
        },
        methods: {
          syncTourFlags() {
            try {
              const t = getStore({ name: kiwiConsts.CONFIG_KEY.TOUR_ENABLED })
              this.tourEnabled = (t == null) ? true : (t === kiwiConsts.TOUR_SETTING.ENABLE || t === true || t === '1' || t === 'true')
              const icon = getStore({ name: kiwiConsts.CONFIG_KEY.SHOW_TOUR_ICON })
              this.helpIconVisible = (icon == null) ? true : (icon === kiwiConsts.TOUR_SETTING.ENABLE || icon === true || icon === '1' || icon === 'true')
            } catch (_) {}
          }
        }
    }
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
