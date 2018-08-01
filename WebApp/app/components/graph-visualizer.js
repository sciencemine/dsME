import Ember from 'ember';
import vis from 'npm:vis';

const { inject: { service } } = Ember;

/*
  vis needs nodes and edges to connect things.
  i don't think i need a service to handle this.
  the nodes are the ces. the edges are the relations in the ces.
*/

export default Ember.Component.extend({
  notify: service(),
  modelService: service(),
  visData: service(),

  classNames: [ 'graph-visualizer' ],

  /* The actual graph */
  network: null,
  nodes: null,
  edges: null,

  /* For adding edges */
  fromVid: null,
  toVid: null,
  relationsLength: null,
  relationsConfig: null,

  /* Graph update data */
  addAttrToVideoData: null,
  editAttributeData: null,

  /* Editor states */
  removeEdgeMode: false,
  removeVideoMode: false,
  usePhysics: true,

  /* Video Attributes Information */
  videoAttributesId: null,
  videoAttributesHeading: null,
  videoAttributes: null,
  videoAttributesExpanded: true,

  shortenName(name) {
    return name.length > 15 ? name.substr(0, 11) + " ..." : name;
  },

  createRGBcolor(diff) {
    let red = diff > 0 ? 10 * diff : 0;
    let green = diff < 0 ? -10 * diff : 0;
    let blue = 127 - ((red + green) / 2);

    return "rgb(" + red + "," + green + "," + blue + ")";
  },
  updateVideoAttributes() {
    let modelData = this.get('modelService.modelData');
    this.set('videoAttributes', [ ]);

    modelData.videos[this.get('videoAttributesId')].attributes.forEach(function(attrId) {
      let attribute = modelData.attributes[attrId];

      this.get('videoAttributes').pushObject({
        name: attribute.prettyName,
        description: attribute.description,
        id: attrId,
        glyphicon: attribute.glyphicon
      });
    }, this);
  },
  updateNetwork() {
    let nodes = new vis.DataSet();
    let edges = new vis.DataSet();
    let dsm = this.get('data');

    for (let ceID in dsm.ce_set) {
      let ce = dsm.ce_set[ceID],
          ceData = ce.ce;
          if (ceData === undefined) { console.log(ceID)}
      let node = {
        id: ceData._id,
        title: `<b>${ceData.title}</b><br>
            ${ceData.description}<br>`,
        label: this.shortenName(ceData.title),
        data: ceData
      };
      if ('teaser' in ceData.playlist) {
        node.title += `<img src="${ceData.playlist.teaser.url}">`
      }
      nodes.add(node);
      let ceEdges = ce.relationships.map((relationship) => {
        let edge = {
          to: relationship.to,
          from: relationship.from,
          weight: relationship.weight,
          label: dsm.attributes[relationship.attribute].title
        }
      });
      edges.add(ceEdges);
    }

    this.setProperties({
      nodes: nodes,
      edges: edges
    });
  },
  // this is borked
  dataObserver: Ember.observer('data', function() {
    console.log('daata')
  }),
  didUpdateAttrs() {
    this.updateNetwork();
  },
  didInsertElement() {
    let graphVisualizer = this;
    let container = this.$('.vis-network')[0];
    let options = {
      autoResize: false,
      manipulation: {
        enabled: true,
        addNode(node, callback) {
          graphVisualizer.$('#addNode')[0].style.display = "block";
          graphVisualizer.setProperties({
            addNodeCallback: callback,
            addNodeData: node
          });
        },
        deleteNode(obj, callback) {
          let node = graphVisualizer.get('nodes').get(obj.nodes[0]);

          if (confirm(`Are you sure you want to delete this ce?\nTitle: ${node.data.title}`)) {
            callback(obj);
            graphVisualizer.get('deleteCEFromModel')(node.id);
          }
          else {
            callback();
          }
        }
      },
      interaction: {
        hover: true
      },
      nodes: {
        size: 15,
        borderWidth: 2,
        shadow: true,
        shape: "circle"
      },
      edges: {
        shadow: true,
        arrows: 'to',
        length: 400,
        scaling: {
          min: 1,
          max: 12.5,
          label: {
            enabled: false,
          }
        },
        font: {
          align: 'bottom',
          size: 15
        }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based'
      }
    };
    this.updateNetwork();
    let data = {
      nodes: this.get('nodes'),
      edges: this.get('edges')
    }
    let network = new vis.Network(container, data, options);
    // update the events
    this.set('network', network);
  },
  didRender() {
    let network = this.get('network');
    // set network to small fist. this is necessary.
    network.setSize(1, 1);
    // now get the width and height we need to adjust to
    let el = this.$()[0];
    network.setSize(el.clientWidth, el.clientHeight);
    // finally, fit the graph onto the screen
    network.fit();
  },
  addAttributeObserver: Ember.observer('addAttrToVideoData', function() {
    let addAttrData = this.get('addAttrToVideoData');

    if (addAttrData) {
      let network = this.get('network');
      let domPos = addAttrData.domPos;

      this.get('getVideoCallback') (network.getNodeAt(domPos), addAttrData.attributeId);
    }
  }),
  makeCE(title = "", desc = null) {
    let ce = {
      title: title,
      version: "0.0.0",
      playlist: {
        queue: [ ]
      }
    };
    if (desc !== null && desc.trim() !== "") {
      ce.description = desc;
    }
    return ce;
  },
  actions: {
    closeModal(id) {
      let el = this.$(id)[0];
      el.style.display = "none";
    },
    addNode(e) {
      let node = this.get('addNodeData'),
          graphId = node.id,
          el = e.target,
          title = el.querySelector('#ceTitle').value,
          desc = el.querySelector('#ceDesc').value,
          ce = this.makeCE(title, desc);

      node.label = this.shortenName(ce.title);
      node.title = `<b>${ce.title}</b><br>`;
      if ('description' in ce) {
        node.title += ce.description;
      }
      node.data = ce;

      this.get('queueCEToAdd') (ce, graphId, (newId, oldId = graphId) => {
        // no way to update a node to a new id so have to remove it and create
        // a new one
      });
      this.get('addNodeCallback') (node);
      this.$('#addNode')[0].style.display = "none";

      return false;
    },
    addEdgeMode() {
      this.get('network').addEdgeMode();
    },
    deleteEdgeMode() {
      this.toggleProperty('removeEdgeMode');
    },
    deleteVideoMode() {
      this.toggleProperty('removeVideoMode');
    },
    toggleVideoAttributes() {
      this.toggleProperty('videoAttributesExpanded');
    },
    removeAttribute(videoId, attributeId) {
      let modelService = this.get('modelService');
      let data = modelService.get('modelData');
      let visData = this.get('visData');

      if (confirm("Are you sure that you want to remove " +
          data.attributes[attributeId].prettyName + " from " +
          data.videos[videoId].prettyName + "? This will remove all" +
          " relations this video has. (Cancel for no)")) {

        visData.get('edges').forEach(function (edge) {
          if ((edge.from === videoId || edge.to === videoId) && edge.attr === attributeId) {
            visData.removeEdge(edge);
          }
        });

        modelService.remove('modelData.videos.' + videoId + '.attributes', attributeId);
        modelService.remove('modelData.attributes.' + attributeId +  '.videos', videoId);

        this.updateVideoAttributes();
      }
    },
    drawGraph() {
      let container = this.$('.graph-container')[0];
      let component = this;
      let modelData = this.get('modelService.modelData');
      let visData = this.get('visData');

      visData.set('options.manipulation.addEdge', function(data, callback) { // jshint ignore:line
        let fromVid = modelData.videos[data.from];
        let toVid = modelData.videos[data.to];
        let attributes = [ ];

        component.set('fromVid', data.from);
        component.set('toVid', data.to);
        component.set('relationsLength', fromVid.relations.length);

        if (data.from === data.to) {
          component.get('notify').warning("Warning! Trying to make a relation to the same video.", {
            radius: true,
            closeAfter: 10 * 1000
          });

          return;
        }

        for (let fromAttr = 0; fromAttr < fromVid.attributes.length; fromAttr++) {
          let attr = fromVid.attributes[fromAttr];

          if (toVid.attributes.includes(attr)) {
            attr = Ember.copy(modelData.attributes[attr]);
            attr.data = attr.prettyName;
            attr.id = fromVid.attributes[fromAttr];

            attributes.push(attr);
          }
        }

        if (attributes.length === 0) {
          component.get('notify').warning("Warning! Trying to make a relation between two videos with no shared attributes.", {
            radius: true,
            closeAfter: 10 * 1000
          });

          return;
        }

        component.set('relationsConfig.data.attributeId.data', attributes);

        component.$("#addRelationOverlay")
        .on('hide.bs.modal', function () {
          let el = Ember.$("#addRelationOverlay");

          component.set('relationsConfig.data.attributeId.data', [ ]);

          Ember.$("#addRelationOverlay").replaceWith("");
          component.$("#modal-container").append(el);

          component.set('fromVid', null);
          component.set('toVid', null);
          component.set('relationsLength', null);
        })
        .appendTo('body').modal('show');
      });

      let graphData = {
        nodes: visData.get('nodes'),
        edges: visData.get('edges')
      };

      let network = new vis.Network(container, graphData, visData.get('options'));

      network
      .on("deselectNode", function (param) {
        if (param.nodes.length === 0) {
          component.get('videoSelectedCallback') (null);
        }
      })
      .on("hoverNode", function (param) {
        let vidData = modelData.videos[param.node];

        component.setProperties({
          videoAttributesHeading: vidData.prettyName,
          videoAttributesId: param.node
        });

        component.updateVideoAttributes();
      })
      .on("click", function (param) {
        if (param.edges.length === 1 && component.get('removeEdgeMode')) {
          let edges = visData.get('edges');
          let edge = edges.get(param.edges[0]);

          if (confirm("Are you sure you want to remove the relation between \"" +
                      modelData.videos[edge.from].prettyName +
                      "\" to \"" + modelData.videos[edge.to].prettyName +
                      "\" related by \"" + modelData.attributes[edge.attr].prettyName +
                      "\"?")) {
            visData.removeEdge(edge);

            component.set('removeEdgeMode', false);

            component.get('modelService').removeAt('modelData.videos.' + edge.from + '.relations', edge.pos);
          }
        }

        if (param.nodes.length === 1 && component.get('removeVideoMode')) {
          if (confirm("Are you sure you want to remove the video \"" + modelData.videos[param.nodes[0]].prettyName + "\"?")) {
            let vidId = param.nodes[0];
            let edges = visData.get('edges');

            edges.forEach(function(edge) {
              if (edge.from === vidId || edge.to === vidId) {
                visData.removeEdge(edge);
              }
            });

            visData.removeNode(vidId);
            component.get('removeVideoCallback') (vidId);
          }

          component.set('removeVideoMode', false);
        }

        if (param.nodes.length === 0) {
          component.setProperties({
            deleteVideoMode: false,
            deleteEdgeMode: false
          });
        }
        else if (param.nodes.length === 1) {
          component.get('videoSelectedCallback') (param.nodes[0]);
        }
      });

      this.set('network', network);
    },
    createEdge(data) {
      let attr = this.get('modelService.modelData.attributes')[data.attributeId];
      let visData = this.get('visData');
      let diff = data.difficulty;
      let fromVid = this.get('fromVid');
      let toVid = this.get('toVid');
      let relationsLength = this.get('relationsLength');

      visData.createEdge(fromVid, toVid, diff, relationsLength, attr.prettyName, data.attributeId);

      if (data.biDirectional) {
        visData.createEdge(toVid, fromVid, diff * -1, relationsLength + 1, attr.prettyName, data.attributeId);

        this.get('modelService').update('modelData.videos.' + fromVid + '.relations', {
          relatedId: fromVid,
          attributeId: data.attributeId,
          diff: (diff * -1)
        });
      }

      this.get('modelService').update('modelData.videos.' + fromVid + '.relations', {
        relatedId: toVid,
        attributeId: data.attributeId,
        diff: diff
      });

      this.get('videoSelectedCallback') (fromVid);

      this.get('network').selectNodes([fromVid]);

      if (Ember.$('#addRelationOverlay')) {
        Ember.$('#addRelationOverlay').modal('hide');
      }
    },
    togglePhysics() {
      this.toggleProperty('usePhysics');

      this.get('visData').set('options.physics.enabled', this.get('usePhysics'));

      this.send('drawGraph');
    },
    setPhysics(solver) {
      this.get('visData').set('options.physics.solver', solver);

      this.send('drawGraph');
    },
    saveModel() {
      this.get('saveModelCallback') ();
    },
    doNothing() {

    }
  }
});


// let newPlaylist = {
//   queue: [

//   ]
// };
// function queueObj() {
//   this.primary= "";
//   this.backgrounds= [ ];
//   this.tracks = [ ];
//   this.overlays = [ ];
// }
// let playlistIndex = 0;
// if (!Array.isArray(ce.playlist[0])) {
//   newPlaylist.teaser = assetMap[ce.playlist[0]];
//   playlistIndex = 1;
// }
// for (; playlistIndex < ce.playlist.length; playlistIndex++) {
//   let queueObj = new queueObj(),
//       oldQueueObj = ce.playlist[playlistIndex];// this is an array
//   queueObj.primary = oldQueueObj[0];
//   queueObj.backgrounds = oldQueueObj[1].map((asset) => {
//     return {
//       asset: assetMap[asset]
//     }
//   })
// }
// ce.playlist = newPlaylist;
