export class SystemStatusManager {
  constructor() {
    this._status = new Map();
  }
  set(key, value) {
    this._status.set(key, value);
  }
  get(key) {
    return this._status.get(key);
  }
  update(entries = {}) {
    for (const [k, v] of Object.entries(entries)) this._status.set(k, v);
  }
  toJSON() {
    return Object.fromEntries(this._status.entries());
  }
}
