/**
 * @license
 * Copyright 2014 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
goog.provide('lf.index.KeyRange');
goog.provide('lf.index.SingleKeyRange');

goog.require('lf.index.Favor');

goog.forwardDeclare('lf.index.Index.SingleKey');



/**
 * A SingleKeyRange represents a key range of a single column, used for querying
 * various lf.index.Index implementations.
 * @constructor
 * @struct
 *
 * @param {?lf.index.Index.SingleKey} from The lower bound of this range. Null
 *     means  that there is no lower bound.
 * @param {?lf.index.Index.SingleKey} to The upper bound of this range. Null
 *     means that there is no upper bound.
 * @param {boolean} excludeLower Whether the lower bound should be excluded.
 *     Ignored if no lower bound exists.
 * @param {boolean} excludeUpper Whether the upper bound should be excluded.
 *     Ignored if no upper bound exists.
 */
lf.index.SingleKeyRange = function(from, to, excludeLower, excludeUpper) {
  /** @type {?lf.index.Index.SingleKey} */
  this.from = from;

  /** @type {?lf.index.Index.SingleKey} */
  this.to = to;

  /** @type {boolean} */
  this.excludeLower = !goog.isNull(this.from) ? excludeLower : false;

  /** @type {boolean} */
  this.excludeUpper = !goog.isNull(this.to) ? excludeUpper : false;
};


/**
 * A KeyRange is more generic than a SingleKeyRange since it can express a key
 * range of a cross-column key. The SingleKeyRange instances in the array
 * represent a key range for each dimension of the cross-column key range.
 * Example for a lf.index.Index.Key (x, y) a KeyRange of [[0, 100], [50, 70]]
 * represents the 2D area where 0 >= x >= 100 AND 50 <= y <=100.
 * @typedef {!Array<!lf.index.SingleKeyRange>}
 */
lf.index.KeyRange;


/**
 * A text representation of this key range, useful for tests.
 * Example: [a, b] means from a to b, with both a and be included in the range.
 * Example: (a, b] means from a to b, with a excluded, b included.
 * Example: (a, b) means from a to b, with both a and b excluded.
 * Example: [unbound, b) means anything less than b, with b not included.
 * Example: [a, unbound] means anything greater than a, with a included.
 * @override
 */
lf.index.SingleKeyRange.prototype.toString = function() {
  return (this.excludeLower ? '(' : '[') +
      (goog.isNull(this.from) ? 'unbound' : this.from) + ', ' +
      (goog.isNull(this.to) ? 'unbound' : this.to) +
      (this.excludeUpper ? ')' : ']');
};


/**
 * Finds the complement key range. Note that in some cases the complement is
 * composed of two disjoint key ranges. For example complementing [10, 20] would
 * result in [unbound, 10) and (20, unbound].
 * @return {!Array<!lf.index.SingleKeyRange>} The complement key ranges. An
 *     empty array will be returned in the case where the complement is empty.
 */
lf.index.SingleKeyRange.prototype.complement = function() {
  // Complement of lf.index.SingleKeyRange.all() is empty.
  if (goog.isNull(this.from) && goog.isNull(this.to)) {
    return [];
  }

  var keyRangeLow = null;
  var keyRangeHigh = null;

  if (!goog.isNull(this.from)) {
    keyRangeLow = new lf.index.SingleKeyRange(
        null, this.from, false, !this.excludeLower);
  }

  if (!goog.isNull(this.to)) {
    keyRangeHigh = new lf.index.SingleKeyRange(
        this.to, null, !this.excludeUpper, false);
  }

  return [keyRangeLow, keyRangeHigh].filter(function(keyRange) {
    return !goog.isNull(keyRange);
  });
};


/**
 * Reverses a keyRange such that "lower" refers to larger values and "upper"
 * refers to smaller values. Note: This is different than what complement()
 * does.
 * @return {!lf.index.SingleKeyRange}
 */
lf.index.SingleKeyRange.prototype.reverse = function() {
  return new lf.index.SingleKeyRange(
      this.to, this.from, this.excludeUpper, this.excludeLower);
};


/**
 * Determines if this range overlaps with the given one.
 * @param {!lf.index.SingleKeyRange} range
 * @return {boolean}
 */
lf.index.SingleKeyRange.prototype.overlaps = function(range) {
  var favor = lf.index.SingleKeyRange.compareKey_(
      this.from, range.from, true, this.excludeLower, range.excludeLower);
  if (favor == lf.index.Favor.TIE) {
    return true;
  }
  var left = (favor == lf.index.Favor.RHS) ? this : range;
  var right = (favor == lf.index.Favor.LHS) ? this : range;

  return goog.isNull(left.to) ||
      left.to > right.from ||
      (left.to == right.from && !left.excludeUpper && !right.excludeLower);
};


