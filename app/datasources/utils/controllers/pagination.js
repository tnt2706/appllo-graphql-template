const _ = require('lodash');

class Pagination {
  /**
   *
   * @param {Model} Model mongoose model.
   * @param {object} criteria query criteria.
   * @param {object} pagination limit and after cursor.
   * @param {object} sort the sort parameters.
   * @param {object} sort.field the sort field name.
   * @param {object} sort.order order. Either 1/-1 or asc/desc.
   * @param {object} select fields to return
   * @param {object} options Additional limit (min,max) and criteria merge options.
   *
   */
  constructor(Model, {
    criteria = {},
    pagination = {},
    sort = {},
    select,
    options = {},
  }) {
    this.promises = {};
    this.Model = Model;
    this.mergeOptions = options.mergeOptions || {};
    this.criteria = _.assignIn({}, criteria, this.mergeOptions);
    const { limit, after, skip } = pagination;
    this.getLimit(limit, options);
    this.after = after;
    this.skip = skip || 0;
    this.getSort(sort);
    this.select = select;
  }

  getSort(sort = { field: '_id', order: 'asc' }) {
    let { field, order } = _.assign({}, sort);
    order = order || 'asc';
    field = field || '_id';
    if (order === 'asc') {
      order = 1;
    } else if (order === 'desc') {
      order = -1;
    } else {
      order = parseInt(order, 10) === -1 ? -1 : 1;
    }
    this.sort = { field, order };
    this.sortValue = { [field]: order };
    if (field !== '_id') this.sortValue._id = order;
  }

  getLimit(limit, options = { def: 10, max: 200 }) {
    const { def, max } = _.assignIn({}, { def: 10, max: 200 }, options);
    let value = parseInt(limit, 10);
    if (!value || value < 1) {
      value = def;
    } if (value > max) {
      value = max;
    }
    this.limit = value;
  }

  /**
   * Gets the total number of documents found based criteria.
   *
   * @return {Promise}
   */
  getTotalCount() {
    const run = () => this.Model.countDocuments(this.criteria);
    if (!this.promises.count) {
      this.promises.count = run();
    }
    return this.promises.count;
  }

  getEndCursor() {
    const run = async () => {
      const edges = await this.getEdges();
      if (!edges.length) return null;
      return edges[edges.length - 1].cursor;
    };
    if (!this.promises.cursor) {
      this.promises.cursor = run();
    }
    return this.promises.cursor;
  }

  async hasNextPage() {
    const run = async () => {
      const criteria = await this.getQueryCriteria();
      const count = await this.Model.find(criteria)
        .select({ _id: 1 })
        .skip(this.first.value)
        .limit(1)
        .sort(this.sort.value)
        .collation(this.sort.collation)
        .countDocuments();
      return Boolean(count);
    };
    if (!this.promises.nextPage) {
      this.promises.nextPage = run();
    }
    return this.promises.nextPage;
  }

  /**
   * Gets the document edges for the current limit and sort.
   *
   * @return {Promise}
   */
  getEdges() {
    const run = async () => {
      const criteria = await this.getQueryCriteria();
      const docs = await this.Model.find(criteria, this.select)
        .sort(this.sortValue)
        .limit(this.limit);
      return docs.map((doc) => ({ node: doc, cursor: doc.id }));
    };
    if (!this.promises.edge) {
      this.promises.edge = run();
    }
    return this.promises.edge;
  }

  /**
   * @private
   * @param {string} _id
   * @param {object} fields
   * @return {Promise}
   */
  findCursorModel(_id, fields) {
    const run = async () => {
      const doc = await this.Model.findOne({ _id })
        .select(fields);
      if (!doc) throw new Error(`No record found for ID '${_id}'`);
      return doc;
    };
    if (!this.promises.model) {
      this.promises.model = run();
    }
    return this.promises.model;
  }

  async getCriteria() {
    const { order } = this.sort;
    const filter = _.assignIn({}, this.criteria, this.mergeOptions);
    if (this.skip) {
      return filter;
    }
    if (this.after) {
      const op = order === 1 ? '$gt' : '$lt';
      const selectedFields = `_id ${this.sort.field}`;
      const doc = await this.findCursorModel(this.after, selectedFields);
      if (this.sort.field) {
        filter[this.sort.field] = { [op]: doc[this.sort.field] };
      } else {
        filter._id = { [op]: doc._id };
      }
    }
    return filter;
  }

  async getDocs() {
    const run = async () => {
      const criteria = await this.getCriteria();
      const docs = await this.Model.find(criteria)
        .sort(this.sortValue)
        .skip(this.skip)
        .limit(this.limit)
        .select(this.select);
      return docs;
    };
    if (!this.promises.docs) {
      this.promises.docs = run();
    }
    return this.promises.docs;
  }

  /**
   * @private
   * @return {Promise}
   */
  getQueryCriteria() {
    const run = async () => {
      const { field, order } = this.sort;

      const filter = _.assignIn({}, this.criteria, this.mergeOptions);
      const limits = {};
      const ors = [];

      if (this.after) {
        let doc;
        const op = order === 1 ? '$gt' : '$lt';
        if (field === '_id') {
          // Sort by ID only.
          doc = await this.findCursorModel(this.after, { _id: 1 });
          filter._id = { [op]: doc.id };
        } else {
          doc = await this.findCursorModel(this.after, { [field]: 1 });
          limits[op] = doc.get(field);
          ors.push({
            [field]: doc.get(field),
            _id: { [op]: doc.id },
          });
          filter.$or = [{ [field]: limits }, ...ors];
        }
      }
      return filter;
    };
    if (!this.promises.criteria) {
      this.promises.criteria = run();
    }
    return this.promises.criteria;
  }
}

module.exports = Pagination;
