import DS from 'ember-data';

export default {
    name: 'reopen-model',
    initialize: function() {
        DS.Model.reopen({
            oldRelationships: null,
            resetOldRelationships: function() {
                let oldRelationships = {};

                this.eachRelationship(function(name, descriptor) {
                    if (descriptor.kind === 'belongsTo') {
                        let id = this.belongsTo(name).id();

                        if (!id) {
                            id = null;
                        }

                        oldRelationships[name] = id;
                    }
                }, this);

                this.set('oldRelationships', oldRelationships);
            },
            getChangedRelationships: function() {
                let oldRelationships = this.get('oldRelationships'),
                    changedRelationships = {};

                this.eachRelationship(function(name, descriptor) {
                    if (descriptor.kind === 'belongsTo') {
                        let id = this.belongsTo(name).id();

                        if (oldRelationships[name] !== id) {
                            changedRelationships[name] = id;
                        }
                    }
                }, this);

                return changedRelationships;
            },
            didCreate: function() {
                this.resetOldRelationships();
            },
            didLoad: function() {
                this.resetOldRelationships();
            },
            didUpdate: function() {
                this.resetOldRelationships();
            },
            rollbackAttributes: function() {
                let oldRelationships = this.get('oldRelationships');

                this.eachRelationship(function(name, descriptor) {
                    if (descriptor.kind === 'belongsTo') {
                        let id = oldRelationships[name],
                            value = id;

                        if (id) {
                            let record = this.store.peekRecord(descriptor.type, id);

                            if (record) {
                                value = record;
                            }
                        }

                        this.set(name, value);
                    }
                }, this);

                this.resetOldRelationships();

                this._super();
            }
        });
    }
}
