import { schedule } from '@ember/runloop';
import { observer } from '@ember/object';
import Model from '@ember-data/model';

let hasManyByBelongsToId = {};

function commitBelongsTo(name, relationship) {
    let belongsToIdByName = this.get('belongsToIdByName'),
        oldBelongsToId = belongsToIdByName[name],
        belongsToId = this.belongsTo(name).id();

    if (oldBelongsToId !== belongsToId) {
        if (oldBelongsToId) {
            let inverse = this.getInverse(name);

            if (inverse) {
                let inverseHasMany = hasManyByBelongsToId[oldBelongsToId];

                inverseHasMany[inverse].delete(this);
            }
        }

        if (belongsToId) {
            let inverse = this.getInverse(name);

            if (inverse) {
                let hasManyByName;

                if (!hasManyByBelongsToId[belongsToId]) {
                    hasManyByBelongsToId[belongsToId] = {};
                }

                hasManyByName = hasManyByBelongsToId[belongsToId];

                if (!hasManyByName[inverse]) {
                    hasManyByName[inverse] = new Set();
                }

                hasManyByName[inverse].add(this);
            }

            belongsToIdByName[name] = belongsToId;
        } else {
            delete belongsToIdByName[name];
        }
    }
}

function commit() {
    schedule('actions', this, function() {
        this.eachRelationship((name, descriptor) => {
            if (descriptor.kind === 'belongsTo') {
                commitBelongsTo.call(this, name, descriptor);
            }
        });
    });
}

export default {
    name: 'reopen-model',
    initialize: function() {
        Model.reopen({
            init: function() {
                this._super();

                this.set('belongsToIdByName', {});
            },
            belongsToIdByName: null,
            getRelationship: function(name) {
                let relationship;

                this.eachRelationship((relationshipName, descriptor) => {
                    if (name === relationshipName) {
                        relationship = descriptor;
                    }
                });

                return relationship;
            },
            getInverse: function(name) {
                let relationship = this.getRelationship(name),
                    inverse = relationship.options.inverse;

                if (!inverse) {
                    if(relationship.kind === 'belongsTo') {
                        inverse = this.belongsTo(name).belongsToRelationship.inverseKey;
                    } else {
                        inverse = this.hasMany(name).hasManyRelationship.inverseKey;
                    }
                }

                return inverse;
            },
            rollbackRelationship: function(name) {
                let relationship = this.getRelationship(name);

                if (relationship.kind === 'belongsTo') {
                    let belongsToIdByName = this.get('belongsToIdByName'),
                        id = belongsToIdByName[name],
                        value = id;

                    if (id) {
                        let record = this.store.peekRecord(relationship.type, id);

                        if (record) {
                            value = record;
                        }
                    }

                    this.set(name, value);
                } else {
                    let hasManyByName = hasManyByBelongsToId[this.get('id')],
                        hasMany = new Set(hasManyByName[name]);

                    if (hasMany) {
                        let inverse = this.getInverse(name);

                        this.get(name).forEach((child) => {
                            hasMany.add(child);
                        });

                        hasMany.forEach((record) => {
                            record.rollbackRelationship(inverse);
                        });
                    }
                }
            },
            rollbackRelationships: function(kind) {
                this.eachRelationship((name, descriptor) => {
                    if (!kind || descriptor.kind === kind) {
                        this.rollbackRelationship(name);
                    }
                });
            },
            isLoadedObserver: observer('isNew', 'isLoaded', 'hasDirtyAttributes', 'isValid', function() {
                if (this.get('isNew') || this.get('isLoaded') || this.get('hasDirtyAttributes') || this.get('isValid')){
                    commit.call(this);
                }
            })
        });
    }
}
