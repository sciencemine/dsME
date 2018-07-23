import Ember from 'ember';

const { inject: { service } } = Ember;

export default Ember.Route.extend({
  modelService: service(),
  visData: service(),
  notify: service(),
  cdnAPI: 'http://csdept26.mtech.edu:30123',
  
  model(params) {
    return Ember.$.getJSON(`${this.cdnAPI}/dsm/${params.id}`)
    .then((data) => {
      return data;
    })
    .catch(() => {
      this.transitionTo('modelSelect');
    })
  },
  setupController(controller, model) {
    this._super(controller, model);

    controller.set('virtualModel', model);
  }
});