/**
 * @param {!lf.index.Index.SingleKey} key The upper bound.
 * @param {boolean=} opt_shouldExclude Whether the upper bound should be
 *     excluded. Defaults to false.
 * @return {!lf.index.SingleKeyRange}
 */
lf.index.SingleKeyRange.upperBound = function(key, opt_shouldExclude) {
  return new lf.index.SingleKeyRange(
      null, key, false, opt_shouldExclude || false);
};


/**
 * @param {!lf.index.Index.SingleKey} key The lower bound.
 * @param {boolean=} opt_shouldExclude Whether the lower bound should be
 *     excluded. Defaults to false.
 * @return {!lf.index.SingleKeyRange}
 */
lf.index.SingleKeyRange.lowerBound = function(key, opt_shouldExclude) {
  return new lf.index.SingleKeyRange(
      key, null, opt_shouldExclude || false, false);
};


/**
 * Creates a range that includes a single key.
 * @param {!lf.index.Index.SingleKey} key
 * @return {!lf.index.SingleKeyRange}
 */
lf.index.SingleKeyRange.only = function(key) {
  return new lf.index.SingleKeyRange(key, key, false, false);
};


/**
 * Creates a range that includes all keys.
 * @return {!lf.index.SingleKeyRange}
 */
lf.index.SingleKeyRange.all = function() {
  return new lf.index.SingleKeyRange(null, null, false, false);
};


/**
 * Returns if the range is all.
 * @return {boolean}
 */
lf.index.SingleKeyRange.prototype.isAll = function() {
  return goog.isNull(this.from) && goog.isNull(this.to);
};


/**
 * Returns if the range is only.
 * @return {boolean}
 */
lf.index.SingleKeyRange.prototype.isOnly = function() {
  return goog.isDefAndNotNull(this.from) &&
      this.from == this.to &&
      !this.excludeLower &&
      !this.excludeUpper;
};


/**
 * @param {!lf.index.Index.SingleKey} key
 * @return {boolean}
 */
lf.index.SingleKeyRange.prototype.contains = function(key) {
  var left = goog.isNull(this.from) || (key > this.from) ||
      (key == this.from && !this.excludeLower);
  var right = goog.isNull(this.to) || (key < this.to) ||
      (key == this.to && !this.excludeUpper);
  return left && right;
};


/**
 * Bound the range with [min, max] and return the newly bounded range.
 * @param {!lf.index.Index.SingleKey} min
 * @param {!lf.index.Index.SingleKey} max
 * @return {?lf.index.SingleKeyRange} When the given bound has no intersection
 *     with this range, or the range/bound is reversed, return null.
 */
lf.index.SingleKeyRange.prototype.getBounded = function(min, max) {
  // Eliminate out of range scenarios.
  if ((goog.isNull(this.from) && !this.contains(min)) ||
      (goog.isNull(this.to) && !this.contains(max))) {
    return null;
  }

  var range = new lf.index.SingleKeyRange(min, max, false, false);
  if (!goog.isNull(this.from) && this.from >= min) {
    range.from = this.from;
    range.excludeLower = this.excludeLower;
  }
  if (!goog.isNull(this.to) && this.to <= max) {
    range.to = this.to;
    range.excludeUpper = this.excludeUpper;
  }

  if (range.from > range.to ||
      (range.from == range.to && (range.excludeUpper || range.excludeLower))) {
    return null;
  }
  return range;
};


/**
 * @param {!lf.index.SingleKeyRange} range
 * @return {boolean}
 */
lf.index.SingleKeyRange.prototype.equals = function(range) {
  return this.from == range.from &&
      this.excludeLower == range.excludeLower &&
      this.to == range.to &&
      this.excludeUpper == range.excludeUpper;
};


/**
 * @param {boolean} a
 * @param {boolean} b
 * @return {boolean}
 */
lf.index.SingleKeyRange.xor = function(a, b) {
  return a ? !b : b;
};


/**
 * Directionally compare two keys.
 * Left hand side key comparison logic: null is considered left, exclusion
 * is considered right.
 * Right hand side key comparison logic: null is considered right, exclusion
 * is considered left.
 * @param {?lf.index.Index.SingleKey} l
 * @param {?lf.index.Index.SingleKey} r
 * @param {boolean} isLeftHandSide
 * @param {boolean=} opt_excludeL
 * @param {boolean=} opt_excludeR
 * @return {!lf.index.Favor}
 * @private
 */
