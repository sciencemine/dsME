/*******************************************************************************
 * COMPONENT:
 *  properties-panel
 *
 * DESCRIPTION:
 *  Properties panel that appears on the right of the screen
 *
 * PARAMETERS:
 *  onSubmitCallback - Callback for form submission
 *  updateModalCallback - Callback for updating the modal information
 *  data - The selected video
 *  attributes - The original attributes from the video
 *  relations - The original relation from the video
 *  config - The configuration data for generating the form
 *  vidKey - The key of the currently selected video
 *
 * AUTHOR:
 *  Michael Fryer
 *
 * DATE:
 *  June 5th, 2017
 ******************************************************************************/
import Ember from 'ember';

const { inject: { service } } = Ember;

export default Ember.Component.extend({
  classNames: [ "properties-panel" ],
  classNameBindings: [ "expanded:properties-panel-expand:properties-panel-collapse" ],
  id: "properties-panel",

  modelService: service(),

  /* Properties for the properties panel to know */
  prefix: "properties",
  path: ".videos",
  key: null,
  attributes: null,
  relations: null,

  didRender() {
    if (this.$('[data-toggle="propertiesTooltip"]').length !== 0) {
      this.$('[data-toggle="propertiesTooltip"]').tooltip({
        trigger: 'hover focus',
        placement: 'auto',
        delay: {
          show: '250',
          hide: '100'
        }
      });
    }
  },
  actions: {
    submitForm(data, path, key) {
      let newData = data;

      newData.attributes = this.get('attributes');
      newData.relations = this.get('relations');

      this.get('onSubmitCallback') (newData, this.get('path'), key);
    },
    doNothing() {

    }
  }
});
