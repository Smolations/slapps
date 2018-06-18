const _ = require('lodash');
const Action = require('./action');


/**
 *  @extends Action
 */
class SelectAction extends Action {
  get isInteractive() {
    return true;
  }

  get validationTemplate() {
    const actionTemplate = super.validationTemplate;
    const validAndIncluded = (opts) => {
      const isArray = Array.isArray(opts);
      if (!isArray) return false;
      const optsValid = opts.reduce((isValid, opt) => isValid && opt._className === 'SelectActionOption' && opt.isValid, true);
      if (!optsValid) return false;
      const firstOpt = opts[0];
      if (!firstOpt) return true;
      const firstOptIncluded = Boolean(_.find(this.options, firstOpt));
      return firstOptIncluded;
    };
    const template = {
      type:             t => t === 'select',
      name:             t => _.isString(t) && !_.isEmpty(t),
      value:            t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t) && t.length <= 2000),
      confirm:          c => _.isNil(c) || (c._className === 'ActionConfirmation' && c.isValid),
      data_source:      t => _.isString(t) && /^(?:static|users|channels|converstions|external)$/.test(t),
      min_query_length: n => _.isInteger(n) && n >= 0,
      options:          o => console.log(o) || Array.isArray(o) && o.reduce((isValid, opt) => isValid && opt._className === 'SelectActionOption' && opt.isValid, true),
      option_groups:    o => Array.isArray(o) && o.reduce((isValid, grp) => isValid && grp._className === 'SelectActionOptionGroup' && grp.isValid, true),
      selected_options: validAndIncluded,
    };
    return Object.assign({}, actionTemplate, template);
  }


  constructor({
    name = null,
    value = null,
    confirm = null,
    options = [],
    optionGroups = [],
    dataSource = 'static',
    selectedOptions = [],
    minQueryLength = 1,
    ...superOpts
  }) {
    const selectOpts = {
      type: 'select',
      name,
      value,
      confirm,
      options,
      option_groups: optionGroups,
      data_source: dataSource,
      selected_options: selectedOptions,
      min_query_length: minQueryLength,
      ...superOpts
    };
    super(selectOpts);
  }
}


module.exports = SelectAction;
