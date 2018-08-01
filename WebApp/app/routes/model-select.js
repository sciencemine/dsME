import Ember from 'ember';
import ENV from 'dsME/config/environment';

const { inject: { service } } = Ember;
const { APP: { cdnAPI } } = ENV;

export default Ember.Route.extend({
  modelService: service(),
  notify: service(),

  model() {
    return Ember.$.getJSON(`${cdnAPI}/dsm`)
    .then((data) => {
      return Ember.RSVP.Promise.all(data.map((dsm) => {
        return Ember.$.getJSON(`${cdnAPI}/dsm/${dsm._id}`)
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
