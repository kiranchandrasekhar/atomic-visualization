/**
 * @class
 * @classdesc Base class all algorithm implementations should inherit from.
 */
class Base {
    /**
     * Generate a hash from a string that is suitable to use as a seed for any
     * of the PRNG's that inherit from this.
     *
     * @param {string} str
     * @returns {Function}
     */
    static _xfnv1a(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 16777619);
        }
        return () => {
            h += h << 13;
            h ^= h >>> 7;
            h += h << 3;
            h ^= h >>> 17;
            return (h += h << 5) >>> 0;
        };
    }
}
export default Base;
//# sourceMappingURL=Base.js.map