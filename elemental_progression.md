# Elemental Progression Spec

## 1 · Core Rules

- Player gains **one level‑up choice** each time the XP bar fills.
- **Three random options** are offered at every level‑up.
- A run may contain **up to three distinct elements**.
  - Once three elements are locked in, further level‑ups only offer upgrades for those elements.
- **Element level cap:**
  - **Lv 1‑5** – free.
  - **Lv 6‑10** – requires the matching **Elemental Mastery Ring** (max two rings equipped).
- **Lv 10** unlocks **one Ultimate** (fusion of previously chosen elements).

---

## 2 · Element Catalogue  (Level 1 Effect ➜ Per‑Level Boost)

| Element   | Additional Attack     | Stat Boost (Lv +1 through level 5)   | Lv 6 Selection if Ring Equipped | Stat Boost (Level 7 - 10 ) |
| --------- | --------------------- | ----------------------------------------- | --------------------- | ------------------------- |
| Fire      | Fireball              | Faster fireball cooldown, +10% DPS to all attacks      | Inferno Wave   | +10% DPS + 10% Range on Inferno Wave |
| Water     | Water Globes (orbit around player)  | +1 globe (max 5), +10% Health       | Freezing Touch | + 10% Health +10% Extra damage taken by frozen enemies (stacking) |
| Earth     | Tremor (ongoing AOE field)                | Increased tremor range (+20px/level), +3 Armor       | Earthquake (10% chance per tremor + stuns)     | +3 armor +10% chance to start earthquake + 10% frequency to tremor |
| Lightning | Chain Lightning       | +1 chain (enhanced 200px hop range), +10% attack speed all attacks   | Thunder Storm    | +10% radius of storm clouds +10% duration of storm |
| Air       | Wind Blades (seeking projectiles) | +1 wind blade per level (1-5), +10% attack range all attacks | Tornado Vortex  | +1 extra tornado per spawn |

Combined Level 11 Ultimate to be added later

---

## 1.5 · Streamlined Level Up Flow

**First Time Mastery:**
- When all selected elements reach maximum level, shows "All Elements Mastered!" celebration screen
- Player acknowledges the achievement by clicking to continue

**Subsequent Level Ups:**
- After the first mastery message, all future level ups happen seamlessly
- No more repetitive upgrade screens interrupting gameplay
- Automatic progression allows uninterrupted enjoyment of mastered builds
- Level counter continues to increase in the background

This ensures players experience the satisfaction of mastery once, then enjoy smooth gameplay without interruptions.

---

## 2.5 · Detailed Ability Mechanics

### 💧 Water Globes
- **Level 1**: Creates 1 small blue orb that orbits the player (45px radius)
- **Level 2-5**: Adds +1 globe per level (max 5 globes at level 5)
- **Mechanics**: 
  - Globes orbit at constant speed with 5px radius
  - Deal 15 damage on enemy contact
  - Create blue splash particle effects on impact
  - Evenly distributed around player (360° / globe count)

### 🌪️ Wind Blades
- **Level 1-5**: Fires 1 to 5 wind blades per shot (equal to Air level)
- **Behavior**: Seeking, curved projectiles with gentle homing
- **Damage**: Each blade deals 80% of base weapon damage
- **Angles**: Randomized around the player per shot 
- **Coverage**: Wide coverage at higher levels due to multiple blades
- **Mechanics**:
  - Curved wind blades with airy trails
  - Each deals 80% of base weapon damage
  - Gentle homing toward nearby enemies
  - Randomized angles per shot create natural coverage

### 🌍 Tremor (Enhanced)
- **Level 1**: Creates ongoing AOE damage field around player (80px range)
- **Level 2-5**: Range increases by +20px per level (100px, 120px, 140px, 160px)
- **Mechanics**:
  - Pulses damage every 0.5 seconds to all enemies in range
  - Base damage: 18 per pulse, +2 per level above 1
  - Faint dashed circle shows effective range
  - Screen shake and earth particle effects when hitting enemies
  - Provides excellent area denial and positioning strategy

### ⚡ Chain Lightning
- **Enhanced Range**: Chain hops extended to 200px (1/4 map width)
- **Level Scaling**: 3 base chains + 1 per Lightning mastery level
- **Mechanics**:
  - Initial strike range: 150px from player
  - Each chain deals 80% of previous damage
  - 0.1 second delay between chain hops
  - Visual lightning bolt effects between targets

---

## 3 · Elemental Mastery Rings

- **Cost:** 50 Diamonds
- **Slots:** 2 rings max
- **Effect:** Unlocks **Lv 6‑10** for its element.
- **Unequip:** Can only equip and unequip between games, lose the ability to go past level 5 if ring not equipped

---

## 4 · Ultimate Fusion Table (Requires two contributing elements at level 10)
When we're ready to add this later:
| Combo             | Ultimate Name     | Short Description                  |
| ----------------- | ----------------- | ---------------------------------- |
| Fire + Air        | **Wildfire**      | Fast‑spreading burning ground      |
| Fire + Earth      | **Magma Surge**   | Lava wave, DoT + slow              |
| Fire + Water      | **Steam Burst**   | High‑pressure AoE, obscures vision |
| Air + Water       | **Tempest**       | Moving storm, pulls enemies        |
| Earth + Lightning | **Seismic Shock** | Quake + chain stun                 |
| Water + Lightning | **Thunder Storm** | Lightning rain around player       |

