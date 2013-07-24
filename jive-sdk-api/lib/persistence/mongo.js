/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */


var q = require('q');
var jive = require('../../api');

/**
 * @param app
 * @constructor
 */
function Mongo(app) {
    var databaseUrl = "mydb";
    if ( app && app.settings && app.settings['databaseUrl'] ) {
        databaseUrl = app.settings['databaseUrl'];
    }
    db = require("mongojs").connect(databaseUrl);
}

module.exports = function(databaseUrl) {
    // setup database url
    if ( !databaseUrl ) {
        databaseUrl = jive.context.config['databaseUrl'];
    }

    if ( !databaseUrl ) {
        // failover to default mongodb
        databaseUrl = 'mydb';
    }

    jive.logger.info("******************");
    jive.logger.info("MongoDB configured");
    jive.logger.info("******************");

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Private

    /**
     * Reference to the mongo db schema.
     */
    var db = require('mongojs').connect(databaseUrl);

    /**
     * Fetches a named collection from the mongo db schema if collection exists; otherwise lazily create the collection.
     * @param collectionID
     * @return {*}
     */
    var getCollection = function( collectionID ) {
        var collection = db[collectionID];
        if ( collection ) {
            return collection;
        } else {
            return db.collection(collectionID);
        }
    };

    return {

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Public

        /**
         * Save the provided data in a named collection, and return promise
         * @param collectionID
         * @param key
         * @param data
         */
        save : function( collectionID, key, data) {
            var deferred = q.defer();

            var collection = getCollection(collectionID);
            collection.save( data, function(err, saved ) {
                if( err || !saved ) throw err;
                else {
                    deferred.resolve(data);
                }
            } );

            return deferred.promise;
        },

        /**
         * Retrieve a piece of data from a named collection, based on the criteria, return promise
         * with an array of the results when done.
         * @param collectionID
         * @param criteria
         */
        find : function( collectionID, criteria) {
            var deferred = q.defer();

            var collection = getCollection(collectionID);
            if (!collection ) {
                deferred.resolve(null);
                return;
            }

            collection.find(criteria, function(err, items) {
                if( err || !items || items.length < 1) {
                    deferred.resolve();
                    return;
                }
                deferred.resolve(items);
            });

            return deferred.promise;
        },

        /**
         * Remove a piece of data from a name collection, based to the provided key, return promise
         * containing removed items when done.f
         * @param collectionID
         * @param key
         */
        remove : function( collectionID, key ) {
            var deferred = q.defer();

            var collection = getCollection(collectionID);
            if (!collection ) {
                deferred.resolve();
                return;
            }

            collection.remove({"id": key}, function(err, items) {
                deferred.resolve(items);
            });

            return deferred.promise;
        }

    };

};