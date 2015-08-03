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
goog.provide('lf.proc.QueryTask');

goog.require('goog.Promise');
goog.require('lf.TransactionType');
goog.require('lf.cache.Journal');
goog.require('lf.proc.PhysicalQueryPlan');
goog.require('lf.proc.Task');
goog.require('lf.query.SelectContext');
goog.require('lf.service');



/**
 * A QueryTask represents a collection of queries that should be executed as
 * part of a single transaction.
 * @implements {lf.proc.Task}
 * @constructor
 * @struct
 *
 * @param {!lf.Global} global
 * @param {!Array<!lf.proc.TaskItem>} items
 */
lf.proc.QueryTask = function(global, items) {
  /** @protected {!lf.Global} */
  this.global = global;

  /** @private {!lf.BackStore} */
  this.backStore_ = global.getService(lf.service.BACK_STORE);

  /** @protected {!Array<!lf.query.Context>} */
  this.queries = items.map(function(item) {
    return item.context;
  });

  /** @private {!Array<!lf.proc.PhysicalQueryPlan>} */
  this.plans_ = items.map(function(item) {
    return item.plan;
  });

  /** @private {!lf.structs.Set<!lf.schema.Table>} */
  this.combinedScope_ = lf.proc.PhysicalQueryPlan.getCombinedScope(this.plans_);

  /** @private {!lf.TransactionType} */
  this.txType_ = this.detectType_();

  /** @private {!goog.promise.Resolver.<!Array<!lf.proc.Relation>>} */
  this.resolver_ = goog.Promise.withResolver();
};


/**
 * @return {!lf.TransactionType}
 * @private
 */
lf.proc.QueryTask.prototype.detectType_ = function() {
  var txType = this.queries.some(
      function(query) {
        return !(query instanceof lf.query.SelectContext);
      }) ? lf.TransactionType.READ_WRITE : lf.TransactionType.READ_ONLY;
  return txType;
};


/** @override */
lf.proc.QueryTask.prototype.exec = function() {
  var journal = new lf.cache.Journal(this.global, this.combinedScope_);
  var results = [];

  var remainingPlans = this.plans_.slice();

  /** @return {!IThenable} */
  var sequentiallyExec = goog.bind(function() {
    var plan = remainingPlans.shift();
    if (plan) {
      var queryContext = this.queries[results.length];
      return plan.getRoot().exec(journal, queryContext).then(
          function(relations) {
            results.push(relations[0]);
            return sequentiallyExec();
          });
    }
    return goog.Promise.resolve();
  }, this);

  return sequentiallyExec().then(goog.bind(function() {
    var tx = this.backStore_.createTx(this.txType_, journal);
    return tx.commit();
  }, this)).then(goog.bind(function() {
    this.onSuccess(results);
    return results;
  }, this), goog.bind(function(e) {
    journal.rollback();
    throw e;
  }, this));
};


/** @override */
lf.proc.QueryTask.prototype.getType = function() {
  return this.txType_;
};


/** @override */
lf.proc.QueryTask.prototype.getScope = function() {
  return this.combinedScope_;
};


/** @override */
lf.proc.QueryTask.prototype.getResolver = function() {
  return this.resolver_;
};


/** @override */
lf.proc.QueryTask.prototype.getId = function() {
  return goog.getUid(this);
};


/** @override */
lf.proc.QueryTask.prototype.getPriority = goog.abstractMethod;


/**
 * Executes after all queries have finished successfully. Default implementation
 * is a no-op. Subclasses should override this method as necessary.
 * @param {!Array<!lf.proc.Relation>} results The results of all queries run by
 *     this task.
 * @protected
 */
lf.proc.QueryTask.prototype.onSuccess = function(results) {
  // Default implementation is a no-op.
};
