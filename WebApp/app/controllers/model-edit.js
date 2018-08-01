import Ember from 'ember';
import ENV from 'dsME/config/environment';

export default Ember.Controller.extend({
    attributePanelExpanded: true,
    propertiesPanelExpanded: true,
    configurationPanelExpanded: true,
    panelChanged: Ember.computed('attributePanelExpanded',
            'propertiesPanelExpanded', 'configurationPanelExpanded', function() {
                return true;
    }),
    selectedCE: null,
    cesToAdd: null,
    cesToUpdate: null,
    virtualModel: null,
    actions: {
        attributeTabClick() {
            this.toggleProperty('attributePanelExpanded');
        },
        propertiesTabClick() {
            this.toggleProperty('propertiesPanelExpanded');
        },
        configurationTabClick() {
            this.toggleProperty('configurationPanelExpanded');
        },
        queueCEToAdd(ceObj, id) {
            this.set(`cesToAdd.${id}`, ceObj);
            let modelCE = {
                id: id,
                attributes: [ ], // empty by default
                relationships: [ ] // empty by default
            }
            this.set(`virtualModel.ce_set.${id}`, modelCE);
        },
        deleteCEFromModel(id) {
            delete this.get('virtualModel.ce_set')[id];
            let ceSet = this.get('virtualModel.ce_set');
            // remove all the ces that have relations to this node
            for (let ceID in ceSet) {
                let ce = ceSet[ceID];
                let relationships = ce.relationships.map((rel) => {
                        return rel.to === ceID ? null : rel;
                });
                console.log(relationships)
                this.set(`virtualModel.ce_set.${ceID}.relationships`, relationships);
            }
            this.notifyPropertyChange('virtualModel');
        },
        deleteEdgeFromModel(edge) {
            let fromCE = this.get(`virtualModel.ce_set.${edge.from}`);
            // need to delete the relationship from the given ce's relationships
            let newRelationships = fromCE.relationships.filter((rel) => {
                return (rel.to !== edge.to) || (rel.attribute !== edge.attribute);
            });
            this.set(`virtualModel.ce_set.${edge.from}.relationships`, newRelationships);
        },
        addRelationToModel(relObj) {
            delete relObj.id;
            this.get(`virtualModel.ce_set.${relObj.from}.relationships`).pushObject(relObj);
            // need to flag the dsm as changed
        }
    }
});
