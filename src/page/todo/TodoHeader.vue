<template>
  <div class="header">
    <h2 class="header-title">{{ $t('todo.title') }}</h2>
    <div class="header-controls">
      <div class="import-export-controls">
        <KiwiButton type="primary" plain size="small" icon="el-icon-magic-stick" @click="$emit('demo')">
          {{ $t('todo.demo') }}
        </KiwiButton>

        <KiwiButton type="danger" plain size="small" icon="el-icon-delete" @click="$emit('clear')">
          {{ $t('todo.clearAll') }}
        </KiwiButton>
      </div>

      <div class="ranking-display">
        <div class="rank-badge" :class="getRankClass(currentRank.name)">
          <div class="rank-icon" @click="$emit('open-rank-image')" style="cursor: pointer;">
            <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="rank-image" />
          </div>
          <div class="rank-info">
            <div class="rank-name">{{ currentRank.name }}</div>
            <div class="rank-level">{{ $t('todo.rankLevel', { level: currentRank.level }) }}</div>
          </div>
          <div class="rank-details-icon">
            <i class="el-icon-info rank-info-icon" :title="$t('todo.viewRankingDetails')" @click="$emit('open-all-ranks')"></i>
          </div>
        </div>
        <div class="rank-progress">
          <div class="progress-info">
            <span class="progress-text">{{ totalPoints }} / {{ currentRank.nextThreshold || '∞' }}</span>
            <span class="progress-percentage" v-if="currentRank.nextThreshold">{{ Number(rankProgress).toFixed(1) }}%</span>
            <span class="progress-percentage max-rank" v-else>{{ $t('todo.maxRank') }}</span>
          </div>
          <KiwiProgress :percentage="rankProgress" :show-text="false" :stroke-width="6" :color="getRankColor(currentRank.name)" class="rank-progress-bar" />
          <div v-if="currentRank.nextRankName" class="next-rank-info">
            <span class="next-rank-text">{{ $t('todo.nextRank', { rank: currentRank.nextRankName }) }}</span>
          </div>
          <div v-else class="max-rank-info">
            <span class="max-rank-text">{{ $t('todo.maxRankReached') }}</span>
          </div>
        </div>
      </div>

      <div class="total-points">
        <span class="points-label">{{ $t('todo.totalPoints') }}:</span>
        <span class="points-badge">{{ totalPoints }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiProgress from '@/components/ui/KiwiProgress.vue'

export default {
  name: 'TodoHeader',
  components: { KiwiButton, KiwiProgress },
  props: {
    totalPoints: { type: Number, required: true },
    currentRank: { type: Object, required: true },
    rankProgress: { type: Number, required: true },
    getRankName: { type: Function, required: true },
    getRankClass: { type: Function, required: true },
    getRankImage: { type: Function, required: true },
    getRankColor: { type: Function, required: true }
  }
}
</script>
<style scoped>
.header {
  /* Transparent to allow parent glass effect */
  background: transparent;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  /* Inner glass effect for the badge */
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  transition: transform 0.2s, box-shadow 0.2s;
}

.rank-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rank-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  padding: 4px;
}

.rank-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.rank-info {
  display: flex;
  flex-direction: column;
}

.rank-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.rank-level {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5), 0 -1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 500;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .rank-badge {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .rank-icon {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* Import/export controls */
.import-export-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Ranking display */
.ranking-display {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.rank-progress {
  min-width: 180px;
  flex: 1;
  max-width: 300px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.progress-text {
  color: var(--text-secondary);
}

.progress-percentage {
  font-weight: 600;
  color: var(--color-primary);
}

.next-rank-info,
.max-rank-info {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

/* Total points badge */
.total-points {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
}

.points-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.points-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  box-shadow:
    var(--shadow-card),
    0 0 20px rgba(var(--color-primary-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: points-glow 2s ease-in-out infinite;
}

.points-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.6s ease;
}

.points-badge:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    var(--shadow-hover),
    0 0 30px rgba(var(--color-primary-rgb), 0.6),
    0 0 60px rgba(var(--color-primary-rgb), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.points-badge:hover::before {
  left: 100%;
}

@keyframes points-glow {
  0%, 100% {
    box-shadow:
      var(--shadow-card),
      0 0 20px rgba(var(--color-primary-rgb), 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      var(--shadow-card),
      0 0 30px rgba(var(--color-primary-rgb), 0.6),
      0 0 40px rgba(var(--color-primary-rgb), 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
}

/* Rank details icon */
.rank-details-icon {
  display: flex;
  align-items: center;
}

.rank-info-icon {
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
}

.rank-info-icon:hover {
  color: var(--color-primary);
}

/* Responsive styles */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .import-export-controls {
    justify-content: center;
    order: 3;
  }

  .ranking-display {
    flex-direction: column;
    align-items: stretch;
    order: 1;
  }

  .rank-badge {
    width: 100%;
    justify-content: center;
  }

  .rank-progress {
    max-width: 100%;
    width: 100%;
  }

  .total-points {
    justify-content: center;
    order: 2;
  }
}

@media (max-width: 600px) {
  .header-title {
    font-size: 1.3rem;
    text-align: center;
  }

  .rank-badge {
    padding: 8px 12px;
    gap: 10px;
  }

  .rank-icon {
    width: 40px;
    height: 40px;
  }

  .rank-name {
    font-size: 1rem;
  }

  .rank-level {
    font-size: 0.8rem;
  }

  .import-export-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 1.2rem;
  }

  .rank-badge {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .rank-icon {
    width: 36px;
    height: 36px;
  }

  .rank-info {
    text-align: center;
    flex: 1;
    min-width: 100px;
  }

  .rank-name {
    font-size: 0.95rem;
  }

  .total-points {
    padding: 6px 12px;
  }

  .points-label {
    font-size: 13px;
  }

  .points-badge {
    font-size: 16px;
  }

  .progress-info {
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .header-title {
    font-size: 1.1rem;
  }

  .rank-badge {
    padding: 6px 10px;
  }

  .rank-icon {
    width: 32px;
    height: 32px;
  }

  .rank-name {
    font-size: 0.9rem;
  }

  .rank-level {
    font-size: 0.75rem;
  }
}
</style>
