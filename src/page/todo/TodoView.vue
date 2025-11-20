<template>
  <div class="todo-view">
    <TodoGamification />
  </div>
</template>

<script>
import TodoGamification from '@/page/todo/TodoGamification.vue'

export default {
  name: 'TodoView',
  components: {
    TodoGamification
  }
}
</script>

<style scoped>
.todo-view {
  width: 100%;
  height: 100%;
  background: var(--bg-body);
  padding: 0;
  margin: 0;
}

/* Ensure the view takes full space */
.todo-view >>> .todo-gamification {
  padding: 16px;
  max-width: 100%;
  background: transparent;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .todo-view >>> .todo-gamification {
    padding: 8px;
  }
}
</style>

