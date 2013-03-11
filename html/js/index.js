
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
	$scope.username = localStorage.username || 'expert-' + (new Date ()).valueOf();
	$scope.constructs = [];	
	$scope.element = undefined;
	$scope.elements = [];

	$scope.elicitation_obj = undefined;
	$scope.loading = 0;

	$scope.error = '';
	$scope.error_header = 'uh oh!';

	var done_element_ids = (localStorage.done_elements && JSON.parse(localStorage.done_elements)) || [];
	
	var show_error = function(msg) {
		$scope.$apply(function() {
			$scope.error = msg;
			$(".alert").show();
		});
	};	
	var start_loading = function() { $scope.$apply(function() { $scope.loading++; }); };
	var end_loading = function() { $scope.$apply(function() { $scope.loading--; }); };
	
	$scope.setUser = function() {
		localStorage.username = $scope.username;
		$scope.elicitation_obj.set('expert', $scope.username);
		delete localStorage.done_elements;
	};
	$scope.setRating = function(construct, val) {
		var eo = $scope.elicitation_obj;
		eo.set(construct, val);
		$scope.loading++;
		eo.save().then(function() {
			console.log('done!');
			end_loading();
		}).fail(function(err) {
			var s = err.message || JSON.stringify(err);
			u.error(s);
			show_error(s);
			end_loading();
		});
	};
	
	$scope.nextElement = function() {
		$scope.loading++;
		done_element_ids.push($scope.element.id);
		localStorage.done_elements = JSON.stringify(done_element_ids);
		window.location.reload();
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
							$scope.constructs = _($scope.constructs).sortBy(function(c) { return c.id; });
							$scope.elements = $scope.elements.filter(function(el) { return done_element_ids.indexOf(el.id) < 0; });
							console.log('scope elements ', $scope.elements);
							if ($scope.elements.length > 0) {
								//
								console.debug('elements more than 0');
								$scope.element = $scope.elements[Math.floor($scope.elements.length*Math.random())];
								$scope.elicitation_obj.set({ 'expert' : $scope.username, 'element' : $scope.element.id });
							}							
						});
					});
					end_loading();
				});					
			});
		}).fail(function () { show_error('Could not log in. Please check your webbox and try again.'); end_loading(); });
	});
}
