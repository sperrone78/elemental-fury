export class SpatialGrid {
    constructor(cellSize = 64) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    clear() {
        this.cells.clear();
    }

    _cellKey(cx, cy) {
        return `${cx},${cy}`;
    }

    _worldToCell(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return { cx, cy };
    }

    insertEnemy(enemy) {
        const { cx, cy } = this._worldToCell(enemy.x, enemy.y);
        const key = this._cellKey(cx, cy);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(enemy);
    }

    queryEnemiesInRadius(x, y, radius) {
        const minCx = Math.floor((x - radius) / this.cellSize);
        const maxCx = Math.floor((x + radius) / this.cellSize);
        const minCy = Math.floor((y - radius) / this.cellSize);
        const maxCy = Math.floor((y + radius) / this.cellSize);
        const results = [];
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const arr = this.cells.get(this._cellKey(cx, cy));
                if (arr && arr.length) results.push(...arr);
            }
        }
        return results;
    }
}


