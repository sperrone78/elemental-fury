# Project TODO (Priority Roadmap)

## P0 - Source of Truth, Death Handling, Safety
- [ ] Remove duplicated build artifacts in `public/js/js/**`; keep `js/**` as source, `public/**` as output only
- [ ] Centralize enemy death & drops in `Game.update()` via a `processEnemyDeath(enemy)` helper
- [ ] Replace in-loop `splice()` with mark-and-sweep (`shouldRemove` -> filter) across entities/effects

## P1 - Performance & Loop Quality
- [ ] Add spatial partitioning (uniform grid) for collisions (enemy<->projectile, player<->enemy)
- [ ] Introduce object pooling for particles/projectiles/effects
- [ ] Fixed timestep update (accumulator) with rAF render; decouple update from frame rate
- [ ] Multi-canvas layering: background | gameplay | UI

## P2 - Palette & Aura Config
- [ ] Move palette to `Constants` and use everywhere (single source)
- [ ] Wire `palette-tuner.html` to import/export JSON to update palette in `Constants`
- [ ] Add aura tuning flags in `Constants` (intensity, particle counts, max orbits)

## P3 - Tooling, Tests, and CI
- [ ] ESLint + Prettier; enforce CI check on PR
- [ ] Add JSDoc types / `// @ts-check` for core entities & systems
- [ ] Unit tests: aura blend math; death->drop pipeline invariants
- [ ] GitHub Actions: build on PR; deploy preview; tag-based prod deploy

## P4 - Docs
- [ ] Update `GAME_SYSTEMS.md` with lifecycle (create->update->mark->sweep) and single-owner rule for death & drops
- [ ] Add Performance Playbook section (spatial grid, pooling, draw culling)

---

## Work Log
- 2025-08-08: Created roadmap; next up: remove `public/js/js/**` and add centralized death processing.
