import Ember from 'ember';

const { inject: { service } } = Ember;

export default Ember.Route.extend({
  modelService: service(),
  notify: service(),
  cdnAPI: 'http://csdept26.mtech.edu:30123',

  model() {
    return Ember.$.getJSON(`${this.cdnAPI}/dsm`)
    .then((data) => {
      return Ember.RSVP.Promise.all(data.map((dsm) => {
        return Ember.$.getJSON(`${this.cdnAPI}/dsm/${dsm._id}`)
        .then((data) => {
          return data;
        })
        .catch((err) => {
          this.get('notify').alert("Could not find model.", {
            radius: true,
            closeAfter: 10 * 1000
          });
        })
      }))
      .then((dsms) => {
        return dsms;
      })
    })
    .catch((err) => {
      this.get('notify').alert("Failed to query for Exhibit Models.", {
        radius: true,
        closeAfter: 10 * 1000
      });
    })
  }
});
