export class ObjectPool {
    constructor(createFn, resetFn) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
    }

    acquire(...args) {
        const obj = this.pool.pop() || this.createFn();
        this.resetFn(obj, ...args);
        obj.shouldRemove = false;
        return obj;
    }

    release(obj) {
        this.pool.push(obj);
    }
}