lf.index.SingleKeyRange.compareKey_ = function(
    l, r, isLeftHandSide, opt_excludeL, opt_excludeR) {
  var Favor = lf.index.Favor;
  var excludeL = opt_excludeL || false;
  var excludeR = opt_excludeR || false;
  var flip = function(favor) {
    return isLeftHandSide ? favor :
        (favor == Favor.LHS) ? Favor.RHS : Favor.LHS;
  };

  // The following logic is implemented for LHS. RHS is achieved using flip().
  var tieLogic = function() {
    return !lf.index.SingleKeyRange.xor(excludeL, excludeR) ? Favor.TIE :
        excludeL ? flip(Favor.LHS) : flip(Favor.RHS);
  };

  if (goog.isNull(l)) {
    return !goog.isNull(r) ? flip(Favor.RHS) : tieLogic();
  }
  return goog.isNull(r) ? flip(Favor.LHS) :
      (l < r) ? Favor.RHS :
      (l == r) ? tieLogic() : Favor.LHS;
};


/**
 * Compares two ranges, meant to be used in Array#sort.
 * @param {!lf.index.SingleKeyRange} lhs
 * @param {!lf.index.SingleKeyRange} rhs
 * @return {!lf.index.Favor}
 */
lf.index.SingleKeyRange.compare = function(lhs, rhs) {
  var result = lf.index.SingleKeyRange.compareKey_(
      lhs.from, rhs.from, true, lhs.excludeLower, rhs.excludeLower);
  if (result == lf.index.Favor.TIE) {
    result = lf.index.SingleKeyRange.compareKey_(
        lhs.to, rhs.to, false, lhs.excludeUpper, rhs.excludeUpper);
  }
  return result;
};


/**
 * Returns a new range that is the minimum range that covers both ranges given.
 * @param {!lf.index.SingleKeyRange} r1
 * @param {!lf.index.SingleKeyRange} r2
 * @return {!lf.index.SingleKeyRange}
 */
lf.index.SingleKeyRange.getBoundingRange = function(r1, r2) {
  var r = lf.index.SingleKeyRange.all();
  if (!goog.isNull(r1.from) && !goog.isNull(r2.from)) {
    var favor = lf.index.SingleKeyRange.compareKey_(r1.from, r2.from, true);
    if (favor != lf.index.Favor.LHS) {
      r.from = r1.from;
      r.excludeLower = (favor != lf.index.Favor.TIE) ? r1.excludeLower :
          r1.excludeLower && r2.excludeLower;
    } else {
      r.from = r2.from;
      r.excludeLower = r2.excludeLower;
    }
  }
  if (!goog.isNull(r1.to) && !goog.isNull(r2.to)) {
    var favor = lf.index.SingleKeyRange.compareKey_(r1.to, r2.to, false);
    if (favor != lf.index.Favor.RHS) {
      r.to = r1.to;
      r.excludeUpper = (favor != lf.index.Favor.TIE) ? r1.excludeUpper :
          r1.excludeUpper && r2.excludeUpper;
    } else {
      r.to = r2.to;
      r.excludeUpper = r2.excludeUpper;
    }
  }
  return r;
};


/**
 * Intersects two ranges and return their intersection.
 * @param {!lf.index.SingleKeyRange} r1
 * @param {!lf.index.SingleKeyRange} r2
 * @return {?lf.index.SingleKeyRange} Returns null if intersection is empty.
 */
lf.index.SingleKeyRange.and = function(r1, r2) {
  if (!r1.overlaps(r2)) {
    return null;
  }

  var r = lf.index.SingleKeyRange.all();
  var favor = lf.index.SingleKeyRange.compareKey_(r1.from, r2.from, true);
  var left = (favor == lf.index.Favor.TIE) ? (r1.excludeLower ? r1 : r2) :
      (favor != lf.index.Favor.RHS) ? r1 : r2;
  r.from = left.from;
  r.excludeLower = left.excludeLower;

  // right side boundary test is different, null is considered greater.
  var right;
  if (goog.isNull(r1.to) || goog.isNull(r2.to)) {
    right = goog.isNull(r1.to) ? r2 : r1;
  } else {
    favor = lf.index.SingleKeyRange.compareKey_(r1.to, r2.to, false);
    right = (favor == lf.index.Favor.TIE) ? (r1.excludeUpper ? r1 : r2) :
        (favor == lf.index.Favor.RHS) ? r1 : r2;
  }
  r.to = right.to;
  r.excludeUpper = right.excludeUpper;
  return r;
};
