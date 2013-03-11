
/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true, sloppy:true */

var params = {
	username : 'webbox',
	password : 'webbox',
	database : 'constructs'
};

var u, ratings;

var setRating = function() {
	console.log('fail');
};

function ElicitationController($scope) {

	$scope.elicitationid = 'elicitation-' + (new Date	()).valueOf();
	window.eid = $scope.elicitationid;
	$scope.constructs = [];	
	$scope.element = undefined;
	$scope.elements = [];
	$scope.elicitation_obj = undefined;
	$scope.loading = 0;

	var start_loading = function() { $scope.$apply(function() { $scope.loading++; }); };
	var end_loading = function() { $scope.$apply(function() { $scope.loading--; }); };

	$scope.setRating = function(construct, val) {
		var eo = $scope.elicitation_obj;
		console.log('set rating called ', construct, val);
		eo.set(construct, val);
		$scope.loading++;
		eo.save().then(function() {
			console.log('done!');
			end_loading();
		}).fail(function(err) {
			u.error(err);
			end_loading();
		});
	};
	
	WebBox.load().then(function() {
		u = WebBox.utils;
		start_loading();
		var store = new WebBox.Store();
		window.store = store;  /* TODO: debug */
		store.login(params.username,params.password).then(function() {
			var box = store.get_or_create_box(params.database);
			window.box = box; /* TODO: debug */
			box.fetch().then(function() {
				var obj_dfds = box.get_obj_ids().map(function(oid) {
					if (oid.indexOf('element') === 0 || oid.indexOf('construct') === 0) {
						return box.get_obj(oid);
					}
				}).filter(function(x) { return x !== undefined; });

				// make a place to save our results
				box.get_obj($scope.elicitationid).then(function(elicitation_obj) {
					$scope.elicitation_obj = elicitation_obj;
					u.when(obj_dfds).then(function() {
						var objs = _.toArray(arguments);
						$scope.$apply(function() {
							objs.map(function(x) {
								(x.id.indexOf('element') === 0 ? $scope.elements : $scope.constructs).push(x);
							});						
							$scope.element = $scope.elements[Math.floor($scope.elements.length*Math.random())];						
							$scope.constructs = _($scope.constructs).sortBy(function(c) { return c.id; });
						});
					});
					end_loading();
				});					
			});			
		});		
	});
}
