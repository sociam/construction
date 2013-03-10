
/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true */

var u;

var setRating = function() {
	console.log('fail');
};

function ElicitationController($scope) {

	$scope.elicitationid = 'elicitation-' + (new Date	()).valueOf();
	$scope.element;
	$scope.constructs = [];

	$scope.setRating = function(construct, val) {
		console.log('set rating called ', construct, val);		
	};
	
	WebBox.load().then(function() {
		u = WebBox.utils;
		window.store = new WebBox.Store();
		store.login('electronic','foo').then(function() {
			var box = store.get_or_create_box('constructs4');
			box.fetch().then(function() {
				var obj_dfds = box.get_obj_ids().map(function(oid) {
					if (oid.indexOf('element') === 0 || oid.indexOf('construct' == 0)) {
						return box.get_obj(oid);
					}
				}).filter(function(x) { return x !== undefined; });
				u.when(obj_dfds).then(function() {
					var objs = _.toArray(arguments);
					var elements = [], constructs = [];
					objs.map(function(x) {
						(x.id.indexOf('element') === 0 ? elements : constructs).push(x);
					});					
					$scope.$apply(function() {
						var chosen_element = elements[Math.floor(elements.length*Math.random())];
						console.log('chosen element ', chosen_element);
						$scope.element = chosen_element;
						$scope.constructs = _(constructs).sortBy(function(c) { return c.id; });
					});
				});
			});			
		});		
	});
	
};
