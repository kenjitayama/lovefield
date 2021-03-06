Version: 2.0.61<br>
Publish date: 20150730<br>
Changes:
 - Converted all code paths to use native ES6 Map/Set when available.
 - Fixed a bug causing Firebase backend stopped working.
 - Fixed toSql() to correctly output queries with left outer join.
 - Fixed scoping bug in performance dashboard.
 - Fixed NULL handling problems in evaluators and predicates.
 - Improve B-Tree performance by using a more effective binary insert/remove
   algorithm.


Version: 2.0.60<br>
Publish date: 20150727<br>
Changes:
 - Modified not-nullable constraint to also mean not-undefinabale.
 - IndexRangeScanStep: Uses cheaper Index#get instead of Index#getRange whenever
   possible.
 - Ignore foreign key constraint violation if child column is set to null.
 - Make sure that cross-column TableBuilder#addUnique can't be used with
   nullable columns.
 - Various BTree optimizations (including get all records case).
 - Fixed case where trying to add an index with order lf.Order.DESC was being
   ignored (index was added with lf.Order.ASC).
 - Unified schema validation for SPAC and lf.query.Builder, and added missing
   checks.
 - Fixed TableBuilder toDbPayload() to handle ARRAY_BUFFER and nullable
   DATE_TIME correctly.
 - Fixed a bug in InMemoryUpdater#updateTableIndicesForRow which caused some
   indices to be inconsistent after a rollback.
 - Migrated various classes to use lf.structs.Map/Set, which is native Map/Set
   when available, or a pollyfil when not available.
 - Fixed behavior of aggregators MIN/MAX/AVG/SUM/COUNT/STDDEV for the case where
   nulls exist.


Version: 2.0.59<br>
Publish date: 20150701<br>
Changes:
 - Implemented RESTRICT foreign key constraints for all queries.
 - Fixed bug that caused a thrown lf.Exception to be unreadable when using
   lovefield.min.js.
 - Fixed bug that caused a nullable and unique index to allow multiple null
   keys.
 - Fixed default values of ARRAY\_BUFFER and OBJECT columns to be null, per
   spec.

Version: 2.0.58<br>
Publish date: 20150617<br>
Changes:
 - Change lf.Exception to be error-code based.
 - Foreign key declaration syntax change, and add more checks for the validity.
 - Consolidate top-level enums into one single file.
 - Gulp improvements: unify all gulp command lines, update gulp to 3.9.0, and
   fix various bugs.
 - Fix a bug that SPAC wrongly placed arraybuffer/object columns as not
   nullable.

Version: 2.0.57<br>
Publish date: 20150608<br>
Changes:
 - Fixed lovefield.min.js. It was missing lf.raw.BackStore public API.

Version: 2.0.56<br>
Publish date: 20150602<br>
Changes:
 - Fixed lovefield.min.js. It was missing various public API endpoints.
 - Added lovefield.d.ts TypeScript definitions in dist/ folder.

Version: 2.0.55<br>
Publish date: 20150526<br>
Changes:
 - Fixed typos
 - Fixed namespace leak in distributed package

Version: 2.0.54<br>
Publish date: 20150521<br>
Changes:
 - lovefield.min.js size reduced from 295Kb to 114Kb.
 - Fixed WebSQL backstore to work properly on Safari.
 - Fixed `gulp build` bug to properly order dependencies (topological sorting).

