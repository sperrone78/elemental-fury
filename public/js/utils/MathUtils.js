// Mathematical utility functions
export class MathUtils {
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }
    
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    static normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }
    
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    static degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    
    static radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }
    
    static circleIntersect(x1, y1, r1, x2, y2, r2) {
        return this.distanceSquared(x1, y1, x2, y2) <= (r1 + r2) * (r1 + r2);
    }
    
    static pointInCircle(px, py, cx, cy, radius) {
        return this.distanceSquared(px, py, cx, cy) <= radius * radius;
    }
    
    static calculateXPRequirement(level) {
        return Math.floor(10 * Math.pow(level, 1.2));
    }
    
    static wrapAngle(angle) {
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;
    }
    
    static vector2(x, y) {
        return { x, y };
    }
    
    static addVectors(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }
    
    static subtractVectors(v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y };
    }
    
    static multiplyVector(v, scalar) {
        return { x: v.x * scalar, y: v.y * scalar };
    }
    
    static vectorLength(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
    
    static normalizeVector(v) {
        const length = this.vectorLength(v);
        if (length === 0) return { x: 0, y: 0 };
        return { x: v.x / length, y: v.y / length };
    }
}