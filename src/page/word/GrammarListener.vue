<template>
  <div class="grammar-listener-removed">
    <div class="removed-notice">
      <i class="el-icon-warning-outline"></i>
      <h3>This feature has been removed</h3>
      <p>The Grammar Listener feature is no longer available.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GrammarListener'
}
</script>

<style scoped>
.grammar-listener-removed {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.removed-notice {
  text-align: center;
  color: var(--text-secondary);
}

.removed-notice i {
  font-size: 48px;
  color: var(--color-warning);
  margin-bottom: 16px;
}

.removed-notice h3 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.removed-notice p {
  margin: 0;
  color: var(--text-muted);
}
</style>
