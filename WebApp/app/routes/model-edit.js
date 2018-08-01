import Ember from 'ember';
import ENV from 'dsME/config/environment';

const { inject: { service } } = Ember;
const { APP: { cdnAPI } } = ENV;

export default Ember.Route.extend({
  modelService: service(),
  visData: service(),
  notify: service(),

  model(params) {
    return Ember.$.getJSON(`${cdnAPI}/dsm/${params.id}`)
    .then((data) => {
      return Ember.RSVP.Promise.all(Object.keys(data.ce_set).map((ceID) => {
        return Ember.$.getJSON(`${cdnAPI}/ce/${ceID}`)
        .then((ce) => {
          data.ce_set[ceID].ce = ce;
        })
        .catch((e) => {
          throw e;
        });
      }))
      .then(() => {
        return data;
      })
      .catch((e) => {
        this.transitionTo('model-select');
      })
    })
    .catch(() => {
      this.transitionTo('modelSelect');
    })
  },
  addCEs(controller) {
    let cesToAdd = controller.get('cesToAdd');
    // push all the ces into the db. after they are done update the keys in
    // the model
    Promise.all(Object.keys(cesToAdd).map((ceToAddId) => {
      let ceToAdd = cesToAdd[ceToAddId];

      return Ember.$.post(`${cdnAPI}/ce`, JSON.stringify(ceToAdd))
      .then((res) => {
        // need to query the db for the ce and then put it in the model
        return {
          oldID: ceToAddId,
          newID: res._id
        };
      })
      .catch(console.error);
    }))
    .then((ids) => {
      // an array of resultant ids is returned after the new ces are added to
      // the db
      let ceMap = { };
      ids.forEach((ceID) => {
        ceMap[ceID.oldID] = ceID.newID;
      });
      // go through each part of the dsm that has ces in it and replace old ones
      // with the new ones
      let vm = controller.get('virtualModel');
      // replace idle_backgrouns
      // replace video_select_backgrounds
      // replace ce_set
      Promise.all(Object.keys(vm.ce_set).map((ceID) => {
        if (ceID in ceMap) {
          return Ember.$.get(`${cdnAPI}/ce/${ceMap[ceID]}`)
          .then((dbCE) => {
            // this is the ce in the database with the assets replaced.
            // can be directly inserted into the virtualModel
            // update ceToAdd to the result of the query
            // rebuild the new ce
            let oldCE = controller.get(`virtualModel.ce_set.${ceID}`);
            let newCE = {
              id: dbCE._id,
              ce: dbCE,
              attributes: oldCE.attributes,
              // we have to update the old relationships since they use old id
              relationships: oldCE.relationships
            }
            controller.set(`virtualModel.ce_set.${dbCE._id}`, newCE);
            delete controller.get('virtualModel.ce_set')[ceID];
            delete controller.get('cesToAdd')[ceID];
          })
          .catch(console.error);
        }
      }))
      .then(() => {
        // update the relations now that all the ces have been replaced
        for (let ceID in (vm = controller.get('virtualModel')).ce_set) {
          let ce = vm.ce_set[ceID];
          console.log(ce)
          ce.relationships = ce.relationships.map((rel) => {
            let newRel = rel;
            if (rel.to in ceMap) {
              newRel.to = ceMap[rel.to];
            }
            if (rel.from in ceMap) {
              newRel.from = ceMap[rel.from];
            }
            return newRel
          });
        }
        controller.notifyPropertyChange('virtualModel');
      })
    })
    .catch(console.error);
  },
  setupController(controller, model) {
    this._super(controller, model);
    if (/* upload ce */ true) {
    setInterval((controller) => {
      let result = controller.getProperties('cesToAdd', 'cesToUpdate');
      // if there are ces to add send off requests to the server to add them
      if (Object.keys(result.cesToAdd).length !== 0) {
        this.addCEs(controller);
      }
      // if there are ces to update send off request to the server to update them
      if (result.cesToUpdate.length !== 0) {
        let newCEsToAdd = result.cesToUpdate.map((ce) => {
          return Ember.$.put(`${cdnAPI}/ce/${ce.id}`, {
            data: ce
          })
          .then((res) => {
            // update it in the model
          })
          .catch((err) => {
            return null;
          });
        });

        controller.set('cesToAdd', newCEsToAdd);
      }
    }, 5 * 1000, controller)
    }

    controller.setProperties({
      cesToAdd: { },
      cesToUpdate: [ ],
      virtualModel: model
    });
  }
});
