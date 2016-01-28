'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function $Promise() {
    this.state = 'pending';
    this.handlerGroups = [];
}

function Deferral() {
    this.$promise = new $Promise();
}

function defer() {
    return new Deferral();
}

Deferral.prototype.resolve = function(value) {
    if (this.$promise.state === 'resolved' || this.$promise.state === 'rejected') {
        return;
    } else {
        this.$promise.value = value;
        this.$promise.state = 'resolved';
    }
    while (this.$promise.handlerGroups.length) {
        var obj = this.$promise.handlerGroups.shift();
        if (typeof obj.successCb === 'function') {
            try {
                var output = obj.successCb(value);
                if (output instanceof $Promise) {
                    output.then(function(val) {
                        obj.forwarder.resolve(val);
                    }).then(null, function(err) {
                        obj.forwarder.reject(err);
                    })
                } else {
                    obj.forwarder.resolve(output);
                }
            } catch (err) {
                obj.forwarder.reject(err);
            }
        } else {
            obj.forwarder.resolve(value);
        }

    }

}

Deferral.prototype.reject = function(err) {
    if (this.$promise.state === 'rejected' || this.$promise.state === 'resolved') {
        return;
    } else {
        this.$promise.value = err;
        this.$promise.state = 'rejected';
    }
    while (this.$promise.handlerGroups.length) {
        var obj = this.$promise.handlerGroups.shift();
        if (typeof obj.errorCb === 'function') {
            try {
                var output = obj.errorCb(err)
                if (output instanceof $Promise) {
                    output.then(function(val) {
                        obj.forwarder.resolve(val);
                    }).then(null, function(err) {
                        obj.forwarder.reject(err);
                    })
                } else {
                    obj.forwarder.resolve(output);
                }
            } catch (err) {
                obj.forwarder.reject(err);
            }
        } else {
            obj.forwarder.reject(err);
        }
    }
}


$Promise.prototype.then = function() {
    var success = arguments[0];
    var error = arguments[1];
    // this.handlerGroups.push(this.defer());
    if (!success || typeof success !== 'function') {
        success = undefined;
    }
    if (!error || typeof error !== 'function') {
        error = undefined;
    }

    var forwarder = new Deferral();
    this.handlerGroups.push({
        forwarder: forwarder,
        successCb: success,
        errorCb: error
    });

    if (this.state === 'resolved' && success !== undefined) {
        this.handlerGroups.pop().successCb(this.value);
    }
    if (this.state === 'rejected' && error !== undefined) {
        this.handlerGroups.pop().errorCb(this.value);
    }

    return forwarder.$promise;
}

// $Promise.prototype.callHandlers = function(){

// }

$Promise.prototype.catch = function(err) {
    return this.then(null, err);
}

/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = {
  defer: defer,
};

So in a Node-based project we could write things like this:

var pledge = require('pledge');
…
var myDeferral = pledge.defer();
var myPromise1 = myDeferral.$promise;
--------------------------------------------------------*/
