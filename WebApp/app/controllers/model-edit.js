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
        }
    }
});
