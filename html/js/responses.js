

/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true, sloppy:true */

function ResultsController($scope) {
	$scope.initialised = false;
	$scope.loading = 0; // spinner support
	$scope.error = '';
	$scope.element = undefined;
	$scope.elements = [];
	$scope.users = [];
	$scope.eliciations = [];

	var defined = function(x) {
		return x.filter(function(xx) { return xx !== undefined; });
	};
	
	$scope.error_header = 'uh oh!';
	var show_error = function(msg) {
		$scope.$apply(function() { $scope.error = msg; });
	};	
	var start_loading = function() { $scope.$apply(function() { $scope.loading++; }); };
	var end_loading = function() { $scope.$apply(function() { $scope.loading--; }); };

	$scope.nextElement = function() {
		$scope.element = $scope.elements[($scope.elements.indexOf($scope.element) + 1) % $scope.elements.length];
	};
	$scope.prevElement = function() {
		var previdx = ($scope.elements.indexOf($scope.element) - 1);
		$scope.element = $scope.elements[previdx < 0 ? $scope.elements.length -1 : previdx];
	};

	WebBox.load().then(function() {
		u = WebBox.utils;
		start_loading();
		var store = new WebBox.Store();
		console.log('store ');		
		store.login(params.username,params.password).then(function() {
			console.log('login then ');
			var box = store.get_or_create_box(params.database);
			window.box = box; /* TODO: debug */
			box.fetch().then(function() {
				u.when(box.get_obj_ids().map(function(oid) { return box.get_obj(oid); }))
					.then(function() {
						var objs = _.toArray(arguments);						
						$scope.$apply(function() {
							var elicitations = $scope.elicitations = objs.filter(function(x) { return x.get('type') && x.get('type').indexOf('elicitation') >= 0; });
							var users = $scope.users = _(defined(elicitations.map(function(x) { return x.get('expert') && x.get('expert')[0]; }))).uniq();
							var eids = _(defined(elicitations.map(function(x) { return x.get('element') && x.get('element')[0]; }))).uniq();
							var elements = $scope.elements = _(objs.filter(function(x) { return eids.indexOf(x.id) >= 0; })).uniq();
							var constructs = $scope.constructs =_(objs.filter(function(x) { return x.id.indexOf('construct') === 0; }))
								.chain()
								.sortBy(function(c) { return c.id; })
								.uniq()
								.value();

							console.log('users ', users);
							console.log('elements ', elements);
							console.log('constructs ', constructs);														
							
							$scope.element = elements.length && elements[0];							
							$scope.loading--;
							$scope.initialised = true;
						});
					}).fail(function(err) { show_error('could not get obj ', err); });
			}).fail(function () {
				// box fetch fail
				show_error('Could not load box. Please make sure your parameters are correct - box: ' + params.database);
				end_loading();
			});
		}).fail(function() {
			console.log('login fail');
			show_error('login failure - Please make sure your login params are correct - username:' + params.username);
		});
	});
}


