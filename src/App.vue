<template>
    <div id="app">
        <router-view></router-view>
        <TourSteps />
    </div>
</template>

<script>
    import TourSteps from '@/components/TourSteps.vue'
    export default {
        name: 'app',
        components: { TourSteps },
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
