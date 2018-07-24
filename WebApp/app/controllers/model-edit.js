import Ember from 'ember';

export default Ember.Controller.extend({
    virtualModel: null,
    attributePanelExpanded: true,
    propertiesPanelExpanded: true,
    configurationPanelExpanded: true,
    panelChanged: Ember.computed('attributePanelExpanded',
            'propertiesPanelExpanded', 'configurationPanelExpanded', function() {
                return true;
    }),
    selectedCE: null,
    actions: {
        attributeTabClick() {
            this.toggleProperty('attributePanelExpanded');
        },
        propertiesTabClick() {
            this.toggleProperty('propertiesPanelExpanded');
        },
        configurationTabClick() {
            this.toggleProperty('configurationPanelExpanded');
        }
    }
});
